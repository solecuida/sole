# Pendientes

Estado: fase 1 (cimientos y diseño completo) cerrada el 2026-11-14 · pasos 1 a 16 de 70 con su etiqueta `step-NN` · sigue el paso 17 (`E3-T1`, reglas de repetición con horario de Chile), primero de la fase 2.

**Cómo retomar:** abre `blueprints/sole-prototipo/tasks.json`, busca la primera tarea con `"status": "pending"` y sigue su bloque en `blueprints/sole-prototipo/epics/`. Antes, en Git Bash desde la raíz del repo: abre Docker Desktop, `export PATH="$HOME/.local:$HOME/.local/bin:$PATH"` y `pnpm -C app db:start`.

## Prioridad alta

Nada bloquea la construcción: todo corre en local.

## Prioridad media

Tareas del fundador. Ninguna frena el desarrollo; todas hacen falta antes del lanzamiento (fase 5).

- **Licencia gratuita de gitleaks-action.** El repositorio pertenece a la organización `solecuida`, y la acción oficial de gitleaks pide una licencia (gratuita) para organizaciones. Se solicita en https://gitleaks.io y se guarda en GitHub → repositorio → Settings → Secrets and variables → Actions, con el nombre `GITLEAKS_LICENSE`. Sin ella, el job `gitleaks` de CI falla.
- **Revisar el contenido inicial** (paso 14): las plantillas por tipo de cuidado, los 23 consejos y actividades, y los 7 recursos de Chile están en `app/supabase/migrations/20261114001000_contenido_inicial.sql`. Los recursos no se muestran a nadie hasta que confirmes cada teléfono y enlace en su fuente oficial y los marques como verificados (desde el panel, cuando exista en la fase 3).
- **Revisar los textos de los permisos** en `app/src/app/(onboarding)/bienvenida/consentimientos/page.tsx`: son la versión `2026-11-14` y enlazan a `solecuida.com/terminos.html` y `cookies.html`, páginas que se escriben en la fase 7. Antes del lanzamiento conviene que alguien con formación legal los lea.
- **Confirmar los límites de los planes gratuitos.** Cada cifra de `docs/limites.md` marcada `[VERIFICAR]` debe revisarse en la página oficial enlazada en su fila.
- **Cuentas y claves para el lanzamiento** (brief §5.1): Supabase de producción, Vercel, Resend, Sentry y Cloudflare Turnstile. La lista de variables y dónde va cada una está en `app/.env.example` y en `blueprints/sole-prototipo/blueprint.md` §10. En producción todas se cargan en Vercel → Project → Settings → Environment Variables; nunca en el repositorio.
- **Opcional: instalar gitleaks en el computador** para que el hook `.githooks/pre-commit` revise cada commit antes de subirlo. Sin gitleaks instalado, el hook solo avisa y el escaneo ocurre en CI.

## Prioridad baja

- **Preguntas de diseño que el brief no resuelve** (no frenan nada hoy; están al final de cada documento de `docs/diseno/`):
  - F12: si hay varios contactos de emergencia, hoy se llama al primero. ¿Debería poder elegir la persona cuidada?
  - F16: ¿cuántos familiares caben en un círculo durante el piloto? ¿Puede un familiar salirse solo?
  - F12: confirmar el 131 (SAMU) en una fuente oficial antes del lanzamiento.
- **F16 · Familiares en el círculo.** Se diseña completa en `docs/diseno/familiares.md` (paso 7) y se construyen en la fase 8 si sobra tiempo (pasos 66 a 68).
- **F17 · Panel para organizaciones.** Se construyen en la fase 8 si sobra tiempo (paso 69).
