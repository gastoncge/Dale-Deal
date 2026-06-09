# 🧠 Brainstorm #06 — PLAN DE IMPLEMENTACIÓN: Programa de referidos doble lado

> Fecha: 2026-06-05 · Generado por research comparativo (3 agentes en paralelo)
> Referencias: Airbnb, Uber, Rappi, Fiverr, MercadoLibre + best practices de
> incentivos, anti-fraude y atribución 2025-2026 + docs de Mercado Pago.

## Por qué este informe es distinto
Los #01–#05 fueron **ideación amplia** (~85 ideas). Como anuncié, el #06 **pivotea a
profundidad**: en vez de más ideas, un **plan técnico paso a paso** de UNA apuesta. Elegí
la de mejor ratio impacto/esfuerzo/riesgo para un dev solo: **el programa de referidos**
(la apuesta grande del #02). Es el motor de crecimiento más barato (CAC −30-70% con
K-factor 0.3-0.7), 100% self-contained, y usa solo infra que ya tenés (Postgres +
Mercado Pago + Resend). No toca el flujo crítico de pago. Esto es un **spec para construir**.

---

## 1. Las decisiones de diseño (qué construir, con su justificación)

| Decisión | Elección para Dale Deal | Por qué (dato) |
|----------|-------------------------|----------------|
| **Lados** | **Doble**: "dale $X, llevate $X" | Doble lado = **2-3x participación**, +41% sharing vs un solo lado |
| **Forma** | **Crédito en cuenta (saldo Dale Deal)**, no cash ni cupón | Store credit = **3,1x retención**; el usuario gasta **25-40% por encima** del crédito → 2ª compra |
| **Monto (MVP)** | **Flat $1.500** ambos lados (tuneable), con compra mínima | Flat es claro de comunicar; el mínimo evita que el premio supere el margen |
| **Cuándo se acredita** | A la **1ª COMPRA completada** del referido, **tras la ventana de reembolso (21 días)** | Atar a compra real corta el fraude #1; esperar evita "compra→cobra→devuelve" |
| **Expiración del crédito** | **90 días** | Genera urgencia; deadline rinde hasta **3x** más redención |
| **Caps** | Máx **10 referidos premiados/mes**, tope **$15.000** crédito acumulable | Anti-abuso. Ref.: Fiverr capea $100/orden y $500 total |
| **Mínimo de compra** | Compra ≥ **$10.000** para calificar | El premio debe ser < valor de la compra |

> Estos números son **defaults de ejemplo** — están en una tabla de config, no hardcodeados,
> para que los ajustes sin redeploy.

---

## 2. Modelo de datos (Postgres)

```sql
-- Señales antifraude + atribución en el usuario
ALTER TABLE users ADD COLUMN referred_by_code TEXT;     -- código con el que se registró
ALTER TABLE users ADD COLUMN signup_ip INET;            -- match self/circular
ALTER TABLE users ADD COLUMN device_id TEXT;            -- v2 (fingerprint)

-- Código único por usuario (1:1)
CREATE TABLE referral_codes (
  user_id    INTEGER PRIMARY KEY REFERENCES users(id),
  code       TEXT UNIQUE NOT NULL,                       -- ej. 'GRACI-7K2P'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Relación referidor → referido (un usuario solo puede ser referido UNA vez)
CREATE TABLE referrals (
  id                  BIGSERIAL PRIMARY KEY,
  referrer_id         INTEGER NOT NULL REFERENCES users(id),
  referee_id          INTEGER NOT NULL UNIQUE REFERENCES users(id),
  code                TEXT NOT NULL,
  state               TEXT NOT NULL DEFAULT 'pending',    -- pending|confirmed|credited|expired|revoked
  qualifying_order_id INTEGER REFERENCES orders(id),
  reward_amount       NUMERIC(12,2),
  referee_signup_ip   INET,                               -- snapshot para auditar
  referee_mp_payer_id TEXT,
  reason              TEXT,                               -- motivo de expired/revoked
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  confirmed_at        TIMESTAMPTZ,
  credited_at         TIMESTAMPTZ
);
CREATE INDEX ON referrals (referrer_id);
CREATE INDEX ON referrals (state);

-- Ledger de crédito append-only (saldo = SUM(amount) de los no expirados)
CREATE TABLE credit_ledger (
  id          BIGSERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id),
  amount      NUMERIC(12,2) NOT NULL,                     -- + earn, - redeem, +/- reverse, - expire
  type        TEXT NOT NULL,                              -- earn|redeem|reverse|expire
  referral_id BIGINT REFERENCES referrals(id),
  order_id    INTEGER REFERENCES orders(id),
  expires_at  TIMESTAMPTZ,                                -- earn: created_at + 90d
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (type, order_id)                                 -- idempotencia del redeem por orden
);
CREATE INDEX ON credit_ledger (user_id);
```

**Saldo disponible** = `SUM(amount) WHERE user_id=$1 AND (expires_at IS NULL OR expires_at > now())`.
Append-only = auditable: nunca hacés `UPDATE` de saldo, solo insertás asientos.

---

## 3. Flujo de atribución (cómo se sabe quién refirió a quién)

1. **Link corto**: `daledeal.com.ar/r/GRACI-7K2P`. Un route en el **Cloudflare Worker**
   hace `302` a la home con `?ref=GRACI-7K2P` y **setea cookie first-party** `dd_ref`
   (30 días, `SameSite=Lax`).
2. **Signup**: el form lee la cookie `dd_ref` y la manda. El backend, al crear el usuario:
   - valida que el código exista y **no sea el del propio usuario**;
   - guarda `users.referred_by_code` + `signup_ip`;
   - crea la fila `referrals` en estado **`pending`** (si pasa los checks anti-fraude del §5).
   - **Si el email/teléfono ya existía → NO se atribuye** (no es usuario nuevo).
3. **Last-click, ventana 30 días**: si llega con un `?ref=` nuevo, pisa la cookie.

---

## 4. Ciclo de vida de la recompensa (máquina de estados)

```
pending    → creada al registrarse el referido vía código (pasó anti-fraude)
confirmed  → el referido hizo su 1ª compra ≥ mínimo, y pasó la ventana de 21d sin refund
credited   → se insertó el asiento `earn` en credit_ledger (ya es saldo usable)
expired    → el referido NO compró dentro de los 30d → no se paga
revoked    → refund/chargeback/fraude → se revierte (clawback si ya estaba credited)
```

Transiciones válidas: `pending→confirmed→credited`; `pending→expired`;
cualquiera de `pending/confirmed/credited → revoked`. Guardás timestamp + `reason` por cambio.

**Quién dispara cada transición:**
- `pending→confirmed`: cron diario que busca referidos cuyo referido tiene 1ª compra
  con ≥21 días y sin reembolso.
- `confirmed→credited`: el mismo cron inserta el `earn` (a ambos lados) + manda email.
- `pending→expired`: cron, si pasaron 30d sin compra calificada.
- `*→revoked`: webhook de Mercado Pago (`payment.refunded`/chargeback) → si el crédito
  ya se acreditó, inserta un asiento `reverse` negativo.

---

## 5. Guardrails anti-fraude

**MVP — sí o sí:**
- [x] Recompensa atada a **1ª compra real completada**, no al signup (defensa #1).
- [x] Referido debe ser **usuario nuevo**: email **y** teléfono nunca vistos; **normalizar
      email** (sacar puntos/+alias de Gmail). `UNIQUE(referee_id)` en la tabla.
- [x] **Bloqueo self/circular**: rechazar si `referrer_id == referee_id` o si comparten
      **email / teléfono / IP de signup / `mp_payer_id` (tarjeta) / dirección**.
- [x] **Compra mínima** > valor de la recompensa.
- [x] **Caps + velocity**: máx 10 referidos premiados/usuario/mes + tope de crédito.
- [x] **Reversión por reembolso**: webhook MP → `revoked` + clawback del ledger.
- [x] Acreditar **recién cerrada la ventana de reembolso (21d)**.

**v2 (después):**
- [ ] **Device fingerprinting** (FingerprintJS) para multi-accounting que rota email/IP.
- [ ] Scoring por clustering (mismo ZIP, árbol de referidos) + **cola de revisión manual** en admin.

---

## 6. Crédito + Mercado Pago — el punto técnico clave

**⚠️ Hallazgo crítico confirmado:** Mercado Pago **NO** expone un campo de cupón
controlable por el comercio en Checkout Pro. Los campos `coupon_code`/`coupon_amount` son
de **campañas propias de MP**, no tu saldo. → **El descuento se aplica del lado del
comercio ANTES de crear la preferencia.**

**Mecanismo:**
1. En checkout, calcular `precio_final = total − min(saldo_disponible, total)`.
2. Crear la preferencia MP con el `unit_price` ya descontado **o** agregar un ítem
   negativo `"Crédito Dale Deal"` (`unit_price` negativo) para que se vea en el detalle.
3. Insertar un asiento `redeem` **idempotente** (`UNIQUE(type, order_id)`) atado a la orden.
4. **Confirmar el `redeem` solo con el webhook `payment.approved`**; si el pago falla o
   expira, revertir el asiento (devolver el saldo al ledger).

**Reembolsos sin perder plata:** MP (`POST /v1/payments/{id}/refunds`) solo devuelve lo
**efectivamente cobrado en dinero** (hasta 90 días, tarjeta). El crédito usado se
**reintegra al ledger**, no por MP. Definí precedencia: reembolsás primero el efectivo,
después restituís el crédito.

---

## 7. Emails (Resend — ya integrado)

| Trigger | Email | A quién |
|---------|-------|---------|
| Referido se registra con código | "Tenés $1.500 para tu primera compra 🎁" | referido |
| Referido se registra | "Tu amigo se sumó a Dale Deal" (opcional) | referidor |
| Recompensa `credited` | "¡Ganaste $1.500! Ya está en tu cuenta" | referidor |
| Crédito por vencer (cron, −7d) | "Tu crédito de $X vence en 7 días" | quien tenga saldo |

---

## 8. UX y sharing (el "ask" y cómo se comparte)

**Dónde pedirlo:**
- **Momento #1: pantalla de compra confirmada** (peak de satisfacción/intención) — el
  patrón de Uber/Rappi. + en el email de confirmación.
- **Card permanente en "Mi Cuenta"**: código, link, progreso ("1 de 3 amigos compró"),
  saldo y estado de cada recompensa.
- Banner liviano en home (recordatorio, no el ask principal).

**Cómo se comparte (Argentina = WhatsApp primero):**
- **Botón primario WhatsApp**: `https://wa.me/?text=` con texto **URL-encoded**:
  `Te regalo $1.500 para tu primera compra en Dale Deal 👉 https://daledeal.com.ar/r/GRACI-7K2P`
- **Botón "Copiar link"** (Clipboard API), siempre visible (fallback).
- **Compartir nativo (Web Share API)** en mobile con *feature detection*:
  `if (navigator.share) navigator.share({text, url})` → abre el share sheet del SO;
  si no existe (desktop), cae a WhatsApp + copiar. Requiere HTTPS + gesto del usuario.

Mostrar la recompensa doble **bien grande**, reglas escaneables (no legales), flujo
completable en <60s.

---

## 9. Endpoints (resumen)

| Método | Ruta | Qué hace |
|--------|------|----------|
| `GET` | `/r/:code` (Worker) | 302 a home + setea cookie `dd_ref` |
| `GET` | `/referrals/me` | mi código, link, stats, saldo disponible |
| `POST`| `/auth/register` (extendido) | lee `dd_ref`, valida, crea `referrals` pending |
| `POST`| `/checkout` (extendido) | aplica crédito (redeem idempotente) antes de la preferencia |
| `POST`| `/webhooks/mercadopago` (extendido) | `approved`→confirma redeem; `refunded`→revoke |
| (cron) | `referrals:tick` | pending→confirmed→credited, expiraciones, emails |

---

## 10. Rollout

- **Fase 0 — MVP (~1 semana):** tablas + atribución por cookie + reward a 1ª compra +
  redeem en checkout + card en Mi Cuenta + share WhatsApp/copiar + los 2 emails clave +
  anti-fraude MVP (1ª compra, email/tel único, self/circular por email+IP, mínimo, caps).
- **Fase 1 — v2:** reversa automática por refund/chargeback vía webhook + cron de
  expiración + email de "vence pronto" + device fingerprint + cola de revisión en admin +
  panel de métricas.

---

## 11. Métricas a trackear (panel admin)

- **Referral rate** (% usuarios que invitan): sano 5-15%.
- **Conversión de invitación** (invitado → registrado → 1ª compra): mediana 3-5%.
- **K-factor** (invitaciones/usuario × conversión): 0.3-0.7 ya baja CAC 30-70%.
- **CAC referido vs paid** y **LTV del referido** (suele retener más).
- **Pasivo de crédito vivo** (suma de saldos no expirados) — control financiero.
- **Tasa de flags anti-fraude**.

---

## 12. Riesgos y nota legal

- **Margen:** el crédito sale de tu bolsillo → respetá los caps y el mínimo de compra.
- **Pasivo contable:** el saldo emitido es una deuda; monitoreá el "pasivo de crédito vivo".
- **Impositivo (alto nivel, no asesoramiento):** el crédito promocional es un **descuento
  comercial**; el IVA se liquida sobre el **neto post-descuento** → reflejalo en la factura
  como descuento, no como ítem aparte. Publicá **Términos y Condiciones** del programa.
  **Consultá a tu contador** para el tratamiento exacto en AFIP/ARCA.

---

> **Estado de la serie:** 6 informes. Los #01–#05 = mapa amplio (~85 ideas). El #06 = primer
> plan de build completo. Próximo informe (#07): otro plan técnico de una apuesta acumulada
> — candidatas: **cuotas reales** (#05, el mayor salto de conversión en AR), **WhatsApp
> commerce** (#05), o **wizard del vendedor** (#04). Decime cuál querés y arranco por esa;
> si no, el #07 toma la de mejor ROI no desarrollada todavía.
