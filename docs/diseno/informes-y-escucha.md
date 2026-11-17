# Diseño funcional · Informes y escucha (F7, F10, F11 y F14)

Fuente: `PROTOTIPO-Brief-Fable.md` §3 y §4. Mismo formato que `nucleo.md`.

## F7 · Informes y avances

Prioridad P1. Sole no es solo alarmas: muestra cómo va el cuidado.

### Flujo

1. **Tres resúmenes:** diario (al final del día, opcional), semanal (cada domingo) y mensual.
2. **Contenido:**
   - Cumplimiento de medicamentos y de cada tipo de recordatorio.
   - Actividades hechas.
   - Días con bitácora y su resumen de ánimo.
   - Tareas cerradas.
   - El estado de la propia cuidadora, solo para ella.
3. **Gráficos simples y legibles**, cada uno con su frase al lado: "Esta semana se cumplió el 90 % de los medicamentos", "Hubo 3 días difíciles". Nunca interpretaciones médicas.
4. **Hitos:** Sole reconoce los logros ("30 días seguidos sin olvidar un medicamento", "Un mes cuidando con Sole"). Sin confeti ni animaciones.
5. **Compartir:** un informe o un hito se comparte como imagen o como PDF con el botón de compartir del celular (WhatsApp, correo). Se genera en el navegador, sin servidor. Antes de compartir, un aviso: "Lo que compartes sale de Sole y queda bajo tu cuidado."
6. La versión compartida nunca incluye el estado personal de la cuidadora.

Estado vacío: "Cuando tengas una semana de uso, aquí verás tu resumen."

### Datos

- Solo lectura de `reminder_occurrences`, `reminders`, `journal_entries`, `tasks` y `selfcare_checkins` (este último, solo el propio).
- Los informes no se guardan: se calculan al abrirlos.

### Permisos

- Ven los informes los miembros del círculo.
- El estado de la cuidadora aparece solo cuando ella misma mira su informe.
- Compartir es una acción de quien comparte; Sole no envía nada por su cuenta.

### Criterios de aceptación

- Existen los resúmenes diario, semanal y mensual.
- Cada gráfico tiene una frase que dice lo mismo en texto.
- Ninguna frase interpreta ni aconseja en términos médicos.
- Los hitos se muestran cuando se cumplen sus condiciones.
- Un informe se comparte como imagen o PDF generado en el teléfono.
- Antes de compartir aparece el aviso de que el contenido sale de Sole.
- El estado personal de la cuidadora no aparece en lo compartido ni para otros miembros.

## F10 · Escuchar a la usuaria

Prioridad P1. La evidencia también es lo que la gente cuenta.

### Flujo

1. **Botón permanente "Contarle algo a Sole"**, visible en todas las pantallas de la app sin tapar lo que está enfocado.
2. Abre un diálogo con dos opciones, "Un comentario" o "Un problema", y un campo de texto. Al enviar: "Gracias. Lo leo yo mismo." (lo lee el fundador).
3. **Microencuestas** de 1 o 2 preguntas en "Hoy", según los días desde el registro:
   - Día 3: facilidad ("¿Qué tan fácil te resultó empezar?").
   - Día 14: valor ("¿Sole te está sirviendo?").
   - Día 28: "¿Cómo te sentirías si Sole dejara de existir?" (muy decepcionada / algo decepcionada / no me importaría).
   - Día 56: cierre de la cohorte y si recomendaría Sole a una organización.
4. Cada encuesta se puede **responder o cerrar**; no vuelve a aparecer.

### Datos

- `feedback`: tipo, mensaje (hasta 2.000 caracteres), pantalla desde donde se envió y si el fundador ya lo leyó.
- `survey_responses`: clave de la encuesta, respuestas y si se cerró sin responder; una por persona y por encuesta.

### Permisos

- Cualquier persona con sesión envía comentarios y responde sus encuestas.
- Nadie lee los comentarios de otra persona. Los lee solo el fundador, con su segundo factor de ingreso.
- Hay un límite de 10 comentarios por hora para evitar abuso.

### Criterios de aceptación

- El botón "Contarle algo a Sole" está en todas las pantallas de la app.
- El botón no tapa el elemento enfocado.
- Las encuestas aparecen en los días 3, 14, 28 y 56 desde el registro.
- Una encuesta respondida o cerrada no vuelve a mostrarse.
- Una usuaria no puede leer comentarios, ni siquiera los suyos, después de enviarlos.

## F11 · Puertas falsas (sin funcionalidad real)

Prioridad P1. Miden interés en funciones que todavía no existen, con honestidad.

### Flujo

1. Una sección "Pronto" lista las ideas. Cada una abre una pantalla que dice claramente: *"Esto todavía no existe. ¿Quieres que te avisemos cuando esté?"*
2. Dos botones: **"Sí, avísame"** y **"No por ahora"**. Ambos registran la respuesta.
3. Las puertas:
   - **Sole con IA:** le hablas a Sole como en una conversación y ella toma nota, resume y ordena lo que dijiste en la bitácora y los recordatorios.
   - **Recetas y recomendaciones** según la rutina de cuidado.
   - **Plan familiar:** 3 o 4 personas con un inicio común. Muestra tres precios de prueba ($2.990, $4.990 y $7.990 al mes) y registra cuál se elige. Dice claramente que no se cobra nada.
   - **Comunidad:** "¿Te gustaría conocer a otras personas que cuidan en una situación como la tuya?"
   - **Fotos e historial visual:** guardar fotos como comprobante o como historial de la persona.
   - **Invitar a un familiar:** solo mientras F16 no esté construida.
4. Después de responder: "Gracias. Tu respuesta nos ayuda a decidir qué construir."

### Datos

- `fake_door_interest`: qué puerta, qué opción eligió (por ejemplo, el precio) y si pidió que le avisen.

### Permisos

- Cada persona registra y ve solo su propio interés.
- El fundador ve los totales en el panel (F15), no quién respondió qué.

### Criterios de aceptación

- Cada puerta dice que la función todavía no existe antes de pedir cualquier cosa.
- Ninguna puerta simula que la función está operando ni pide datos de pago.
- El plan familiar muestra tres precios y registra el elegido.
- La puerta "Invitar a un familiar" desaparece cuando F16 está construida.
- Cada respuesta queda registrada una vez por persona y por puerta.

## F14 · Premium, gratis durante el piloto

Prioridad P2. Funciones que serán pagadas, construidas de verdad y marcadas para medir su uso real.

### Flujo

1. **Informe para el médico:** una página mensual pensada para llevar a un control.
2. Contenido: cumplimiento de medicamentos, actividades, resumen de la bitácora y un espacio en blanco para las preguntas de la familia.
3. Lleva la etiqueta **"Premium · gratis durante el piloto"**.
4. Se abre desde "Informes", se elige el mes y se imprime o se guarda como PDF desde el navegador.
5. El informe reúne lo que la cuidadora registró; no interpreta ni recomienda.

A criterio, si sobra tiempo: otra función candidata (por ejemplo, informes con más historial), documentada en `docs/negocio/planes.md`.

### Datos

- Solo lectura de `reminder_occurrences`, `reminders` y `journal_entries` del mes elegido.
- El uso se registra como evento de investigación (`premium.used`), sin contenido del informe.

### Permisos

- Lo genera la cuidadora del círculo.
- El PDF se crea en su teléfono; Sole no lo guarda ni lo envía.

### Criterios de aceptación

- El informe cabe en una página imprimible.
- Muestra la etiqueta "Premium · gratis durante el piloto".
- Incluye un espacio para las preguntas de la familia.
- No contiene interpretaciones ni recomendaciones médicas.
- Cada uso queda registrado para la hipótesis H4.
