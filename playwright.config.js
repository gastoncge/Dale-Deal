// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * Config de Playwright para tests E2E de Dale Deal.
 *
 * Filosofía:
 *   - Levantamos el `dist/` (output del build) con un http.server local.
 *   - Los tests INTERCEPTAN las llamadas al backend (route mocking) y
 *     devuelven fixtures controladas. Así testeamos la LÓGICA del frontend
 *     sin depender de prod ni de un backend corriendo.
 *   - Por qué importa: los bugs de esta sesión (electricista, fotos
 *     repetidas, flash) eran del FRONTEND no actualizando la UI aunque el
 *     backend mandara datos OK. Con mocking, controlamos exactamente qué
 *     "manda el backend" y verificamos que la UI lo refleje.
 *
 * Correr:
 *   npm run test:e2e            (headless, todos)
 *   npm run test:e2e -- --ui    (modo UI interactivo)
 *   npm run test:e2e -- --headed (ver el browser)
 */
module.exports = defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  expect: { timeout: 8_000 },
  fullyParallel: true,
  retries: 0,
  reporter: [['list']],

  use: {
    baseURL: 'http://localhost:5566',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium-desktop',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'chromium-mobile',
      use: { ...devices['Pixel 5'] },
    },
  ],

  // Levanta el dist/ buildeado antes de correr los tests.
  // reuseExistingServer evita rearrancar si ya hay uno corriendo (dev loop).
  webServer: {
    command: 'python3 -m http.server 5566 --directory dist',
    port: 5566,
    reuseExistingServer: !process.env.CI,
    timeout: 20_000,
  },
});
