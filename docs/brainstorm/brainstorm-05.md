# 🧠 Brainstorm #05 — Lo que un playbook global se pierde: Argentina + tendencias 2026

> Fecha: 2026-06-05 · Generado por research comparativo (3 agentes en paralelo)
> Foco: dinámica e-commerce argentina (inflación, dólar, cuotas, pagos, WhatsApp) +
> economía circular/recurrente (Vinted, Back Market, Subscribe&Save) + tendencias
> emergentes 2026 (agentic commerce, WhatsApp commerce, búsqueda visual/conversacional,
> creators). Contexto AR 2026: inflación ~31% anual, WhatsApp 90% penetración, 71% de
> la cripto comprada en AR son stablecoins (la gente ahorra en dólares).

## Cambio de eje respecto a #01–#04
Los 4 informes anteriores compararon Dale Deal contra marketplaces **globales**. Pero
una comparación global **estructuralmente se pierde dos cosas**: (1) las dinámicas
**específicamente argentinas** que deciden una venta acá, y (2) las tendencias **2026
todavía "early"** que van a importar. El #05 ataca exactamente eso. Cero overlap.

---

## 🏆 TOP 3 QUICK WINS (alto impacto, bajo esfuerzo)

| # | Idea | Por qué | Esfuerzo |
|---|------|---------|----------|
| 1 | **WhatsApp con mensaje contextual** | WhatsApp creció **+111%** como canal en AR, 98% open rate — es EL canal de cierre. Hoy tenés link pelado. Pre-cargar texto: "Hola, me interesa [título] ($precio) — daledeal.com.ar/p/[id]" + botón en cada card/ficha + `whatsapp` en perfil del vendedor. | **S** |
| 2 | **Categoría "Usados" + grading + badge "Dale otra vida"** | El usado explota en inflación (autos usados **+24%** en 2025, récord). Enum `condition` (nuevo→aceptable) + flag `is_used` + filtro (reusa ProductFilters) + N fotos reales obligatorias. El badge de sostenibilidad juega con tu propio nombre ("Dale"). | **S** |
| 3 | **Pago por transferencia/efectivo (vía MP)** | El C2C argentino odia la comisión de MP (~6%); transferencia = 0% y es norma cultural. MP ya soporta `ticket` (Rapipago/PagoFácil) y `bank_transfer` — solo habilitarlos en la preferencia. | **S** |

## 🎯 LA APUESTA GRANDE
**Comercio conversacional: vender DENTRO de WhatsApp.** El comercio conversacional en
LatAm fue **US$18.200M en 2025 (+35% i.a.), con el 72% vía WhatsApp**. En Argentina
es *el* canal — no un complemento. Hoy Dale Deal solo tiene un link "abrir WhatsApp";
el salto es al **WhatsApp Business Cloud API** (webhook → Cloudflare Worker, que ya usás).
Empezar simple: catálogo nativo de WhatsApp + un bot que responde "¿tenés X?" buscando
en tu Postgres y devuelve producto con foto/precio/link. Después: carrito y cobro dentro
del chat. La conversión asistida por IA en este canal va de **20-38%** según rubro. Es la
apuesta que mejor combina "lo argentino" con "lo emergente". Esfuerzo: **M**.

---

## 🇦🇷 EJE A — Lo específicamente argentino

| Idea | Qué resuelve | Ref | Esfuerzo |
|------|--------------|-----|----------|
| **WhatsApp contextual** | Canal de cierre #1 en AR; hoy es link pelado. | WhatsApp (90% penetración) | **S** |
| **Transferencia/efectivo vía MP** | C2C evita la comisión ~6%; norma cultural. Habilitar `ticket`+`bank_transfer`. | MODO, Rapipago | **S** |
| **Cuotas sin interés REALES (no estáticas)** | *La palanca de conversión #1 en AR* — el argentino decide por "cuánto pago por mes". Cuota Simple (ex-Ahora 12) terminó jun-2025 → ahora es diferenciador del VENDEDOR. Campo `cuotas_sin_interes` por publicación → `installments` en la preferencia MP. | Mercado Pago | **M** |
| **Precio en USD con conversión a ARS** | En inflación, fijar en ARS obliga a re-pricear semanal; USD congela valor. Campo `moneda` + cron que cachea cotización (dolarapi.com), mostrar "USD 500 (~$945.000)", cobro en ARS. | ML, retail electrónica | **M** |
| **"Hacé tu oferta" / regateo nativo** | Cultura C2C argentina; hoy la negociación se va a WhatsApp y se pierde. Toggle `acepta_ofertas` + tabla `offers` (contraoferta) sobre la mensajería → al aceptar genera checkout al precio pactado. | OLX, Facebook MP, ML | **M** |
| **Factura automática AFIP/ARCA (monotributo)** | Vendedor recurrente no puede operar sin facturar. `condicion_fiscal`/CUIT + gateway (Facturante/TusFacturas) post-pago → PDF por Resend. Empezar con factura C. | Tiendanube, MP | **L** |

## ♻️ EJE B — Economía circular & compra recurrente

| Idea | Qué resuelve | Ref | Esfuerzo |
|------|--------------|-----|----------|
| **Usados diferenciados + grading de estado** | Mercado nuevo enorme en inflación. Enum `condition` + `is_used` + fotos reales obligatorias. | Vinted (€10.8B GMV, rentable) | **S** |
| **Badge sostenibilidad "Dale otra vida"** | Diferenciación barata + storytelling (juega con el nombre). Automático sobre `is_used`/`refurbished` + contador en home. | Vinted, ThredUp | **S** |
| **Trade-in / "Entregá tu usado"** | Capta inventario + retención (crédito que vuelve a gastarse). Form → admin aprueba → **crédito en cuenta** (reusa el saldo de Mi Cuenta). Manual al inicio. | Apple, Best Buy | **M** |
| **Reacondicionados con garantía** | Diferenciación + ticket alto; confianza sobre el usado. Tag `refurbished` para vendedores aprobados + `warranty_months` mostrado como sello. | Back Market (€3B GMV, +32%) | **M** |
| **Suscribite y ahorrá (compra recurrente)** | Retención + revenue predecible en consumibles. Tabla `subscriptions` + cron + **MP preapproval** (pagos recurrentes). 23% de compradores de Amazon usan Subscribe&Save. | Amazon S&S | **L** |
| **Servicios recurrentes (limpieza/mantenimiento mensual)** | Diferencia tu lado servicios (hoy one-shot) + ingreso recurrente para el prestador. Reusa la infra de suscripción sobre `services`. | Angi | **M** (si recurrente ya existe) |

## 🔮 EJE C — Tendencias emergentes 2026

| Idea | Qué resuelve | Madurez | Esfuerzo |
|------|--------------|---------|----------|
| **WhatsApp commerce (vender dentro)** *(apuesta grande)* | El canal de LatAm (72% de US$18.200M). Business Cloud API + bot que busca en Postgres. | ya-vale-la-pena | **M** |
| **Afiliados / embajadores (creator commerce)** | Adquisición barata; encaje natural de marketplace. Links `?ref=` + comisiones en Postgres + dashboard payouts. 45,5% del budget va a micro-creators. | ya-vale-la-pena | **S-M** |
| **Agentic-ready: que los agentes de IA te encuentren y compren** | El descubrimiento se mueve del navegador al agente; el *feed* decide. Subir JSON-LD a nivel ACP (`Offer` completo, GTIN/SKU) + endpoint `/feed.json` SSR desde el Worker. 34% de compradores US ya usaron un agente. | apostar-temprano | **M** |
| **Búsqueda conversacional ("regalo para mamá < $20.000")** | Tu búsqueda no entiende intención ni presupuesto. Embeddings en **pgvector** + similaridad con filtro de precio. ML ya lo usa en este mercado. | apostar-temprano | **M** |
| **Búsqueda visual (buscar por foto)** | Descubrimiento donde describir cuesta (muebles, deco, ropa). Mismo motor de embeddings pero multimodal (CLIP). Arrancar solo en categorías visuales. | apostar-temprano | **L** |
| **AR / probador virtual** | +94% conv / −40% devoluciones, pero solo en categorías acotadas. Pilotar WebAR (`<model-viewer>`) recién más adelante. | apostar-temprano (nicho) | **L** |

> **Saltear: voice commerce.** Solo **2,8%** completa compra solo por voz y 46% no
> confía en el asistente. No invertir como canal de compra.

---

## 💡 Síntesis: roadmap sugerido

1. **Esta semana (S, muy argentino):** WhatsApp contextual + usados con grading + badge
   "Dale otra vida" + transferencia/efectivo vía MP. Todo barato, todo local-fit.
2. **Los dos M-essentials argentinos:** cuotas sin interés REALES + precio en USD. Son,
   juntos, probablemente el mayor salto de conversión posible en el mercado argentino —
   más que cualquier feature global, porque atacan cómo el argentino realmente decide.
3. **La apuesta de canal (M):** WhatsApp commerce (vender dentro). Es donde está la gente.
4. **El mercado nuevo (S→M):** usados → trade-in → refurbished. La inflación empuja la
   demanda de segunda mano; capturarla es catálogo y diferenciación casi gratis.
5. **Sembrar el futuro (M, apostar temprano):** feed agéntico + búsqueda conversacional
   comparten la MISMA infra de embeddings/pgvector — hacer una abarata la otra. Quien se
   prepara hoy para que los agentes de IA lo descubran, gana el SEO de 2027.

> Nota estratégica: este es el informe más **diferenciado** de la serie, porque sale del
> "copiá lo que hace Amazon" y entra en "qué necesita ESTE mercado". Las dos cosas más
> impactantes acá (cuotas reales + WhatsApp) no aparecerían nunca en un benchmark global.
>
> **Estado de la serie:** 5 informes, ~85 ideas, cubriendo demanda · retención/monetización
> · tráfico/logística/data · oferta/seguridad/soporte · local/emergente. La **ideación
> amplia está bien cubierta**. El #06 debería **pivotear a profundidad**: un plan técnico
> paso a paso (schema + endpoints + UI + guardrails) de UNA apuesta acumulada. Candidatas
> más fuertes por ROI/esfuerzo: **(a) referidos** (#02), **(b) cuotas reales** (#05),
> **(c) WhatsApp commerce** (#05), **(d) wizard del vendedor** (#04). Decímelo y arranco
> por esa; si no, el #06 elige la de mejor ratio impacto/esfuerzo y la desarrolla entera.
