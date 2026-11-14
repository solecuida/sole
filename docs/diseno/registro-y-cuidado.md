# Diseño funcional · Registro y cuidado (F5, F6, F8 y F9)

Fuente: `PROTOTIPO-Brief-Fable.md` §3. Mismo formato que `nucleo.md`.

## F5 · Tareas sin fecha

Prioridad P2. Las cosas por hacer que no tienen día fijo: comprar pañales, retirar una receta, llamar al banco.

### Flujo

1. **Agregar** una tarea con una línea de texto.
2. **Pasar a hoy** con un toque: la tarea aparece en "Hoy" junto a los recordatorios del día.
3. **Marcar como hecha** desde la lista o desde "Hoy".
4. **"Pedir ayuda con esto":** cada tarea tiene este botón. Mientras F16 no exista, lleva a la puerta falsa "Invitar a un familiar" (F11). Cuando F16 exista, lleva a invitar a un familiar o muestra quién la tomó ("yo me encargo").
5. **Borrar** una tarea que ya no corresponde.

Estado vacío: "No tienes tareas pendientes. Anota aquí lo que no tiene día fijo."

### Datos

- `tasks`: título (hasta 120 caracteres), para qué día se pasó, quién la tomó, cuándo se hizo y quién la hizo.

### Permisos

- Crea, edita, pasa a hoy y borra la cuidadora.
- Leen los miembros del círculo.
- Un familiar (F16) puede tomar una tarea con la función `claim_task`; no puede crearla ni borrarla.

### Criterios de aceptación

- Una tarea se crea solo con un título.
- Con un toque pasa al día de hoy y se ve en "Hoy".
- Cada tarea muestra "Pedir ayuda con esto".
- Sin F16 construida, ese botón abre la puerta falsa y registra el interés.
- Una tarea hecha deja de aparecer como pendiente y cuenta en los informes.

## F6 · Bitácora diaria

Prioridad P1. Un registro rápido de cómo fue el día, en menos de 15 segundos.

### Flujo

1. Una sola pantalla, con todo opcional salvo la primera pregunta:
   - **Cómo fue el día:** bueno / regular / difícil.
   - **Cómo estuvo la persona** (varias respuestas): tranquila, feliz, triste, irritable, ansiosa, desorientada, con dolor, cansada, otro.
   - **Sueño:** bien / regular / poco.
   - **Comida:** bien / regular / poco.
   - **Nota libre.** La pantalla invita a dictar con el micrófono del teclado del celular, que no tiene costo.
2. **Guardar** con un botón. Si ya escribió hoy, la pantalla abre lo guardado para corregirlo: hay un registro por día.
3. **Días anteriores:** una lista de los últimos 14 días para leer o completar.
4. **Sugerencia diaria:** Sole recuerda registrar una vez al día, a la hora que la cuidadora elija. Se puede apagar.

Es observación cotidiana: sin vocabulario clínico, sin escalas médicas y sin interpretaciones. "Desorientada" es lo que la cuidadora observa, no una conclusión médica. Sole no saca conclusiones de lo anotado.

Estado vacío: "Aún no escribes en la bitácora. Hoy puede ser el primer día."

### Datos

- `journal_entries`: fecha, cómo fue el día, ánimos observados, sueño, comida y la nota. La nota se guarda cifrada. Un registro por círculo y por día.
- `profiles.journal_reminder_time`: la hora de la sugerencia diaria.

### Permisos

- Escribe y corrige la cuidadora.
- Leen los familiares del círculo (F16), sin poder editar.
- La persona cuidada vinculada no ve la bitácora.
- El panel del fundador no puede leer ninguna nota.

### Criterios de aceptación

- Registrar el día toma menos de 15 segundos tocando solo las opciones.
- Hay un registro por día; volver a guardar el mismo día lo actualiza.
- La nota libre se guarda cifrada y se muestra como texto plano.
- La pantalla no usa vocabulario clínico ni interpreta lo anotado.
- La sugerencia diaria llega a la hora elegida y se puede desactivar.

## F8 · Cuidar a quien cuida

Prioridad P1. Sole también pregunta por la cuidadora.

### Flujo

1. **Pregunta breve:** "¿Cómo estás tú hoy?", de 1 a 5, como máximo una vez al día. Se puede saltar.
2. **Privada:** la respuesta no la ve nadie más, ni los familiares ni el fundador.
3. **Varios días bajos seguidos:** Sole lo nota con suavidad ("Has tenido días pesados. ¿Te muestro algunos apoyos?") y ofrece el directorio. No saca conclusiones ni alarma.
4. **Botón "Necesito un respiro":** abre pausas cortas (respirar un minuto, tomar agua, salir a la puerta), los recursos y los contactos de apoyo.
5. **Directorio de recursos en Chile:** programas públicos de cuidado, líneas de ayuda y organizaciones. Cada recurso muestra su fuente oficial y la fecha en que se verificó. Solo se muestran los verificados.

Estado vacío del directorio: "Estamos verificando los recursos. Vuelve pronto."

### Datos

- `selfcare_checkins`: fecha y puntaje de 1 a 5; uno por persona y por día.
- `resources`: nombre, descripción, teléfono, enlace, fuente oficial, fecha de verificación y región (lo edita el fundador desde F15).

### Permisos

- Cada persona lee y escribe solo sus propias respuestas.
- Ningún otro miembro del círculo las ve, tampoco en los informes compartidos.
- El directorio lo lee cualquier persona con sesión; lo edita solo el fundador.

### Criterios de aceptación

- La pregunta aparece como máximo una vez al día y se puede saltar.
- La respuesta de una cuidadora no es visible para ningún otro usuario.
- Tras varios días bajos seguidos aparece el mensaje suave con recursos, sin lenguaje de alarma.
- "Necesito un respiro" está disponible siempre desde "Para ti".
- Cada recurso mostrado tiene fuente oficial y fecha de verificación.
- Ningún texto promete que Sole mejora la salud ni reduce el estrés.

## F9 · Contactos importantes

Prioridad P2. Los teléfonos que importan, a un toque.

### Flujo

1. **Agregar** un contacto de la persona cuidada: nombre, tipo (familia, médico tratante, centro de salud, farmacia, transporte, otro), teléfono y una nota opcional.
2. **Llamar con un toque:** el teléfono abre la llamada del celular.
3. **Contacto de emergencia:** uno o más se marcan así. El primero es el que usa el botón de emergencia de F12.
4. **Editar o borrar** cuando cambian.

Sin datos clínicos: no se guardan alergias, enfermedades ni previsión de salud. La pantalla lo dice junto al campo de la nota.

Estado vacío: "Todavía no hay contactos. Agrega el primero, por ejemplo un familiar."

### Datos

- `contacts`: nombre, tipo, teléfono, nota (cifrada) y si es de emergencia.

### Permisos

- Crea, edita y borra la cuidadora.
- Leen los miembros del círculo.
- La vista de la persona cuidada no muestra la lista: solo usa el teléfono de emergencia al pedir ayuda.

### Criterios de aceptación

- Un contacto se llama con un toque.
- Se puede marcar más de un contacto de emergencia.
- El teléfono solo acepta números, espacios, paréntesis, guiones y el signo +.
- La pantalla avisa que no se guardan datos clínicos.
- La nota del contacto se guarda cifrada.
