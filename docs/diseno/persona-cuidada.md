# Diseño funcional · Vista de la persona cuidada (F12)

Fuente: `PROTOTIPO-Brief-Fable.md` §3 (F12). Mismo formato que `nucleo.md`.

## F12 · Vista mínima de la persona cuidada

Prioridad P2. La persona cuidada ve en su propio teléfono lo que le toca hoy, sin cuenta, sin correo y sin contraseña.

### Flujo

**La cuidadora vincula un teléfono**

1. En "Persona cuidada" toca "Crear enlace". Puede ponerle un nombre para reconocerlo ("Teléfono de la mamá").
2. Sole muestra el enlace una sola vez, para abrirlo o enviarlo al teléfono de la persona cuidada. Después solo se ve su nombre, cuándo se creó y cuándo se usó por última vez.
3. El enlace dura 90 días. La cuidadora puede **revocarlo en cualquier momento**; desde ese instante deja de funcionar.
4. En cada recordatorio, la cuidadora decide si es "visible para [nombre]". Por defecto, ninguno lo es.

**La persona cuidada usa la vista**

1. Abre el enlace. Ve un saludo con su nombre y **solo** los recordatorios de hoy marcados como visibles, en letra muy grande.
2. Cada ítem tiene un botón **"Listo"**. Al tocarlo, el ítem queda hecho y la cuidadora lo ve en su "Hoy" como hecho desde el enlace.
3. Uno o dos botones por pantalla. Sin menús, sin configuración, sin nada más que leer.
4. Si no hay nada visible hoy: "Hoy no tienes nada pendiente."

**Botón de emergencia**

1. Un botón grande, siempre visible: "Pedir ayuda".
2. Al tocarlo, una confirmación sencilla evita los toques accidentales: "¿Quieres pedir ayuda?", con "Sí, pedir ayuda" y "No".
3. Al confirmar pasan tres cosas:
   - **Se abre la llamada telefónica** (`tel:`) al contacto de emergencia de F9 o, si no hay ninguno, al **131 (SAMU)** `[VERIFICAR en fuente oficial]`. Es el camino confiable, porque usa la línea telefónica.
   - **Además**, Sole envía una notificación urgente a la cuidadora y, si F16 existe, a los familiares que tengan activo ese aviso.
   - Queda registrado en el historial del círculo.
4. La vista y la pantalla de configuración dicen, con estas palabras: "Sole no reemplaza a un servicio de emergencia y no puede garantizar que un aviso llegue."

Un enlace vencido, revocado o mal escrito muestra: "Este enlace ya no sirve. Pídele uno nuevo a quien te cuida." No da más detalles.

### Datos

- `cared_links`: el vínculo con su nombre, vencimiento (90 días), si fue revocado y cuándo se usó por última vez. El enlace no se guarda: solo su huella.
- `reminders.visible_to_cared`: qué recordatorios se muestran en la vista.
- `reminder_occurrences` y `occurrence_marks`: el "Listo" queda marcado como hecho desde el enlace.
- `contacts.is_emergency`: a quién se llama.
- `emergency_events`: cada pedido de ayuda, con el vínculo que lo originó, cuántas personas fueron avisadas y la hora.
- La vista no muestra medicamentos por su nombre ni su indicación, salvo el título que la cuidadora escribió.

### Permisos

- Crea y revoca vínculos solo la cuidadora.
- Quien tiene el enlace puede: ver los ítems visibles de hoy de ese círculo, tocar "Listo" en ellos y pedir ayuda. Nada más.
- No ve la bitácora, los informes, los contactos, las tareas ni otros círculos.
- El enlace es un código largo y aleatorio, imposible de adivinar.
- Límites contra el abuso: 30 "Listo" cada 10 minutos y 3 pedidos de ayuda cada 10 minutos por vínculo.

### Criterios de aceptación

- La cuidadora crea un enlace y la persona cuidada entra sin crear cuenta ni escribir un correo.
- La vista muestra solo los recordatorios de hoy marcados como visibles.
- Tocar "Listo" marca el ítem y la cuidadora lo ve en su "Hoy".
- El botón de emergencia pide una confirmación antes de actuar.
- Al confirmar se abre la llamada al contacto de emergencia o al 131, se avisa a la cuidadora y queda registrado.
- La vista y la configuración muestran el texto "Sole no reemplaza a un servicio de emergencia y no puede garantizar que un aviso llegue."
- Un enlace revocado deja de funcionar de inmediato.
- Los títulos se leen en letra de 28 px o más y los botones miden 64 px de alto.

### Preguntas abiertas

- El número 131 (SAMU) debe confirmarse en una fuente oficial del Ministerio de Salud antes del lanzamiento. Hasta entonces sigue marcado `[VERIFICAR]`.
- Si hay varios contactos de emergencia, se llama al primero; el brief no dice si la persona debería poder elegir.
