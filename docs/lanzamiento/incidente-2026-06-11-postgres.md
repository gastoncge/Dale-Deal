# Postmortem — Caída del backend por contraseña de Postgres (11/06/2026)

## Resumen
El backend de producción quedó **503 ~2h47m** (≈14:14 → 17:01 hora AR) porque el
cluster de Postgres tenía guardada una contraseña **distinta** a la de las
variables de Railway. La página estática siguió en línea; lo caído fue todo lo
que usa la base (catálogo, login, publicar, contacto). **No se perdió ningún
dato** (verificado: 16 tablas, 30 productos, intactos).

## Timeline (hora AR)
- **13:51** — Deploy del backend (persistencia de contactos) → verificado OK (13:53: health 200).
- **13:57** — El contenedor de **Postgres se reinició solo** (sus logs muestran
  "automatic recovery"; causa no determinada, probablemente mantenimiento de
  Railway — nuestros comandos apuntaron solo al servicio backend).
- **14:14** — Redeploy del backend (variable `CONTACT_INBOX`). Las conexiones
  nuevas empezaron a fallar: `password authentication failed for user "postgres"`.
- **~16:30–17:00** — Diagnóstico y reparación (ver abajo). **17:01 — health 200.**

## Causa raíz
- El cluster (pg_authid) tenía una contraseña que **no coincidía con ninguna
  variable** del store de Railway (origen del drift: desconocido, anterior al día).
- Estuvo **latente** mucho tiempo por dos máscaras:
  1. El pool del backend mantenía **conexiones viejas vivas** (Postgres no corta
     sesiones existentes al cambiar la contraseña) → el backend "funcionaba".
  2. `pg_hba` tiene **`trust` para loopback** → cualquier chequeo local "pasaba"
     sin validar contraseña (esto también nos comió un diagnóstico).
- El reinicio de Postgres (13:57) + el redeploy del backend (14:14) forzaron
  conexiones nuevas contra la regla remota real (`scram-sha-256`) → falla.

## Reparación (sin exponer secretos — todo dentro de los contenedores)
1. Diagnóstico por **huellas** (sha256/8): las contraseñas de las variables
   (backend URL, `PGPASSWORD`, URL de Postgres) eran **todas iguales** entre sí
   (`e65b1fb6`) — el problema era el **cluster**.
2. `ALTER USER postgres WITH PASSWORD :'pw'` con el **valor de la variable
   oficial**, ejecutado vía socket local (trust) dentro del contenedor PG.
3. Verificación contra la regla **scram real** (IP privada, no loopback): OK.
4. El backend se reconectó **solo, sin redeploy** (health 200 en 5 segundos).

## Mejoras que quedaron hechas
- El `DATABASE_URL` del backend ahora se construye con **referencias**
  (`${{Postgres.PGUSER}}:${{Postgres.PGPASSWORD}}@${{Postgres.RAILWAY_PRIVATE_DOMAIN}}…`)
  en vez de un string estático → si Railway rota credenciales, el backend las
  sigue automáticamente.

## Riesgos residuales / pendientes (revisar en el dashboard)
1. **Verificar que `POSTGRES_PASSWORD` == `PGPASSWORD`** en las variables del
   servicio Postgres (yo no puedo compararlas sin manipular secretos). Si
   difieren, igualarlas: si el wrapper de Railway aplicara `POSTGRES_PASSWORD`
   en algún arranque futuro, volvería a romper.
2. **UptimeRobot estuvo pegándole a `/health` (503) durante todo el incidente**
   — revisar por qué no llegó la alerta (¿email de alertas mal configurado?).
3. Causa del reinicio de Postgres de las 13:57: desconocida (lado Railway).

## Lecciones
- Variables estáticas con credenciales adentro = bomba de tiempo → usar referencias.
- `trust` en loopback hace mentir cualquier test local de contraseñas.
- Un pool con conexiones longevas puede ocultar credenciales rotas por semanas:
  el próximo deploy "inocente" se come el incidente.
