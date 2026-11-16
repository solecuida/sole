# ISO/IEC 27001:2022 Anexo A: controles aplicables

Referencia, no certificación (brief sección 6.1). La tabla recoge los controles que aplican a un proyecto con un fundador único y una app en la nube, y dice cómo se cumplen hoy. Los números siguen la agrupación del Anexo A de la edición 2022 (5 organizacionales, 6 de personas, 7 físicos, 8 tecnológicos); el texto exacto de cada control y su numeración se confirman contra la norma `[VERIFICAR]` (es de pago; esta tabla no la reproduce).

Lo que depende del sistema desplegado o de procesos que aún no existen va marcado como "Lista de lanzamiento" o "Pendiente".

| Control | Aplica | Cómo se cumple | Evidencia |
|---|---|---|---|
| 5.1 Políticas de seguridad de la información | Sí | Reglas no negociables del proyecto y estos documentos | `CLAUDE.md`, `docs/seguridad/checklist-6.2.md` |
| 5.2 Roles y responsabilidades | Sí | Fundador único: responsable de seguridad, de incidentes y de los datos | `docs/seguridad/plan-incidentes.md`, `docs/legal/registro-actividades.md` |
| 5.3 Segregación de funciones | Parcial | No hay equipo que separar; se compensa con el segundo factor y la auditoría del panel | `app/src/server/admin/guard.ts` |
| 5.7 Inteligencia de amenazas | Parcial | Dependabot y escaneo de dependencias avisan de vulnerabilidades conocidas | `.github/dependabot.yml`, `.github/workflows/ci.yml` |
| 5.8 Seguridad en la gestión de proyectos | Sí | Modelo de amenazas y evaluación de impacto antes de construir cada fase | `docs/seguridad/modelo-amenazas.md`, `docs/legal/eipd.md` |
| 5.9 Inventario de activos | Sí | Registro de tratamientos con destinatarios y categorías de datos | `docs/legal/registro-actividades.md`, `docs/limites.md` |
| 5.10 Uso aceptable de la información | Parcial | Reglas de qué datos no se piden (sin datos clínicos) y qué nunca va a un aviso | `CLAUDE.md` |
| 5.12 Clasificación de la información | Parcial | Los campos sensibles se identifican y se cifran; el resto no tiene niveles formales | `app/src/lib/crypto/field.ts`, `docs/legal/registro-actividades.md` |
| 5.15 Control de acceso | Sí | RLS en todas las tablas, privilegios por columna, roles por círculo | `app/supabase/tests/database.test.sql`, `app/tests/db/rls-circles.test.ts` |
| 5.16 Gestión de identidades | Sí | Identidades en Supabase Auth; el administrador se asigna a mano | `app/supabase/migrations/20261114000100_base.sql`, `app/tests/db/admin-access.test.ts` |
| 5.17 Información de autenticación | Sí | Contraseñas solo en Supabase Auth, con largo y composición mínimos | `app/supabase/config.toml`, `app/src/server/auth/login.ts` |
| 5.18 Derechos de acceso | Sí | El borrado de cuenta y el cierre de círculo retiran el acceso; los familiares solo leen | `app/src/server/account/lifecycle.ts`, `app/tests/db/account-lifecycle.test.ts` |
| 5.19 a 5.22 Relaciones con proveedores | Sí | Inventario de proveedores con datos recibidos; revisión de sus planes y límites | `docs/legal/registro-actividades.md`, `docs/limites.md`. Pendiente: revisar los términos de cada proveedor `[VERIFICAR]`. |
| 5.23 Seguridad en servicios en la nube | Sí | Supabase, Vercel, Sentry, Resend y Cloudflare, con secretos solo en variables de entorno del servidor | `app/.env.example`, `app/src/lib/env.ts` |
| 5.24 a 5.28 Gestión de incidentes | Sí | Plan con detección, contención, notificación, recuperación y lecciones | `docs/seguridad/plan-incidentes.md`. Pendiente: un simulacro. |
| 5.29 Seguridad durante una interrupción | Parcial | Respaldo nocturno cifrado previsto; hoy sin comprobar | Pendiente: respaldo y restauración probada (Lista de lanzamiento, punto 28 de `docs/seguridad/checklist-6.2.md`) |
| 5.31 Requisitos legales | Sí | Registro de actividades y evaluación de impacto; ley chilena de datos personales | `docs/legal/registro-actividades.md`, `docs/legal/eipd.md`. Plazos de la Ley 21.719 `[VERIFICAR]`. |
| 5.33 Protección de registros | Sí | Auditoría del panel que solo el administrador con segundo factor escribe y lee | `app/supabase/migrations/20261114000100_base.sql`, `app/tests/db/admin-access.test.ts` |
| 5.34 Privacidad y datos personales | Sí | Consentimiento por capas, seudónimos, exportación y borrado | `app/src/server/consents/consents.ts`, `app/src/server/account/export.ts`, `app/src/server/events/track.ts` |
| 5.36 Cumplimiento de políticas y normas | Sí | Compuerta de CI con pruebas, lint, tipos, gitleaks, auditoría y Semgrep | `.github/workflows/ci.yml` |
| 6.1 a 6.2 Selección y condiciones de empleo | No aplica | No hay personal contratado | Sin evidencia: no hay empleados ni colaboradores con acceso a datos |
| 6.3 Concientización y formación | Parcial | El fundador conoce las reglas; no hay programa formal | `CLAUDE.md` |
| 6.6 Acuerdos de confidencialidad | Pendiente | Aplicará si se suma alguien con acceso a datos | Lista de lanzamiento: acuerdo antes de dar acceso a otra persona |
| 6.8 Reporte de eventos de seguridad | Sí | Contacto único para reportar: `hola@solecuida.com` | `docs/seguridad/plan-incidentes.md` |
| 7.1 a 7.14 Seguridad física | No aplica | No hay servidores ni oficina propios; lo cubre el proveedor de nube. Sus certificaciones no se verificaron `[VERIFICAR]`. | `docs/legal/registro-actividades.md` |
| 8.1 Dispositivos de usuario final | Parcial | La sesión vive en cookies `HttpOnly`; cierre de sesión global al pedir el borrado | `app/src/proxy.ts`, `app/src/server/account/lifecycle.ts` |
| 8.2 Derechos de acceso privilegiado | Sí | Administrador solo con `aal2`; el panel no lee datos de cuidado | `app/src/server/admin/guard.ts`, `app/tests/db/admin-access.test.ts` |
| 8.3 Restricción de acceso a la información | Sí | RLS y columnas con privilegios mínimos; la clave de servicio solo en el servidor | `app/tests/db/rls-private.test.ts`, `app/src/lib/supabase/admin.ts` |
| 8.5 Autenticación segura | Sí | Cookies seguras, rotación del token de refresco, segundo factor del panel, captcha | `app/supabase/config.toml`, `app/tests/e2e/auth.spec.ts` |
| 8.7 Protección contra malware | Parcial | Escaneo de dependencias y análisis estático; sin antivirus propio | `.github/workflows/ci.yml` |
| 8.8 Gestión de vulnerabilidades técnicas | Sí | `audit`, Dependabot y Semgrep en CI | `.github/workflows/ci.yml`, `.github/dependabot.yml` |
| 8.9 Gestión de la configuración | Sí | Esquema y configuración versionados; nunca se edita el panel a mano | `app/supabase/config.toml`, `app/supabase/migrations/20261114000100_base.sql` |
| 8.10 Eliminación de información | Parcial | Borrado a los 7 días de gracia con `purge_user`; el trabajo diario que lo ejecuta aún no existe | `app/src/server/account/lifecycle.ts`, `app/tests/db/account-lifecycle.test.ts`. Pendiente: `/api/cron/daily` (paso 49). |
| 8.11 Enmascaramiento de datos | Sí | Seudónimo en eventos; filtro de datos personales antes de Sentry | `app/src/server/events/track.ts`, `app/src/lib/observability/scrub.ts`, `app/tests/unit/scrub.test.ts` |
| 8.12 Prevención de fuga de datos | Sí | Sin datos en logs ni en avisos; secretos fuera del bundle; CSP con `connect-src 'self'` | `app/scripts/check-bundle-secrets.ts`, `app/src/lib/security/headers.ts` |
| 8.13 Respaldo de la información | Parcial | Previsto, aún no construido | Lista de lanzamiento: respaldo cifrado y restauración probada |
| 8.15 Registro de actividad | Parcial | Auditoría de accesos administrativos y eventos técnicos | `app/src/server/admin/guard.ts`, `app/tests/db/events.test.ts`. Pendiente: revisión de logs de proveedores. |
| 8.16 Actividades de monitoreo | Parcial | Sentry y panel de límites; sin alertas automáticas comprobadas | Lista de lanzamiento: alertas de Sentry y Advisors de Supabase |
| 8.20 a 8.22 Seguridad de redes | Sí | HTTPS, HSTS, CSP, sin CORS abierto; la red la gestiona el proveedor | `app/src/lib/security/headers.ts`, `app/tests/e2e/security-headers.spec.ts` |
| 8.24 Uso de criptografía | Sí | AES-256-GCM con versión de clave y rotación | `app/src/lib/crypto/field.ts`, `app/tests/unit/field-crypto.test.ts` |
| 8.25 a 8.29 Desarrollo seguro y pruebas | Sí | Pruebas de aislamiento, de cabeceras y de producción limpia; revisión de cada tarea | `app/tests/db/rls-circles.test.ts`, `app/tests/unit/production-hygiene.test.tsx`, `app/tests/unit/security-headers.test.ts` |
| 8.28 Codificación segura | Sí | Validación con zod, consultas parametrizadas, sin HTML de usuarias, Semgrep | `app/src/server/reminders/rule-schema.ts`, `.github/workflows/ci.yml` |
| 8.31 Separación de entornos | Parcial | Base local aparte de la de producción; mismo código | `app/supabase/config.toml`, `app/.env.example`. Pendiente: comprobar que producción no recibe datos de ejemplo. |
| 8.32 Gestión de cambios | Sí | Una tarea, un commit y una etiqueta; CI en cada cambio | `.github/workflows/ci.yml` |
| 8.33 Información de prueba | Sí | Datos de prueba solo locales (`seed.sql`) | `app/supabase/config.toml` |
| 8.34 Protección en auditorías | No aplica | No hay auditorías externas de sistemas | Sin evidencia: aún no existe una auditoría externa |

## Referencia de privacidad

La ISO/IEC 27701 se toma como referencia de gestión de privacidad (brief 6.1). No se hizo un cruce control por control: el registro de actividades (`docs/legal/registro-actividades.md`) y la evaluación de impacto (`docs/legal/eipd.md`) son el sustituto simplificado de esta etapa.
