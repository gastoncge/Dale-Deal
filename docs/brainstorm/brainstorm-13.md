# 🧠 Brainstorm #13 — LUPA: búsqueda y descubrimiento

> Fecha: 2026-06-05 · Generado por research comparativo (3 agentes en paralelo)
> Referencias: Baymard (Search UX), NN/g, Algolia + casos Amazon/MercadoLibre + camino de
> implementación en Postgres (pg_trgm, full-text, pgvector).

## Tercera lupa de ejecución
#11 checkout · #12 ficha · **#13 la búsqueda** — donde van los usuarios de **mayor
intención**. La data: quienes buscan convierten **1.8x** (4.63% vs 2.77%), son ~15% del
tráfico pero hasta **40% del revenue**. Y es terreno ganable: **56% de los sites tienen
búsqueda mediocre o peor**, el 61% falla en search, y solo el **19%** hace bien el
autocomplete. Dale Deal tiene búsqueda básica → mucho por afilar, **todo factible con
Postgres** (sin Algolia).

---

## 🎯 LA APUESTA GRANDE: autocomplete con tolerancia a typos (pg_trgm)

Agregar **autocomplete** sube ventas hasta **~24%** y el **75%** de los usuarios usa las
sugerencias. Hoy Dale Deal no lo tiene. El plan, todo en Postgres:
- **Caja siempre visible** en el header (Lyst pasó de ícono a caja abierta: **+43%
  desktop / +13% mobile**), centrada, ancha (~25-30 chars), placeholder útil ("Buscar
  productos, servicios y marcas…").
- **Dropdown** con 3 secciones: sugerencias de query (en negrita la parte predicha) +
  **productos con thumbnail+precio** + categorías. Máx **6-9 desktop / 4-8 mobile**.
- **Recientes** (al hacer foco, desde `localStorage`) + **populares** (tabla contador).
- **Tolerancia a typos** desde el día 1 ("samsng" → "Samsung"): **69% de sites fallan acá**.
- **Implementación:** `pg_trgm` + índice GIN; el mismo índice habilita typos en TODA la
  búsqueda. Endpoint `GET /api/suggest?q=` con `LIMIT 8`, debounce 250ms en el front,
  cancelar request anterior.

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_prod_nombre_trgm ON productos USING gin (nombre gin_trgm_ops);
-- prefijo (rápido/exacto) + typos:
SELECT id, nombre, precio, imagen, categoria
FROM productos
WHERE nombre ILIKE $1 || '%' OR similarity(nombre, $1) > 0.2
ORDER BY (nombre ILIKE $1 || '%') DESC, similarity(nombre, $1) DESC
LIMIT 8;
```
Esfuerzo: **M**. Es el cambio de búsqueda de mayor impacto.

---

## 🏆 TOP 3 QUICK WINS de búsqueda (S, alto impacto)

| # | Fix | Por qué (dato) | Esfuerzo |
|---|-----|----------------|----------|
| 1 | **Página de "0 resultados" que NO sea callejón** | Es la **fuga #1** — ~50% de sites dan un dead-end. Mostrá: categorías relacionadas + 3-5 productos populares + **botón WhatsApp** (grupo de alto riesgo de abandono). Meta de tasa de 0-results: **<2%** (media industria 12-18%). | **S** |
| 2 | **Default de orden: relevancia, NO fecha** | Ordenar por fecha por defecto es un error clásico. Cambiar el `ORDER BY` a un score compuesto (match textual × popularidad × rating). Para **servicios**, sumar **cercanía**. | **S** |
| 3 | **Tabla de sinónimos argentinos + expansión de query** | pg_trgm no entiende sinónimos. Una tabla `synonyms` que expande la query capta los modismos locales (ver tabla abajo). Cero ML, alto local-fit. | **S** |

---

## Caja de búsqueda + autocomplete — spec

- **Caja siempre visible**, no detrás de un ícono. Centrada en el header, misma posición en
  todas las páginas. Placeholder descriptivo, no "Buscar".
- **Dropdown:** sugerencias de query (principal) + productos (thumbnail, nombre, precio) +
  categorías. **Scoped search** "iPhone en Celulares" con estilo distinto (46% lo hace mal).
- **Velocidad:** debounce 150-300ms, cancelar requests viejos, sin scrollbar en el dropdown.
- **Mobile:** hit areas ≥44px, 4-8 sugerencias sin scroll.

## Resultados + filtros — spec (productos vs servicios)

- **Ranking por relevancia compuesta** (no fecha): `ts_rank` (full-text) × popularidad
  (vistas/ventas) × rating, recencia como desempate. **Servicios:** sumá **proximidad
  geográfica + rating del prestador** → un servicio cercano y bien calificado flota sobre
  uno lejano más nuevo.
- **Sort:** ofrecé los cuatro (Precio · Mejor calificado · Más vendido · Más nuevo) +
  Relevancia (default). 64% no ofrece los cuatro. Servicios: + "Más cercano".
- **Filtros:** OR dentro de una faceta, AND entre facetas (**15% falla** con selección
  única). Conteo por opción, ocultar/deshabilitar las de cero. Truncar listas largas a 4-8
  + "ver más".
  - Productos: categoría, precio, condición (nuevo/usado), marca, rating, ubicación.
  - **Servicios: la ZONA/ubicación es filtro PRIMARIO**, no secundario.
- **Mobile:** drawer (`offcanvas` de Bootstrap), botón **"Mostrar 234 resultados"** con
  contador en vivo dentro del panel (no real-time, que desorienta en mobile).
- **Chips de filtros aplicados** removibles arriba de los resultados + "Limpiar todo" (**42%
  lo hace mal**). **Contador de resultados** siempre visible.
- **Paginación:** "Cargar más" + lazy-load gana (la paginación se siente lenta; el scroll
  infinito rompe backtracking/footer/compartir). **SEO:** URLs `?page=` crawleables.
- **Densidad:** 24-48 por página; **máx 4 por fila** (el escaneo sube ~34% por columna al
  pasar de 4→5). Servicios en formato lista (más metadata: zona, rating, "desde $X").
- **Pocos/0 resultados con filtros:** relajá el filtro **menos importante**, no la query
  (precio = rango aproximado). Servicios: mostrá los **N más cercanos** aunque estén lejos,
  nunca pantalla vacía.

## Entendimiento de la query (typos, sinónimos, "quisiste decir")

- **Typos:** 10-25% de las búsquedas tienen errores; **56% de sites fallan**. Estrategia
  híbrida en Postgres: full-text primero; si da 0, fallback a `similarity()` (threshold ~0.3).
- **Sinónimos / modismos argentinos** (tabla `synonyms(termino, canonico)` que expande la query):

| Canónico | Variantes a mapear |
|----------|--------------------|
| zapatillas | championes, tenis, sneakers |
| remera | playera, polera, camiseta |
| heladera | refrigerador, nevera, frigorífico |
| celular | móvil, smartphone |
| notebook | laptop, computadora, ordenador |
| anteojos | lentes, gafas |
| birome | lapicera, bolígrafo |
| pochoclo | palomitas, pop corn |
| palta | aguacate |
| (servicios) plomero | plomería, gasista, destapaciones |

- **"Quisiste decir"** (82% lo tienen, 36% lo empeoran): si la query corregida tiene muchos
  más resultados, **auto-buscá la corregida** con aviso "Resultados para *X*".
- **Semántica (pgvector):** recién DESPUÉS de typos + sinónimos + analítica. Híbrido
  keyword+vector mejora 15-25%, pero es para queries de intención ("regalo para nene"), no
  para "Samsung A54". Empezá 0.5/0.5.

## Lo que alimenta TODO: el log de búsqueda

Tabla `search_log` (query cruda + normalizada + **nº de resultados / flag zero** + filtros +
click-through + posición del click + sesión). Acción **semanal**:
- **Top 50 queries con 0 resultados** → gaps de catálogo o sinónimos faltantes.
- **Queries top sin clicks** → relevancia mala.

Es el bucle que convierte la búsqueda en algo que mejora solo con el tiempo.

---

## 📋 Scorecard de búsqueda — orden sugerido

| Prioridad | Fix | Esfuerzo | Impacto |
|-----------|-----|----------|---------|
| 1 | `search_log` + página de 0 resultados decente | S | alto |
| 2 | Default de orden → relevancia compuesta | S | alto |
| 3 | Tabla de sinónimos argentinos + expansión | S | alto |
| 4 | Tolerancia a typos (pg_trgm fallback) en toda la búsqueda | S/M | alto |
| 5 | **Autocomplete con dropdown (productos + recientes + populares)** *(apuesta grande)* | M | alto |
| 6 | Servicios: ubicación como filtro primario + "más cercanos" | M | alto |
| 7 | Chips de filtros aplicados + contador de resultados | S/M | medio-alto |
| 8 | Filtros mobile en drawer + "Mostrar X resultados" | M | medio-alto |
| 9 | Sort completo (4 opciones) + "Cargar más" con `?page=` | M | medio |
| 10 | "Quisiste decir" + pgvector semántico (al final) | M/L | medio |

---

> **Estado de la serie:** 13 informes. #01-05 ideas · #06-10 planes de build · #11-13 lupas
> de ejecución (checkout, ficha, búsqueda). Próximas lupas: **diseño de card de catálogo** ·
> **el home del marketplace** · **microcopy que vende** · **onboarding del comprador
> primerizo** · **el panel/flujo de "publicar"**. El #14 toma una.
>
> 👉 Tres scorecards de ejecución ya (checkout, ficha, búsqueda), todos con muchos fixes
> **S** factibles en Postgres/Bootstrap. Si querés que **frene y empiece a implementarlos**,
> decímelo y arrancamos por el de mayor ROI.
