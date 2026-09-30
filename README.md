# Fichas de plantas

App web para registrar fichas técnicas de plantas en grupo (nombre científico, nombre común,
fotos de planta, flor y fruto, lugar y fecha). **Sin login**: el acceso se da con links secretos.

- Link de **edición**: ver, crear, editar y borrar fichas (a la papelera).
- Link de **solo lectura**: solo ver.

Stack: Next.js 16 + Tailwind + Supabase (Postgres y Storage), desplegado en Vercel. Todo en planes gratuitos.

## 1. Crear el proyecto en Supabase

1. Crear una cuenta en <https://supabase.com> y un proyecto nuevo (región cercana, p. ej. São Paulo).
2. Ir a **SQL Editor → New query**, pegar el contenido de [`supabase/schema.sql`](supabase/schema.sql) y ejecutar (**Run**).
   Esto crea las tablas, activa RLS y crea el bucket privado `fotos`.
3. Ir a **Project Settings → API keys** y copiar:
   - la **Project URL** → `SUPABASE_URL`
   - la clave **secreta** (`service_role` o `sb_secret_…`) → `SUPABASE_SERVICE_ROLE_KEY`

> La clave secreta salta todas las restricciones: nunca la pongas en código del navegador ni la subas a GitHub.

## 2. Correr en tu computador

```bash
cp .env.example .env.local   # y completar los valores
npm install
npm run dev
```

Crear una colección (imprime los dos links):

```bash
npm run crear-coleccion -- "Herbario del curso"
```

Abrir el link de edición en el navegador y crear una ficha.

**Probar desde el celular** en la misma red wifi: `npm run dev -- -H 0.0.0.0` y abrir
`http://<IP-del-computador>:3000/c/<token>`. Si Next.js bloquea la conexión, agregar esa IP en
`allowedDevOrigins` de `next.config.ts`. (La cámara funciona, pero "Usar mi ubicación" requiere HTTPS:
pruébalo después de desplegar.)

## 3. Desplegar en Vercel

1. Subir el proyecto a un repositorio de GitHub (el `.gitignore` ya excluye `.env.local`).
2. En <https://vercel.com> → **Add New → Project** → importar el repositorio.
3. En **Environment Variables** cargar `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET` y
   `APP_URL` (la URL que te da Vercel, p. ej. `https://fichas-plantas.vercel.app`).
4. Deploy. El archivo `vercel.json` programa un cron diario a `/api/cron/diario`, que mantiene
   activo Supabase (el plan gratis se pausa tras 7 días sin uso) y purga la papelera.
5. Actualizar `APP_URL` en tu `.env.local` y crear la colección real con `npm run crear-coleccion`.

## Administración

| Tarea | Comando |
|---|---|
| Crear colección y obtener links | `npm run crear-coleccion -- "Nombre"` |
| Ver colecciones | `npm run rotar-links` |
| Regenerar links (si se filtró uno) | `npm run rotar-links -- <id> [edicion\|lectura\|ambos]` |

Los links no se guardan en la base de datos (solo su hash): si pierdes uno, regénéralo.

## Cómo funciona la seguridad sin login

- El token del link tiene 32 bytes aleatorios: no se puede adivinar.
- El navegador nunca habla con la base de datos: el servidor valida el token en **cada** página y acción.
- RLS está activado sin políticas, así que las claves públicas de Supabase no pueden leer nada.
- Las fotos están en un bucket privado y se muestran con URLs firmadas que caducan en 1 hora.
- `Referrer-Policy: no-referrer` y `noindex` evitan que el link se filtre a otros sitios o buscadores.
- Borrar envía la ficha a la papelera (recuperable 30 días).

Quien tenga el link de edición puede modificar cualquier ficha: compártelo solo con el grupo.

## Estructura

```
app/c/[token]/            galería, nueva ficha, ficha, editar, papelera
app/api/cron/diario/      ping diario + purga de papelera
lib/acceso.ts             validación del token del link
lib/acciones.ts           Server Actions (crear, editar, papelera)
lib/datos.ts              consultas y URLs firmadas de fotos
lib/imagenes.ts           compresión de fotos y lectura de EXIF en el navegador
components/               formulario, subidor de fotos, autocompletado GBIF, vista de ficha
scripts/                  crear colección y rotar links
supabase/schema.sql       tablas, RLS y bucket
```

## Espacio (plan gratuito de Supabase)

Cada ficha ocupa ≈ 0,5–1,5 MB (fotos de hasta 1600 px + miniaturas). 1 GB ≈ 1.000 fichas.
