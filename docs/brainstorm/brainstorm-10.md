# 🧠 Brainstorm #10 — PLAN DE IMPLEMENTACIÓN: WhatsApp commerce

> Fecha: 2026-06-05 · Generado por research comparativo (3 agentes en paralelo)
> Referencias: WhatsApp Business Cloud API (Meta), Commerce Manager, Mercado Pago Link de
> Pago + casos LATAM de conversational commerce 2025-2026.

## Por qué este informe
Quinto y **último plan de build de las apuestas grandes**. WhatsApp es EL canal de LatAm:
**open rate 98%** (vs 21,5% email), **72% del comercio conversacional regional** pasa por
ahí, conversión de campañas **3-5× email**. Hoy Dale Deal solo tiene un **link básico** a
WhatsApp — este plan lo lleva a **vender por WhatsApp** de verdad.

## ⚠️ Dos realidades que definen el diseño
1. **WhatsApp Pay NO opera en Argentina** (solo India y Brasil). No hay checkout nativo en
   el chat → **el pago SIEMPRE vuelve a un link de Mercado Pago** (Link de Pago / `init_point`)
   pegado en la conversación, y la confirmación regresa por el **webhook de MP**.
2. **Esto es por fases.** La Fase 1 (deep links) no necesita aprobaciones; la Fase 2 (API)
   depende de verificación de Meta y aprobación de templates. No es "todo o nada".

---

## La estrategia por fases

| Fase | Qué | Depende de | Esfuerzo |
|------|-----|-----------|----------|
| **1. Click-to-WhatsApp con contexto** | Botón "Consultar por WhatsApp" en cada ficha con `wa.me` + texto pre-armado (producto, ID, URL) + UTMs para atribución | nada (ya tenés link básico) | **S** |
| **2. Cloud API: confirmaciones + bot** | Webhook en Worker, templates utility de pedido/envío disparados por tus webhooks de MP, bot que contesta "¿tenés X?" | verificación Meta + templates | **M** |
| **3. Catálogo + carrito en chat + carrito abandonado** | Multi-Product Messages desde tu catálogo, secuencia de recuperación con opt-in | Fase 2 andando | **M** |

> **Empezá por Fase 1 hoy** (es un quick win que mejora el link actual). La Fase 2 es el
> verdadero "WhatsApp commerce".

---

## Setup técnico (Fase 2) — Cloud API directa de Meta

**Recomendación:** para un dev con stack propio (Node/Postgres/Workers) + catálogo en
Postgres, **Cloud API directa** (gratis, REST crudo, ya tenés infra). Evaluá **360dialog**
(~US$50/mes flat, sin markup) solo si el onboarding de Meta se complica. Evitá el markup de
Twilio y los no-code (Wati) que no aplican a tu caso.

**Onboarding (orden real):**
1. **Meta Business Portfolio** + app tipo Business con el producto WhatsApp.
2. **Número dedicado** (sin WhatsApp normal/Business activo) → recibe el OTP una vez.
3. **WABA** (se crea al agregar el número).
4. **Business Verification** (docs de la empresa): días → de Tier 0 (**250 conv/día**) a
   **1.000/día** verificado, y escala por quality rating.
5. **System User token permanente** con permisos `whatsapp_business_messaging`,
   `whatsapp_business_management`, `catalog_management`.

**Webhook (Cloudflare Worker sirve perfecto):**
- **GET** (verificación): validás `hub.verify_token` y respondés `hub.challenge` + 200.
- **POST** (eventos): `entry[].changes[].value.messages[]` → respondé **200 rápido** y
  procesá async (si tardás, Meta reintenta y duplica). Validá `X-Hub-Signature-256` (HMAC
  con el App Secret).
- **SDK:** `whatsapp-api-js` (sin dependencias, serverless-friendly) para el Worker, o el
  SDK oficial de Meta en el backend Node.

---

## El flujo de venta (descubrir → consultar → cerrar → seguir)

**1. Descubrir + consultar (SITIO → WhatsApp).** Botón "Consultar por WhatsApp" en cada
ficha:
```
https://wa.me/549XXX?text=Hola,%20consulto%20por%20[Producto]%20(ID%20{id})%20-%20daledeal.com.ar/p/{slug}
```
El `text` pre-cargado pasa el contexto. Agregá UTMs (wa.me no devuelve referer).

**2. Navegar catálogo (en WhatsApp).** Catálogo en Commerce Manager (feed CSV/XML
**sincronizado desde tu Postgres**). **Multi-Product Messages** (hasta 30 ítems). El
cliente arma un "carrito" en el chat y manda un *order message* — pero **no se paga ahí**.

**3. Cerrar (WhatsApp → MP → WhatsApp).** El bot/agente confirma ítems + total + envío →
tu backend **genera la preferencia de MP** y devuelve el **link de pago** al chat → el
cliente paga en MP → el **webhook de MP** dispara la confirmación de vuelta en WhatsApp.

**4. Seguir (en WhatsApp).** Templates **utility** aprobados: "Pedido #N confirmado", "Tu
pedido fue enviado — seguilo acá {link}" con botones. (Conecta con el tracking del #03 y
los estados de orden del #09.)

---

## El bot que contesta "¿tenés X?"

**Fase 1 del bot (MVP):** intent básico + búsqueda en Postgres. Reusá el **pgvector** ya
propuesto (#03/#05): `mensaje → embedding → similitud → top 3 productos con foto/precio/link`.
**No necesitás un LLM para buscar**, solo (opcional) para redactar la respuesta.

**Fase 2 del bot:** `gpt-4o-mini` en RAG (recuperás con pgvector, el modelo arma la
respuesta natural). Un bot bien armado deflecta **60-75%** de consultas.

**Handoff a humano** cuando: piden "humano/persona/vendedor"; baja confianza (similitud
pgvector < ~0,4) en intents sensibles (pago, reembolso, cancelación); señales de
frustración (MAYÚSCULAS, "no sirve"). **Pasá el contexto completo** al humano.

---

## Notificaciones (la ventana de 24h y el opt-in)

**La ventana de 24h** se abre cuando el usuario te escribe y se reinicia con cada mensaje suyo:
- **Gratis dentro de la ventana:** mensajes de servicio (free-form) **y templates utility**.
- **Pago fuera:** todo **marketing** (siempre) + utility/auth fuera de ventana. Utility/auth
  cuestan <US$0,01; marketing es lo caro. (Pricing per-message desde jul-2025.)

**Opt-in obligatorio (Meta, desde nov-2024)** para mensajes proactivos. *Que te escriban NO
es opt-in para marketing.* Válido: **checkbox en checkout** ("recibí updates por WhatsApp"),
QR, link. Todo marketing necesita **opt-out**.

**Notificaciones priorizadas (casi todas utility = baratas):**
1. **Estado del pedido** (confirmación, pago)
2. **Envío / tracking** ← el de mejor performance
3. **Recordatorio de cita** (servicios: plomero/electricista) ← baja no-shows
4. **Bajó de precio** (marketing, requiere opt-in) — conecta con #02
5. **Carrito/consulta abandonada** (secuencia de 3: 1h → 1 día → 3 días; recupera 15-45%)

---

## No que te baneen (quality rating)

- **Métrica #1 de ban: ratio block/report.** Respetá "STOP"/opt-out al instante.
- **Warm-up:** número nuevo → 50-100 msgs/día, escalá gradual.
- **Pacing** 3-8s entre mensajes en broadcasts. Priorizá transaccional sobre promo.
- Rating verde/amarillo/rojo; desde oct-2025 los límites son por **portfolio**, no por número.

---

## Modelo de datos

```sql
ALTER TABLE users ADD COLUMN whatsapp_phone       TEXT;
ALTER TABLE users ADD COLUMN wa_optin_marketing   BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN wa_optin_at          TIMESTAMPTZ;

CREATE TABLE wa_conversations (
  id               BIGSERIAL PRIMARY KEY,
  user_id          INTEGER REFERENCES users(id),
  wa_id            TEXT NOT NULL,            -- número del cliente
  last_user_msg_at TIMESTAMPTZ,             -- calcula la ventana de 24h
  assigned_to      TEXT DEFAULT 'bot',      -- 'bot' | 'human'
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE wa_messages (
  id              BIGSERIAL PRIMARY KEY,
  conversation_id BIGINT REFERENCES wa_conversations(id),
  direction       TEXT NOT NULL,            -- 'in' | 'out'
  type            TEXT,                     -- text|template|product|interactive
  body            TEXT,
  wa_message_id   TEXT UNIQUE,              -- id de WhatsApp (idempotencia)
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## Costos

- Mensajes **service: gratis**; **utility/auth <US$0,01**; **marketing**: el costo
  dominante (verificá la tarifa AR vigente en la tabla de Meta al momento del build).
- LLM `gpt-4o-mini` y embeddings: centavos para volumen chico — embeber el catálogo entero
  cuesta menos de un café.

---

## Rollout

- **Fase 1 (S, hoy):** deep links `wa.me` con contexto + UTMs en cada ficha. Mejora directa.
- **Fase 2 (M):** Cloud API + webhook en Worker + templates utility de pedido/envío
  disparados por MP + bot con pgvector + opt-in en checkout.
- **Fase 3 (M):** catálogo sincronizado a Commerce Manager + carrito en chat + secuencia de
  carrito abandonado (con opt-in).

## Riesgos
- **Aprobación de Meta:** la verificación y los templates pueden demorar/rechazarse → la
  Fase 1 no depende de esto, por eso se empieza ahí.
- **Bans por spam:** opt-in real + respetar opt-out + priorizar utility. Cuidá el rating.
- **Operativo:** responder rápido (<15 min) o el bot debe cubrir; un canal abierto sin
  atención frustra más que no tenerlo.

---

> **Estado de la serie:** **10 informes.** #01-05 = mapa amplio (~85 ideas). #06-10 = los
> **5 planes de build de TODAS las apuestas grandes**: referidos, cuotas reales, activación
> del vendedor, compra protegida, WhatsApp commerce. **El brainstforming de alto nivel
> cumplió su ciclo.**
>
> 👉 **Recomendación honesta:** a esta altura, otro informe de ideación tendría rendimiento
> decreciente. Lo de mayor valor ahora es **ejecutar**. Tenés 5 features con plan completo;
> 4 son construibles ya (referidos, cuotas, activación, WhatsApp Fase 1). Si querés, **freno
> la ideación y arranco a codear** la que elijas. Si preferís que el loop siga, el #11+
> profundizará **sub-features** o **tendencias emergentes nuevas** a medida que aparezcan,
> pero ya no apuntando a "qué falta" (eso está mapeado) sino a "cómo ejecutar mejor".
