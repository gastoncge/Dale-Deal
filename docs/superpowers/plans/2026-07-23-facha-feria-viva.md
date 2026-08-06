# Rebrand "Feria Viva" — Implementation Plan (PROTOTIPO)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Aplicar el sistema visual "Feria Viva" (spec `docs/superpowers/specs/2026-07-23-facha-feria-viva-design.md`) a las páginas v1 de Dale Deal, como prototipo en la rama `feat/facha-feria-viva`, sin tocar producción.

**Architecture:** Rebrand por capa de estilos: nuevos tokens en `CSS/variables.css` (con alias de compatibilidad `--primary-red → --coral`), recetas de componentes en `CSS/components.css`, retoques por página en `CSS/pages/*.css`, y el hero nuevo en `HTML/index.html`. La lógica JS, rutas y estructura no se tocan. Cada tarea termina con build + verificación programática en preview + screenshot + commit.

**Tech Stack:** CSS vanilla con custom properties, Bootstrap 5 (overrides por clase, sin `!important` nuevos), build.js (esbuild), preview server `dist` (launch.json) + Browser pane para verificar.

## Global Constraints (de la spec — valen para TODAS las tareas)

- Rama: `feat/facha-feria-viva`. PROHIBIDO deployar (nada de `wrangler deploy`) — prototipo.
- Paleta exacta: `--crema:#fff4e8` `--crema-card:#fffdf9` `--tinta:#231f20` `--coral:#ff3d2e` `--sol:#ffd23f` `--verde:#1f9d55` `--azul-info:#2563eb`.
- Sombras duras: botones `5px 5px 0 var(--tinta)`, cards `6px 6px 0`, cajas `7px 7px 0`. Bordes: chips 2px, cards/botones 3px, siempre `var(--tinta)`.
- Radios: botones 12px, cards 14px, cajas 16px. Transiciones 100–150ms.
- Coral solo en textos ≥18px bold; texto chico siempre tinta (AA).
- Dark mode: NO tocar los tokens dark existentes salvo acentos (primario→coral, highlight→sol).
- Microcopy v1 (pendiente OK Dylan, usar igual en el prototipo): compra "¡Dale, lo quiero!", buscador "DALE", publicar "Publicar gratis".
- Después de CADA tarea: `node build.js` + verificación en preview + screenshot + commit. El preview se levanta con `preview_start {name:"dist"}`.
- Los archivos `dist/_mockups-facha*.html` son la referencia visual (NO se commitean, dist está gitignoreado).

---

### Task 1: Tokens + botones + chips

**Files:**
- Modify: `CSS/variables.css` (bloque `:root` — agregar tokens nuevos + alias)
- Modify: `CSS/components.css` (recetas `.btn-*` y `.chip`/filtros)

**Interfaces:**
- Produces: tokens CSS `--crema --crema-card --tinta --coral --sol --verde --azul-info --sombra-btn --sombra-card --sombra-caja` y clases `.btn-primary/.btn-outline-*` restyleadas + `.dd-chip`. Tareas 2-6 consumen estos tokens POR NOMBRE.

- [ ] **Step 1: Agregar tokens en `:root` de variables.css** (al final del bloque `:root` claro, antes del bloque dark):

```css
/* ── Feria Viva (rebrand 2026-07) ─────────────────────────── */
--crema: #fff4e8;
--crema-card: #fffdf9;
--tinta: #231f20;
--coral: #ff3d2e;
--sol: #ffd23f;
--verde: #1f9d55;
--azul-info: #2563eb;
--sombra-btn: 5px 5px 0 var(--tinta);
--sombra-card: 6px 6px 0 var(--tinta);
--sombra-caja: 7px 7px 0 var(--tinta);
/* Alias de compatibilidad: el rojo histórico ahora ES coral (solo tema claro) */
--primary-red: var(--coral);
```

Verificar antes con `grep -n "primary-red" CSS/variables.css` dónde se define el original (para ponerle el alias DESPUÉS de esa línea y que gane la cascada) y que el bloque dark NO se toque.

- [ ] **Step 2: Fondo base crema** — en variables.css/components.css localizar el token de fondo del body del tema claro (`grep -nE "body|--bg|--gray-50" CSS/variables.css CSS/components.css | head -20`) y apuntarlo a `var(--crema)`.

- [ ] **Step 3: Botones** — en components.css, al FINAL del archivo (gana cascada sin `!important`):

```css
/* ── Feria Viva: botones ── */
.btn { border-radius: 12px; font-weight: 800; transition: transform .12s, box-shadow .12s; }
.btn-primary, .btn-danger {
  background: var(--coral); border: 3px solid var(--tinta); color: #fff;
  box-shadow: var(--sombra-btn);
}
.btn-primary:hover, .btn-primary:focus {
  background: var(--coral); border-color: var(--tinta); color: #fff;
  transform: translate(2px,2px); box-shadow: 3px 3px 0 var(--tinta);
}
.btn-warning, .btn-publicar {
  background: var(--sol); border: 3px solid var(--tinta); color: var(--tinta);
  box-shadow: var(--sombra-btn); font-weight: 900;
}
.btn-outline-primary, .btn-outline-secondary {
  background: #fff; border: 3px solid var(--tinta); color: var(--tinta);
  box-shadow: var(--sombra-btn); font-weight: 700;
}
.btn-outline-primary:hover, .btn-outline-secondary:hover {
  background: var(--crema-card); color: var(--tinta); border-color: var(--tinta);
  transform: translate(2px,2px); box-shadow: 3px 3px 0 var(--tinta);
}
[data-theme="dark"] .btn-primary { border-color: transparent; box-shadow: none; }
[data-theme="dark"] .btn-outline-primary, [data-theme="dark"] .btn-outline-secondary { background: transparent; border-color: var(--gray-600); color: var(--gray-100); box-shadow: none; }
```

- [ ] **Step 4: Chips** (filtros/categorías) — misma sección:

```css
.dd-chip, .filter-chip, .category-chip {
  display: inline-flex; align-items: center; gap: 6px;
  background: #fff; border: 2px solid var(--tinta); border-radius: 999px;
  padding: 7px 14px; font-weight: 700; font-size: 13px; color: var(--tinta);
  box-shadow: 3px 3px 0 var(--tinta); cursor: pointer;
}
.dd-chip.active, .filter-chip.active { background: var(--sol); }
[data-theme="dark"] .dd-chip, [data-theme="dark"] .filter-chip { background: var(--gray-800); border-color: var(--gray-600); color: var(--gray-100); box-shadow: none; }
```

(Verificar con `grep -rn "chip" CSS/ JS/ --include="*.css" --include="*.js" -l | head` qué clases de chips existen realmente y ajustar los selectores a las reales; si no existe ninguna, dejar `.dd-chip` para uso en tareas 3-4.)

- [ ] **Step 5: Build + verificación programática.** `node build.js`; levantar preview `dist`; navegar a `/productos`; ejecutar en el Browser pane:

```js
(() => { const b = document.querySelector('.btn-primary');
  const cs = getComputedStyle(b);
  return { bg: cs.backgroundColor, border: cs.borderWidth, shadow: cs.boxShadow.slice(0,40) }; })()
```

Esperado: `bg: rgb(255, 61, 46)` (coral), `border: 3px`, shadow con `5px 5px`. Screenshot.

- [ ] **Step 6: Commit** — `git add CSS/variables.css CSS/components.css && git commit -m "feat(facha): tokens Feria Viva + botones y chips (prototipo)"`

---

### Task 2: Navbar + footer

**Files:**
- Modify: `HTML/components/navbar.html` (si existe; sino el navbar inline — localizar con `grep -rn "navbar" HTML/index.html build.js | head`) — SOLO clases/texto del botón buscar ("DALE") y wordmark
- Modify: `CSS/components.css` (sección navbar + footer al final)

**Interfaces:**
- Consumes: tokens Task 1.
- Produces: navbar crema con borde tinta; wordmark `DALE` tinta + `DEAL` coral vía `.logo-deal { color: var(--coral) }`.

- [ ] **Step 1: Recon** — `grep -n "navbar\|logo" HTML/components/navbar.html | head -30` (o el archivo que inyecta build.js). Identificar: contenedor, clase del logo, form de búsqueda del navbar.
- [ ] **Step 2: CSS navbar** (final de components.css):

```css
/* ── Feria Viva: navbar ── */
.navbar, .dd-navbar { background: var(--crema); border-bottom: 3px solid var(--tinta); }
.navbar .navbar-brand { font-weight: 900; letter-spacing: -0.02em; color: var(--tinta); }
.navbar .navbar-brand .logo-deal { color: var(--coral); }
.navbar .form-control { border: 3px solid var(--tinta); border-radius: 10px 0 0 10px; box-shadow: 4px 4px 0 var(--tinta); }
.navbar .btn-search { background: var(--sol); border: 3px solid var(--tinta); border-left: 0; border-radius: 0 10px 10px 0; font-weight: 900; box-shadow: 4px 4px 0 var(--tinta); }
[data-theme="dark"] .navbar { background: var(--gray-900); border-bottom-color: var(--gray-700); }
footer, .dd-footer { background: var(--tinta); color: var(--crema); }
footer a { color: var(--sol); }
```

Ajustar los selectores a las clases REALES halladas en Step 1 (p. ej. si el logo es una `<img>`, envolver el wordmark es un cambio HTML mínimo: `DALE<span class="logo-deal">DEAL</span>`).
- [ ] **Step 3: Botón del buscador** — cambiar el texto/ícono del submit del navbar a `DALE` (mantener `aria-label="Buscar"`).
- [ ] **Step 4: Build + verificar** — preview en `/` y `/productos`: navbar crema, borde inferior tinta, botón DALE sol. Screenshot claro + dark (toggle).
- [ ] **Step 5: Commit** — `git commit -m "feat(facha): navbar y footer Feria Viva (prototipo)"`

---

### Task 3: Home nueva (hero + secciones)

**Files:**
- Modify: `HTML/index.html` (sección hero: reemplazar el carrusel por el hero tipográfico)
- Modify: `CSS/pages/home.css` (hero + círculos decorativos + secciones)

**Interfaces:**
- Consumes: tokens + `.dd-chip` (Task 1).
- Produces: hero `#hero-feria` con H1 "DALE. VENDÉ. / DALE. COMPRÁ.", buscador grande (reusa el form de búsqueda existente con sus IDs actuales para que `JS/search.js` siga andando SIN cambios), chips de categorías linkeando a `/productos?categoria=...` como los links actuales del carrusel.

- [ ] **Step 1: Recon del hero actual** — `grep -n "hero" HTML/index.html | head -20` y `grep -n "hero" JS/pages/home.js | head`. Anotar: IDs del form de búsqueda del hero (si existe) y qué inicializa el JS del carrusel (para dejar el carrusel FUERA del DOM sin romper JS: el init debe tolerar ausencia — verificar que el init haga `if (!el) return`, si no, guardar el bloque con `display:none` en vez de borrarlo).
- [ ] **Step 2: HTML del hero nuevo** (estructura, adaptando clases/IDs reales del form):

```html
<section class="hero-feria" id="hero-feria">
  <div class="container">
    <span class="hero-tag">El mercado de tu barrio, online</span>
    <h1 class="hero-title">DALE. <em>VENDÉ.</em><br>DALE. <em>COMPRÁ.</em></h1>
    <p class="hero-sub">Todo lo que se vende y se ofrece cerca tuyo, con la plata protegida y gente real verificada.</p>
    <!-- reusar el form de búsqueda existente (mismos IDs) con clase extra .hero-search -->
    <div class="hero-chips">
      <a class="dd-chip" href="./productos.html?categoria=ofertas">🔥 Ofertas</a>
      <a class="dd-chip" href="./servicios.html">🛠️ Servicios</a>
      <a class="dd-chip" href="./productos.html?categoria=hogar">🏠 Hogar</a>
      <a class="dd-chip" href="./productos.html?categoria=tecnologia">📱 Tecno</a>
    </div>
  </div>
</section>
```

- [ ] **Step 3: CSS del hero** en home.css (colores exactos del mockup B: tag tinta/sol rotado -2deg, título 900 uppercase con `em` coral, círculos decorativos `::before/::after` sol y naranja `#ff6b35` al 25%), mobile-first (título 34px en 375px, 56px desktop).
- [ ] **Step 4: Build + verificar** — preview `/`: hero nuevo, búsqueda funciona (probar una búsqueda real con el backend prod), chips navegan. Verificar consola sin errores del carrusel. Screenshot 375px y desktop.
- [ ] **Step 5: Commit** — `git commit -m "feat(facha): hero Feria Viva en home (prototipo)"`

---

### Task 4: Cards de catálogo (productos + servicios + home)

**Files:**
- Modify: `CSS/components.css` (receta única de card al final)
- Recon primero: `grep -rn "class=\"[^\"]*card" JS/pages/home.js JS/api.js HTML/productos.html HTML/servicios.html | head -20` para las clases REALES de las cards renderizadas por JS.

**Interfaces:**
- Consumes: tokens Task 1.
- Produces: cards con borde 3px tinta + `--sombra-card` + hover "despega"; precio coral 900; línea de cuotas verde.

- [ ] **Step 1: Receta card** (selectores ajustados a los reales del recon):

```css
/* ── Feria Viva: cards ── */
.product-card, .service-card {
  background: #fff; border: 3px solid var(--tinta); border-radius: 14px;
  box-shadow: var(--sombra-card); overflow: hidden;
  transition: transform .12s, box-shadow .12s;
}
.product-card:hover, .service-card:hover { transform: translate(-2px,-2px); box-shadow: 9px 9px 0 var(--tinta); }
.product-card img, .service-card .service-image { border-bottom: 3px solid var(--tinta); }
.product-card .price, .service-card .price { color: var(--coral); font-weight: 900; letter-spacing: -0.02em; }
.product-card .installments, .service-card .installments { color: var(--verde); font-weight: 700; }
[data-theme="dark"] .product-card, [data-theme="dark"] .service-card { background: var(--gray-800); border-color: var(--gray-600); box-shadow: none; }
```

- [ ] **Step 2: Build + verificar** — preview `/productos` y `/servicios` con datos REALES del backend: cards con el estilo, skeletons intactos (recargar y mirar el flash de carga), fotos con borde inferior. Screenshot grid.
- [ ] **Step 3: Verificación programática** de una card: `getComputedStyle` borde `3px solid rgb(35, 31, 32)`.
- [ ] **Step 4: Commit** — `git commit -m "feat(facha): cards de catálogo Feria Viva (prototipo)"`

---

### Task 5: Fichas (producto + servicio) + caja Compra Protegida

**Files:**
- Modify: `HTML/producto.html`, `HTML/servicio.html` (caja Compra Protegida junto al CTA; texto del CTA)
- Modify: `CSS/pages/product.css`, `CSS/pages/service.css` (galería con marco, buy box, trustbox)

**Interfaces:**
- Consumes: tokens; insignias `.verif-badge` existentes (restylear variante clara a pastel+borde: identidad `#dbeafe/#1e40af`, profesional `#d1fae5/#065f46`, antecedentes `#ede9fe/#5b21b6`, borde 2px tinta).
- Produces: `.dd-trustbox` reutilizable.

- [ ] **Step 1: CTA** — en producto.html cambiar el texto del botón de compra a `¡Dale, lo quiero!` (conservar id/clases; `grep -n "Comprar\|buy" HTML/producto.html | head` para ubicarlo).
- [ ] **Step 2: Trustbox** — HTML junto al CTA (ambas fichas):

```html
<div class="dd-trustbox">
  <i class="bi bi-shield-fill-check" aria-hidden="true"></i>
  <div><b>Compra Protegida:</b> tu plata queda retenida y el vendedor la recibe recién cuando confirmás que te llegó. Si algo sale mal, te la devolvemos.</div>
</div>
```

```css
.dd-trustbox { display:flex; gap:9px; align-items:flex-start; background:#fff8dc; border:2px solid var(--tinta); border-radius:12px; padding:12px 14px; font-size:13px; font-weight:600; margin-top:14px; }
.dd-trustbox i { color: var(--verde); font-size:16px; margin-top:1px; }
[data-theme="dark"] .dd-trustbox { background: rgba(255,210,63,.08); border-color: var(--gray-600); }
```

(En servicio.html ya existe un bloque trust de MP — integrarlo/reemplazarlo por esta caja, sin duplicar.)
- [ ] **Step 3: Galería + buy box** — marco tinta 3px + sombra-caja en la galería principal y el panel de compra (selectores reales de product.css/service.css).
- [ ] **Step 4: Insignias pastel** — actualizar `.verif-badge` claro en service.css a las 3 variantes pastel con borde 2px tinta (dark queda como está).
- [ ] **Step 5: Build + verificar** — preview de una ficha real de producto y una de servicio (IDs reales de la DB), claro + dark, 375px + desktop. Confirmar: trustbox visible sin scroll en desktop, CTA nuevo, insignias pastel. Screenshots.
- [ ] **Step 6: Commit** — `git commit -m "feat(facha): fichas + Compra Protegida + insignias pastel (prototipo)"`

---

### Task 6: Auth + publicar + mi-cuenta

**Files:**
- Modify: `CSS/pages/*.css` correspondientes (login/signup/publicar/mi-cuenta usan components + estilos propios — recon: `ls CSS/pages/`)
- Modify: `HTML/publicar.html` (CTA "Publicar gratis" con `.btn-warning` sol)

**Interfaces:** Consumes tokens + botones Task 1 (la mayoría hereda solo).

- [ ] **Step 1: Recon** — abrir en preview `/login`, `/signup`, `/publicar`, `/mi-cuenta` y anotar qué NO heredó bien (inputs, cards de formulario, .account-card).
- [ ] **Step 2: Formularios** — inputs con borde 2px tinta radius 10 en claro; `.account-card` con borde+sombra-card.
- [ ] **Step 3: Build + verificar las 4 páginas** (claro/dark/mobile), login real contra prod para confirmar cero regresión funcional. Screenshots.
- [ ] **Step 4: Commit** — `git commit -m "feat(facha): auth, publicar y mi-cuenta (prototipo)"`

---

### Task 7: QA integral + checkpoint final

**Files:** los que surjan (fixes).

- [ ] **Step 1: Barrido 375px** de TODAS las páginas v1 (preview mobile preset) — lista de roturas, fix inmediato de cada una.
- [ ] **Step 2: Barrido dark** completo — nada del rebrand claro debe haber pisado el dark (grep de reglas sin guard `[data-theme]` en lo agregado).
- [ ] **Step 3: Contraste** — verificar con javascript_tool que ningún texto <18px quedó coral: assertion sobre computed color de `.price` (grande, ok) vs body text.
- [ ] **Step 4: Consola limpia** en las 9 páginas (read_console_messages, cero errores nuevos).
- [ ] **Step 5: Lighthouse local** (`npx lighthouse http://localhost:5555/ --preset=desktop --quiet`) — Performance no debe caer >5 puntos vs baseline actual.
- [ ] **Step 6: Screenshots finales** de todo (home, catálogos, ficha, mi-cuenta; claro+dark+mobile) → **CHECKPOINT con Graciano y Dylan. FIN DEL PLAN. No hay paso de deploy: decisión humana posterior.**
- [ ] **Step 7: Commit final** — `git commit -m "chore(facha): QA integral del prototipo Feria Viva"`

---

## Self-review del plan

- Cobertura de spec: tokens/paleta (T1), interacciones hover/press (T1/T4), voz-microcopy (T2 DALE, T3 hero, T5 CTA, T6 publicar), insignias pastel (T5), trustbox (T5), hero (T3), navbar/footer (T2), alcance v1 completo (T3-T6), dark-solo-acentos (guards en cada receta), QA/a11y/riesgos (T7), prototipo-sin-deploy (Global + T7). Preguntas abiertas de la spec no bloquean (copy con fallback).
- Sin placeholders: cada paso tiene código o comando concreto; los pasos de recon existen porque las clases reales deben confirmarse en el código antes de tocar (con el grep exacto indicado).
- Consistencia de nombres: tokens definidos en T1 y consumidos con el mismo nombre en T2-T6; `.dd-chip` (T1) usado en T3; `.dd-trustbox` (T5) autocontenida.
