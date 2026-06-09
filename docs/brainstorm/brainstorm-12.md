# 🧠 Brainstorm #12 — LUPA: la ficha de detalle (PDP) producto + servicio

> Fecha: 2026-06-05 · Generado por research comparativo (3 agentes en paralelo)
> Referencias: Baymard (Product Page UX), NN/g, Amazon, MercadoLibre, Etsy, SHEIN, Target
> (productos) · Fiverr, Thumbtack, Airbnb, Upwork, TaskRabbit (servicios) + CWV 2026.

## Segunda lupa de ejecución
El #11 radiografió el checkout. El #12 toma la **ficha de detalle** — donde el usuario
decide. Dale Deal vende **productos Y servicios**, y se venden distinto: una ficha de
producto vende un **objeto** verificable; una de servicio vende a una **persona y su
trabajo** intangible → la conversión pasa de "convencer del objeto" a **reducir el riesgo
de contratar a un desconocido**. Por eso este informe trata las dos. Dato base: **82% de
los sites tienen problemas severos de UX en la PDP** → hay mucho por afilar sin features nuevas.

## Producto vs Servicio — el mapa de diferencias

| | Ficha de PRODUCTO | Ficha de SERVICIO |
|--|--|--|
| Above-fold | Galería del objeto | **Persona (foto real) + prueba** |
| Decisión | Specs, stock, fotos | Expertise, trabajos hechos, confianza |
| CTA | "Comprar / Agregar al carrito" | **"Contactar / Pedir presupuesto"** (WhatsApp) |
| Reviews | Del ítem | De la **persona** + verificación/matrícula |
| Precio | Fijo | **Paquetes** (Básico/Estándar/Premium) o "desde $X / por hora" |
| Logística | Envío + fecha | Zona de cobertura + disponibilidad + "responde en X" |

---

## 🎯 LA APUESTA GRANDE: reordenar el above-the-fold de ambas fichas al patrón ganador

El layout pobre es **por sí solo** causa de abandono. El orden que más convierte:

**Producto:** galería → **título** → ★ rating+nº reseñas (clickable) → **precio/cuotas/ahorro** →
stock → **envío + fecha concreta** → CTA (Comprar + Agregar).
**Servicio:** foto del prestador + título específico → ★ rating + nº de trabajos + zona →
**paquetes/precio** → "responde en X" + verificación → CTA (Contactar).

Hoy las fichas de Dale Deal tienen los elementos pero (probablemente) no en esta jerarquía
ni con un **buy box cohesivo**. Reordenarlas es **M** y de alto impacto. Es el cambio
estructural de la PDP.

---

## 🏆 TOP 3 QUICK WINS de la ficha (S, alto impacto)

| # | Fix | Por qué (dato) | Esfuerzo |
|---|-----|----------------|----------|
| 1 | **Rating clickable arriba (bajo el título, antes del precio) + histograma de estrellas** | 95% usa reviews; rating above-fold es de lo más mirado. El *ratings distribution summary* es el feature más usado y **43% de sites no lo tiene**. No persigas el 5,0: la conversión pico está en **4.0-4.7**. | **S** |
| 2 | **`fetchpriority="high"` + AVIF en la foto principal (LCP)** | La foto principal ES el LCP. 100ms de delay = −7% conversión; LCP 4-5s convierte **40-50% menos** y duplica bounce; CWV "Good" = **+24% conv mobile**. Ya tenés AVIF wrapping → falta priorizar la hero. | **S** |
| 3 | **Sticky CTA en mobile** (Comprar / Contactar) | **+8-15% general, +12-25% en mobile**; 70-80% scrollea más allá del botón original. Barra inferior: precio + ★ + botón. | **S** |

---

## Ficha de PRODUCTO — spec de ejecución

- **Buy box cohesivo** (panel derecho desktop / bajo galería mobile), en este orden:
  **precio → cuotas → ahorro → stock ("en stock") → envío + fecha → Comprar ahora →
  Agregar al carrito → vendedor/garantía**. El 85% de las ventas de Amazon pasan por este box.
- **Precio:** tachado (ancla) + actual destacado + ahorro. Regla: <$100 mostrar **% off**;
  >$100 mostrar **monto**; >$500 **ambos**. Descuento visible en la PDP (no solo checkout)
  sube conversión **25-40%**.
- **CTA:** incluí **ambos** (Comprar ahora primario + Agregar al carrito). **Sticky
  add-to-cart** en scroll: +5-15%.
- **Info: NO uses tabs horizontales** — **27% de usuarios ignoran** el contenido oculto
  (ahí caen specs/reviews/FAQ). Usá **una página larga** o TOC sticky. Descripción en
  bullets + ficha técnica como tabla.
- **Reviews — split placement:** rating clickable arriba + sección completa abajo con
  histograma. 5 reseñas = **+270%** de probabilidad de compra.
- **Envío + fecha concreta en la PDP** (no "3-5 días" → "llega el martes 9"): **+12%**.
  64% lo busca acá; 43% de sites no lo muestran.
- **Cross-sell** ("Comprados juntos") **debajo del fold**, después de specs/reviews — que
  no compita con la decisión. Cuidá la relevancia (52% muestran cross-sell irrelevante).

## Ficha de SERVICIO — spec de ejecución (lo que más diferencia a Dale Deal)

- **Above-fold = persona + prueba:** foto real del prestador (en Airbnb el 68% visita el
  perfil antes de reservar), **título específico** ("Electricista matriculado —
  instalaciones y urgencias", no "Electricista"), rating + nº de trabajos + zona de cobertura.
- **Caja de paquetes sticky:** Básico / Estándar / Premium en **3 columnas comparables**
  (entregables + plazo + precio). Premium = ancla, Estándar = objetivo. Para oficios sin
  tiers (plomero): "desde $X" + rango por hora (TaskRabbit muestra $/h).
- **Descripción personal, no specs:** problema → proceso → resultado. "Es tu oportunidad de
  presentarte".
- **Portfolio de trabajos reales** (3-5 con foto antes/después) — perfiles con 5★ pero **sin
  fotos de trabajo se evitan**.
- **Stack de confianza (en orden de peso):** badge de **verificación** (identidad,
  antecedentes, **matrícula**) → **"responde en X min"** + tasa de respuesta → antigüedad +
  nº de trabajos → reviews con foto + **precio total upfront**.
- **CTA = "Contactar / Pedir presupuesto"** (un servicio rara vez se compra en 1 clic).
  **WhatsApp como CTA primario es la jugada correcta** para Argentina. Opcional: agenda con
  slots clickeables (peluquera, turnos).

---

## Transversal (ambas fichas) — detalle de ejecución

- **Galería:** nº óptimo por categoría (3-5 simple · 5-8 visual · 6-10 complejo). **Zoom
  no-negociable** (Target: +13% con imágenes grandes + ángulos + zoom). Servir **≥1600px**.
  **67% evalúa la foto antes de leer** (74% en mobile) → la foto principal es el verdadero
  titular. **Video en la galería** (no en tab aparte): testimonial +80%, adoptantes 2,5x.
- **Social proof:** rating `★ 4.8 (1.247)` clickable **debajo del título, antes del precio**.
  Mostrá el **histograma 1-5★** (ocultarlo genera sospecha). **Reseñas con foto** (76% las
  busca) — thumbnails arriba del listado.
- **"Customers say" SIN IA:** chips/tags manuales o por keyword ("Tal cual la foto", "Llegó
  rápido", "Buen vendedor") que al tocarse **filtran reseñas** + mini-conteos. Aproxima el
  resumen de Amazon sin modelo.
- **Urgencia HONESTA:** "Quedan X" solo con stock real; "X viendo" solo con eventos reales.
  Francia bloqueó 80 sites por escasez/contadores falsos (foco UE 2025-2028) — un contador
  fabricado = pérdida permanente de confianza. Mejor nada que mentira.
- **Velocidad:** la foto principal = LCP → `fetchpriority="high"` + preload + AVIF/WebP +
  dimensiones fijas (evita CLS). Solo 39% de e-commerce pasa los 3 CWV.

---

## 📋 Scorecard de la ficha — orden sugerido

| Prioridad | Fix | Esfuerzo | Impacto |
|-----------|-----|----------|---------|
| 1 | Rating clickable arriba + histograma de estrellas | S | alto |
| 2 | `fetchpriority="high"` + AVIF en foto principal (LCP) | S | alto |
| 3 | Sticky CTA mobile (Comprar / Contactar) | S | alto |
| 4 | Reseñas con foto + chips "customers say" sin IA | S/M | alto |
| 5 | Servicio: stack de confianza (verificación + "responde en X" + portfolio) | M | alto |
| 6 | Producto: buy box cohesivo + precio con ahorro | M | alto |
| 7 | Envío + fecha concreta de entrega en la PDP | M | alto |
| 8 | Matar tabs horizontales → página larga / TOC sticky | M | medio-alto |
| 9 | Servicio: paquetes Básico/Estándar/Premium en 3 columnas | M | alto |
| 10 | **Reordenar above-the-fold de ambas fichas** *(apuesta grande)* | M | alto |

---

> **Estado de la serie:** 12 informes. #01-05 ideas · #06-10 planes de build · #11-12 lupas
> de ejecución (checkout, ficha). Próximas lupas: **experiencia de búsqueda** (autocomplete
> + filtros + "sin resultados") · **diseño de card de catálogo** · **el home del marketplace**
> · **microcopy que vende** · **onboarding del comprador primerizo**. El #13 toma una.
>
> 👉 Las lupas #11 y #12 son scorecards muy accionables (muchos fixes son **S** y reusan lo
> que ya tenés: galería, reviews, AVIF). Si querés que **frene y los implemente**, decímelo.
