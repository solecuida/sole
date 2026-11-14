# Diseño funcional · Familiares en el círculo (F16)

Fuente: `PROTOTIPO-Brief-Fable.md` §3 (F16). Es una funcionalidad **secundaria**: se diseña completa aquí y se construye en la fase 8, si sobra tiempo. El modelo de datos la soporta desde el primer día, y mientras no exista se mide con la puerta falsa "Invitar a un familiar" (F11).

## F16 · Familiares en el círculo (versión liviana)

La cuidadora suma a otras personas de la familia para que vean cómo va el día y ayuden a distancia, sin entregarles la administración.

### Flujo

**La cuidadora invita**

1. En "Círculo" toca "Invitar a un familiar". Sole genera un enlace que dura 7 días y sirve una sola vez.
2. Lo comparte con el botón de compartir del celular (WhatsApp, correo). Sole no envía nada por su cuenta.
3. Ve la lista de invitaciones pendientes y puede revocar cualquiera.
4. Ve la lista de familiares del círculo y puede sacar a alguien.

**El familiar acepta**

1. Abre el enlace. Si no tiene cuenta, entra con su correo como cualquier persona.
2. Acepta los consentimientos por capas (los mismos de F1).
3. Escribe cómo quiere aparecer ("Pedro, hijo") y toca "Unirme".
4. Llega al "Hoy" del círculo.

Un enlace vencido, usado o revocado muestra: "Esta invitación ya no sirve. Pídele una nueva a quien te invitó."

**El familiar acompaña**

1. Ve el "Hoy" y el calendario del círculo.
2. Puede **marcar un ítem como hecho o verificado** a distancia. Queda para todo el círculo como **"verificado por [nombre]"**. Ejemplo: el hijo llama a su mamá, ella se toma el remedio y él lo marca.
3. Puede **tomar** una tarea de F5 ("yo me encargo"); la tarea muestra quién la tomó.
4. Ve los informes de F7, salvo el estado personal de la cuidadora.
5. Lee la bitácora, sin editarla.
6. Ve la **actividad del círculo**: lo que fue pasando, quién verificó qué y los hitos compartidos (los últimos 50 movimientos).

**Lo que el familiar no puede hacer**

No cambia la configuración, los recordatorios, los contactos ni los permisos, y no invita a otras personas. Solo la cuidadora administra el círculo.

### Datos

- `circle_members`: el familiar entra con rol `family`, su nombre visible y sus preferencias de aviso.
- `invitations`: la invitación con su vencimiento, si fue revocada y quién la aceptó. El enlace no se guarda: solo su huella.
- `occurrence_marks`: quién marcó cada ítem; de ahí sale "verificado por".
- `tasks`: quién tomó cada tarea.
- Nada de F16 guarda datos clínicos.

### Permisos

| Acción | Cuidadora | Familiar |
|---|---|---|
| Ver "Hoy", calendario, recordatorios, bitácora e informes | Sí | Sí |
| Ver el estado personal de la cuidadora | Solo el suyo | No |
| Marcar un ítem como hecho o verificado | Sí | Sí |
| Tomar una tarea | Sí | Sí |
| Crear o editar recordatorios, tareas, contactos o vínculos | Sí | No |
| Invitar, revocar invitaciones o sacar miembros | Sí | No |
| Cambiar sus propias preferencias de aviso | Sí | Sí |
| Cambiar roles o cerrar el círculo | Sí | No |

- Un familiar nunca ve otros círculos de la cuidadora.
- Si la cuidadora borra su cuenta, se borran los círculos que ella creó, incluido lo que veían sus familiares. La pantalla de borrado lo advierte.
- Las invitaciones tienen un límite de 10 por día.

### Criterios de aceptación

- La cuidadora genera un enlace de invitación y puede revocarlo antes de que se use.
- Un enlace vencido, usado o revocado no deja entrar y lo explica con claridad.
- El familiar ve "Hoy" y el calendario del círculo, y nada de otros círculos.
- Al marcar un ítem, el círculo ve "verificado por [nombre]".
- El familiar puede tomar una tarea y no puede crearla, editarla ni borrarla.
- El familiar no puede crear ni editar recordatorios, contactos ni permisos, tampoco llamando directo al servidor.
- El estado personal de la cuidadora no aparece en ninguna pantalla del familiar.
- Cuando F16 está construida, la puerta falsa "Invitar a un familiar" deja de mostrarse.

### Notificaciones

- La cuidadora define qué avisos recibe cada familiar; el familiar puede reducirlos, no ampliarlos más allá de lo que ella permitió.
- **Por defecto:** fechas importantes, controles y emergencias.
- Tipos posibles: los siete tipos de recordatorio de F3 y las emergencias de F12.
- La emergencia de la persona cuidada llega a todo familiar que tenga ese aviso activo, además de la cuidadora.
- El "¿Lo hiciste?" de los 15 minutos le llega solo a la cuidadora: los familiares no reciben insistencias.
- Un familiar sin avisos activos ve todo igual en "Hoy".

### Modelo de datos

- `circle_members.role = 'family'`: el rol del familiar. La usuaria no puede cambiar su propio rol.
- `circle_members.notify_kinds`: lista de tipos de aviso del miembro; por defecto `important_date`, `appointment` y `emergency`.
- `invitations`: `circle_id`, `token_hash` (huella SHA-256 del enlace), `created_by`, `expires_at` (7 días), `revoked_at`, `accepted_by` y `accepted_at`.
- `occurrence_marks.marked_by`: quién hizo cada marca; si esa persona se va del círculo, la marca se conserva sin nombre.
- `tasks.claimed_by`: quién tomó la tarea.
- Función `accept_invitation(token_hash, display_name)`: valida la invitación, exige los consentimientos y agrega al familiar.
- Función `claim_task(task)`: asigna la tarea a quien la toma, si es miembro del círculo.
- Función `set_member_notify_kinds(circle, user, kinds)`: cambia los avisos de un miembro; la cuidadora para cualquiera, el familiar solo para sí mismo.
- Función `mark_occurrence`: la misma de "Hoy"; acepta a cuidadoras y familiares, y rechaza a cualquier otra persona.

### Preguntas abiertas

Van también en `PENDIENTES.md` cuando se construya la fase 8; el brief no las resuelve:

- ¿Cuántos familiares caben en un círculo durante el piloto? El plan familiar de la puerta falsa habla de 3 o 4 personas.
- ¿El familiar puede salirse solo del círculo, o solo lo saca la cuidadora?
