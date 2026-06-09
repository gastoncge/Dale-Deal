# 🧠 Brainstorm #04 — El backbone operativo: oferta, seguridad y soporte

> Fecha: 2026-06-05 · Generado por research comparativo (3 agentes en paralelo)
> Marketplaces analizados: Airbnb, Etsy, Fiverr (cold-start + seller tools), Amazon,
> MercadoLibre, eBay, BlaBlaCar + servicios KYC/antifraude (Didit, Stripe Radar,
> FingerprintJS) + soporte IA (Intercom Fin, Mercado Ayuda, Airbnb Resolution Center).

## Cambio de eje respecto a #01–#03
Los tres informes anteriores miraron casi todo desde el **lado del comprador / la
demanda**:
- **#01** = convertir · **#02** = retener + monetizar + comunidad · **#03** = traer
  tráfico + logística + data.

El **#04 (este)** mira la **trastienda que ningún informe tocó**: las 3 capas
"poco sexy" pero que deciden si el marketplace sobrevive a escala:
**(A) conseguir y activar VENDEDORES (la oferta)**, **(B) anti-fraude / trust & safety**,
**(C) soporte y autoservicio**. Cero overlap con #01–#03.

---

## 🏆 TOP 3 QUICK WINS (alto impacto, bajo esfuerzo)

| # | Idea | Por qué | Esfuerzo |
|---|------|---------|----------|
| 1 | **Checklist de activación "Completá tu tienda"** | El promedio de completitud de onboarding de vendedor es **~19%** → margen enorme. Un % de perfil completo (avatar, bio, 1er listing, datos de pago) empuja al vendedor a publicar Y vender. Reusa datos que ya tenés; es read-mostly. | **S** |
| 2 | **Velocity checks + guardar score antifraude de MP** | Mercado Pago ya devuelve señales antifraude en el webhook — hoy las tirás. Guardarlas + contar pagos/transacciones por usuario+IP en ventanas (1h/24h) y frenar sobre umbral ataca el fraude #1 ("cobra y no entrega") con SQL puro y costo cero. | **S** |
| 3 | **FAQ contextual en el widget de soporte que ya existe** | Help contextual da **+25-30% engagement** y baja tickets 20-30%. El widget ya existe: que cargue 3-4 artículos según la página (`data-help-context="checkout\|publicar\|pago"`). JSON estático, cero IA. | **S** |

## 🎯 LA APUESTA GRANDE
**Sistema de activación del vendedor: wizard "Publicá en 3 pasos" + seller dashboard.**
Las apuestas grandes de #02 (referidos) y #03 (SEO) eran ambas de **demanda**. Pero un
marketplace tiene **dos lados**, y el research de cold-start es unánime: **sin oferta no
hay marketplace** — Airbnb scrapeó Craigslist y emailó hosts uno por uno; Etsy mandó
fundadores a ferias a reclutar artesanos ("do things that don't scale"). Una vez con
vendedores, el dial #1 es **activación**: que publiquen y hagan su primera venta. Hoy
"publicar" es un formulario largo donde la mayoría abandona. Convertirlo en **wizard de
3 pasos** (1: fotos — ya hay multi-imagen · 2: título+categoría+descripción · 3: precio)
con barra de progreso y estado en `localStorage`, + pantalla de éxito "compartí tu link
por WhatsApp", + un **seller dashboard** en `mis-ventas` con vistas/mensajes/conversión
(las métricas que hacen que el vendedor vuelva). Esfuerzo: **M**. Es la mitad del
marketplace que los 3 informes anteriores no atendieron.

---

## 🏪 EJE A — Conseguir y activar VENDEDORES (la oferta)

| Idea | Qué resuelve | Ref | Esfuerzo |
|------|--------------|-----|----------|
| **Checklist "Completá tu tienda"** | Activación. Onboarding promedio ~19% completado. Tabla `seller_onboarding` con flags + widget % en mi-cuenta. | Estándar SaaS | **S** |
| **Sugerencias de mejora de listing (reglas, no IA)** | Oferta de calidad → más conversión para todos. Score 0-100: <3 fotos, título corto, sin categoría/precio → banner con tips. Heurística JS, barato. | Etsy títulos | **S** |
| **Wizard "Publicá en 3 pasos"** *(apuesta grande)* | Baja la fricción de la 1ª publicación, donde más se abandona. | Etsy, Fiverr gig builder | **M** |
| **Seller dashboard (vistas/mensajes/conversión)** *(apuesta grande)* | Retención del vendedor: sin feedback de "funciona", se va. Tabla `listing_views` (throttle por sesión) + tarjetas en mis-ventas. | Etsy Shop Stats, Fiverr Analytics | **M** |
| **Seller Handbook + niveles/badges** | Educación + trust del comprador. 4-6 artículos (voseo) + badge "Nuevo/Activo/Destacado" derivado de ventas+rating+respuesta. | Etsy Handbook, Fiverr levels | **M** |
| **Importación masiva por CSV** | Desbloquea vendedores con catálogo (revendedores, comercios) que no cargan 50 productos a mano. Upload→preview→bulk insert transaccional. | eBay File Exchange | **L** |

## 🛡️ EJE B — Anti-fraude & Trust/Safety (que no se llene de estafadores)

| Idea | Qué resuelve | Ref | Esfuerzo |
|------|--------------|-----|----------|
| **Velocity checks + score antifraude de MP** | Vendedor que cobra y no entrega, tarjetas robadas, ataques de volumen. SQL puro, cero costo. | Stripe Radar | **S** |
| **Anti-leakage: maskear tel/email en mensajes** | Disintermediación amenaza hasta **18%** de transacciones + protege al usuario de estafas off-platform. Regex que reemplaza por "[oculto]" + loggea intento como señal de riesgo. | BlaBlaCar | **S/M** |
| **Reviews de "compra verificada" + heurísticas** | Reviews falsas matan la credibilidad (Amazon bloqueó **cientos de millones** en 2025). Permitir reseñar solo con transacción real en DB + detectar ráfagas → cola admin. | Amazon | **M** |
| **KYC de identidad para vendedores (Didit)** | Estafadores re-registrándose / productos fantasma. **Didit: KYC ID+liveness a ~US$0,30, 500 gratis/mes para siempre.** Disparar solo en momentos de riesgo (1er payout, monto alto), no al registro. | Onfido, Stripe Identity | **M** |
| **Moderación de listings (auto + cola humana)** | Listings prohibidos, imágenes inapropiadas, spam. Blocklist de keywords (como el honeypot) + moderación de imágenes (Sightengine/Rekognition) → `pending_review`. | Patrón estándar T&S | **M** |
| **Device fingerprinting + trust score por comportamiento** | Baneados que vuelven, multi-accounting (fraude multi-paso +180% YoY). FingerprintJS visitor ID + score (antigüedad, tasa de respuesta, % completadas, KYC). | Fingerprint, Incognia | **M** |

## 🎧 EJE C — Soporte & autoservicio (que el crecimiento no te ahogue)

| Idea | Qué resuelve | Ref | Esfuerzo |
|------|--------------|-----|----------|
| **FAQ contextual en el widget existente** | +25-30% engagement, −20-30% tickets, sin sacar al user del flujo. JSON estático por página. | Widgets contextuales | **S** |
| **Centro de Ayuda + FAQ schema** | Deflection base **25-35%** + SEO gratis (FAQ schema → featured snippets). Páginas `/ayuda` HTML + buscador Fuse.js + "¿te sirvió?". Alimenta el bot. | Mercado Ayuda, Airbnb | **S/M** |
| **Estados self-service "Mi compra/Mi venta"** | "¿Dónde está mi compra?"/"quiero cancelar" = mayor volumen → **60-80% deflection**. Timeline de estados + acciones contextuales en Mi Cuenta. | ML "Mis Compras" | **M/L** |
| **Chatbot IA con RAG sobre pgvector** | Absorbe consultas repetidas 24/7 (containment maduro **70-90%**). Embeddings de tus artículos (`text-embedding-3-small`, ~US$0,005-0,01/consulta) en **pgvector** (ya tenés Postgres). Escala a humano si baja confianza o keywords "reclamo/estafa". | Intercom Fin | **M** |
| **Resolución de disputas guiada (ODR)** | Estructura el reclamo (el caso más caro y sensible). Wizard sobre la mensajería: reclamo → SLA 48h → escala a admin → refund (endpoint ya existe). | Airbnb Resolution Center | **M/L** |
| **WhatsApp como canal + SLAs publicados** | Canal preferido en LATAM posventa. Fase 1: link `wa.me` con mensaje pre-armado + publicar SLAs. Fase 2: WhatsApp Business API solo si el volumen lo justifica. | Estándar LATAM | **S** → **M** |

---

## 💡 Síntesis: roadmap sugerido

1. **Esta semana (S, todo sobre infra existente):** checklist "Completá tu tienda" +
   velocity checks con el score de MP + FAQ contextual en el widget. Uno por eje, los
   tres baratos.
2. **La apuesta de la oferta (M):** wizard "Publicá en 3 pasos" + seller dashboard.
   Es la mitad del marketplace que #01–#03 no atendieron. **Sin vendedores activos,
   todo lo demás (SEO, referidos, conversión) no tiene qué mostrar.**
3. **El piso de seguridad no-negociable (S→M, en paralelo):** maskeo anti-leakage +
   reviews de compra verificada + KYC con Didit en momentos de riesgo. Un marketplace
   muere si los estafadores entran más rápido que la confianza.
4. **Soporte que escala (M):** Centro de Ayuda con FAQ schema (sirve doble: deflection
   + SEO) → luego el chatbot RAG sobre pgvector cuando el volumen lo pida.
5. **Madurez (L):** importación CSV (vendedores con catálogo) + estados self-service de
   pedido + ODR de disputas (se apoya en el escrow del #02).

> Nota estratégica: este informe corrige un sesgo de los 3 anteriores —todos miraban la
> demanda. Pero el cuello de botella de un marketplace nuevo suele ser la **oferta** (no
> tener qué vender) y la **confianza** (estafas que espantan a todos). Atender la
> trastienda no es opcional: es lo que sostiene el peso de las ideas de demanda.
>
> Próximo informe (#05): plan técnico paso a paso de UNA apuesta acumulada (wizard del
> vendedor de este #04, referidos del #02, escrow del #02, o SEO programático del #03),
> o ángulos nuevos sin tocar: internacionalización/multi-moneda, app nativa vs PWA,
> accesibilidad como diferenciador competitivo, o sostenibilidad/impacto local.
