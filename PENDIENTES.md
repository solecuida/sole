# Pendientes

Estado: fase 3 (informes, escucha y panel) cerrada el 2026-11-15 · pasos 1 a 42 de 70 con su etiqueta `step-NN` · sigue el paso 43 (`E6-T1`), primero de la fase 4 (seguridad y calidad).

**Cómo retomar:** abre `blueprints/sole-prototipo/tasks.json`, busca la primera tarea con `"status": "pending"` y sigue su bloque en `blueprints/sole-prototipo/epics/`. Antes, en Git Bash desde la raíz del repo: abre Docker Desktop, `export PATH="$HOME/.local:$HOME/.local/bin:$PATH"` y `pnpm -C app db:start`.

## Prioridad alta

Nada bloquea la construcción: todo corre en local.

## Prioridad media

Tareas del fundador. Ninguna frena el desarrollo; todas hacen falta antes del lanzamiento (fase 5).

- **Licencia gratuita de gitleaks-action.** El repositorio pertenece a la organización `solecuida`, y la acción oficial de gitleaks pide una licencia (gratuita) para organizaciones. Se solicita en https://gitleaks.io y se guarda en GitHub → repositorio → Settings → Secrets and variables → Actions, con el nombre `GITLEAKS_LICENSE`. Sin ella, el job `gitleaks` de CI falla.
- **Revisar el contenido inicial** (paso 14): las plantillas por tipo de cuidado, los 23 consejos y actividades, y los 7 recursos de Chile están en `app/supabase/migrations/20261114001000_contenido_inicial.sql`. Los recursos no se muestran a nadie hasta que confirmes cada teléfono y enlace en su fuente oficial y los marques como verificados (desde el panel, cuando exista en la fase 3).
- **Revisar los textos de los permisos** en `app/src/app/(onboarding)/bienvenida/consentimientos/page.tsx`: son la versión `2026-11-14` y enlazan a `solecuida.com/terminos.html` y `cookies.html`, páginas que se escriben en la fase 7. Antes del lanzamiento conviene que alguien con formación legal los lea.
- **Probar los avisos en un teléfono de verdad.** Las pruebas automáticas usan un emisor falso: confirman que el aviso se arma y se envía una sola vez, no que llegue a un teléfono. La entrega real en un Android con Chrome y en un iPhone con Sole instalada se prueba en el lanzamiento (fase 5), cuando la app tenga dirección `https`.
- **Leer los textos de «Mi cuenta»**, sobre todo el de cerrar el cuidado de una persona por fallecimiento y el de borrar la cuenta (`app/src/components/account/` y `app/src/app/(app)/cuenta/page.tsx`).
- **Darte acceso al panel del fundador** (`/admin`). Ninguna pantalla concede ese permiso: se asigna a mano, una vez, con una línea de SQL sobre tu propia cuenta. En local se hace desde Supabase Studio (http://127.0.0.1:54323 → SQL Editor): `update public.profiles set is_admin = true where id = (select id from auth.users where email = 'TU-CORREO');`. En producción, lo mismo en el panel de Supabase (fase 5). La primera vez que entres a `/admin`, Sole te pide configurar el segundo paso con una app de códigos (Google Authenticator, Aegis, 1Password).
- **Verificar los recursos de Chile en `/admin/contenido` → Recursos.** Cada recurso trae el enlace a su fuente oficial y un botón «Marcar como verificado hoy». Mientras no lo marques, no se muestra a nadie.
- **Confirmar los límites de los planes gratuitos.** Cada cifra de `docs/limites.md` marcada `[VERIFICAR]` debe revisarse en la página oficial enlazada en su fila.
- **Cuentas y claves para el lanzamiento** (brief §5.1): Supabase de producción, Vercel, Resend, Sentry y Cloudflare Turnstile. La lista de variables y dónde va cada una está en `app/.env.example` y en `blueprints/sole-prototipo/blueprint.md` §10. En producción todas se cargan en Vercel → Project → Settings → Environment Variables; nunca en el repositorio.
- **Opcional: instalar gitleaks en el computador** para que el hook `.githooks/pre-commit` revise cada commit antes de subirlo. Sin gitleaks instalado, el hook solo avisa y el escaneo ocurre en CI.

## Prioridad baja

- **Advertencia de Serwist al revisar tipos.** `pnpm -C app typecheck` imprime un aviso sobre Turbopack que no afecta nada: el build y el modo desarrollo usan webpack, como pide el plano. Se puede silenciar con la variable `SERWIST_SUPPRESS_TURBOPACK_WARNING=1`.
- **Cifra de «avisos activos» del panel.** El panel la calcula con los eventos de investigación (personas que aceptaron los avisos), no contando teléfonos suscritos: el administrador no lee esa tabla. Sirve como tendencia; el conteo exacto de suscripciones está en `/admin/limites`.
- **Sugerencia diaria de la bitácora.** La hora se guarda en «Avisos», pero el aviso que la usa todavía no se envía; no está en ningún paso del plano. Hay que decidir si se suma al despachador.
- **Ajustes visuales.** El fundador probó la bienvenida el 2026-11-14 y la aprobó, pero anticipa ajustes de aspecto. Se revisan en el pulido de la fase 8 (paso 70) o antes si él los detalla; los colores, tipografía y radios viven en `app/src/app/globals.css` y `app/src/lib/design/tokens.ts`.
- **Preguntas de diseño que el brief no resuelve** (no frenan nada hoy; están al final de cada documento de `docs/diseno/`):
  - F12: si hay varios contactos de emergencia, hoy se llama al primero. ¿Debería poder elegir la persona cuidada?
  - F16: ¿cuántos familiares caben en un círculo durante el piloto? ¿Puede un familiar salirse solo?
  - F12: confirmar el 131 (SAMU) en una fuente oficial antes del lanzamiento.
- **F16 · Familiares en el círculo.** Se diseña completa en `docs/diseno/familiares.md` (paso 7) y se construyen en la fase 8 si sobra tiempo (pasos 66 a 68).
- **F17 · Panel para organizaciones.** Se construyen en la fase 8 si sobra tiempo (paso 69).
