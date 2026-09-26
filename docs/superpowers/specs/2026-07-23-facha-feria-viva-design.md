# Spec de diseño — "Feria Viva" (rebrand visual de Dale Deal)

**Fecha:** 2026-07-23 · **Estado:** aprobada por Graciano (mockups B revisados en preview)
**Decisión:** dirección B del brainstorm de facha (mockups en `dist/_mockups-facha*.html`, temporales).

## Objetivo

Darle a Dale Deal una identidad visual propia, con energía argentina, que se despegue
de MercadoLibre y haga protagonistas a los diferenciales reales del producto
(verificación de prestadores + Compra Protegida). Sin tocar estructura, lógica ni SEO.

## No-objetivos (v1)

- NO rediseñar admin ni páginas legales (quedan con el estilo actual).
- NO neobrutalismo en dark mode (el dark actual se conserva, solo acentos nuevos).
- NO cambiar logo/isotipo (el wordmark evoluciona por CSS: DALE en tinta, DEAL en coral).
- NO tocar HTML estructural, JS de lógica, rutas, build ni SEO.

## Sistema de diseño

### Tokens (nuevos/actualizados en `CSS/variables.css`)

| Token | Valor | Uso |
|---|---|---|
| `--crema` | `#fff4e8` | fondo base de páginas |
| `--crema-card` | `#fffdf9` | superficies secundarias |
| `--tinta` | `#231f20` | bordes, texto, sombras duras |
| `--coral` | `#ff3d2e` | CTAs primarios, precios, links fuertes |
| `--sol` | `#ffd23f` | CTAs secundarios (Publicar), highlights, chips activos |
| `--verde` | `#1f9d55` | cuotas, éxito, protección |
| `--azul-info` | `#2563eb` | info, insignia identidad |
| Radios | 10–16px | botones 12, cards 14, cajas 16 |
| Sombra dura | `Npx Npx 0 var(--tinta)` | botones 5px, cards 6px, cajas 7px |
| Bordes | 2–3px tinta | chips 2px, cards/botones 3px |

El rojo actual (`--primary-red`) se mapea a `--coral` (alias) para no romper CSS existente.

### Reglas de interacción

- Cards: hover "despega" (`translate(-2px,-2px)` + sombra crece a 9px).
- Botones: hover/active "aprieta" (`translate(2px,2px)` + sombra achica a 3px).
- Transiciones 100–150ms; sin AOS nuevo (el existente se conserva donde ya está).

### Tipografía

- Inter (ya self-hosted). Titulares: 900, uppercase, tracking -0.03em.
- Precios: 900, coral, tracking -0.02em. Cuerpo: 400–600 tinta.
- Contraste: coral SOLO en textos ≥18px bold; texto chico siempre tinta (AA).

### Voz (microcopy)

- Botón de compra: **"¡Dale, lo quiero!"** · Buscador: botón **"DALE"** · Publicar: **"Publicar gratis"** (fondo sol).
- Pendiente de OK de Dylan: los textos exactos (fallback conservador: "Comprar ahora").

### Componentes clave

1. **Navbar**: crema, borde inferior 3px tinta, wordmark DALE(tinta)DEAL(coral), buscador con sombra dura.
2. **Cards de producto/servicio**: borde 3px + sombra dura, imagen full con borde inferior tinta, precio coral, línea de cuotas verde, meta con insignias.
3. **Chips**: filtros y categorías, borde 2px + sombra 3px; activo = fondo sol.
4. **Insignias de verificación**: pastel + borde tinta — identidad `#dbeafe/#1e40af`, profesional `#d1fae5/#065f46`, antecedentes `#ede9fe/#5b21b6` (reemplazan el estilo glow actual en light).
5. **Caja Compra Protegida**: fondo `#fff8dc`, borde 2px tinta, escudo verde — en TODAS las fichas junto al CTA (copy: "tu plata queda retenida y el vendedor la recibe recién cuando confirmás que te llegó").
6. **Hero home**: tag rotado ("El mercado de tu barrio, online"), H1 "DALE. VENDÉ. / DALE. COMPRÁ.", buscador grande, chips de categorías, círculos decorativos sol/naranja de fondo.

### Dark mode

Se conserva el dark actual (tokens oscuros existentes). Cambian solo los acentos:
primario→coral, highlights→sol, insignias mantienen su variante dark actual.
Neobrutalismo dark completo = v2 si la v1 gusta.

## Alcance v1 (páginas)

index, productos, servicios, producto, servicio, login, signup, publicar, mi-cuenta.
(Admin, legales, 404 y soporte: v2.)

## Riesgos y mitigaciones

1. **Gusto fuerte** → checkpoint visual obligatorio con Graciano + Dylan en preview ANTES de deployar; rollback = revertir commits de CSS (la lógica no se toca).
2. **Divergencia con refactor de Gastón (main)** → avisarle ANTES de arrancar; el rebrand es capa CSS, el merge conflictúa principalmente en estilos.
3. **Contraste/a11y** → regla coral-solo-grande; verificación AA en QA.
4. **Bootstrap desalineado** (botones/inputs base) → override en components.css por clase, sin `!important` nuevos.

## Etapas de implementación (para writing-plans)

1. Tokens + botones + chips (variables.css, components.css) → preview.
2. Navbar + footer → preview.
3. Home nueva (hero + secciones) → preview.
4. Cards catálogo (productos + servicios + home) → preview.
5. Fichas (producto + servicio) + caja Compra Protegida → preview.
6. Auth + publicar + mi-cuenta → preview.
7. QA integral (mobile 375px, dark, contraste, Lighthouse) → checkpoint final → build + deploy con OK explícito.

## Preguntas abiertas

1. Copy de botones: OK de Dylan a "¡Dale, lo quiero!" / "DALE" (fallback: "Comprar ahora" / ícono lupa).
2. ¿Gastón participa del QA visual antes del deploy? (recomendado)
