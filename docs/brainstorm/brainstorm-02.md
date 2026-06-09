# 🧠 Brainstorm #02 — El motor de negocio: retención, plata y comunidad

> Fecha: 2026-06-05 · Generado por research comparativo (3 agentes en paralelo)
> Marketplaces analizados: MercadoLibre/Mercado Ads/Meli+, Amazon, Etsy, Fiverr,
> Airbnb, Thumbtack, Temu, Shein, AliExpress, Shopee, TikTok Shop, Depop, eBay.

## Cambio de eje respecto al #01
El **#01** atacó *conversión y confianza en la ficha/checkout* (trust bar, guest
checkout, Q&A, badges, booking…). Este **#02 NO repite nada de eso**: cambia de
pregunta. En vez de "cómo convertir al que ya entró", se pregunta:

1. **¿Cómo lo traigo de vuelta?** → retención y growth loops
2. **¿Cómo gano plata?** → modelo de ingresos (hoy solo el 5% de comisión)
3. **¿Cómo construyo comunidad y confianza profunda?** → engagement + escrow

---

## 🏆 TOP 3 QUICK WINS (alto impacto, bajo esfuerzo — todo reusa infra existente)

| # | Idea | Por qué | Esfuerzo |
|---|------|---------|----------|
| 1 | **Alertas de precio/stock sobre favoritos** | Los favoritos YA existen. Guardar `price_snapshot` al favoritear y mailear "bajó de precio / volvió el stock". Back-in-stock convierte **5-6,5%** con **open rate ~59%** (el email automático de mayor ROI de 2025). Reactiva intención alta ya existente. | **S** |
| 2 | **Activar el modal de "planes destacados" → Mercado Pago** | El modal YA está construido (deshabilitado). Conectarlo a MP como pago único: Destacado/Urgente/Bump al tope, con `featured_until` + orden del catálogo por ese flag. Es la fruta más madura: ingreso directo, infra de pagos ya existe. | **S/M** |
| 3 | **Comisión por categoría (no flat 5%)** | ML cobra **11-17%** según rubro; Etsy saca **~53%** de sus ingresos de la comisión. El 5% flat deja plata sobre la mesa. Solo agregar `commission_rate` a categorías y leerlo en el cálculo (el motor de comisión ya existe). | **S** |

## 🎯 LA APUESTA GRANDE
**Programa de referidos de doble lado ("Traé un amigo").** Para un marketplace
**nuevo**, el problema existencial no es convertir — es *tener usuarios*. El referido
es el canal más barato: **CAC −30-50%**, los referidos **churnan 18-30% menos** y
tienen **LTV 16-120% mayor**; los incentivos de doble lado convierten **~36% más**.
Implementación: tabla `referrals` (código único por usuario), link `?ref=CODIGO` que
setea cookie, y se acredita crédito a **ambos** cuando el nuevo completa su **primera
compra** (atar a compra, no a signup, evita fraude). Email vía Resend (ya integrado).
El #01 hizo que el embudo *convierta*; esta apuesta lo *llena*. Esfuerzo: **M**.

---

## 🔁 RETENCIÓN & GROWTH — lo que nos falta

| Idea | Qué resuelve | Ref | Esfuerzo |
|------|--------------|-----|----------|
| **Alertas precio/stock en favoritos** | Retención + LTV. El email automático de mayor open rate (~59%). | Shopify (Swym/Notify) | **S** |
| **Lifecycle emails (browse abandonado + win-back)** | Recupera revenue casi perdido. Carrito/browse abandonado convierte 10-20%, ROI 30:1; serie de 3 mails rinde ~6x vs uno. Cron node-cron sobre favoritos/vistas sin compra en 24-72h. | Benchmark universal | **M** |
| **Referidos doble lado** *(apuesta grande)* | CAC −30-50%; referido más leal. | Estándar (Dropbox, ML) | **M** |
| **Ruleta/cupón de bienvenida + check-in** | Re-engagement y hábito. Cupón server-side al signup (anti-trampa). Ojo dark patterns. | Temu/Shein/AliExpress | **M** (S solo ruleta) |
| **Web Push de re-engagement** | Reactiva dormidos sin depender solo de email. La PWA/manifest ya existe → Web Push API (VAPID + service worker). Arrancar con price-drop. | Shein/Temu | **M** |
| **Puntos/cashback canjeable** | LTV y frecuencia. Ledger `loyalty_points` (earn/redeem), % de cada compra como saldo. Empezar simple, sin niveles. | Mercado Puntos / Meli+ | **L** |

## 💰 MONETIZACIÓN — cómo ganar plata (hoy solo 5% de comisión)

| Modelo | Quién + número | Aplicable a Dale Deal | Esfuerzo | Ingreso |
|--------|----------------|------------------------|----------|---------|
| **Comisión por categoría** | ML 11-17%; Etsy comisión = ~53% ingresos | Alta (productos + servicios) — el 5% flat deja plata | **S** | alto |
| **Planes destacados (activar modal)** | ML clasificados "destacar/renovar" | Alta — modal ya construido, pago único MP | **S/M** | medio |
| **Lead fees B2B (pay-per-lead)** | Thumbtack **US$8-100+/lead** (~$35-60), créditos a ~$1,50 | Alta para **servicios** — ya tenés leads B2B sin monetizar | **M** | alto (servicios) |
| **Ads internos / Promoted listings** | **Mercado Ads +US$1.000M/año, +63% YoY**; Etsy Ads ~18% ingresos | Alta productos / media servicios — CPC subastado, slot "Patrocinado" | **L** | alto |
| **Suscripción vendedor "Pro"** | Amazon Pro US$39,99/mes; Etsy Plus US$10/mes | Media — comisión reducida + destacados + badge + analytics; flag `is_pro` | **M** | medio |
| **Servicios de valor agregado (fintech)** | Shopee préstamos +90% YoY; ML cuotas/envíos | Media-alta — spread en financiación, etiqueta de envío, garantía partner | **L** (negocio) | medio-alto |

## 🤝 COMUNIDAD & CONFIANZA AVANZADA — engagement profundo

| Idea | Qué resuelve | Ref | Esfuerzo |
|------|--------------|-----|----------|
| **Seguir vendedores/tiendas + feed de novedades** | Convierte compra única en relación; reactiva sin ads. Tabla `follows` + notif a followers al publicar (reusa mensajería/notif). | Etsy "Updates", Depop, tiendas ML | **M** |
| **Compra Protegida (escrow con MP)** | El bloqueo #1 P2P en Argentina: "¿y si pago y no llega?". Retener liberación al vendedor con `release_after` post-entrega. Estados: paid→shipped→delivered→released/refunded. El refund endpoint ya existe como base. | ML Compra Protegida, eBay MBG | **L** |
| **Disputas / mediación formal** | Cierra el loop del escrow; evita que el conflicto se vaya a redes/contracargo. Tabla `disputes` + hilo dedicado, admin resuelve → refund/release. | eBay, ML | **M** (si escrow existe) |
| **Video corto en ficha (vendedor)** | +65% conversión, −35% devoluciones. Servicios: "así trabajo". Campo `video_url`: arrancar con embed YouTube, luego upload a R2. | TikTok Shop, Shopee Live | **S** (embed) / **M** (upload) |
| **UGC: fotos de clientes en la ficha** | Prueba social más allá del review escrito (+10-25% conv). Extender el form de reviews con `review_images` + moderación admin (panel ya existe). | Alo Yoga, reviews con foto | **S/M** |
| **Wishlists públicas/compartibles** | Adquisición viral: la lista trae gente nueva. 31% usan wishlists para regalos. Favoritos → `slug` público + `/lista/:slug` con OG tags, compartir por WhatsApp (ya integrado). | Elfster, apps Shopify | **S/M** |

---

## 💡 Síntesis: roadmap sugerido

1. **Esta semana (S, encender lo que ya existe):** alertas de precio/stock sobre
   favoritos + activar el modal de planes destacados + comisión por categoría.
   Cero infra nueva — son interruptores sobre data/código que ya tenés. *Y ya empezás
   a facturar más allá del 5%.*
2. **Próximo sprint (M, llenar el embudo):** referidos doble lado + lifecycle emails
   (browse abandonado / win-back). El #01 hizo que convierta; esto trae a la gente.
3. **Monetizar servicios (M):** lead fees estilo Thumbtack — es *el* modelo del
   vertical de servicios y hoy está 100% sin tocar.
4. **Bloque de confianza (L, la base que destraba todo):** Compra Protegida (escrow
   con MP) + disputas. Es lo que convierte "marketplace de gente desconocida" en
   "lugar seguro para pagar". Habilita el P2P real.
5. **Comunidad (S→M, cuando haya masa):** seguir tiendas + UGC con foto + wishlists
   compartibles. Reusan infra de favoritos/reviews/notif.

> Nota de método: ideas priorizadas por ratio impacto/esfuerzo. Las "S" reusan
> infra que Dale Deal YA tiene (favoritos, modal de destacados, motor de comisión,
> form de reviews, mensajería, PWA). Cero overlap con el #01.
>
> Próximo informe (#03) profundizará UNA de estas con un plan técnico paso a paso
> (candidatas fuertes: el programa de referidos completo, o el escrow con MP), o
> traerá ángulos nuevos aún no cubiertos: analytics de comportamiento/embudos,
> SEO programático para capturar búsquedas de Google, logística/envíos, o
> accesibilidad e i18n como diferenciador.
