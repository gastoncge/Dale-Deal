# 🧠 Brainstorm #07 — PLAN DE IMPLEMENTACIÓN: Cuotas reales calculadas

> Fecha: 2026-06-05 · Generado por research comparativo (3 agentes en paralelo)
> Referencias: docs Mercado Pago (preferences, installments API, split payments) +
> contexto legal/mercado AR (CACE 2025, Ley 24.240, BCRA) + best practices BNPL
> (Klarna, Affirm, Afterpay, MercadoLibre, Amazon).

## Por qué este informe
Segundo plan de build (después de referidos en #06). Si referidos = **crecimiento**,
cuotas reales = **conversión** — y en Argentina es *la* palanca: **8 de cada 10**
consumidores consideran clave pagar en cuotas, y las cuotas de 3-6 pagos son **más de la
mitad de las ventas online** (CACE 2025). Mostrar cuotas sin interés sube conversión
**+30-50%** (data de MercadoLibre). Hoy Dale Deal muestra cuotas como **texto estático** —
este plan las hace **reales, calculadas y presentes en la card**.

---

## 0. ⚠️ LA DECISIÓN QUE HAY QUE TOMAR PRIMERO: ¿quién paga el "sin interés"?

Esto define todo. En Mercado Pago:
- **Cuotas CON interés** → las paga el **comprador** (lo financia el banco). **Costo cero**
  para vos y para el vendedor. Pero legalmente **obligan a mostrar TEA + CFT** (Ley 24.240).
- **Cuotas SIN interés** → las absorbe el **vendedor/comercio** (collector). Costo de
  referencia: **3 cuotas 4,49% · 6 cuotas 6,99% · 9 cuotas 9,90%** (+ IVA), cobrado según
  la cuota que **efectivamente elige** el comprador. En el split de MP, el costo se deduce
  **de los fondos del vendedor antes de tu `marketplace_fee`** — no lo paga la plataforma.

**Las 3 estrategias posibles:**

| Estrategia | Quién paga | Pro | Contra |
|-----------|-----------|-----|--------|
| **A. Con interés universal** | comprador | gratis, inmediato, siempre disponible | menos atractivo; obliga TEA+CFT |
| **B. Sin interés opt-in por vendedor** | vendedor | máximo poder de conversión | el vendedor banca 4,5-10%; debe habilitarlo en SU panel MP |
| **C. Sin interés subsidiado** | Dale Deal | imán de adquisición | caro; sale de tu margen |

> **Recomendación MVP:** **A + B**. Activá cuotas con interés para todos (gratis, ya), y
> dejá que cada vendedor **opte por ofrecer N cuotas sin interés** en su publicación (él
> absorbe el costo y lo habilita en su cuenta MP). El subsidio (C) solo para campañas
> puntuales de growth. **Nunca digas "Ahora 12 / Cuota Simple": ese programa estatal
> terminó el 30-jun-2025 y no se renovó.**

---

## 1. Decisiones de diseño

| Decisión | Elección | Por qué |
|----------|----------|---------|
| **Dónde mostrar** | **Card + ficha + checkout** (hoy solo texto fijo) | Mostrar el monto por cuota antes del checkout sube AOV ~+25-32% y baja abandono |
| **Cálculo** | **Real** (no texto): sin interés = `precio/N`; con interés = API de MP | El texto estático miente apenas cambia el precio |
| **Config** | **Por publicación**: `cuotas_sin_interes` (0/3/6/9/12) que el vendedor elige | MP no tiene cuotas por-producto nativas → lo resolvés vos al crear la preferencia |
| **Copy** | Voseo: "3 cuotas sin interés de $X" + "Ver cuotas" | Patrón mental que el usuario AR ya conoce (ML) |
| **Legal** | Sin interés → texto simple OK · Con interés → TEA+CFT destacados | Ley 24.240 art. 36; CFT solo obligatorio si hay interés |
| **Promos bancarias** | Badges **configurables/temporales**, no hardcodeadas | Cambian por banco y fecha (ej. BNA 20 cuotas) |

---

## 2. Modelo de datos

```sql
-- Cuántas cuotas SIN interés ofrece el vendedor en esta publicación (0 = ninguna).
-- El vendedor absorbe el costo; debe tenerlo habilitado en su cuenta MP.
ALTER TABLE products  ADD COLUMN cuotas_sin_interes SMALLINT NOT NULL DEFAULT 0
  CHECK (cuotas_sin_interes IN (0,3,6,9,12));
ALTER TABLE services  ADD COLUMN cuotas_sin_interes SMALLINT NOT NULL DEFAULT 0
  CHECK (cuotas_sin_interes IN (0,3,6,9,12));

-- Config global (tuneable sin redeploy): máximo de cuotas con interés a ofrecer siempre.
-- Tabla settings key/value o constante de entorno. Ej: MAX_INSTALLMENTS = 12
```

> No hace falta más tabla: el resto se calcula en runtime (display) o se pasa a la
> preferencia MP (checkout).

---

## 3. El helper de display (frontend, reemplaza el texto estático)

Un solo módulo JS `cuotas.js` que recibe `precio` + `cuotasSinInteres` y renderiza:

```js
// Devuelve la línea para card/ficha. precio en ARS, sinInteres = 0|3|6|9|12
function lineaCuotas(precio, sinInteres) {
  if (sinInteres > 0) {
    const cuota = Math.round(precio / sinInteres);
    return `${sinInteres} cuotas sin interés de ${fmt(cuota)}`;   // "6 cuotas sin interés de $20.000"
  }
  return null; // sin sin-interés, mostramos "Ver cuotas" que abre el modal con-interés
}
```

- **Card:** una línea bajo el precio. Mobile: acortar a `6 x $20.000 sin interés`. Sin modal.
- **Ficha:** la línea + link **"Ver cuotas ▸"** que abre un modal con la tabla completa.
- El modal con la tabla **con interés** (montos + CFT reales) se llena con la **API de MP**
  (§5), no a mano.

**Copy final (voseo):**
- Card: `6 cuotas sin interés de $20.000`
- Ficha: `Pagá en 6 cuotas sin interés de $20.000` · `Ver cuotas`
- Badge: `Sin interés` (verde) — diferenciado visualmente de los planes con CFT
- Con interés: `12 cuotas de $13.200 · CFT XX%`

---

## 4. Checkout — pasar las cuotas a la preferencia de Mercado Pago

Al crear la preferencia (`POST /checkout/preferences`), setear `payment_methods`:

```json
"payment_methods": {
  "installments": 12,            // máximo de cuotas a mostrar (techo)
  "default_installments": 1
}
```

- `installments` = tope; `default_installments` = preseleccionada.
- Para que las **sin interés** sean realmente 0%, el **vendedor (collector)** debe tenerlas
  habilitadas en su panel MP **"Costos y cuotas" → Cuotas sin interés → Ofrecer** (2/3/6/9/12).
  Dale Deal **no puede forzarlo**: el flag de la publicación debe reflejar lo que el
  vendedor activó. → En el flujo de "publicar", educá al vendedor y validá.
- Confirmá en producción los **topes reales** de `installments` para AR (la doc de 1-36 es de Brasil).

---

## 5. Calcular cuotas para mostrar (la API que reemplaza el texto)

`GET https://api.mercadopago.com/v1/payment_methods/installments?amount={precio}&payment_method_id={visa…}`

Devuelve `payer_costs[]` con, por cada plan:
- `installments`, `installment_amount` (monto por cuota), `total_amount`, `installment_rate`
- `recommended_message` ("3 cuotas de $X ($Y)")
- **`labels[]` con `CFT_xx,xx%` y `TEA_xx,xx%`** ← obligatorios en AR, ya vienen calculados

> Para el modal "Ver cuotas" pedí esto **una vez por ficha** (cacheá por precio). Para la
> línea **sin interés** de la card, alcanza el cálculo local `precio/N` (no hay interés
> que calcular). Pasar `bin` (primeros dígitos de la tarjeta) da tasas reales por tarjeta;
> sin `bin`, estimación genérica — suficiente para mostrar en la ficha.

---

## 6. Cumplimiento legal (no exponerse)

- **Sin interés:** "X cuotas sin interés de $Y" **basta** — no se dispara la obligación de CFT.
- **Con interés:** obligatorio informar **TEA + CFT** (Ley 24.240 art. 36, bajo pena de
  nulidad). MP ya te los devuelve en `labels[]` → mostralos **destacados** (el estándar
  BCRA para entidades financieras es tipografía mayor; replicalo).
- **Nunca** "sin interés" si hay interés. Diferenciá visualmente ambos.
- Publicá las condiciones de cuotas en una nota al pie / modal.

---

## 7. Cómo interactúa con tu comisión (split / marketplace_fee)

Orden de deducción de MP sobre el pago:
1. **Comisión de MP**
2. **Costo financiero de las cuotas sin interés** (lo absorbe el vendedor)
3. **Tu `marketplace_fee`** sobre el remanente

→ Si el vendedor ofrece sin interés, **tu comisión no se ve afectada** (sale de su parte
antes de tu fee). Confirmá si Dale Deal usa split real (`marketplace_fee`) o cobra todo y
liquida aparte — eso decide quién es el "collector" y, por ende, quién habilita y paga las
cuotas sin interés.

---

## 8. Rollout

- **Fase 0 — MVP (~2-4 días):** helper `cuotas.js` que reemplaza el texto estático →
  línea real en **card + ficha** (sin interés por cálculo local; "Ver cuotas" con la API
  de MP) + pasar `installments` a la preferencia para que el checkout las ofrezca. Campo
  `cuotas_sin_interes` por publicación + selector en "publicar".
- **Fase 1:** modal "Ver cuotas" completo con CFT/TEA reales por tarjeta (`bin`) + badges
  de promos bancarias configurables desde admin + educación al vendedor sobre el costo.
- **Fase 2:** analítica — medir conversión con/sin cuotas mostradas (A/B) y por # de cuotas.

---

## 9. Métricas y riesgos

**Métricas:** conversión de ficha con cuotas visibles vs sin · % de checkouts que eligen
cuotas · # de cuotas promedio · AOV con/sin cuotas.

**Riesgos:**
- **Costo al vendedor:** sin interés cuesta 4,5-10% — el vendedor debe entender que lo
  banca él. Mostralo claro en "publicar".
- **Desfase de datos:** si el vendedor NO habilitó sin interés en su MP pero la publicación
  dice que sí, el checkout no las ofrecerá → frustración. Validá/sincronizá.
- **Legal:** mostrar mal el CFT en planes con interés expone (Ley 24.240). Usá siempre los
  `labels[]` de MP, no inventes números.
- **CFT cambia seguido:** nunca lo hardcodees; tomalo siempre de la API en vivo.

---

> **Estado de la serie:** 7 informes — #01-05 mapa amplio (~85 ideas), #06 build de
> referidos, #07 build de cuotas reales. Próximo (#08): otro plan técnico — candidatas que
> quedan: **WhatsApp commerce** (#05), **wizard del vendedor** (#04), o **escrow/Compra
> Protegida** (#02). Decime cuál querés, o si preferís que **frene la ideación y te ayude a
> construir** alguna de estas de verdad (referidos del #06 o cuotas de este #07 están listas
> para arrancar). Si no decís nada, el #08 toma la de mejor ROI no desarrollada.
