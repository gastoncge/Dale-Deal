# 🧠 Brainstorm #11 — LUPA: el checkout como los mejores del mundo

> Fecha: 2026-06-05 · Generado por research comparativo (3 agentes en paralelo)
> Referencias: Baymard Institute (50+ estudios de checkout), Wroblewski/Etre, Stripe,
> Shopify + doc oficial de Mercado Pago (Checkout Pro / Bricks / API).

## Nuevo foco de la serie (a partir de acá)
Los informes #01-10 mapearon "qué falta" (~85 ideas + 5 planes de build). Como acordamos,
ahora la lupa cambia: **un sub-feature por informe, profundizado contra los mejores del
mundo, para EJECUTAR mejor lo que ya existe.** Empezamos por el de mayor palanca de
revenue: **el checkout** (Dale Deal ya lo tiene con MP → esto es "afilarlo", no "agregarlo").

## Por qué importa (las apuestas)
Abandono de carrito promedio: **70,2%** (Baymard, 50 estudios). Mobile peor: **~80%** vs
~66% desktop. Las **causas rankeadas** (de quienes SÍ querían comprar), marcando cuáles
controlás vos:

| # | Causa de abandono | % | ¿Lo controla Dale Deal? |
|---|-------------------|---|--------------------------|
| 1 | **Costos sorpresa** (envío/impuestos al final) | **48%** | ✅ Sí |
| 2 | Forzar crear cuenta | 26% | ✅ Sí |
| 3 | Desconfianza con la tarjeta/seguridad | 25% | ✅ Sí (percepción) |
| 4 | Entrega lenta | 23% | ⚠️ Parcial (logística #03) |
| 5 | Checkout largo/complicado | 18% | ✅ Sí |

> **4 de las 5 causas top están en tu cancha.** Por eso el checkout es el mejor lugar para
> "ejecutar como los grandes": no necesitás features nuevas, necesitás pulir lo que ya hay.

---

## 🎯 LA APUESTA GRANDE (estructural): migrar de Checkout Pro a **Bricks**

Hoy Dale Deal probablemente usa **Checkout Pro** (redirect a `mercadopago.com.ar`). Cada
salto de dominio/diseño suma fricción y duda. La evidencia de industria: los checkouts
**embebidos convierten ~15-20 puntos más** que los redirect.

| | Checkout Pro (hoy) | **Checkout Bricks (recomendado)** | Checkout API |
|--|--|--|--|
| Pago | Redirect (sale del sitio) | **Embebido, sin redirect**\* | Embebido, form propio |
| UI la controla | MP | **Comercio (sobre componentes MP)** | Comercio (todo) |
| PCI / mantenimiento | MP / muy bajo | **MP / medio-bajo** | Tuyo / alto |
| Conversión/branding | Menor | **Mayor** | Mayor |

\* el único redirect inevitable es el login de Wallet MP.

**Recomendación:** migrar a **Bricks** (Payment Brick + Wallet Brick + Status Screen
Brick). Punto óptimo: pago en tu dominio con tu branding, **sin** asumir el PCI/mantenimiento
del API completo, y compatible con tu stack (`mercadopago.js` vanilla + Node/Postgres).
Esfuerzo: **M**. Es el cambio de checkout de mayor impacto.

---

## 🏆 TOP 3 QUICK WINS del checkout (S, alto impacto — lo que controlás ya)

| # | Fix | Por qué (dato) | Esfuerzo |
|---|-----|----------------|----------|
| 1 | **Teclados + autocomplete correctos en mobile** | `type="email"`, `type="tel"`, `inputmode="numeric"` (CP) + `autocomplete` (`given-name`, `postal-code`, `tel`…) y **nunca** `autocomplete="off"`. Baja el tiempo de llenado **40-60%**, errores ~25%, sube conversión mobile **+20%**. Mobile es el 80% del abandono. | **S** |
| 2 | **Bloque de confianza debajo del botón de pago** | Badge ahí = **+12% completación**. Candado + "Pago protegido por Mercado Pago" + logos de medios (Visa/Master/MP, +8-15%) + "hasta 12 cuotas". 1 sello fuerte > 6 débiles. | **S** |
| 3 | **CTA con monto + sticky en mobile + anti-doble-submit** | "Pagar $42.998" gana a "Finalizar compra" (+5-15%). Sticky full-width = +10-15%. Deshabilitar botón + spinner al primer click evita cargos/órdenes duplicadas. | **S** |

---

## El blueprint del checkout (lo que controlás, antes/después del pago MP)

**1. Costos visibles TEMPRANO (la causa #1, 48%).** Mostrá envío + total en el carrito/ficha,
pidiendo CP para estimar. **Nunca** metas un costo nuevo en la pantalla de review. Resumen
itemizado: "Productos $40.000 · Envío $2.000 · Total $42.000".

**2. Guest checkout (causa #2, 26%).** **63% abandona si no puede comprar como invitado.**
Permití comprar sin cuenta y ofrecé **crear cuenta DESPUÉS**, en la confirmación (ya tenés
nombre/email/dirección → solo falta una contraseña).

**3. Mínimo de campos.** Promedio real ~11 campos; **óptimo 7-8**; la conversión cae **4-6%
por cada campo extra** sobre el octavo. Un solo **"Nombre completo"** (no nombre+apellido).
Address autocomplete: +25-35% de completitud.

**4. Single-page (para tu caso).** Marketplace + mobile alto + ticket medio/bajo → single-page
convierte mejor (**+21,8%** vs two-page en A/B citado). Excepción: tickets >US$200 rinden
mejor en multi-step. Con Bricks, single-page hasta el pago.

**5. Resumen del pedido siempre visible.** Sticky en desktop (columna lateral), colapsable en
mobile + botón "Pagar" siempre en viewport.

---

## Validación y errores (lo que separa amateur de pro)

- **Validá `on-blur`, nunca en cada tecla** (marcar "inválido" antes de que terminen genera
  MÁS errores). Estudio clásico Wroblewski/Etre: validación inline = **+22% éxito, −22%
  errores, 42% más rápido** vs on-submit.
- **Quitá el error apenas se corrige** + mostrá **check verde** en campos complejos (tarjeta,
  CVV, email, CP).
- **Mostrá el error debajo del campo**: borde rojo + **ícono** + texto (color solo no basta —
  WCAG 3.3.1). A11y: `aria-invalid="true"`, `aria-describedby`, contenedor `aria-live`.

**Microcopy de error (voseo) — el de la derecha convierte:**

| ❌ Malo | ✅ Bueno |
|---------|---------|
| "Campo inválido" | "Ingresá un CP de 4 dígitos (ej: 1425)" |
| "Teléfono inválido" | "El teléfono es muy corto — faltan dígitos" |
| "Email inválido" | "Falta el @ en tu email" |
| "Tarjeta inválida" | "Revisá el número: tiene que tener 16 dígitos" |

---

## Confianza y ansiedad cerca del botón

- **Seguridad percibida (clave Baymard):** ~1 de 5 abandona porque "no confió en el sitio con
  su tarjeta", aunque técnicamente sea seguro. El bloque de pago necesita refuerzo visual
  (recuadro + candado + microcopy), no solo HTTPS.
- **Reducí ansiedad junto al CTA:** política de devolución/garantía ahí mismo. Datos:
  "no te gustó, lo devolvés" **+41%**, garantía de satisfacción **+34%**, money-back **+23%**.
  Microcopy: *"No se te cobra hasta confirmar el pago"*, *"Compra protegida"*.
- **Si el pago se rechaza:** mensaje claro (qué pasó + qué hacer) y **ofrecé otro medio en el
  mismo error** (otra tarjeta, dinero en cuenta MP) → recupera **~30%**. No borres el carrito.

---

## Subir la TASA DE APROBACIÓN de MP (plata que se gana gratis)

Lo que enviás vos cambia cuántos pagos aprueba MP:
1. **Device ID:** incluir `security.js` y mandar `MP_DEVICE_SESSION_ID` al crear el pago.
2. **`additional_info` completo:** datos del payer (nombre, email, doc, teléfono) + ítems +
   envío. Más datos = más aprobación.
3. **Activar Wallet MP** (pago 1-clic para logueados → más conversión y aprobación) + **3DS 2.0**.
4. **Webhooks firmados (`x-signature`) = la fuente de verdad**, NO las `back_urls`. Confirmá
   el pedido SOLO al recibir el webhook (IPN está deprecado). Hacé páginas propias de
   éxito/pendiente/error.

> ⚠️ Error grave a evitar: marcar un pedido como pagado por el retorno del navegador
> (`back_url`). El navegador puede no volver o ser falseado — la verdad la da el webhook.

---

## 📋 Scorecard de checkout — orden sugerido

| Prioridad | Fix | Esfuerzo | Impacto |
|-----------|-----|----------|---------|
| 1 | Teclados + autocomplete mobile | S | alto |
| 2 | Trust block bajo el botón + logos + cuotas | S | alto |
| 3 | CTA con monto + sticky + anti-doble-submit | S | alto |
| 4 | Costos/total visibles temprano (no sorpresa) | S/M | alto |
| 5 | Validación on-blur + microcopy de error en voseo | M | alto |
| 6 | Guest checkout + crear cuenta post-compra | M | alto |
| 7 | Webhooks firmados como fuente de verdad | M | alto (correctitud) |
| 8 | Device ID + `additional_info` (aprobación MP) | M | medio-alto |
| 9 | **Migrar a Bricks (embebido)** *(apuesta grande)* | M | alto |
| 10 | Single-page + resumen sticky | M | medio |

---

> **Estado de la serie:** 11 informes. #01-05 ideas · #06-10 planes de build · **#11 = primera
> lupa de ejecución (checkout).** Próximas lupas candidatas: **anatomía de la ficha de
> producto/servicio (PDP)** que más convierte · **diseño de card de catálogo** · **experiencia
> de búsqueda** (autocomplete + "sin resultados") · **microcopy que vende** · **el home de un
> marketplace**. El #12 toma una de estas.
>
> 👉 Sigue en pie: si querés que **frene y construya** (este scorecard de checkout es muy
> accionable, o cualquiera de las 5 features con plan), decímelo y arranco a codear.
