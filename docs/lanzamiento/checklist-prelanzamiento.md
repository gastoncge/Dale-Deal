# 🚀 Checklist de pre-lanzamiento — Dale Deal

> **Diagnóstico:** la página está lista técnicamente. Lo que falta para lanzar
> NO es código: son 3 acciones de panel/config + conseguir oferta y demanda reales.
> Este doc cubre las 4 cosas que desbloquean el arranque.

Estado al **10/06/2026**.

| # | Bloqueador | Tipo | Quién | Tiempo |
|---|-----------|------|-------|--------|
| 1 | Mercado Pago no cobra | Decisión + config | **Dueño** | ~1 h |
| 2 | Data demo en la página | Decisión + DB | Dueño + dev | ~30 min |
| 3 | Analytics apagado | Config | Dev (falta token) | ~10 min |
| 4 | Mails de soporte no llegan | Config (1 variable) | **Dueño/dev** | ~5 min |

---

## 1 · Activar Mercado Pago (el bloqueador #1 — sin esto no hay negocio)

**El código ya está listo.** El backend lee la variable `MP_ACCESS_TOKEN` y crea las
preferencias de pago. Lo único que falta son las **credenciales de producción**.

### ¿Qué cuenta elegir? (la duda que está frenando todo)
Para **arrancar y validar**, no compliques:
- **Usá la cuenta de Mercado Pago que YA tenés.** Una cuenta **personal** sirve
  perfecto para empezar a cobrar y validar el negocio.
- Lo formal (cuenta de **empresa** con CUIT, facturación AFIP) se arregla
  **después** con un contador. **No lo dejes bloquear la prueba.** Primero validá
  que la gente compra; después formalizás.

### Pasos para sacar las credenciales (1 hora, lo hace el dueño)
1. Entrar a **mercadopago.com.ar** con la cuenta elegida.
2. Ir a **"Tus integraciones"** (panel de desarrolladores).
3. **Crear una aplicación** → producto **Checkout Pro** (pagos online).
4. Dentro de la app → **Credenciales de producción** → copiar:
   - **Access Token** → `APP_USR-...` ← **esta es la clave**
   - **Public Key** → `APP_USR-...` (solo si después usamos formulario embebido;
     con Checkout Pro redirigido alcanza con el Access Token).
   - ⚠️ Hay credenciales de **prueba** (`TEST-...`) y de **producción**
     (`APP_USR-...`). Para cobrar **plata real** → producción.
5. Configurar la **URL de notificaciones (webhook)** en la app de MP apuntando al
   backend (endpoint de webhooks de pagos). *(El dev confirma la URL exacta.)*

### Cargar la credencial (lo hace el dev, 5 min)
En **Railway → backend → Variables**:
```
MP_ACCESS_TOKEN = APP_USR-...(el de producción)
```
Redeploy del backend. Listo: **cobra plata real.**

> El backend ya valida que en producción el token NO sea `TEST-` (avisa si te
> equivocás). El frontend ya muestra "Pago protegido por Mercado Pago" + cuotas.

### Importante: el flujo de PUBLICAR está en modo demo
La página `publicar.html` hoy dice *"Versión demo. No se procesará ningún pago"* y
tiene un botón **"Registrar interés (Demo)"**. Cuando MP esté activo hay que
**des-gatear el publicar** para que los vendedores reales puedan cargar productos.
👉 Esto es parte de "salir a producción de verdad" — coordinarlo con el dev.

---

## 2 · Limpiar / reemplazar la data demo

**Qué hay hoy:** la base tiene datos de demostración cargados por `db/seed.sql`:
- **5 usuarios demo** (`ana.garcia@daledeal.com`, `carlos.ruiz@...`, etc. — ojo, son
  `@daledeal.com`, no el dominio real `.com.ar`).
- Productos, servicios y reseñas de ejemplo asociados a esos usuarios.
- *(Las categorías NO son demo — son la taxonomía real, se quedan.)*

**El problema:** el primer visitante real ve "productos de prueba" → parece un sitio
sin terminar y se va.

**Opciones (decisión del dueño):**
- **A) Reemplazar por oferta real** — la ideal, pero necesita los primeros
  vendedores reales cargados (ver punto 1: des-gatear publicar).
- **B) Seed creíble temporal** — re-tematizar la demo con nombres/fotos/precios
  realistas para que el sitio "se vea vivo" mientras se consigue oferta real.
- **C) Borrar la demo + buen empty-state** — vacío pero honesto ("Próximamente").

**Cómo se borra (cuando se decida):** hay un script preparado en
`docs/lanzamiento/limpiar-demo.sql` que **primero cuenta** lo que va a borrar
(dry-run) y borra solo los 5 usuarios demo + su contenido, **conservando las
categorías**. ⚠️ Toca la **base de producción** → se corre con OK explícito.

---

## 3 · Activar analytics (ya está cableado, falta el token)

**Buena noticia: ya está integrado.** El build (`build.js`) inyecta el beacon de
**Cloudflare Web Analytics** si le das el token. Es **gratis, sin cookies, sin
banner de consentimiento** (ideal, ya estamos en Cloudflare).

**Pasos (10 min):**
1. Cloudflare → **Analytics → Web Analytics** → tu sitio → **JavaScript snippet**.
2. Copiar el valor de `data-cf-beacon` (el **token**).
3. Pasárselo al dev → se setea y se redeploya:
   ```
   CF_BEACON_TOKEN=xxxxx npm run build   # luego wrangler deploy
   ```
4. A las pocas horas ves: cuánta gente entra, qué páginas miran, de dónde vienen.

> Sin esto vas a ciegas. Cuando empiece a llegar gente, necesitás los números
> **desde el día 1**.

---

## 4 · Que lleguen los mails de soporte (1 variable, 5 min)

**El bug:** el formulario de contacto manda el mail al equipo a
`contacto@daledeal.com.ar` **por defecto**, pero ese dominio **no tiene casilla**
(sin MX) → los mensajes se mandan al vacío. Peor: los contactos **normales** (no
empresa) hoy **solo se mandan por mail**, no se guardan → **se están perdiendo**.

**El fix (inmediato, no necesita código):**
En **Railway → backend → Variables**:
```
CONTACT_INBOX = tucorreo@gmail.com   ← el Gmail real del dueño
```
Resend manda **desde** el dominio verificado (`hola@daledeal.com.ar`) **hacia**
cualquier casilla, incluido Gmail — **no hace falta MX en daledeal**. Redeploy y
listo: las consultas te llegan al Gmail.

**Mejora opcional (código, después):** guardar TODOS los contactos en la base (no
solo los de empresa), así nunca se pierde un mensaje aunque falle el mail, y se
ven en el admin. *(Requiere una migración chica — se hace en rama backend con
checkpoint.)*

---

## TL;DR — qué hacer esta semana
1. **Dueño:** elegí la cuenta de MP (la personal sirve) y sacá el `APP_USR-`. ← desbloquea TODO.
2. **Dueño:** pasame el token de Cloudflare Web Analytics + tu Gmail para soporte.
3. **Dev:** cargo MP + analytics + `CONTACT_INBOX`, des-gateo publicar, redeploy.
4. **Dueño:** a conseguir los primeros 5–10 vendedores y los primeros usuarios (a mano).
