# Licencias

Todo lo que Sole usa y no es propio, con su licencia y de dónde sale (brief §6.4, punto 10). Las licencias de los paquetes se leyeron del campo `license` de cada paquete instalado en `app/node_modules` el 2026-11-14. Antes de agregar una tipografía, un ícono, una imagen o una librería, se anota aquí.

## Tipografía, íconos e imágenes

| Recurso | Licencia | Fuente |
|---|---|---|
| Atkinson Hyperlegible (tipografía de la app) | SIL Open Font License 1.1 | https://fonts.google.com/specimen/Atkinson+Hyperlegible — se descarga en el build con `next/font/google` y se sirve desde el dominio de la app |
| lucide-react (íconos) | ISC | https://www.npmjs.com/package/lucide-react |
| Logo "S" de Sole | Propio | `web/assets/`; lo creó el proyecto |

No se usan fotos, ilustraciones ni logos de terceros. Los logos de organizaciones aliadas solo se usarán con su permiso por escrito.

## Librerías de la app

| Recurso | Licencia | Fuente |
|---|---|---|
| Next.js | MIT | https://www.npmjs.com/package/next |
| React y React DOM | MIT | https://www.npmjs.com/package/react |
| Supabase JS (`@supabase/supabase-js`, `@supabase/ssr`) | MIT | https://www.npmjs.com/package/@supabase/supabase-js |
| Recharts (gráficos) | MIT | https://www.npmjs.com/package/recharts |
| Serwist (`serwist`, `@serwist/next`: service worker de la PWA) | MIT | https://www.npmjs.com/package/serwist |
| web-push (envío de avisos) | MPL-2.0 | https://www.npmjs.com/package/web-push |
| zod (validación) | MIT | https://www.npmjs.com/package/zod |
| react-hook-form y `@hookform/resolvers` (formularios) | MIT | https://www.npmjs.com/package/react-hook-form |
| idb (guardado sin conexión) | ISC | https://www.npmjs.com/package/idb |
| date-fns y `@date-fns/tz` (fechas y horario de Chile) | MIT | https://www.npmjs.com/package/date-fns |
| html-to-image (compartir un informe como imagen) | MIT | https://www.npmjs.com/package/html-to-image |
| `@sentry/nextjs` (registro de errores) | MIT | https://www.npmjs.com/package/@sentry/nextjs |
| `@marsidev/react-turnstile` (anti-bots) | MIT | https://www.npmjs.com/package/@marsidev/react-turnstile |

## Notas

- **MPL-2.0 (web-push):** permite usar la librería sin abrir el código de Sole. Solo obliga a publicar los cambios si se modifican los archivos de la propia librería, cosa que no se hace.
- **SIL Open Font License 1.1:** permite usar e incluir la tipografía en la app; no permite venderla sola.
- Las herramientas de desarrollo (TypeScript, Biome, Vitest, Playwright, Tailwind CSS, CLI de Supabase) no se distribuyen con la app; sus licencias están en `app/node_modules/<paquete>/package.json`.
