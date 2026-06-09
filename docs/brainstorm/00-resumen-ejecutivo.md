# 📊 Resumen ejecutivo — 13 informes de Brainstorm (Dale Deal)

> Generados en loop (cada ~30 min) comparando Dale Deal contra los mejores
> marketplaces del mundo (MercadoLibre, Amazon, Fiverr, Thumbtack, Airbnb, Etsy,
> Vinted, Back Market, Temu, etc.) + tendencias e-commerce 2026.
> Este archivo es el **índice + síntesis** de los 13 informes individuales.

---

## Las 3 fases del loop

| Fase | Informes | Qué hizo |
|------|----------|----------|
| **1 · Ideación amplia** | #01–#05 | Mapear "qué le falta" a Dale Deal vs el mundo. ~85 ideas. |
| **2 · Planes de build** | #06–#10 | Plan técnico paso a paso de las 5 apuestas grandes. |
| **3 · Lupas de ejecución** | #11–#13 | Afinar a nivel mundial lo que YA existe (checkout, ficha, búsqueda). |

---

## Índice de los 13 informes

| # | Título | Tipo | En una línea |
|---|--------|------|--------------|
| 01 | Dale Deal vs. los mejores del mundo | Ideas | Conversión, confianza y ficha: trust bar, guest checkout, Q&A, reputación, booking, escrow. |
| 02 | El motor de negocio | Ideas | Retención + plata + comunidad: referidos, loyalty, comisión por categoría, ads, lead fees, seguir vendedores. |
| 03 | Crecer y vender más | Ideas | Tráfico gratis (SEO programático), logística/envíos (Enviopack), data (recomendaciones, vistos recientemente). |
| 04 | El backbone operativo | Ideas | La trastienda: conseguir vendedores (oferta), anti-fraude, soporte/ayuda. |
| 05 | Lo que un playbook global se pierde | Ideas | **Argentina**: cuotas reales, precio USD, WhatsApp, regateo + circular (usados) + emergente (agentic, búsqueda visual). |
| 06 | Programa de referidos doble lado | **Plan build** | Crecimiento: schema, atribución, anti-fraude, crédito con MP, emails, sharing por WhatsApp. |
| 07 | Cuotas reales calculadas | **Plan build** | Conversión #1 en AR: quién paga el "sin interés", API de MP, CFT/TEA, display en card. |
| 08 | Activación del vendedor | **Plan build** | Oferta: wizard "Publicá en 3 pasos", quality score, checklist, dashboard del vendedor. |
| 09 | Compra Protegida (sin escrow propio) | **Plan build** | Confianza: NO custodiar plata (trampa regulatoria) → apoyarse en MP + capa de disputas. |
| 10 | WhatsApp commerce | **Plan build** | El canal de LatAm: Cloud API, bot con pgvector, notificaciones, ventana de 24h, opt-in. |
| 11 | El checkout como los mejores | **Lupa** | Migrar a Bricks (embebido), teclados mobile, trust bajo el botón, validación on-blur, aprobación MP. |
| 12 | La ficha de detalle (PDP) | **Lupa** | Producto vs servicio, above-the-fold, rating clickable, LCP, stack de confianza para servicios. |
| 13 | Búsqueda y descubrimiento | **Lupa** | Autocomplete (pg_trgm), página de 0 resultados, sinónimos argentinos, ranking por relevancia. |

---

## 🎯 Las "apuestas grandes" (y su estado)

| Apuesta | Qué resuelve | Estado |
|---------|--------------|--------|
| **Referidos doble lado** | Crecimiento barato (CAC −30-70%) | ✅ Plan completo (#06) |
| **Cuotas reales** | Conversión #1 en Argentina | ✅ Plan completo (#07) |
| **Activación del vendedor** | Conseguir oferta (la otra mitad del marketplace) | ✅ Plan completo (#08) |
| **WhatsApp commerce** | El canal de venta de LatAm | ✅ Plan completo (#10) |
| **Compra Protegida** | Confianza P2P ("¿y si pago y no llega?") | ⚠️ Plan + 2 confirmaciones pendientes (MP + abogado) (#09) |
| **SEO programático** | Tráfico orgánico gratis (moat) | 💡 Idea desarrollada (#03), sin plan de build aún |

---

## 🏆 Quick wins transversales (lo barato y de alto impacto que más se repitió)

Todos esfuerzo **S**, reusan infra que ya tenés:
1. **Cuotas reales en la card** (no texto fijo) — la palanca de conversión #1 en AR.
2. **Bloque de confianza debajo del botón de pago** ("Pago protegido por MP" + medios + cuotas) → +12%.
3. **WhatsApp contextual** — link con el producto/precio/URL pre-cargados.
4. **Alertas de precio/stock sobre favoritos** — el email de mayor open rate (~59%).
5. **Vistos recientemente** — el driver de retorno más barato.
6. **Página de "0 resultados" útil** (sugerencias + populares + WhatsApp), no callejón sin salida.
7. **Teclados + autocomplete correctos en checkout mobile** → +20% conversión mobile.
8. **`fetchpriority="high"` en la foto principal** (LCP) → +24% conv mobile con CWV "Good".
9. **Stock bajo honesto** ("Quedan 3") — el dato ya está en la DB.
10. **"Responde en ~X min"** en prestadores — sale de la tabla de mensajes.

---

## 💡 Los 6 hallazgos más importantes de toda la serie

1. **Para Argentina, cuotas reales + WhatsApp son las 2 palancas que un benchmark global no ve.** El argentino decide por "cuánto pago por mes" y cierra por WhatsApp.
2. **Un marketplace nuevo muere tanto por falta de OFERTA como de demanda.** Los primeros informes sesgaban a comprador; la activación del vendedor es la otra mitad.
3. **NO construir un escrow propio.** Custodiar plata de terceros te encuadra como PSPCP ante el BCRA (registro + encaje 100%), y la API de retención de MP está marcada como obsoleta. → Apoyarse en la Compra Protegida de MP.
4. **Mercado Pago NO tiene cupón controlable por el comercio.** Todo crédito/descuento (referidos, cuotas sin interés) se aplica del lado tuyo ANTES de crear la preferencia.
5. **4 de las 5 causas top de abandono de carrito las controlás vos** (costos sorpresa, forzar cuenta, desconfianza, checkout largo). El checkout es puro "ejecutar mejor".
6. **Casi todo es factible con Postgres**, sin pagar servicios: `pg_trgm` (typos/autocomplete), tabla de sinónimos (modismos AR), `pgvector` (búsqueda semántica + bot de WhatsApp).

---

## 🚦 Recomendación: por dónde empezar

**Semana 1 — quick wins (todo S, cero infra nueva):** cuotas reales en la card +
bloque de confianza en el checkout + WhatsApp contextual + alertas de favoritos +
página de 0 resultados + teclados mobile. *Impacto directo en conversión, riesgo casi nulo.*

**Después — UNA apuesta grande con plan listo:** lo más recomendable por ROI/esfuerzo es
**referidos** (#06) o **cuotas reales completas** (#07). Ambas usan solo Postgres + MP +
Resend que ya tenés.

**Más adelante:** activación del vendedor (#08) para la oferta, y WhatsApp commerce (#10)
para el canal. Compra Protegida (#09) cuando tengas las 2 confirmaciones (MP + abogado).

---

## 📁 Dónde está cada cosa

Todos los informes están en `docs/brainstorm/`:
- `brainstorm-01.md` … `brainstorm-05.md` → ideas (qué falta)
- `brainstorm-06.md` … `brainstorm-10.md` → planes de build (cómo construirlo)
- `brainstorm-11.md` … `brainstorm-13.md` → lupas de ejecución (cómo afinarlo)
- `00-resumen-ejecutivo.md` → este índice

> Nota: el loop se frenó en el #13. El #14 (diseño de card de catálogo) quedó pendiente.
> Cada informe individual tiene su propia tabla de prioridad (Idea · Esfuerzo · Impacto ·
> Referencia) y, los de build, el esquema de datos + endpoints + rollout.
