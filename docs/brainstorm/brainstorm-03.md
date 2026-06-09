# 🧠 Brainstorm #03 — Crecer y vender más: tráfico gratis, logística y data

> Fecha: 2026-06-05 · Generado por research comparativo (3 agentes en paralelo)
> Marketplaces analizados: MercadoLibre/Mercado Envíos, Amazon, Thumbtack, Etsy,
> Airbnb + carriers AR (Correo Argentino, Andreani, OCA, Enviopack, Zippin).

## Cambio de eje respecto a #01 y #02
- **#01** = convertir al que ya entró (ficha, checkout, confianza).
- **#02** = retener + ganar plata + comunidad (loyalty, comisión, escrow).
- **#03 (este)** = los **3 motores que faltan** para que el negocio escale, sin
  inventar nada exótico: **(A) tráfico orgánico gratis (SEO programático)**,
  **(B) logística/envíos**, **(C) personalización con data propia**. Cero overlap.

---

## 🏆 TOP 3 QUICK WINS (alto impacto, bajo esfuerzo)

| # | Idea | Por qué | Esfuerzo |
|---|------|---------|----------|
| 1 | **"Vistos recientemente"** | El driver de retorno más barato que hay. Tabla `recently_viewed` (o `localStorage` para anónimos) + un carrusel. Amazon/ML lo tienen hace años; personalización de browse genera **+89% en compras**. | **S** |
| 2 | **Mostrar costo de envío en la ficha** | **64% busca el costo de envío ANTES de agregar al carrito** — hoy Dale Deal lo deja en blanco y eso abandona ventas. Arrancar con tabla de zonas flat-rate (CABA/GBA/interior × peso) editable por admin, sin API. | **S** |
| 3 | **Schema avanzado: ItemList + AggregateRating + BreadcrumbList** | Páginas con structured data ganan **~35% más CTR** sobre el MISMO ranking de Google. Reusa los reviews y el sitemap que ya tenés. Más clics gratis. | **S** |

## 🎯 LA APUESTA GRANDE
**SEO programático: páginas de categoría + ubicación generadas a escala.** El
long-tail es ~70% de las búsquedas y convierte ~2,5x mejor. **Thumbtack** llegó 10
años tarde a su sector y aun así domina el resultado local de servicios (valuación
US$1.300M) apoyado casi enteramente en páginas city+categoría. Para un marketplace
**sin presupuesto de ads, es el canal de adquisición más durable que existe** — tráfico
gratis que compone con el tiempo y que la plata no puede comprar. Dale Deal corre en
**Cloudflare Workers**, que puede hacer SSR: ruta `/{categoria}/{barrio}` (ej.
`/plomeria/palermo`, `/electricista/belgrano`) que consulta Postgres y renderiza HTML
único. **Empezar con top 20 categorías × 30 barrios CABA/GBA ≈ 600 páginas indexables.**
Clave: cada página con contenido REAL distinto (FAQ del barrio, # de profesionales,
precios locales) — si no, Google la penaliza por duplicada. Esfuerzo: **L**, pero es
el moat. Complementa al #02 (referidos = boca en boca; esto = Google).

---

## 🔎 EJE A — SEO programático & descubrimiento orgánico (CAC ≈ 0)

| Idea | Qué resuelve | Ref | Esfuerzo |
|------|--------------|-----|----------|
| **Schema avanzado (ItemList + AggregateRating + Breadcrumb)** | +35% CTR sobre mismo ranking. (Ojo: FAQPage ya casi no da rich snippet — Google lo limitó). | Rich results | **S** |
| **Hubs de categoría + internal linking en ≤3 clics** | Que Google descubra/indexe las páginas programáticas (sin links quedan huérfanas). Paginación con `canonical`, filtros en `noindex,follow` para no quemar crawl budget. | Regla técnica SEO | **M** |
| **SEO local para servicios (LocalBusiness + GBP)** | "Cerca mío" dispara AI Overviews en >40% de queries locales. JSON-LD `LocalBusiness` con `areaServed`/`geo` + animar a cada pro a crear su Google Business linkeando a Dale Deal. | Thumbtack, Google local | **M** |
| **Páginas programáticas categoría+ubicación** *(apuesta grande)* | Captura long-tail de intención altísima ("plomero en Palermo"). | ML, Amazon, Thumbtack | **L** |
| **Páginas de colección por atributo** | Long-tail por atributo ("iPhone 13 usado", "notebook gamer barata"). Mismo motor SSR filtrando por tags; solo si hay ≥N listings. | Etsy, Amazon | **M** |
| **Blog / guías "cómo elegir" + Q&A indexable** | Captura intención informacional arriba del funnel + backlinks. Tiendas con blog: **+55% tráfico orgánico**. `/guias/{slug}` desde Markdown en R2/D1. | Airbnb guides | **S** infra |

## 📦 EJE B — Logística & envíos (el gap operativo #1 de productos)

| Idea | Qué resuelve | Ref | Esfuerzo |
|------|--------------|-----|----------|
| **Calculadora de envío por CP (zonas flat-rate)** | 64% busca el costo antes de comprar. Empezar sin API: tabla de zonas × peso, editable por admin. | Tiendanube básico | **S** |
| **Calculadora real por API (Correo Argentino / Andreani)** | Costo + plazo exactos por CP. Guardar `peso`+`dimensiones` por producto, endpoint que cotiza y cachea por CP+peso. | Mercado Envíos | **M** |
| **Agregador multi-carrier (Enviopack / Zippin)** | UNA integración = Andreani+OCA+Correo+Urbano + elige la más barata. **El mayor ROI por esfuerzo** — desbloquea etiqueta, tracking, puntos y devoluciones de una. | Enviopack (+30 operadores, +1500 puntos) | **M** |
| **Etiqueta + tracking integrado para el comprador** | Mata el "¿dónde está mi pedido?". Al pagar → genera etiqueta (PDF) + `tracking_number`, webhook actualiza estados, avisás por Resend. | Mercado Envíos | **M** |
| **Puntos de retiro / lockers** | Envío más barato que domicilio (sube conversión) + elimina "no estaba en casa". Andreani: +2000 puntos HOP. | Andreani HOP, PUDO | **M** |
| **Logística inversa (devoluciones) operativa** | Confianza pre-compra + operación post-venta sin coordinar a mano. Drop-off en sucursal, atado al refund endpoint que ya existe. | Enviopack Drop-OFF | **L** |

## 🧠 EJE C — Personalización & recomendaciones con data propia (sin ML pesado)

| Idea | Qué resuelve | Ref | Esfuerzo |
|------|--------------|-----|----------|
| **"Vistos recientemente" / "Seguí viendo"** | El win de retorno más barato. Tabla con `UNIQUE(user,product)` + `ON CONFLICT DO UPDATE`; anónimos en localStorage. | Amazon, ML | **S** |
| **Tracking de eventos / embudo** | Prerequisito de TODO lo demás. Tabla `events` (view/select/favorito/checkout/purchase), `POST /events` fire-and-forget. Mide drop-off. CF Web Analytics no llega a nivel producto. | GA4 estándar | **M** |
| **Ranking de catálogo por relevancia (no por fecha)** | Score compuesto en SQL: `0.4·ln(views) + 0.3·conv + 0.2·rating + 0.1·recencia`. Columnas denormalizadas en `products`. +101 reviews → +250% conversión. | Algolia learn-to-rank | **M** |
| **Co-visitación: "otros también vieron"** | Filtrado colaborativo item-item en SQL puro (tabla `product_covisit` recalculada nightly). ML publicó un modelo de grafo así que **superó a BERT4Rec** sin redes neuronales. | MercadoLibre | **M** |
| **Home "Para vos" / "Inspirado en lo que viste"** | Recomendaciones = **35% de ventas de Amazon**. Carrusel SSR de las últimas categorías vistas, rankeadas por popularidad; sin login cae a trending. | Amazon, ML | **M** |
| **Emails personalizados por comportamiento** | Browse-abandono: **34,5% open rate, 2x CTR** vs promo. Cron sobre `events` + template de newsletter existente. | Flujos behavior | **M** |

---

## 💡 Síntesis: roadmap sugerido

1. **Esta semana (S):** vistos recientemente + costo de envío con tabla de zonas +
   schema avanzado. Tres interruptores baratos sobre infra existente; los dos primeros
   atacan abandono directo, el tercero trae clics gratis de Google.
2. **El prerequisito invisible (M):** tabla de **eventos**. Sin medir el embudo, la
   personalización (home, co-visitación, emails) no existe. Es la base de todo el Eje C.
3. **El unlock operativo (M):** integrar **Enviopack** (un solo SDK) → habilita
   cotización real, etiqueta, tracking, puntos de retiro y devoluciones de una.
   Es lo que vuelve "vendible en serio" el lado productos.
4. **La apuesta de crecimiento (L):** SEO programático categoría+ubicación. Lento en
   madurar pero es el moat de adquisición gratis. Sembrarlo ya para cosechar en meses.
5. **Capa de inteligencia (M, cuando haya eventos):** co-visitación + ranking por
   relevancia + home "Para vos". Cada uno sube conversión con la data que ya generás.

> Nota de método: el orden óptimo NO es por esfuerzo sino por dependencia — la tabla
> de eventos (paso 2) destraba medio Eje C, y Enviopack (paso 3) destraba medio Eje B.
> Invertir en esas dos "llaves" primero hace barato todo lo que viene después.
>
> Próximo informe (#04): plan técnico paso a paso de UNA de las apuestas grandes
> acumuladas (referidos del #02, escrow del #02, o SEO programático de este #03), o
> ángulos nuevos aún sin tocar: onboarding del vendedor (qué tan fácil es publicar),
> moderación/anti-fraude, soporte/centro de ayuda, o app nativa vs PWA.
