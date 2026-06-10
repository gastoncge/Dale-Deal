#!/usr/bin/env node
/**
 * Build script — minifica JS y CSS para producción.
 *
 * Uso:
 *   node build.js          → un build one-shot
 *   node build.js --watch  → rebuilds en cada cambio
 *
 * Qué hace:
 *   - Toma todos los .js en JS/ y JS/pages/ → los minifica con esbuild
 *     y los escribe en dist/JS/ y dist/JS/pages/ con la MISMA ESTRUCTURA
 *     y MISMO NOMBRE de archivo (no hashing). Así los HTMLs que cargan
 *     ./JS/foo.js no necesitan cambios — basta con servir desde dist/.
 *   - Toma todos los .css en CSS/ y CSS/pages/ → los minifica igual.
 *   - Copia los HTMLs e IMG y otros assets sin tocar.
 *
 * Reducción esperada: ~50% en JS (comentarios + whitespace + var renames),
 * ~25-30% en CSS. Lighthouse pasa de ~40 a ~70 por reducir transferred bytes.
 *
 * Deploy:
 *   - Producción debe servir desde dist/ en lugar de la raíz.
 *   - Dev local sigue usando la raíz como hasta ahora (sin tocar nada).
 */

const fs   = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const ROOT = __dirname;
const DIST = path.join(ROOT, 'dist');

// Cloudflare Web Analytics beacon token. Si está vacío, el build no inyecta
// el snippet — útil para dev local. Sacalo del dashboard de Cloudflare
// (Analytics → Web Analytics → tu sitio → JavaScript snippet → copiar el
// valor dentro de data-cf-beacon).
//
// También se puede sobreescribir con env var: CF_BEACON_TOKEN=xxx npm run build
const CF_BEACON_TOKEN = process.env.CF_BEACON_TOKEN || '';
const WATCH = process.argv.includes('--watch');

// ── Helpers ─────────────────────────────────────────────────────────────────
function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function listFiles(dir, ext) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...listFiles(p, ext));
    } else if (entry.name.endsWith(ext)) {
      out.push(p);
    }
  }
  return out;
}

function copyFile(src, dst) {
  ensureDir(path.dirname(dst));
  fs.copyFileSync(src, dst);
}

function copyTree(srcRoot, dstRoot, filter = () => true) {
  for (const entry of fs.readdirSync(srcRoot, { withFileTypes: true })) {
    const s = path.join(srcRoot, entry.name);
    const d = path.join(dstRoot, entry.name);
    if (entry.isDirectory()) {
      copyTree(s, d, filter);
    } else if (filter(s)) {
      copyFile(s, d);
    }
  }
}

function formatBytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

// ── Pasos del build ─────────────────────────────────────────────────────────

async function minifyJS() {
  const files = listFiles(path.join(ROOT, 'JS'), '.js');
  let origTotal = 0, minTotal = 0;

  for (const file of files) {
    const rel = path.relative(ROOT, file);
    const out = path.join(DIST, rel);
    ensureDir(path.dirname(out));

    const src = fs.readFileSync(file, 'utf8');
    origTotal += src.length;

    try {
      const result = await esbuild.transform(src, {
        minify:    true,
        target:    'es2020',  // moderno pero compatible con browsers de últimos 4 años
        sourcemap: false,     // sin sourcemaps en prod (perf + secrets)
      });
      fs.writeFileSync(out, result.code);
      minTotal += result.code.length;
    } catch (err) {
      console.error(`✗ Error minificando ${rel}:`, err.message);
      // Fallback: copia el original sin minificar para no romper el build
      fs.writeFileSync(out, src);
      minTotal += src.length;
    }
  }

  const saved = origTotal - minTotal;
  const pct   = ((saved / origTotal) * 100).toFixed(1);
  console.log(`✓ JS:  ${files.length} archivos · ${formatBytes(origTotal)} → ${formatBytes(minTotal)} (-${pct}%)`);
}

async function minifyCSS() {
  const files = listFiles(path.join(ROOT, 'CSS'), '.css');
  let origTotal = 0, minTotal = 0;

  for (const file of files) {
    const rel = path.relative(ROOT, file);
    const out = path.join(DIST, rel);
    ensureDir(path.dirname(out));

    const src = fs.readFileSync(file, 'utf8');
    origTotal += src.length;

    try {
      const result = await esbuild.transform(src, {
        loader: 'css',
        minify: true,
      });
      fs.writeFileSync(out, result.code);
      minTotal += result.code.length;
    } catch (err) {
      console.error(`✗ Error minificando ${rel}:`, err.message);
      fs.writeFileSync(out, src);
      minTotal += src.length;
    }
  }

  const saved = origTotal - minTotal;
  const pct   = ((saved / origTotal) * 100).toFixed(1);
  console.log(`✓ CSS: ${files.length} archivos · ${formatBytes(origTotal)} → ${formatBytes(minTotal)} (-${pct}%)`);
}

// Genera dist/CSS/core.css concatenando los 3 CSS que carga TODA página
// (variables + components + responsive) en una sola request. Los pages/X.css
// específicos siguen separados porque cada página carga uno distinto y no
// vale inflar el bundle. Reduce 4 requests → 2 en el waterfall del head.
async function bundleCoreCss() {
  // fonts.css va PRIMERO para que los @font-face existan antes de que
  // cualquier regla los referencie en --font-family.
  const order = ['CSS/fonts.css', 'CSS/variables.css', 'CSS/components.css', 'CSS/responsive.css'];
  const chunks = [];
  for (const rel of order) {
    const f = path.join(ROOT, rel);
    if (!fs.existsSync(f)) {
      console.error(`✗ Falta ${rel} para el bundle de core`);
      return;
    }
    chunks.push(`/* ${rel} */\n${fs.readFileSync(f, 'utf8')}\n`);
  }
  const combined = chunks.join('\n');
  let bundled;
  try {
    const result = await esbuild.transform(combined, { loader: 'css', minify: true });
    bundled = result.code;
  } catch (err) {
    console.error('✗ Error bundling core.css:', err.message);
    bundled = combined;
  }
  const out = path.join(DIST, 'CSS', 'core.css');
  ensureDir(path.dirname(out));
  fs.writeFileSync(out, bundled);
  console.log(`✓ CSS bundle: core.css (variables+components+responsive) → ${formatBytes(bundled.length)}`);
}

// Inlinea el contenido de core.css dentro del <head> de index.html (la home).
// Trade-off pensado: la home gana ~25KB en el HTML (gzipped) a cambio de
// eliminar 1 request render-blocking (1.35s en lighthouse local sin gzip).
// El otro HTML link a core.css se borra para no cargarlo dos veces.
//
// Solo aplica a index.html porque es la página que mide Lighthouse y la que
// tiene mayor probabilidad de ser primera visita (cache cold). Las páginas
// internas mantienen el <link rel="stylesheet" href="./CSS/core.css"/> para
// aprovechar cache del browser entre navegaciones.
function inlineCriticalCssInHome() {
  const indexFp  = path.join(DIST, 'index.html');
  const coreFp   = path.join(DIST, 'CSS', 'core.css');
  if (!fs.existsSync(indexFp) || !fs.existsSync(coreFp)) {
    console.error('✗ No encontré dist/index.html o dist/CSS/core.css');
    return;
  }
  const coreCss = fs.readFileSync(coreFp, 'utf8');
  let html = fs.readFileSync(indexFp, 'utf8');
  // Si por error se corre dos veces, no inlinear de nuevo
  if (html.includes('<style data-bundle="core.css">')) {
    console.log('= index.html ya tiene core.css inline (skip)');
    return;
  }
  // Las URLs relativas dentro del CSS (../IMG/fonts/...) están escritas
  // asumiendo que el CSS está en /CSS/. Al inlinear en index.html (que vive
  // en raíz), las URLs ../IMG/fonts/X se resolverían a /IMG/fonts/X — mal,
  // porque debería ser ./IMG/fonts/X. Fix: reemplazar ../IMG/ → ./IMG/
  const coreFixed = coreCss.replace(/\.\.\/IMG\//g, './IMG/');

  // Reemplazar el <link> a core.css por <style>...</style>
  const linkRe = /<link\s+rel="stylesheet"\s+href="\.\/CSS\/core\.css"\s*\/?>/;
  if (!linkRe.test(html)) {
    console.log('= index.html no tiene <link> a core.css (skip inline)');
    return;
  }
  html = html.replace(linkRe, `<style data-bundle="core.css">${coreFixed}</style>`);
  fs.writeFileSync(indexFp, html);
  console.log(`✓ core.css inlined en index.html (${formatBytes(coreFixed.length)})`);
}

// Inyecta el navbar (HTML/components/header.html) directamente en cada HTML
// reemplazando el div#navbar-placeholder. Antes el navbar se cargaba via
// fetch async en runtime → flash visible de ~200ms al entrar a cada página
// (la navbar aparecía vacía y después se llenaba).
//
// Con esto el HTML inicial ya tiene la navbar completa → cero flash.
// El JS de component-loader.js sigue funcionando como fallback y para
// reaplicar los path fixes / authManager.updateUI() después de hidratar.
//
// Footer NO se inyecta porque está al final de la página, no es above-the-fold
// y el flash es invisible (se ve solo al hacer scroll).
function inlineNavbarInHtmls() {
  const headerSrc = path.join(ROOT, 'HTML', 'components', 'header.html');
  if (!fs.existsSync(headerSrc)) {
    console.log('= header.html no existe, skipeo inline navbar');
    return;
  }
  let headerHtml = fs.readFileSync(headerSrc, 'utf8');

  const htmls = [];
  const walk = (d) => {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, entry.name);
      if (entry.isDirectory()) walk(p);
      else if (entry.name.endsWith('.html')) htmls.push(p);
    }
  };
  walk(DIST);

  let injected = 0;
  for (const fp of htmls) {
    let content = fs.readFileSync(fp, 'utf8');
    // Buscar el placeholder vacío (puede tener cualquier whitespace adentro)
    const placeholderRe = /<div\s+id="navbar-placeholder"\s*>\s*<\/div>/;
    if (!placeholderRe.test(content)) continue;

    // Fix paths del header según ubicación del HTML donde se inyecta.
    //
    // El header.html original asume que está en /HTML/ (sus hrefs son
    // `./productos.html`, `./servicios.html`, etc. — relativos a /HTML/).
    //   - Cuando se inyecta en HTMLs de /HTML/ → no toca nada, hrefs OK.
    //   - Cuando se inyecta en index.html (raíz) → hay que prefijar ./HTML/
    //     a los hrefs locales, sino daledeal.com.ar/productos.html (no existe)
    //     en lugar de daledeal.com.ar/HTML/productos.html.
    //   - Y src="./IMG/LOGO-2.png" funciona desde raíz pero NO desde /HTML/
    //     (tiene que ser ../IMG/).
    //
    // Bug previo: el rewrite estaba al revés (suponía que header asumía root).
    // Síntoma: al click en "Productos" del navbar desde la home, URL quedaba
    // /productos.html y Cloudflare servía index.html como SPA fallback.
    const fromRoot = path.relative(DIST, fp).indexOf(path.sep) === -1;
    let headerFixed = headerHtml;
    if (fromRoot) {
      // En raíz: hrefs ./X.html → ./HTML/X.html (excepto index.html que ya está OK)
      headerFixed = headerFixed.replace(
        /href="\.\/(?!index\.html|HTML\/|#)([^"]+\.html[^"]*)"/g,
        'href="./HTML/$1"'
      );
      // src="./IMG/..." en raíz funciona tal cual, no se toca
    } else {
      // En /HTML/: src="./IMG/..." → "../IMG/..." (subir un nivel)
      headerFixed = headerFixed.replace(/src="\.\/IMG\//g, 'src="../IMG/');
    }

    content = content.replace(placeholderRe, headerFixed);
    fs.writeFileSync(fp, content);
    injected++;
  }
  console.log(`✓ Navbar inyectada en ${injected} HTMLs (sin flash de hidratación)`);
}

// Inyecta el snippet de Cloudflare Web Analytics antes del </body> en cada HTML.
// Idempotente: skipea si ya está el script (por el data-cf-beacon attribute).
// No-op si CF_BEACON_TOKEN está vacío (dev local o pre-config).
function injectCloudflareWebAnalytics() {
  if (!CF_BEACON_TOKEN) {
    console.log('= CF_BEACON_TOKEN vacío, skipeo inyección de Web Analytics');
    return;
  }

  const snippet = `  <script defer src='https://static.cloudflareinsights.com/beacon.min.js' data-cf-beacon='{"token":"${CF_BEACON_TOKEN}"}'></script>\n`;

  const htmls = [];
  const walk = (d) => {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, entry.name);
      if (entry.isDirectory()) walk(p);
      else if (entry.name.endsWith('.html')) htmls.push(p);
    }
  };
  walk(DIST);

  let injected = 0;
  for (const fp of htmls) {
    let content = fs.readFileSync(fp, 'utf8');
    if (content.includes('data-cf-beacon=')) continue; // ya inyectado
    if (!content.includes('</body>')) continue; // HTML mal formado
    content = content.replace('</body>', snippet + '</body>');
    fs.writeFileSync(fp, content);
    injected++;
  }
  console.log(`✓ CF Web Analytics inyectado en ${injected} HTMLs`);
}

// Envuelve TODAS las imágenes <img src="https://images.unsplash.com/..."> de los
// HTMLs de dist/ en un <picture> con sources para AVIF y WebP. Unsplash sirve
// el formato pedido via ?fm=avif|webp. El browser elige el mejor que soporte:
// AVIF (Chrome/Edge/Safari recientes, -50% bytes), WebP (todo lo demás, -30%),
// o fallback al JPG original. Sin esto cada visita baja ~30-50% más bytes.
//
// Idempotencia: skipea <img> que ya están dentro de <picture> chequeando que
// los 30 chars previos no contengan "<source". Las imágenes con loading="lazy"
// se mantienen tal cual (el lazy aplica al <img> dentro del <picture>).
function wrapUnsplashImagesWithPicture(dir) {
  const htmls = [];
  const walk = (d) => {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, entry.name);
      if (entry.isDirectory()) walk(p);
      else if (entry.name.endsWith('.html')) htmls.push(p);
    }
  };
  walk(dir);

  // Matchea <img ... src="https://images.unsplash.com/..." ... /> (self-closing o no)
  const imgRe = /<img\b[^>]*\bsrc="(https:\/\/images\.unsplash\.com\/[^"]+)"[^>]*\/?>/g;

  let wrapped = 0;
  for (const fp of htmls) {
    let content = fs.readFileSync(fp, 'utf8');
    const orig = content;

    content = content.replace(imgRe, (match, src, offset) => {
      // Skipear si ya está dentro de <picture> (los 60 chars previos contienen <source o <picture)
      const before = content.substring(Math.max(0, offset - 60), offset);
      if (before.includes('<source') || before.includes('<picture')) return match;

      // CRÍTICO: skipear imágenes que JS reemplaza dinámicamente. Cuando se
      // hace `img.src = X`, el browser NO actualiza los <source srcset> del
      // <picture> wrapper — sigue mostrando la versión AVIF/WebP vieja.
      // Por eso JS/pages/service.js cambiaba el src pero el user seguía
      // viendo la imagen hardcoded original (bug reportado por el dueño:
      // "cualquier servicio muestra la foto del electricista").
      // Lista de IDs que JS muta y NO deben wrapearse:
      if (/\bid="(mainServiceImage|mainProductImage|productMainImg|heroProductImg)"/.test(match)) {
        return match;
      }

      // Construir URLs avif y webp añadiendo &fm=avif|webp al query string.
      // Las URLs de Unsplash siempre tienen ? (vienen con w=&h=&fit=crop).
      const avifUrl = src.includes('?') ? `${src}&fm=avif` : `${src}?fm=avif`;
      const webpUrl = src.includes('?') ? `${src}&fm=webp` : `${src}?fm=webp`;
      return `<picture><source srcset="${avifUrl}" type="image/avif"><source srcset="${webpUrl}" type="image/webp">${match}</picture>`;
    });

    if (content !== orig) {
      fs.writeFileSync(fp, content);
      wrapped++;
    }
  }
  console.log(`✓ Imágenes Unsplash wrapped en <picture>: ${wrapped} archivos`);
}

// Reescribe los <link> de los 3 CSS internos a un único <link> a core.css
// en TODOS los HTMLs de dist/. Solo afecta dist/, los archivos source quedan
// intactos para que el dev local siga funcionando sin build.
function rewriteHtmlLinksToBundle() {
  const htmls = [];
  // HTMLs en raíz
  for (const entry of fs.readdirSync(DIST, { withFileTypes: true })) {
    if (entry.isFile() && entry.name.endsWith('.html')) {
      htmls.push(path.join(DIST, entry.name));
    }
  }
  // HTMLs en dist/HTML/
  const htmlDir = path.join(DIST, 'HTML');
  if (fs.existsSync(htmlDir)) {
    for (const entry of fs.readdirSync(htmlDir, { withFileTypes: true })) {
      if (entry.isFile() && entry.name.endsWith('.html')) {
        htmls.push(path.join(htmlDir, entry.name));
      }
    }
  }

  // Patrones a matchear (con cualquier path relativo: ./CSS/ o ../CSS/)
  // El bundle reemplaza los 3 — el primer match define dónde queda el bundle,
  // los otros 2 se borran.
  let rewritten = 0;
  for (const fp of htmls) {
    let content = fs.readFileSync(fp, 'utf8');
    const orig = content;

    // Detectar prefijo (./CSS/ desde raíz, ../CSS/ desde HTML/)
    const fromRoot = path.relative(DIST, fp).indexOf(path.sep) === -1;
    const cssPrefix = fromRoot ? './CSS' : '../CSS';

    const reVariables  = new RegExp(`\\s*<link\\s+rel="stylesheet"\\s+href="${cssPrefix.replace('.','\\.')}/variables\\.css"\\s*/?>\\s*`, 'g');
    const reComponents = new RegExp(`\\s*<link\\s+rel="stylesheet"\\s+href="${cssPrefix.replace('.','\\.')}/components\\.css"\\s*/?>\\s*`, 'g');
    const reResponsive = new RegExp(`\\s*<link\\s+rel="stylesheet"\\s+href="${cssPrefix.replace('.','\\.')}/responsive\\.css"\\s*/?>\\s*`, 'g');

    // ¿Tiene los 3? Si no, skipear (algunas páginas internas no usan todos)
    if (!reVariables.test(content) || !reComponents.test(content) || !reResponsive.test(content)) continue;
    // Resetear lastIndex porque .test() los mueve
    reVariables.lastIndex = 0; reComponents.lastIndex = 0; reResponsive.lastIndex = 0;

    // Reemplazar el primero (variables) por el bundle; borrar los otros 2.
    content = content.replace(reVariables, `\n    <link rel="stylesheet" href="${cssPrefix}/core.css" />\n    `);
    content = content.replace(reComponents, '');
    content = content.replace(reResponsive, '');

    if (content !== orig) {
      fs.writeFileSync(fp, content);
      rewritten++;
    }
  }
  console.log(`✓ HTMLs reescritos para usar core.css: ${rewritten}`);
}

function copyHTMLsAndAssets() {
  // HTMLs: copia HTML/ y los .html de la raíz tal cual
  copyTree(path.join(ROOT, 'HTML'), path.join(DIST, 'HTML'));
  for (const entry of fs.readdirSync(ROOT, { withFileTypes: true })) {
    if (entry.isFile() && entry.name.endsWith('.html')) {
      copyFile(path.join(ROOT, entry.name), path.join(DIST, entry.name));
    }
  }

  // Assets: IMG, robots.txt, sitemap*.xml, products.json
  if (fs.existsSync(path.join(ROOT, 'IMG'))) {
    copyTree(path.join(ROOT, 'IMG'), path.join(DIST, 'IMG'));
  }
  // manifest.json (PWA): SI FALTA, Cloudflare devuelve index.html como SPA
  // fallback y el browser tira "Manifest: Syntax error" al parsearlo como JSON.
  // Antes faltaba en esta lista — 5 HTMLs con <link rel="manifest"> rompían.
  for (const f of ['robots.txt', 'sitemap.xml', 'sitemap-index.xml', 'products.json', 'manifest.json', '_headers', '_redirects']) {
    const src = path.join(ROOT, f);
    if (fs.existsSync(src)) copyFile(src, path.join(DIST, f));
  }

  // 404.html en RAÍZ del dist — wrangler.toml usa `not_found_handling: 404-page`
  // que requiere /404.html en root. Copiamos desde HTML/404.html (que es donde
  // vive el source) y ajustamos las paths relativas para que funcionen desde
  // la raíz en lugar de desde /HTML/.
  const src404 = path.join(ROOT, 'HTML', '404.html');
  if (fs.existsSync(src404)) {
    let html404 = fs.readFileSync(src404, 'utf8');
    // Reescribir paths ../X (relativos a /HTML/) → ./X (relativos a raíz)
    // Aplica a IMG, CSS, JS, manifest.
    html404 = html404
      .replace(/href="\.\.\//g, 'href="./')
      .replace(/src="\.\.\//g, 'src="./');
    // Los links a otras páginas (./X.html) desde 404 que está en raíz necesitan
    // ./HTML/X.html — mismo treatment que index.html.
    html404 = html404.replace(/href="\.\/(?!HTML\/)([\w-]+\.html)"/g, 'href="./HTML/$1"');
    fs.writeFileSync(path.join(DIST, '404.html'), html404);
    console.log('✓ 404.html copiado a dist/ (paths re-escritas para raíz)');
  }

  console.log('✓ HTMLs + assets copiados a dist/');
}

// Cache-busting: agrega ?v=<build-hash> a TODOS los <script src> y <link href>
// de archivos JS/CSS locales en los HTMLs del dist. El hash cambia en cada
// build → el browser nunca sirve un asset viejo cacheado cuando deployamos.
//
// Antes: el user reportó "todavía veo la foto del electricista" porque su
// browser tenía el bundle viejo cacheado aunque deploy ya estaba listo. Esto
// previene ese bug para SIEMPRE — al cambiar el src, el browser refetch.
//
// Solo toca rutas LOCALES (que arrancan con ./, ../, /, JS/, CSS/, dist/).
// Skip a CDNs externos (cdn.jsdelivr.net, unpkg.com, etc.) y a URLs que ya
// tienen query string.
function appendCacheBust(hash) {
  const htmls = listFiles(DIST, '.html');
  let count = 0;
  for (const fp of htmls) {
    let html = fs.readFileSync(fp, 'utf8');
    const before = html;
    // src="..." con .js
    html = html.replace(
      /(<script[^>]*\bsrc=["'])(\.{0,2}\/[^"'?]+\.js)(["'])/g,
      `$1$2?v=${hash}$3`
    );
    // href="..." con .css
    html = html.replace(
      /(<link[^>]*\bhref=["'])(\.{0,2}\/[^"'?]+\.css)(["'])/g,
      `$1$2?v=${hash}$3`
    );
    if (html !== before) {
      fs.writeFileSync(fp, html);
      count++;
    }
  }
  console.log(`✓ Cache-busting ?v=${hash} agregado a ${count} HTMLs (forza refetch en deploy)`);
}

async function build() {
  const start = Date.now();
  // Limpiar dist/ entero para builds reproducibles
  fs.rmSync(DIST, { recursive: true, force: true });
  ensureDir(DIST);

  await minifyJS();
  await minifyCSS();
  await bundleCoreCss();          // genera dist/CSS/core.css
  copyHTMLsAndAssets();
  rewriteHtmlLinksToBundle();     // reemplaza 3 links → 1 link a core.css en dist/
  inlineNavbarInHtmls();          // inyecta navbar en cada HTML (sin flash)
  // NOTA: inlineCriticalCssInHome() probado y deshabilitado — en local sin gzip
  // hace el HTML 3x más grande y empeora FCP. En producción con gzip+HTTP/2
  // sería ganancia (1 request menos). Reactivar si se valida en deploy real.
  wrapUnsplashImagesWithPicture(DIST); // <img Unsplash> → <picture> con avif/webp
  injectCloudflareWebAnalytics();  // CF beacon antes de </body> (si hay token)

  // Cache-busting va al FINAL, después de todas las modificaciones a HTMLs.
  // Hash basado en commit SHA (si está en CI) o timestamp de build (local).
  // 7 chars es suficiente entropía y queda visualmente limpio en el src.
  const buildHash = (process.env.GITHUB_SHA
    ? process.env.GITHUB_SHA.slice(0, 7)
    : Date.now().toString(36)).toLowerCase();
  appendCacheBust(buildHash);

  console.log(`✓ Build completo en ${Date.now() - start}ms — output: dist/`);
}

async function watch() {
  await build();
  console.log('\n⏵ Watching JS/, CSS/, HTML/, index.html...');

  let timer = null;
  const debounce = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      console.log('\n→ Cambios detectados, rebuilding...');
      build().catch(err => console.error('Build error:', err));
    }, 150);
  };

  for (const dir of ['JS', 'CSS', 'HTML', 'IMG']) {
    const fullDir = path.join(ROOT, dir);
    if (fs.existsSync(fullDir)) {
      fs.watch(fullDir, { recursive: true }, debounce);
    }
  }
  fs.watch(ROOT, (ev, f) => {
    if (f && f.endsWith('.html')) debounce();
  });
}

// ── Run ─────────────────────────────────────────────────────────────────────
(WATCH ? watch() : build()).catch(err => {
  console.error('✗ Build falló:', err);
  process.exit(1);
});
