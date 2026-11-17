# Catálogo de eventos de investigación

Sole mide su uso con eventos propios, guardados en su propia base de datos. No se envía nada de las usuarias a servicios de analítica de terceros.

**Reglas** (brief §4):

- **Ningún evento existe sin una hipótesis.** Cada fila dice qué hipótesis del piloto (H1 a H6, brief §1.1) alimenta.
- **Seudónimo, no identidad.** Cada evento lleva un identificador que no es el de la cuenta, más el código de la organización de origen. Nunca nombre, correo ni texto libre.
- **Propiedades cerradas.** Solo listas de valores fijos, números enteros y sí/no.
- **Consentimiento separado.** Sin el consentimiento de investigación, solo se guardan los eventos marcados como técnicos: los mínimos para que la app funcione y se puedan corregir errores.
- **Se borran con la cuenta.** Al eliminar una cuenta se eliminan sus eventos.

Este documento y `app/src/server/events/catalog.ts` dicen lo mismo y cambian juntos; la prueba `app/tests/unit/events-catalog.test.ts` falla si se separan.

## Eventos

| Evento | Cuándo se dispara | Propiedades | Hipótesis | Técnico |
|---|---|---|---|---|
| `app.opened` | al cargar una página de la app, una vez por sesión de navegador | `screen` | H1 | no |
| `screen.viewed` | al ver una pantalla de la app | `screen` | H1, H2 | no |
| `flow.started` | al empezar un flujo medido | `flow` | H2 | no |
| `flow.completed` | al terminar un flujo medido | `flow`, `duration_ms` | H2 | no |
| `flow.abandoned` | al salir de un flujo medido sin terminarlo | `flow`, `step` | H2 | no |
| `app.error` | al mostrarle un error a la usuaria | `code`, `screen` | H2 | sí |
| `onboarding.completed` | al crear el círculo en la bienvenida | `care_type`, `template_items` | H1, H6 | no |
| `reminder.created` | al crear un recordatorio | `kind`, `importance`, `source` | H1 | no |
| `occurrence.marked` | al marcar un ítem como hecho, no hecho o pospuesto | `status`, `via`, `kind` | H1 | no |
| `journal.saved` | al guardar la bitácora del día | `duration_ms`, `has_note` | H1, H2 | no |
| `selfcare.checked_in` | al responder la pregunta diaria de bienestar (sin el puntaje) | ninguna | H1 | no |
| `report.viewed` | al abrir un informe | `period` | H3 | no |
| `report.shared` | al compartir un informe | `format` | H3 | no |
| `survey.answered` | al responder o descartar una microencuesta | `survey`, `dismissed` | H3 | no |
| `fake_door.viewed` | al abrir una puerta falsa | `door` | H4 | no |
| `fake_door.interest` | al tocar «Sí, avísame» o elegir un precio en una puerta falsa | `door`, `choice` | H4 | no |
| `premium.used` | al usar una función Premium en piloto | `feature` | H4 | no |
| `push.permission` | al responder el permiso de avisos | `result` | H1 | no |
| `invitation.created` | al crear una invitación a un familiar | ninguna | H5 | no |
| `cared_link.created` | al crear un vínculo de la persona cuidada | ninguna | H5 | no |
| `account.deletion_requested` | al pedir el borrado de la cuenta | ninguna | H1 | sí |

## Valores de las propiedades

| Propiedad | Valores |
|---|---|
| `screen` | `hoy`, `calendario`, `recordatorios`, `tareas`, `bitacora`, `para-ti`, `informes`, `contactos`, `persona-cuidada`, `circulo`, `avisos`, `cuenta`, `pronto` |
| `flow` | `onboarding`, `reminder_create`, `journal` |
| `duration_ms`, `step`, `template_items` | número entero, 0 o más |
| `code` | `unauthorized`, `forbidden`, `not_found`, `validation_failed`, `rate_limited`, `captcha_failed`, `conflict`, `invitation_invalid`, `unavailable`, `internal` |
| `care_type` | los 9 tipos de cuidado de la bienvenida |
| `kind` | `medication`, `food`, `activity`, `appointment`, `errand`, `important_date`, `custom` |
| `importance` | `important`, `normal`, `whenever` |
| `source` | `manual`, `template`, `tip` |
| `status` | `done`, `not_done`, `snoozed` |
| `via` | `app`, `push`, `offline_sync`, `cared_link` |
| `has_note`, `dismissed` | sí o no |
| `period` | `dia`, `semana`, `mes` |
| `format` | `png`, `pdf` |
| `survey` | `d3`, `d14`, `d28`, `d56` |
| `door` | `ia`, `recetas`, `plan_familiar`, `comunidad`, `fotos`, `invitar_familiar` |
| `choice` | `2990`, `4990`, `7990` (precio de prueba elegido, en pesos al mes) o `none` |
| `feature` | `informe_medico` |
| `result` | `granted`, `denied`, `default` |

## Qué hipótesis alimenta cada grupo

- **H1 · uso diario:** `app.opened`, `screen.viewed`, `reminder.created`, `occurrence.marked`, `journal.saved`, `selfcare.checked_in`, `push.permission`, `onboarding.completed`.
- **H2 · tareas rápidas:** `flow.started`, `flow.completed`, `flow.abandoned`, `journal.saved`, `app.error`.
- **H3 · valor percibido:** `survey.answered`, `report.viewed`, `report.shared`.
- **H4 · disposición a pagar:** `fake_door.viewed`, `fake_door.interest`, `premium.used`.
- **H5 · sumar a otras personas:** `invitation.created`, `cared_link.created`.
- **H6 · canales:** `onboarding.completed`, junto al código de organización que acompaña a cada evento.
