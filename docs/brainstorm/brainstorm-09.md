# 🧠 Brainstorm #09 — PLAN: Compra Protegida (sin construir un escrow propio)

> Fecha: 2026-06-05 · Generado por research comparativo (3 agentes en paralelo)
> Referencias: Mercado Pago (Split / Advanced Payments / Compra Protegida), MercadoLibre,
> eBay MBG, Airbnb, Upwork/Fiverr (escrow de milestones) + normativa BCRA (Com. "A" 6859,
> 7429, **8432/2026**) y Ley 24.240. **Aviso: la sección legal es research, NO asesoramiento.**

## ⚠️ El hallazgo que cambia el plan (leé esto primero)
Iba a ser "cómo construir un escrow". El research devolvió **dos paredes** que obligan a
reformular:

1. **Técnica:** el mecanismo de MP que retenía fondos con control de liberación
   (**Advanced Payments + `money_release_days`**) aparece marcado como **obsoleto** en la
   doc. El producto vigente (**Split Payments**) **no expone un toggle self-service** para
   "no liberar hasta que el comprador confirme" (la doc dice *"contactá a tu ejecutivo
   comercial"*). → El escrow nativo controlado por API **no está confirmado** para nuevas
   integraciones en AR.
2. **Regulatoria (la grave):** si **vos** recibís la plata del comprador y la "guardás"
   hasta pagarle al vendedor, eso probablemente te encuadra como **PSPCP** (Proveedor de
   Servicios de Pago con Cuentas de Pago) ante el BCRA: registro obligatorio + **100% de
   los fondos de clientes encajados**. La **Com. "A" 8432/2026 ("PSPCP como Servicio")**
   cerró el atajo: tercerizar la interfaz **no exime**, y los clientes del marketplace se
   consideran clientes del PSPCP. **Un dev solo no puede cumplir eso.**

> **Conclusión honesta:** ❌ NO construyas tu propio escrow (no toques la plata).
> ✅ Dejá que **Mercado Pago custodie** (MP ya es la entidad regulada) y construí encima
> solo la **capa de experiencia de Compra Protegida**: estados de orden, confirmación de
> entrega, disputas y notificaciones. La plata nunca pasa por tu cuenta.

---

## La estrategia: dos caminos

| | **Camino A — Apoyarse en MP (recomendado)** | **Camino B — Release control real (solo si MP lo habilita)** |
|--|--|--|
| **Cómo** | Usás el checkout normal + la **Compra Protegida propia de MP** (retiene ~14 días y media disputas). Vos construís la capa de tracking/disputas ENCIMA. | **Advanced Payments** con `money_release_days` alto + `POST .../disburses` al confirmar el comprador. |
| **Custodia** | MP | MP |
| **Riesgo regulatorio** | Bajo (sos comercio/intermediario) | Bajo (MP sigue custodiando) |
| **Riesgo técnico** | Bajo (rails estándar) | **Alto** (API posiblemente deprecada — confirmar con MP) |
| **Control de timing** | Limitado (lo define MP) | Fino (lo controlás vos) |
| **Esfuerzo** | **M** | **L** |

> **Empezá por A.** Da el 80% del valor (el comprador ve "Compra Protegida", hay estados y
> disputas) sin tocar territorio regulado ni APIs frágiles. Pasá a B **solo** si tu
> ejecutivo de MP confirma que Advanced Payments sigue abierto para AR y lo necesitás.

---

## El corazón reutilizable (sirve para A y B): máquina de estados de la orden

```
PENDING_PAYMENT → PAID → [bifurca por tipo]

PRODUCTO:  PAID → SHIPPED → DELIVERED → (gracia) → RELEASED
SERVICIO:  PAID → IN_PROGRESS → COMPLETED → (gracia) → RELEASED

Desde DELIVERED/COMPLETED o durante la gracia → DISPUTED → REFUNDED | RELEASED | PARTIAL_REFUND
Terminales: RELEASED, REFUNDED, PARTIAL_REFUND, CANCELLED
```

`DISPUTED` **congela** la auto-liberación. `RELEASED` es el momento en que el vendedor
cobra (en A, es informativo/coincide con la liberación de MP; en B, dispara el `disburse`).

---

## Ventanas y plazos (calibrados a Argentina)

**Productos (con envío):**
- Vendedor marca `SHIPPED` con tracking en **≤3 días hábiles** → si no, cancelación + reembolso automático.
- Comprador confirma o reclama: **7 días** desde `DELIVERED` → si no, **auto-RELEASE**.
- "Nunca llegó": ventana de reclamo **21 días** desde el pago (alineado a tiempos de correo AR).

**Servicios (trabajo realizado):**
- Prestador marca `COMPLETED` con evidencia.
- Comprador acepta / pide revisión / reclama: **5 días** → si no, **auto-RELEASE** (estilo Upwork/Fiverr).
- Trabajos largos: liberar **por hito (milestone)**, no todo al final.

**Común:** hold antifraude de **3-5 días** en el primer cobro de vendedores nuevos
(patrón Airbnb/Upwork). Opcional: liberación parcial al inicio del servicio (Airbnb libera
24 h post check-in) para el cashflow del prestador.

---

## Flujo de disputa paso a paso

1. **Comprador abre reclamo** dentro de la ventana, con motivo + evidencia (fotos/tracking/chat).
   Orden → `DISPUTED`, auto-liberación pausada.
2. **Vendedor responde — SLA 3 días.** Sin respuesta → resolución a favor del comprador.
3. **Resolución directa:** si el vendedor acepta → `REFUNDED` (vía tu refund endpoint a MP)
   o devolución del producto.
4. **Mediación (admin):** sin acuerdo, el admin revisa evidencia de ambos lados y resuelve
   (vinculante): `REFUNDED`, `RELEASED` o `PARTIAL_REFUND`. Objetivo: 2 días hábiles.
5. **Cierre por inactividad:** caso sin movimiento **14-21 días** → auto-cierre.

Reusás la **mensajería backend** para el hilo comprador↔vendedor↔admin y **Resend** para
notificar cada transición.

---

## Modelo de datos

```sql
-- Extender orders con el estado de protección
ALTER TABLE orders ADD COLUMN protection_state TEXT NOT NULL DEFAULT 'none';
  -- none|paid|shipped|delivered|in_progress|completed|disputed|released|refunded|partial_refund|cancelled
ALTER TABLE orders ADD COLUMN shipped_at   TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN delivered_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN release_at   TIMESTAMPTZ;   -- cuándo auto-libera si no hay reclamo
ALTER TABLE orders ADD COLUMN tracking_code TEXT;
ALTER TABLE orders ADD COLUMN dispute_id   BIGINT;

CREATE TABLE disputes (
  id          BIGSERIAL PRIMARY KEY,
  order_id    INTEGER NOT NULL REFERENCES orders(id),
  buyer_id    INTEGER NOT NULL REFERENCES users(id),
  seller_id   INTEGER NOT NULL REFERENCES users(id),
  reason      TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'open',  -- open|seller_responded|in_review|resolved
  resolution  TEXT,                          -- refunded|released|partial_refund
  sla_deadline TIMESTAMPTZ,                  -- deadline de respuesta del vendedor
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);
CREATE TABLE dispute_messages (
  id         BIGSERIAL PRIMARY KEY,
  dispute_id BIGINT NOT NULL REFERENCES disputes(id),
  sender_id  INTEGER NOT NULL REFERENCES users(id),
  body       TEXT,
  attachment_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Cron `protection:tick`** (diario): órdenes en `delivered`/`completed` con
`release_at < now()` y sin disputa → `released`; SLA de disputa vencido → resolución por
defecto; envíos sin `SHIPPED` en plazo → cancelar + reembolsar.

---

## 🔴 Lo que hay que confirmar ANTES de codear (bloqueante)

1. **Con tu ejecutivo de Mercado Pago:** (a) ¿Advanced Payments sigue habilitado para
   nuevas integraciones en Argentina? (b) ¿Split Payments ya soporta retención/liberación
   controlada por API? (c) ¿Cómo se activa la Compra Protegida de MP en tu cuenta?
2. **Con un abogado/contador:** encuadre bajo Com. "A" 8432/2026, redacción de los T&C
   ("protección vía MP", sin asumir custodia), y exposición solidaria (Art. 40 Ley 24.240,
   con jurisprudencia que condena a MercadoLibre como parte de la cadena).

> Sin (1) resuelto, construí **solo el Camino A** (estados + disputas + tracking sobre los
> rails estándar de MP). Eso ya es una mejora enorme de confianza y no depende de nada frágil.

---

## Prevención de abuso

- **Comprador de mala fe:** exigir evidencia para abrir disputa; tracking entregado =
  presunción a favor del vendedor; flaggear usuarios con ratio alto de reclamos.
- **Vendedor que no envía:** SLA de envío con cancelación automática; tracking obligatorio;
  en Camino B, el dinero no se libera hasta `DELIVERED` + gracia.
- **Chargebacks:** guardá TODA la evidencia (chat, tracking, fotos) para representment. En
  Camino A, el riesgo de contracargo lo gestiona MP — otra razón para empezar por A.

---

## Rollout

- **Fase 0 — Camino A (M):** badge "Compra Protegida" (apoyado en MP) + máquina de estados
  de la orden + confirmación de entrega + flujo de disputa con mediación admin + crons +
  emails. **Cero custodia propia.**
- **Fase 1:** integrar tracking de carriers (se conecta con la logística del #03) +
  auto-cierres + métricas de disputa (tasa, tiempo de resolución).
- **Fase 2 (opcional, solo si MP lo habilita):** Camino B con Advanced Payments para control
  fino de la liberación contra confirmación del comprador.

---

## Riesgos

- **Regulatorio (el grande):** NO retener fondos propios. Si alguna vez la plata tocara tu
  cuenta como saldo de terceros, encuadrás PSPCP. Mantené a MP como custodio. **Consultá al
  profesional.**
- **Dependencia de MP:** el control fino de liberación depende de qué te habilite MP.
- **Operativo:** las disputas consumen tiempo de admin — definí SLAs y plantillas.

---

> **Estado de la serie:** 9 informes — #01-05 mapa amplio (~85 ideas), #06-09 cuatro planes
> de build (referidos, cuotas, activación del vendedor, compra protegida). Con esto, **las
> 4 apuestas grandes acumuladas + 1 tienen plan**. La única apuesta del #05 sin desarrollar
> a fondo es **WhatsApp commerce** (candidata para el #10).
>
> 👉 Tenés **4 features con plan completo**. Tres son construibles ya (referidos, cuotas,
> activación); esta (compra protegida) necesita **2 confirmaciones externas primero** (MP +
> abogado). Si querés que **frene la ideación y empiece a codear** alguna de las
> construibles, decímelo. Si no, el #10 hace WhatsApp commerce.
