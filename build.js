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
  for (const f of ['robots.txt', 'sitemap.xml', 'sitemap-index.xml', 'products.json']) {
    const src = path.join(ROOT, f);
    if (fs.existsSync(src)) copyFile(src, path.join(DIST, f));
  }

  console.log('✓ HTMLs + assets copiados a dist/');
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
  // NOTA: inlineCriticalCssInHome() probado y deshabilitado — en local sin gzip
  // hace el HTML 3x más grande y empeora FCP. En producción con gzip+HTTP/2
  // sería ganancia (1 request menos). Reactivar si se valida en deploy real.
  wrapUnsplashImagesWithPicture(DIST); // <img Unsplash> → <picture> con avif/webp

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
