# Diseño funcional · Núcleo (F1 a F4)

Fuente: `PROTOTIPO-Brief-Fable.md` §3. Este documento dice cómo se comporta cada funcionalidad para la persona que usa Sole; el cómo técnico está en `blueprints/sole-prototipo/blueprint.md`. Si lo construido cambia, este documento cambia con él.

Palabras que se repiten: **círculo** = una persona cuidada y quienes la acompañan; **cuidadora** = quien administra el círculo; **ocurrencia** = un recordatorio en un día y hora concretos.

## F1 · Bienvenida y configuración en menos de 5 minutos

Prioridad P1. La persona llega, entra con su correo y deja lista a la persona que cuida, sin instrucciones.

### Flujo

1. **Llegada.** Entra a `app.solecuida.com`, a veces con `?org=CODIGO` si una organización le pasó el enlace. La portada explica en dos frases qué es Sole y muestra un botón: "Entrar".
2. **Ingreso.** En `/entrar` escribe su correo y recibe un enlace para entrar, sin contraseña. La respuesta es la misma exista o no la cuenta: "Si el correo es válido, te llegó un enlace. Revisa tu bandeja." La contraseña es opcional y se crea después, en "Mi cuenta".
3. **Consentimientos por capas**, antes de guardar cualquier dato de cuidado. Ninguna casilla viene marcada:
   - Términos y uso básico (obligatorio), con la declaración de ser mayor de 18 años.
   - Datos sensibles de rutina, ánimo y medicamentos (obligatorio), con la declaración de que cuenta con la autorización de la persona cuidada o actúa en su interés.
   - Investigación (opcional): quien la rechaza usa Sole igual.
4. **Persona cuidada.** Escribe el nombre o apodo, la relación ("mi mamá", "mi hijo"), cómo quiere que Sole la salude a ella y elige el tipo de cuidado.
5. **Plantilla.** Según el tipo de cuidado, Sole propone recordatorios, rutinas y fechas típicas. Todo se puede quitar o cambiar antes de guardar y después. Tipos: adulto mayor, Alzheimer y otras demencias, diálisis, discapacidad física, discapacidad intelectual, enfermedad crónica general, recuperación de una cirugía, niñez con necesidades especiales y "empezar desde cero".
6. **Llegada a "Hoy"** con una guía breve para instalar Sole en la pantalla de inicio, separada para Android con Chrome y para iPhone con Safari.
7. **Avisos.** El permiso de notificaciones no se pide al abrir la app: se pide en "Avisos", cuando la persona toca "Activar avisos", después de leer para qué sirven. En iPhone se explica que solo funcionan con Sole instalada en la pantalla de inicio.

Las plantillas son organización práctica, no consejo médico. Ejemplo para diálisis: "sesión de diálisis lun-mié-vie", "preparar bolso para la sesión", "control mensual". No traen indicaciones de dieta, líquidos ni cantidades de medicamentos.

### Datos

- `profiles`: nombre para saludar, zona horaria, código de la organización de origen (si el código existe) y un identificador seudónimo para la investigación.
- `consents`: una fila por capa y versión; revocar agrega una fila nueva, nunca edita.
- `circles` y `circle_members`: el círculo y la cuidadora como su administradora.
- `care_templates`: el contenido de cada plantilla (lo edita el fundador desde F15).
- `reminders`: los recordatorios que la persona aceptó de la plantilla, marcados con origen "plantilla".
- El correo vive solo en el sistema de ingreso; no se copia a otras tablas.

### Permisos

- Cada persona ve y cambia solo su perfil y sus consentimientos.
- El círculo se crea con la función `create_circle`, que exige los dos consentimientos obligatorios vigentes.
- Nadie sin sesión lee ninguna tabla.
- El código de organización se valida en el servidor: un código inventado se ignora, sin error.

### Criterios de aceptación

- Una persona nueva llega a "Hoy" con su persona cuidada creada en menos de 5 minutos.
- Sin los consentimientos obligatorios no se guarda ningún dato de cuidado y no se puede crear el círculo.
- Ninguna casilla de consentimiento viene marcada.
- Rechazar la investigación no impide usar Sole.
- Cada tipo de cuidado ofrece su plantilla y existe "empezar desde cero".
- Ninguna plantilla contiene consejo médico, de dieta ni cantidades de medicamentos.
- El permiso de notificaciones nunca se pide en la primera pantalla.
- La guía de instalación tiene pasos distintos para Android y para iPhone.
- Quien llega con `?org=CODIGO` válido queda asociada a esa organización.

## F2 · "Hoy": el centro del día a día

Prioridad P1. Al entrar, la persona ve su día y lo resuelve con un toque por ítem.

### Flujo

1. **Saludo** con su nombre y la fecha, y el nombre de la persona cuidada.
2. **Lo pendiente de hoy**, ordenado por hora y agrupado en tres bloques: **Importante**, **Normal** y **Cuando puedas**.
3. Cada ítem tiene tres acciones: **Hecho**, **No se hizo** y **Posponer**. "No se hizo" ofrece un motivo opcional ("lo rechazó", "no había", "otro"). "Posponer" lo mueve unos minutos y vuelve a avisar.
4. **Lo atrasado** aparece arriba, marcado con texto ("Atrasado"), no solo con color. **Lo hecho** queda abajo, plegado.
5. **Lo próximo:** fechas importantes, controles y trámites de los siguientes días.
6. **Consejo o actividad del día:** un mensaje breve y cálido. Si es una actividad ("¿Una caminata de 10 minutos hoy?"), se puede **aceptar** y queda en el día como un ítem más. Sin consejos médicos.
7. **Avance amable** del día y de la semana: "Vas 3 de 5 hoy". Nunca "Fallaste" ni frases que culpen.
8. **Varios círculos:** si cuida a más de una persona, cambia entre ellas arriba.
9. **Sin avisos activos:** un aviso fijo y discreto lo dice y lleva a activarlos; lo pendiente se sigue viendo aquí.
10. **Sin conexión:** "Hoy" se puede consultar y marcar; las marcas se envían solas cuando vuelve la señal (ver `transversal.md`).

Estado vacío: "Hoy no hay nada pendiente. Si quieres, agrega un recordatorio."

### Datos

- `reminder_occurrences`: los ítems del día con su estado (pendiente, hecho, no se hizo, pospuesto).
- `occurrence_marks`: una fila por marca, con quién la hizo y por dónde (app, aviso, sin conexión, enlace de la persona cuidada).
- `tips`: el banco de consejos y actividades (lo edita el fundador desde F15).
- `reminders`: una actividad aceptada crea un recordatorio con origen "consejo".

### Permisos

- Ven "Hoy" los miembros del círculo.
- Marcan ítems la cuidadora y, cuando exista F16, los familiares. Siempre por la función `mark_occurrence`.
- La persona cuidada vinculada (F12) solo marca "Listo" en lo que la cuidadora dejó visible para ella.
- Nadie ve ni marca ítems de un círculo ajeno.

### Criterios de aceptación

- Los ítems de hoy aparecen por hora dentro de Importante, Normal y Cuando puedas.
- Marcar Hecho, No se hizo o Posponer toma un toque (más el motivo opcional).
- Repetir una marca por mala señal no la duplica.
- Lo atrasado se distingue con texto, no solo con color.
- Una actividad aceptada aparece en "Hoy" como un ítem más.
- El avance nunca usa lenguaje de culpa o presión.
- Con dos círculos, se cambia de uno a otro sin salir de "Hoy".
- "Hoy" se puede consultar y marcar sin conexión.

## F3 · Recordatorios para todo

Prioridad P1. Una sola herramienta para centralizar el cuidado.

### Flujo

1. **Crear** desde "Recordatorios", desde un día del calendario o desde "Hoy". Meta: menos de 60 segundos.
2. **Tipo:** medicamento, comida o hidratación, actividad (caminata, ejercicio, terapia), control o cita, trámite, fecha importante (cumpleaños, aniversarios) o personalizado.
3. **Importancia:** importante, normal o cuando puedas. Define su lugar en "Hoy" y cuánto insisten los avisos.
4. **Medicamento:** nombre en texto libre, indicación en texto libre ("1 pastilla con comida"), horarios y días. Sole no tiene catálogo de fármacos ni calcula cantidades: guarda lo que la persona escribe.
5. **Repetición:** una vez, diaria, por días de la semana, cada N días, mensual o anual (para cumpleaños). Fecha de término opcional.
6. **Visible para la persona cuidada:** una casilla, apagada por defecto (la usa F12).
7. **Aviso a la hora.** Llega una notificación con el título del recordatorio. El nombre y la indicación del medicamento no van en la notificación.
8. **Confirmación activa.** Si no hay respuesta, a los **15 minutos** (configurable entre 5 y 120) llega *"¿Lo hiciste? ¿Se lo tomó?"* con los botones **"Sí, listo"** y **"No"**. Si responde "No", puede indicar un motivo opcional o posponer.
9. **Fechas con anticipación.** Controles, trámites y fechas importantes avisan con los días que la persona elija: por defecto 3 días antes, el día anterior y el mismo día.
10. **Editar o desactivar.** Un recordatorio no se borra: se desactiva, y su historial se conserva para los informes.

Todo ocurre en horario de Chile (`America/Santiago` por defecto), con el cambio de hora bien manejado: un recordatorio de las 9:00 sigue siendo a las 9:00 después del cambio.

Estado vacío: "Todavía no hay recordatorios. Crea el primero."

### Datos

- `reminders`: tipo, importancia, título, regla de repetición, días de anticipación, visibilidad para la persona cuidada, activo o no, origen (manual, plantilla, consejo). El nombre y la indicación del medicamento se guardan cifrados.
- `reminder_occurrences`: las ocurrencias de las próximas 48 horas, con cuándo avisar y cuándo ocurre.
- `push_subscriptions`: los teléfonos y navegadores donde la persona activó avisos.
- `profiles.followup_minutes`: los minutos de espera del "¿Lo hiciste?".

### Permisos

- Crea, edita y desactiva la cuidadora.
- Leen los miembros del círculo.
- Nadie puede mover un recordatorio a otro círculo ni cambiar quién lo creó.
- Cada persona administra solo sus propias suscripciones de aviso.

### Criterios de aceptación

- Existen los 7 tipos y los 3 niveles de importancia.
- Un medicamento se guarda con texto libre; no hay catálogo ni cálculo de cantidades.
- Funcionan las repeticiones diaria, por días de la semana, cada N días, mensual y anual, con término opcional.
- El aviso llega a la hora programada en horario de Chile, también en la semana del cambio de hora.
- Sin respuesta, llega el "¿Lo hiciste?" a los 15 minutos, o a los que la persona configuró.
- Una fecha importante avisa 3 días antes, el día anterior y el mismo día, salvo que se cambie.
- El nombre del medicamento nunca aparece en una notificación.
- Crear un recordatorio toma menos de 60 segundos.

## F4 · Calendario

Prioridad P1. Ver todo lo programado y agregar desde ahí.

### Flujo

1. **Vista de mes:** una grilla con los días; cada día muestra cuántos ítems tiene y si hay alguno importante, con texto o ícono, no solo con color.
2. **Vista de semana:** los siete días con sus ítems por hora.
3. **Tocar un día** muestra su lista y el botón "Agregar", que abre el formulario de F3 con la fecha ya puesta (no se vuelve a pedir).
4. **Moverse** con los botones "Anterior" y "Siguiente" y volver con "Hoy". No hay arrastre.

Un día sin ítems muestra la celda vacía con "Agregar".

### Datos

- `reminders`: el calendario se calcula desde las reglas de repetición, así muestra meses futuros sin guardar cada día.
- `reminder_occurrences`: el estado de lo ya ocurrido (hecho, no se hizo).

### Permisos

- Ven el calendario los miembros del círculo.
- Crea desde el calendario solo la cuidadora, con las reglas de F3.

### Criterios de aceptación

- Hay vista de mes y vista de semana con todo lo programado.
- Desde un día se crea cualquier recordatorio de F3 con la fecha precargada.
- Un cumpleaños anual aparece en su fecha del año siguiente.
- La grilla se usa completa con teclado y se lee bien a 320 px de ancho.
- La importancia no se comunica solo con color.
