# 🧠 Brainstorm #01 — Dale Deal vs. los mejores del mundo

> Fecha: 2026-06-05 · Generado por research comparativo (3 agentes en paralelo)
> Marketplaces analizados: MercadoLibre, Amazon, eBay, Etsy, Temu, Shopee, Fiverr,
> Thumbtack, Upwork, Airbnb, TaskRabbit, Doctoralia + tendencias UX/conversión 2026.

## Contexto: qué YA tiene Dale Deal
Catálogo con filtros · detalle producto/servicio con galería · reviews (con form) ·
favoritos · carrito · checkout Mercado Pago · cuotas visibles · búsqueda · trending
"más visto" · mensajería (backend) · B2B leads · newsletter · mi-cuenta · admin ·
PWA · Sentry · SEO JSON-LD · sitemap · honeypot.

Este informe busca **lo que les falta** para competir, sin repetir lo existente.

---

## 🏆 TOP 3 QUICK WINS (alto impacto, bajo esfuerzo)

| # | Idea | Por qué | Esfuerzo |
|---|------|---------|----------|
| 1 | **Trust bar en ficha + checkout** | 70% busca señales de confianza antes de comprar; badges bajo el botón de pago suben checkout ~12%. Es el freno #1 de un marketplace argentino nuevo. | **S** |
| 2 | **Stock bajo / urgencia honesta** | "Quedan 3" sube urgencia hasta ~60%. El dato YA está en `stock`. Solo si es real (legal + confianza). | **S** |
| 3 | **"Responde en ~X min" en prestadores** | Google LSA y Thumbtack premian velocidad; el cliente elige a quien contesta rápido. Sale de la tabla de mensajes. | **S** |

## 🎯 LA APUESTA GRANDE
**Guest checkout + Mercado Pago Wallet (1-clic).** Forzar crear cuenta causa 24-26% de
los abandonos; guest checkout sube conversión 20-45%. MP Wallet guarda tarjetas → compra
en 1 clic. Es el cambio de mayor ROI en conversión pura. Esfuerzo: **M**.

---

## 📦 Marketplaces de PRODUCTOS — gaps detectados

| Idea | Qué resuelve | Ref | Esfuerzo |
|------|--------------|-----|----------|
| **Q&A público en ficha** | La duda pre-compra que hoy se va por WhatsApp y se pierde. Queda público (suma SEO). ML penaliza responder lento. | MercadoLibre, Amazon | M |
| **Reputación / "Vendedor verificado"** | Confianza = cuello de botella #1. Termómetro de reputación desde primeras ventas. | MercadoLibre, eBay, Etsy | M |
| **"Comprados juntos"** | Sube ticket promedio. ~35% de ventas de Amazon vienen de recomendaciones. Sin ML: co-ocurrencia en `order_items`. | Amazon | M |
| **Devoluciones self-service** | 92% recompra si la devolución es fácil; baja tickets soporte ~80%. Cubre botón arrepentimiento (ya existe estático). | Amazon, eBay | M |
| **Comparador de productos** | Parálisis al elegir entre similares; los mantiene adentro vs irse a Google. | Amazon | M |
| **Historial de precios** | Transparencia / confianza. Menor ROI inmediato. | CamelCamelCamel | M |

## 🔧 Marketplaces de SERVICIOS — gaps detectados

| Idea | Qué resuelve | Ref | Esfuerzo |
|------|--------------|-----|----------|
| **Verificación + badge (matrícula/DNI)** | Confianza #1 al contratar a alguien que entra a tu casa. Crítico para gasistas/electricistas (matrícula obligatoria). | Google Verified, Thumbtack, TaskRabbit | S (manual) |
| **Portfolio de trabajos del prestador** | Un albañil/peluquera vende por resultados visibles. Hoy la galería es del servicio, no del historial. | Thumbtack, Fiverr Pro | M |
| **Paquetes Básico/Estándar/Premium** | Transparencia de precio + upsell. "Destape simple" vs "destape + cámara". | Fiverr | M |
| **Cotizaciones estructuradas** | Plomería/electricidad no tienen precio fijo; hoy se negocia por chat sin trazabilidad. | Thumbtack, Upwork | M |
| **Agenda / booking con calendario** | Elimina el "¿cuándo podés venir?". Instant Book de Thumbtack = 2.4x más reservas. | Thumbtack, Doctoralia | L |
| **Pago en garantía (escrow)** | Confianza en transacciones grandes. Requiere integrar pagos retenidos con MP — fase posterior. | Upwork | L |

## 🚀 Tendencias UX / Conversión 2026

| Idea | Por qué (dato) | Esfuerzo | Impacto |
|------|----------------|----------|---------|
| **Trust bar + reviews verificadas** | +20% conversión con trust signals bien usados | S | alto |
| **Guest checkout + MP Wallet** | Guest sube conv. 20-45%; 48% abandona por costos sorpresa | M | alto |
| **Publicar con foto → IA arma el listing** | Facebook MP: +45% listings completados. Usa Workers AI de Cloudflare (ya disponible). | M | medio-alto |
| **Social proof + urgencia honesta** | "X viendo ahora" / "vendido hace 2h" con data REAL: picos 20-30% | S-M | medio-alto |
| **Search con autocomplete + "sin resultados" inteligente** | Autocomplete +24% ventas; quien busca convierte 1.8x | M | medio |
| **Core Web Vitals mobile (LCP)** | Mobile 60-70% tráfico pero 40-50% facturación; CWV "Good" = +24% conv mobile | S | medio |

---

## 💡 Síntesis: por dónde empezar

1. **Esta semana (quick wins S):** trust bar + stock bajo + "responde en X min" + apretar LCP de la ficha. Todo con data propia, cero servicios nuevos.
2. **Próximo sprint (M, confianza):** Q&A público + reputación/badge verificado + portfolio de prestadores. Es lo que separa "marketplace amateur" de "serio".
3. **Apuesta de conversión (M):** guest checkout + MP Wallet 1-clic.
4. **Diferenciador (M):** publicar con IA — ataca la OFERTA (en un marketplace nuevo, conseguir vendedores es tan crítico como compradores).
5. **Fase futura (L):** booking con calendario + escrow.

> Nota de método: ideas priorizadas por ratio impacto/esfuerzo. Las marcadas "S" usan
> datos/infra que Dale Deal YA tiene. Próximo informe (#02) profundizará una de estas
> con un plan de implementación concreto, o traerá ángulos nuevos no cubiertos acá
> (ej: gamification, programa de referidos, analytics de comportamiento, accesibilidad
> como diferenciador, i18n, app nativa).
