// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Smoke tests E2E: cada página pública carga sin errores de consola
 * graves y sin scroll horizontal en mobile. Cobertura amplia y barata.
 */

const PUBLIC_PAGES = [
  { path: '/index.html',            mustHave: 'Dale Deal' },
  { path: '/HTML/productos.html',   mustHave: 'Productos' },
  { path: '/HTML/servicios.html',   mustHave: 'Servicios' },
  { path: '/HTML/login.html',       mustHave: /iniciar sesión/i },
  { path: '/HTML/signup.html',      mustHave: /crear|registr/i },
  { path: '/HTML/contacto.html',    mustHave: /contacto/i },
  { path: '/HTML/mi-cuenta.html',   mustHave: /cuenta|sesión/i },
  { path: '/HTML/centro-ayuda.html', mustHave: /ayuda/i },
];

test.describe('Smoke — páginas públicas cargan OK', () => {
  for (const pg of PUBLIC_PAGES) {
    test(`${pg.path} carga sin errores JS críticos`, async ({ page }) => {
      const errors = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          const t = msg.text();
          // Ignorar errores esperables en el entorno de TEST (no son bugs):
          //  - fetch/network fallido: no hay backend local
          //  - GSI_LOGGER origin not allowed: localhost:5566 no está en los
          //    Authorized Origins de Google (solo prod lo está) — esperado
          //  - Sentry: DSN dev
          if (/Failed to fetch|NetworkError|net::ERR|conectar|servidor|backend|401|403|Sentry|GSI_LOGGER|origin is not allowed|accounts\.google/i.test(t)) return;
          errors.push(t);
        }
      });
      page.on('pageerror', (err) => errors.push('PAGEERROR: ' + err.message));

      await page.goto(pg.path, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1500);

      // Contenido esperado presente
      await expect(page.locator('body')).toContainText(pg.mustHave);

      // Sin errores JS no-esperados
      expect(errors, `Errores JS en ${pg.path}:\n${errors.join('\n')}`).toEqual([]);
    });
  }
});

test.describe('Smoke mobile — sin scroll horizontal', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  for (const pg of PUBLIC_PAGES) {
    test(`${pg.path} no tiene scroll horizontal en 375px`, async ({ page }) => {
      await page.goto(pg.path, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1200);
      const overflow = await page.evaluate(() => {
        return {
          scrollW: document.body.scrollWidth,
          clientW: document.documentElement.clientWidth,
        };
      });
      // Tolerancia de 2px por sub-pixel rounding
      expect(overflow.scrollW, `scroll horizontal en ${pg.path}`)
        .toBeLessThanOrEqual(overflow.clientW + 2);
    });
  }
});
