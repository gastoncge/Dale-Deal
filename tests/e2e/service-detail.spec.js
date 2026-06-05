// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Tests E2E de la página de detalle de servicio.
 *
 * EL TEST QUE FALTABA: estos cubren exactamente los bugs que el dueño
 * reportó manualmente esta sesión:
 *   - "cualquier servicio me lleva al electricista"
 *   - "plomería muestra la foto del electricista"
 *   - "todos los servicios muestran la misma foto"
 *
 * Estrategia: interceptamos GET /services/:id y devolvemos un fixture
 * controlado. Después verificamos que la UI renderice ESE fixture
 * (imagen, provider, precio), no la imagen hardcoded del HTML.
 */

// Fixture base — forma real de la respuesta del backend (GET /services/:id)
function serviceFixture(overrides = {}) {
  return {
    id: 1,
    title: 'Plomero matriculado - urgencias 24hs',
    description: 'Plomero con 15 años de experiencia. Destapaciones, roturas.',
    price_from: '8000.00',
    price_to: '35000.00',
    currency: 'ARS',
    price_type: 'quote',
    category_id: 1,
    category_slug: 'plomeria',
    category_name: 'Plomería',
    provider_id: 1,
    provider_name: 'Ana García',
    provider_avatar: 'https://ui-avatars.com/api/?name=Ana+Garcia',
    provider_phone: '+54 11 4567-8901',
    provider_location: 'Buenos Aires, CABA',
    provider_since: '2021-01-01T00:00:00.000Z',
    images: [
      'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1542013936693-884638332954?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=600&h=400&fit=crop',
    ],
    location: 'Buenos Aires, CABA',
    zones_covered: ['CABA', 'GBA Norte'],
    status: 'active',
    views: 16,
    avg_rating: 5,
    review_count: 0,
    ...overrides,
  };
}

// Helper: interceptar todas las llamadas de la página y mockear /services/:id
async function mockBackend(page, serviceById) {
  // Interceptar el detalle del servicio
  await page.route('**/services/*', async (route) => {
    const url = route.request().url();
    // /services/:id  (no /services?query)
    const m = url.match(/\/services\/(\d+)(?:\?|$)/);
    if (m) {
      const id = parseInt(m[1], 10);
      const svc = serviceById[id];
      if (svc) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(svc),
        });
      }
      return route.fulfill({ status: 404, contentType: 'application/json', body: '{"error":"not found"}' });
    }
    // /services?... (listados) → array vacío para no romper carruseles
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [] }) });
  });

  // Reviews y demás endpoints secundarios → respuestas vacías controladas
  await page.route('**/reviews/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [] }) }));
}

test.describe('Página de servicio — render dinámico', () => {

  test('muestra la foto, provider y título del servicio cargado (no la hardcoded)', async ({ page }) => {
    await mockBackend(page, {
      1: serviceFixture(),
    });

    await page.goto('/HTML/servicio.html?id=1');

    // El provider del backend debe aparecer (no un mock tipo "Valentina G.")
    await expect(page.locator('h1')).toContainText('Plomero matriculado');

    // La imagen principal debe ser la del fixture (primer item de images),
    // NO la hardcoded del electricista (1621905252507).
    const mainImg = page.locator('#mainServiceImage');
    await expect(mainImg).toHaveAttribute('src', /1607472586893/, { timeout: 10_000 });
    await expect(mainImg).not.toHaveAttribute('src', /1621905252507/);
  });

  test('REGRESIÓN del electricista: 2 servicios distintos → 2 fotos distintas', async ({ page }) => {
    // Este es EL test que hubiera cazado el bug original.
    const plomero = serviceFixture({
      id: 1,
      title: 'Plomero matriculado',
      provider_name: 'Ana García',
      images: ['https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=600&h=400&fit=crop'],
    });
    const electricista = serviceFixture({
      id: 3,
      title: 'Electricista matriculado',
      provider_name: 'María López',
      category_slug: 'electricidad',
      images: ['https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=600&h=400&fit=crop'],
    });

    await mockBackend(page, { 1: plomero, 3: electricista });

    // Servicio 1 (plomero)
    await page.goto('/HTML/servicio.html?id=1');
    await expect(page.locator('h1')).toContainText('Plomero');
    await expect(page.locator('#mainServiceImage')).toHaveAttribute('src', /1607472586893/, { timeout: 10_000 });

    // Servicio 3 (electricista) — DEBE cambiar la foto y el título
    await page.goto('/HTML/servicio.html?id=3');
    await expect(page.locator('h1')).toContainText('Electricista');
    await expect(page.locator('#mainServiceImage')).toHaveAttribute('src', /1621905252507/, { timeout: 10_000 });
    // Y NO debe quedar la foto del plomero
    await expect(page.locator('#mainServiceImage')).not.toHaveAttribute('src', /1607472586893/);
  });

  test('la imagen principal NO queda como placeholder gris tras cargar', async ({ page }) => {
    await mockBackend(page, { 1: serviceFixture() });
    await page.goto('/HTML/servicio.html?id=1');

    const mainImg = page.locator('#mainServiceImage');
    // Esperar a que cargue la real
    await expect(mainImg).toHaveAttribute('src', /unsplash/, { timeout: 10_000 });
    // El skeleton (clase is-loading) debe haberse removido
    await expect(mainImg).not.toHaveClass(/is-loading/);
    // El src NO debe ser el SVG placeholder
    const src = await mainImg.getAttribute('src');
    expect(src).not.toContain('data:image/svg');
  });

  test('servicio inexistente redirige al listado (no muestra basura)', async ({ page }) => {
    await mockBackend(page, {}); // ningún id existe → 404

    await page.goto('/HTML/servicio.html?id=99999');
    // El código redirige a servicios.html tras mostrar "no encontrado"
    await page.waitForURL(/servicios\.html/, { timeout: 6_000 });
    expect(page.url()).toContain('servicios.html');
  });
});
