-- =====================================================================
-- SEED CREÍBLE — avatares de personas reales (Dale Deal)
-- =====================================================================
-- El contenido del seed (productos, servicios, precios, descripciones) ya es
-- creíble. El único "tell" que delata que son cuentas sembradas es el avatar:
-- hoy son iniciales de colorcito (ui-avatars.com). Esto los reemplaza por
-- fotos de personas (randomuser.me), que es lo que tendría un usuario real.
--
-- ✅ NO destructivo: solo cambia avatar_url de 5 usuarios. Reversible.
-- ✅ Idempotente: se puede correr las veces que quieras.
--
-- CÓMO CORRERLO (la DB de prod NO está expuesta a internet, así que va por Railway):
--   Opción A — Railway dashboard: proyecto → servicio Postgres → pestaña "Data"
--              / "Query" → pegar y ejecutar.
--   Opción B — CLI:  railway run psql < docs/lanzamiento/seed-avatares.sql
-- =====================================================================

UPDATE users SET avatar_url = 'https://randomuser.me/api/portraits/women/68.jpg'
  WHERE email = 'ana.garcia@daledeal.com';

UPDATE users SET avatar_url = 'https://randomuser.me/api/portraits/men/32.jpg'
  WHERE email = 'carlos.ruiz@daledeal.com';

UPDATE users SET avatar_url = 'https://randomuser.me/api/portraits/women/44.jpg'
  WHERE email = 'maria.lopez@daledeal.com';

UPDATE users SET avatar_url = 'https://randomuser.me/api/portraits/men/52.jpg'
  WHERE email = 'jorge.fernandez@daledeal.com';

UPDATE users SET avatar_url = 'https://randomuser.me/api/portraits/women/30.jpg'
  WHERE email = 'lucia.gomez@daledeal.com';

-- Verificar:
SELECT name, email, avatar_url FROM users
WHERE email LIKE '%@daledeal.com'
ORDER BY id;

-- NOTA: son fotos placeholder temporales para el pre-lanzamiento. Cuando entren
-- vendedores reales, cada uno sube su propia foto y estas cuentas se borran
-- (ver docs/lanzamiento/limpiar-demo.sql).
