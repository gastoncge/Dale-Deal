/**
 * Página de "Próximamente" (pre-lanzamiento).
 *
 * La sirve worker.js en lugar de cualquier página del sitio mientras
 * COMING_SOON = "1" (wrangler.toml). Autocontenida: CSS inline; solo usa el
 * logo, la imagen para redes y las fuentes de /IMG (que el gate deja pasar)
 * y los íconos del mismo CDN que usa el sitio.
 *
 * "Avisame cuando abra" → POST /newsletter/subscribe con source "proximamente".
 * Los mails se exportan desde el admin (Leads B2B → Exportar newsletter).
 */
export function comingSoonPage() {
  return String.raw`<!doctype html>
<html lang="es-AR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Dale Deal · Próximamente</title>
<meta name="description" content="Comprá, vendé y contratá en Argentina, con tu plata protegida hasta que recibís. Muy pronto.">
<meta name="robots" content="noindex">
<meta name="theme-color" content="#d63031">
<link rel="icon" href="/IMG/favicon-32.png" type="image/png" sizes="32x32">
<link rel="apple-touch-icon" href="/IMG/apple-touch-icon.png">
<meta property="og:type" content="website">
<meta property="og:url" content="https://daledeal.com.ar/">
<meta property="og:title" content="Dale Deal · Próximamente">
<meta property="og:description" content="Comprá, vendé y contratá en Argentina, con Compra Protegida. Muy pronto.">
<meta property="og:image" content="https://daledeal.com.ar/IMG/og-home.jpg">
<meta name="twitter:card" content="summary_large_image">
<link rel="preload" href="/IMG/fonts/spacegrotesk-variable.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" integrity="sha384-XGjxtQfXaH2tnPFa9x+ruJTuLE3Aa6LhHSWRr1XeTyhezb4abCG4ccI5AkVDxqC+" crossorigin="anonymous">
<style>
  @font-face { font-family: 'Space Grotesk'; src: url('/IMG/fonts/spacegrotesk-variable.woff2') format('woff2'); font-weight: 300 700; font-display: swap; }
  @font-face { font-family: 'Inter'; src: url('/IMG/fonts/inter-variable.woff2') format('woff2'); font-weight: 100 900; font-display: swap; }
  :root { --rojo: #d63031; --amarillo: #ffc629; --tinta: #5c1414; }
  * { box-sizing: border-box; margin: 0; }
  /* El atributo hidden tiene que ganarle a los display de .ok y form */
  [hidden] { display: none !important; }
  body {
    min-height: 100vh; display: flex; flex-direction: column; overflow-x: hidden;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: #fff; background-color: var(--rojo);
    background-image:
      radial-gradient(900px 520px at 8% -10%, rgba(255,138,31,.95) 0%, rgba(255,138,31,0) 62%),
      radial-gradient(720px 520px at 108% 112%, rgba(110,14,14,.55) 0%, rgba(110,14,14,0) 70%),
      linear-gradient(160deg, #e34a2a 0%, #d63031 55%, #b3201f 100%);
    -webkit-font-smoothing: antialiased;
  }
  /* Líneas de velocidad y cajitas, como en la flecha del logo y la imagen de redes */
  .deco { position: fixed; inset: 0; pointer-events: none; overflow: hidden; }
  .deco .line { position: absolute; height: 7px; border-radius: 7px; background: rgba(255,255,255,.12); transform: rotate(-16deg); }
  .deco .box { position: absolute; border: 2px solid rgba(255,255,255,.14); border-radius: 12px; transform: rotate(-12deg); }
  .wrap { position: relative; flex: 1; width: 100%; max-width: 760px; margin: 0 auto; padding: 40px 20px 28px; display: flex; flex-direction: column; align-items: center; text-align: center; }
  .logo { width: min(240px, 60vw); height: auto; filter: drop-shadow(0 10px 24px rgba(80,10,10,.35)); }
  .chip { margin-top: 26px; display: inline-flex; align-items: center; gap: 8px; padding: 7px 14px; border-radius: 999px; background: rgba(255,255,255,.14); border: 1px solid rgba(255,255,255,.25); font-size: .86rem; font-weight: 600; letter-spacing: .02em; }
  .chip .dot { width: 8px; height: 8px; border-radius: 50%; background: var(--amarillo); box-shadow: 0 0 0 0 rgba(255,198,41,.7); animation: pulse 2s infinite; }
  @keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(255,198,41,.7); } 70% { box-shadow: 0 0 0 10px rgba(255,198,41,0); } 100% { box-shadow: 0 0 0 0 rgba(255,198,41,0); } }
  h1 { margin-top: 14px; font-family: 'Space Grotesk', 'Inter', sans-serif; font-weight: 700; font-size: clamp(3rem, 12vw, 6.6rem); line-height: .95; letter-spacing: -.035em; text-shadow: 0 6px 30px rgba(90,12,12,.25); }
  .arrow { width: min(360px, 78%); height: auto; margin-top: 10px; }
  .lead { margin-top: 18px; max-width: 34em; font-size: clamp(1.02rem, 2.4vw, 1.18rem); line-height: 1.6; font-weight: 500; text-shadow: 0 1px 12px rgba(90,12,12,.25); }
  .lead strong { color: var(--amarillo); font-weight: 700; }
  .feats { list-style: none; padding: 0; margin-top: 26px; display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; }
  .feats li { display: inline-flex; align-items: center; gap: 8px; padding: 9px 14px; border-radius: 12px; background: rgba(90,12,12,.22); border: 1px solid rgba(255,255,255,.18); font-size: .92rem; font-weight: 600; }
  .feats i { color: var(--amarillo); font-size: 1.05rem; }
  .card { margin-top: 32px; width: 100%; max-width: 520px; padding: 22px; border-radius: 20px; background: rgba(255,255,255,.12); border: 1px solid rgba(255,255,255,.24); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); box-shadow: 0 20px 50px rgba(80,10,10,.28); }
  .card h2 { font-family: 'Space Grotesk', 'Inter', sans-serif; font-size: 1.22rem; font-weight: 700; }
  .card p.sub { margin-top: 4px; font-size: .92rem; opacity: .9; }
  form { margin-top: 14px; display: flex; gap: 8px; }
  input[type=email] { flex: 1; min-width: 0; height: 50px; padding: 0 16px; border-radius: 12px; border: 2px solid transparent; font: inherit; font-size: 1rem; color: #1f2937; background: #fff; outline: none; }
  input[type=email]:focus { border-color: var(--amarillo); box-shadow: 0 0 0 4px rgba(255,198,41,.35); }
  button { height: 50px; padding: 0 20px; border: 0; border-radius: 12px; font: inherit; font-weight: 700; font-size: 1rem; color: var(--tinta); background: var(--amarillo); cursor: pointer; white-space: nowrap; transition: transform .12s ease, filter .12s ease; }
  button:hover { filter: brightness(1.05); transform: translateY(-1px); }
  button:disabled { opacity: .7; cursor: wait; transform: none; }
  .msg { margin-top: 10px; min-height: 1.3em; font-size: .9rem; font-weight: 600; }
  .msg.err { color: #fff3c4; }
  .ok { margin-top: 12px; display: flex; align-items: center; gap: 10px; justify-content: center; font-weight: 600; }
  .ok i { color: var(--amarillo); font-size: 1.4rem; }
  .social { margin-top: 26px; display: inline-flex; align-items: center; gap: 8px; color: #fff; font-weight: 600; text-decoration: none; padding: 8px 14px; border-radius: 999px; border: 1px solid rgba(255,255,255,.3); transition: background .15s ease; }
  .social:hover { background: rgba(255,255,255,.12); }
  footer { position: relative; padding: 18px 20px 24px; text-align: center; font-size: .84rem; opacity: .85; }
  footer a { color: #fff; }
  .sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
  @media (max-width: 480px) {
    .wrap { padding-top: 28px; }
    form { flex-direction: column; }
    input[type=email] { flex: none; width: 100%; }
    button { width: 100%; }
    .feats li { font-size: .86rem; }
  }
  @media (prefers-reduced-motion: reduce) { .chip .dot { animation: none; } button { transition: none; } }
</style>
</head>
<body>
  <div class="deco" aria-hidden="true">
    <span class="line" style="width:220px; top:14%; left:-40px"></span>
    <span class="line" style="width:120px; top:17.5%; left:-20px"></span>
    <span class="line" style="width:260px; bottom:22%; right:-60px"></span>
    <span class="line" style="width:140px; bottom:18.5%; right:-30px"></span>
    <span class="box" style="width:64px; height:64px; top:26%; right:7%"></span>
    <span class="box" style="width:40px; height:40px; bottom:30%; left:6%"></span>
    <span class="box" style="width:28px; height:28px; top:8%; right:22%"></span>
  </div>

  <main class="wrap">
    <img class="logo" src="/IMG/logo-blanco.png" alt="Dale Deal" width="640" height="413">
    <p class="chip"><span class="dot" aria-hidden="true"></span>Muy pronto en Argentina</p>
    <h1>Próximamente</h1>
    <svg class="arrow" viewBox="0 0 360 44" aria-hidden="true">
      <rect x="0" y="27" width="22" height="8" rx="4" fill="#ffc629"/>
      <rect x="30" y="27" width="250" height="8" rx="4" fill="#ffc629"/>
      <rect x="18" y="12" width="262" height="8" rx="4" fill="#ffc629"/>
      <path d="M300 2 L358 22 L300 42 L312 22 Z" fill="#ffc629"/>
    </svg>
    <p class="lead">Estamos terminando los últimos detalles de <strong>Dale Deal</strong>: el lugar para comprar, vender y contratar servicios en Argentina, con tu plata protegida hasta que recibís.</p>
    <ul class="feats">
      <li><i class="bi bi-shield-check" aria-hidden="true"></i>Compra Protegida</li>
      <li><i class="bi bi-patch-check-fill" aria-hidden="true"></i>Vendedores verificados</li>
      <li><i class="bi bi-truck" aria-hidden="true"></i>Seguimiento de envíos</li>
    </ul>

    <section class="card" aria-labelledby="avisame">
      <h2 id="avisame">Avisame cuando abra</h2>
      <p class="sub">Dejanos tu mail y sos de los primeros en entrar.</p>
      <form id="f" novalidate>
        <label class="sr" for="email">Tu mail</label>
        <input id="email" type="email" name="email" placeholder="tu@mail.com" autocomplete="email" inputmode="email" required>
        <button id="b" type="submit">Avisame</button>
      </form>
      <p class="msg" id="m" role="status" aria-live="polite"></p>
      <p class="ok" id="ok" hidden><i class="bi bi-check-circle-fill" aria-hidden="true"></i>¡Listo! Te avisamos apenas abramos.</p>
    </section>

    <a class="social" href="https://www.instagram.com/daledeal.ar/" target="_blank" rel="noopener"><i class="bi bi-instagram" aria-hidden="true"></i>Seguinos en @daledeal.ar</a>
  </main>

  <footer>© 2026 Dale Deal · <a href="mailto:hola@daledeal.com.ar">hola@daledeal.com.ar</a></footer>

  <script>
    (function () {
      var API = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) ? 'http://localhost:3000' : 'https://api.daledeal.com.ar';
      var f = document.getElementById('f'), input = document.getElementById('email'),
          b = document.getElementById('b'), m = document.getElementById('m'), ok = document.getElementById('ok');
      function say(text) { m.textContent = text; m.className = 'msg err'; }
      f.addEventListener('submit', function (e) {
        e.preventDefault();
        var email = input.value.trim();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { say('Revisá el mail: parece que le falta algo.'); input.focus(); return; }
        b.disabled = true; b.textContent = 'Enviando…'; m.textContent = '';
        fetch(API + '/newsletter/subscribe', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email, source: 'proximamente' })
        }).then(function (r) {
          return r.json().catch(function () { return {}; }).then(function (d) {
            if (r.status === 429) throw new Error('Demasiados intentos. Probá de nuevo en unos minutos.');
            if (!r.ok || d.ok === false) throw new Error(d.error === 'Email inválido' ? 'Revisá el mail: parece que le falta algo.' : 'No pudimos anotarte. Probá de nuevo.');
            f.hidden = true; ok.hidden = false; m.textContent = '';
          });
        }).catch(function (err) {
          say(err && err.message && err.message !== 'Failed to fetch' ? err.message : 'Error de conexión. Probá de nuevo.');
          b.disabled = false; b.textContent = 'Avisame';
        });
      });
    })();
  </script>
</body>
</html>`;
}
