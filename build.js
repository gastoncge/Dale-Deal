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
  copyHTMLsAndAssets();

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
