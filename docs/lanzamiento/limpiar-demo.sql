-- =====================================================================
-- LIMPIAR DATA DEMO — Dale Deal
-- =====================================================================
-- Borra los 5 usuarios de demostración (cargados por db/seed.sql) y, por
-- cascada (ON DELETE CASCADE), sus productos, servicios, reseñas y favoritos.
--
-- ⚠️  CORRE CONTRA LA BASE DE PRODUCCIÓN. Leer antes de ejecutar:
--   • Apunta a los 5 EMAILS EXACTOS del seed (no usa wildcard '%@daledeal.com'
--     a propósito: así NO toca un eventual admin@daledeal.com real).
--   • Las CATEGORÍAS (product_categories / service_categories) NO se tocan:
--     son taxonomía real, se quedan.
--   • orders.buyer_id/seller_id es ON DELETE RESTRICT: si algún usuario demo
--     tuviera una orden, el DELETE FALLA (seguro — no corrompe nada). El seed
--     no crea órdenes, así que en condiciones normales no hay problema.
--
-- USO:
--   1) Correr SOLO el PASO 1 (dry-run) y revisar los números.
--   2) Si los números tienen sentido, correr el PASO 2 dentro de la transacción.
--   3) Verificar con el PASO 3 antes del COMMIT.
-- =====================================================================

-- Lista de emails demo (del seed.sql). Editar si cambió.
--   ana.garcia@daledeal.com, carlos.ruiz@daledeal.com,
--   jorge.fernandez@daledeal.com, lucia.gomez@daledeal.com,
--   maria.lopez@daledeal.com

-- ─────────────────────────────────────────────────────────────────────
-- PASO 1 · DRY-RUN: ¿qué se va a borrar? (no borra nada)
-- ─────────────────────────────────────────────────────────────────────
SELECT u.id, u.email, u.name,
       (SELECT count(*) FROM products  p WHERE p.seller_id   = u.id) AS productos,
       (SELECT count(*) FROM services  s WHERE s.provider_id = u.id) AS servicios,
       (SELECT count(*) FROM reviews   r WHERE r.reviewer_id = u.id) AS resenias,
       (SELECT count(*) FROM favorites f WHERE f.user_id     = u.id) AS favoritos,
       (SELECT count(*) FROM orders    o WHERE o.buyer_id = u.id OR o.seller_id = u.id) AS ordenes_OJO
FROM users u
WHERE u.email IN (
  'ana.garcia@daledeal.com',
  'carlos.ruiz@daledeal.com',
  'jorge.fernandez@daledeal.com',
  'lucia.gomez@daledeal.com',
  'maria.lopez@daledeal.com'
)
ORDER BY u.id;
-- 👉 Si la columna "ordenes_OJO" da > 0 en alguno, PARAR y avisar (ese usuario
--    tiene ventas reales asociadas; el DELETE fallaría por RESTRICT).

-- ─────────────────────────────────────────────────────────────────────
-- PASO 2 · BORRADO (transaccional — se puede revertir con ROLLBACK)
-- ─────────────────────────────────────────────────────────────────────
BEGIN;

DELETE FROM users
WHERE email IN (
  'ana.garcia@daledeal.com',
  'carlos.ruiz@daledeal.com',
  'jorge.fernandez@daledeal.com',
  'lucia.gomez@daledeal.com',
  'maria.lopez@daledeal.com'
);
-- (products, services, reviews, favorites se borran solos por ON DELETE CASCADE)

-- ─────────────────────────────────────────────────────────────────────
-- PASO 3 · VERIFICAR antes de confirmar
-- ─────────────────────────────────────────────────────────────────────
SELECT
  (SELECT count(*) FROM users)    AS usuarios_restantes,
  (SELECT count(*) FROM products) AS productos_restantes,
  (SELECT count(*) FROM services) AS servicios_restantes,
  (SELECT count(*) FROM product_categories) AS categorias_prod_INTACTAS,
  (SELECT count(*) FROM service_categories) AS categorias_serv_INTACTAS;

-- Si todo OK:
--   COMMIT;
-- Si algo no cuadra:
--   ROLLBACK;
