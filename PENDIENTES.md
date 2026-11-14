# Pendientes

Estado: épica 01 cerrada el 2026-11-14 (fase 0 y diseño funcional de las 17 funcionalidades) · pasos 1 a 8 de 70 con su etiqueta `step-NN` · sigue el paso 9 (`E2-T1`, aislamiento por rol y límites de frecuencia).

**Cómo retomar:** abre `blueprints/sole-prototipo/tasks.json`, busca la primera tarea con `"status": "pending"` y sigue su bloque en `blueprints/sole-prototipo/epics/`. Antes, en Git Bash desde la raíz del repo: abre Docker Desktop, `export PATH="$HOME/.local:$HOME/.local/bin:$PATH"` y `pnpm -C app db:start`.

## Prioridad alta

Nada bloquea la construcción: todo corre en local.

## Prioridad media

Tareas del fundador. Ninguna frena el desarrollo; todas hacen falta antes del lanzamiento (fase 5).

- **Licencia gratuita de gitleaks-action.** El repositorio pertenece a la organización `solecuida`, y la acción oficial de gitleaks pide una licencia (gratuita) para organizaciones. Se solicita en https://gitleaks.io y se guarda en GitHub → repositorio → Settings → Secrets and variables → Actions, con el nombre `GITLEAKS_LICENSE`. Sin ella, el job `gitleaks` de CI falla.
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
