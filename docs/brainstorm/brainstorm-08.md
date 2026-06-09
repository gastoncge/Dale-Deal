# 🧠 Brainstorm #08 — PLAN DE IMPLEMENTACIÓN: Activación del vendedor

> Fecha: 2026-06-05 · Generado por research comparativo (3 agentes en paralelo)
> Referencias: Fiverr (gig builder + levels), Etsy (Shop Stats), MercadoLibre (calidad
> de publicaciones), eBay, Walmart LQS, Tiendanube + best practices de multi-step forms,
> activación PLG y endowed-progress 2025-2026.

## Por qué este informe completa el trío
Tercer plan de build. Los tres juntos cubren el marketplace entero:
- **#06 Referidos** → *traer* usuarios (demanda).
- **#07 Cuotas reales** → *convertir* usuarios (demanda).
- **#08 Activación del vendedor (este)** → conseguir y activar la **oferta**.

Un marketplace nuevo muere por falta de oferta tanto como por falta de demanda. El dato
norte: **>98% de los usuarios nuevos churnean en 2 semanas si no llegan a un hito de
valor** (Amplitude 2025). Para el vendedor, ese hito es **publicar y hacer la 1ª venta**.
Hoy "publicar" es un formulario largo donde la gente se cae.

Son **4 componentes** que se refuerzan: **(1) Wizard de publicación · (2) Score de calidad
del aviso · (3) Checklist de activación · (4) Dashboard del vendedor.**

---

## Componente 1 — Wizard "Publicá en 3 pasos"

**Estructura** (un paso por pantalla, no acordeón):
1. **Fotos** (ya hay multi-imagen) — empezar por acá da una micro-victoria fácil y engancha en mobile.
2. **Título + categoría + descripción**
3. **Precio** (+ cuotas sin interés del #07)

> Tu orden propuesto es válido y mejor para mobile. **3 pasos es la zona segura — no
> agregues un 4to** (checkouts >4 pasos: 22% abandono; ≤2: 8,6%).

**UX:**
- Barra de progreso fina + **"Paso 1 de 3"** (el número explícito baja la ansiedad).
- Botón **"Atrás" siempre**; nunca borrar lo cargado al volver.
- **"Siguiente" sticky abajo** (thumb zone), ancho completo, ≥44px. Single-column siempre.
- **Validación inline `on blur`** (no en cada tecla) y **bloquear el avance**, no validar al
  final. Bootstrap 5 ya trae `.is-invalid`/`.is-valid` + `.invalid-feedback` — usarlo.

**Persistencia del borrador → localStorage primero, draft backend después:**
- Guardar el JSON del wizard en cada cambio de paso bajo `dd_draft_listing`. Al volver:
  *"Tenés una publicación sin terminar ¿retomar?"*.
- ⚠️ **No guardar binarios de fotos en localStorage** (~5MB, síncrono). Guardar
  metadata/orden y, si ya subís a storage, las URLs. Subí las fotos al cerrar el paso 1.
- Draft en backend (`POST /listings/draft`) = sync multi-dispositivo, para la Fase 1.

**Pantalla de éxito** (página `/publicado` con URL propia para tracking):
1. Confirmación + **preview real** del aviso.
2. **"Compartí tu link"**: copiar + WhatsApp (clave en AR).
3. **Un solo CTA primario** ("Ver mi publicación") + uno secundario ("Publicar otro").
4. Limpiar el localStorage acá.

> Dato ancla: completion promedio de forms = **51,7%**; cada campo extra cuesta 10-15%.
> Mantené cada paso al mínimo de campos. Forms partidos en pasos rinden hasta **63% más en mobile**.

---

## Componente 2 — Listing Quality Score (por reglas, sin IA)

Score **0-100** recalculado en cada guardado, mostrado **en vivo** mientras el vendedor
publica y en "mis-ventas". Reglas y pesos sugeridos:

| Criterio | Regla | Puntos |
|----------|-------|--------|
| **Fotos (cantidad)** | 0=0 · 1-2=8 · 3-4=18 · **5+=25** | 25 |
| **Foto principal** | ≥1000px lado largo, aspect ~1:1 | 8 |
| **Título (largo)** | <20=0 · 20-39=8 · **40-60=15** · >70=−3 | 15 |
| **Título (estructura)** | contiene marca/modelo o medida/color (regex) | 7 |
| **Descripción** | vacía=0 · <120=5 · **≥300=15** | 15 |
| **Categoría** | hoja (no genérica) | 8 |
| **Atributos/ficha** | % de campos de la categoría completados ×12 | 12 |
| **Precio** | presente y >0 | 10 |

**Niveles (semáforo):** <40 **Básico** (rojo) · 40-74 **Estándar** (amarillo) · 75-100
**Profesional** (verde). Mostrar % + lista de tips ordenada por puntos que faltan.

**Tips accionables (el de mayor impacto primero), en voseo:**
- "Sumá fotos: con 5+ vendés ~50% más. Te faltan N."
- "Primera foto sobre fondo blanco y nítida: +20% de clics."
- "Título corto. Sumá marca, modelo y medida (ej: *Taladro Bosch GSB 13RE 650W*)."
- "Completá la ficha técnica: faltan N atributos → +40% de visibilidad."
- "Agregá descripción (apuntá a 300+ caracteres)."

**Moderación pre-publicar (barata, sin ML):**
- Placeholder/duplicado: hash de imagen repetido o filename `noimage/placeholder/whatsapp`.
- Borrosa: peso < ~15KB o lado largo <600px → flag.
- Título: bloquear TODO MAYÚSCULAS, repetición de keyword, emojis spam, "oferta/envío gratis".
- Score <40 → banner *"Mejorá tu publicación antes de destacarla"*.

> Ref.: ML usa un indicador 0-100 (básico/estándar/profesional) y **más completitud =
> más exposición orgánica**. eBay: item specifics completos = **+40% impresiones**.

---

## Componente 3 — Checklist de activación "Completá tu tienda"

3-5 ítems, vendedor "activo" al **70%**. Widget con **barra + % + pasos tildados** en
mi-cuenta/mis-ventas:

- [ ] Avatar/logo + bio (confianza del comprador en vendedor sin reseñas)
- [ ] Primer aviso publicado (con foto propia, no de stock)
- [ ] Datos de cobro cargados
- [ ] Primera respuesta a un mensaje

**Truco psicológico (endowed progress effect):** arrancá la barra con un paso **ya
tildado** ("Cuenta creada ✓"). El experimento clásico (Nunes & Drèze): tarjetas
pre-llenadas → **34% vs 19%** de completitud (+82%). La gente termina más lo que ya empezó.

---

## Componente 4 — Dashboard del vendedor

Ya tenés timeseries en backend (admin). Exponérselo al vendedor en "mis-ventas":

| Métrica | Cómo |
|---------|------|
| **Vistas / Visitas** | tabla `listing_views` (insert throttled por sesión) |
| **Pedidos / Ingresos** | de `orders` (ya existe) |
| **Conversión** | (Pedidos / Visitas) × 100 — sano **1-5%** |
| **Mensajes sin responder** | de la mensajería (ya existe) |
| **Términos de búsqueda** que te encontraron | loggear queries de búsqueda (Fase 1) |

Lo más accionable según Etsy es **qué buscaron los compradores** para llegar al aviso.

**Nudges (Resend, disparados por EVENTO no por tiempo):** "te falta tu primer aviso",
"tenés un mensaje sin responder hace 2 días". Nudges conductuales subieron la 1ª acción
clave en 72h de **28%→49%** y +22% retención a 90 días vs emails genéricos.

**Niveles de vendedor (Fase 2):** New → Activo → Destacado, derivado de
ventas+rating+tasa de respuesta. Auto-upgrade + **grace period de 30 días** antes de bajar
(anti-dark-pattern, como Fiverr). El badge sube confianza del comprador y motiva al vendedor.

---

## Modelo de datos

```sql
-- Score cacheado (recalcular en cada save del aviso)
ALTER TABLE products ADD COLUMN quality_score SMALLINT NOT NULL DEFAULT 0;
ALTER TABLE services ADD COLUMN quality_score SMALLINT NOT NULL DEFAULT 0;

-- Estado de activación del vendedor
CREATE TABLE seller_onboarding (
  user_id        INTEGER PRIMARY KEY REFERENCES users(id),
  has_avatar     BOOLEAN NOT NULL DEFAULT false,
  has_bio        BOOLEAN NOT NULL DEFAULT false,
  has_listing    BOOLEAN NOT NULL DEFAULT false,
  has_payment    BOOLEAN NOT NULL DEFAULT false,
  first_reply_at TIMESTAMPTZ,
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Vistas para el dashboard del vendedor (throttle por sesión)
CREATE TABLE listing_views (
  id           BIGSERIAL PRIMARY KEY,
  listing_type TEXT NOT NULL,            -- 'product' | 'service'
  listing_id   INTEGER NOT NULL,
  session_id   TEXT,
  viewed_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON listing_views (listing_type, listing_id, viewed_at);
```

Función backend `computeQualityScore(listing) → {score, tips[]}` llamada en cada save.

---

## Rollout

- **Fase 0 — MVP (~1 semana):** wizard de 3 pasos (con localStorage + pantalla de éxito) +
  Quality Score por reglas mostrado en vivo al publicar + checklist de activación en
  mi-cuenta.
- **Fase 1:** dashboard del vendedor (vistas/conversión/mensajes) + nudges por email +
  logging de términos de búsqueda + draft en backend.
- **Fase 2:** niveles/badges de vendedor + import CSV (UTF-8, validación por fila,
  dry-run con preview) para vendedores con catálogo.

---

## Métricas y riesgos

**Métricas norte:** time-to-first-listing · % que completa onboarding (sano 40-60%, top
85%) · time-to-first-sale · activation rate (~34% promedio, 70%+ best-in-class) · quality
score promedio del catálogo.

**Riesgos:**
- **No sobre-gamificar:** progreso auténtico, sin presión forzada ni falsos logros.
- **El score es una guía, no un muro:** no bloquees publicar por score bajo (salvo
  moderación de spam/placeholder); solo nudgeá a mejorar.
- **Vistas infladas:** throttle por sesión para que `listing_views` no cuente refresh.

---

> **Estado de la serie:** 8 informes — #01-05 mapa amplio (~85 ideas), #06-08 tres planes
> de build (referidos, cuotas, activación del vendedor) que cubren demanda + oferta.
> Próximo (#09): plan de **WhatsApp commerce** (#05) o **escrow/Compra Protegida** (#02),
> las dos apuestas grandes que quedan sin desarrollar.
>
> 👉 Ya hay **3 features con plan completo listas para construir** (referidos, cuotas,
> activación). Si querés que **frene la ideación y arranque a codear** una de verdad,
> decímelo y la implementamos. Si no, sigo con los planes.
