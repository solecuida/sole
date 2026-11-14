# Diseño funcional · Mi cuenta y mis datos (F13)

Fuente: `PROTOTIPO-Brief-Fable.md` §3 (F13) y §6.3. Mismo formato que `nucleo.md`.

## F13 · Mi cuenta y mis datos

Prioridad P1. La persona manda sobre sus datos: los ve, se los lleva y los borra con la misma facilidad con que creó la cuenta.

### Flujo

**Consentimientos**

1. "Mi cuenta" muestra las tres capas con su estado y la fecha en que se aceptaron: términos y uso básico, datos sensibles, e investigación.
2. La investigación se activa o desactiva cuando se quiera. Al desactivarla, Sole deja de registrar eventos de uso de esa persona, salvo los técnicos mínimos.
3. Revocar una capa obligatoria se explica antes: "Sin este permiso no podemos guardar tus recordatorios ni tu bitácora." Si la revoca, la app vuelve a la pantalla de consentimientos y no guarda nada nuevo hasta que los acepte otra vez.

**Descargar mis datos**

1. Un botón "Descargar todo" entrega un archivo JSON con todo lo suyo.
2. También hay archivos CSV por tema, que se abren en Excel: recordatorios, cumplimiento, bitácora, tareas, contactos y bienestar.
3. Los campos que se guardan cifrados (notas, nombre e indicación de medicamentos) salen legibles para su dueña.

**Contraseña opcional y salir**

1. Puede crear una contraseña si prefiere no depender del enlace por correo: mínimo 10 caracteres, con mayúsculas, minúsculas y números.
2. "Salir" cierra la sesión en ese teléfono.

**Borrar mi cuenta**

1. Un botón "Borrar mi cuenta", sin esconderlo.
2. La confirmación dice qué pasa, en claro:
   - La cuenta se desactiva de inmediato y los avisos se detienen.
   - Los datos se eliminan de verdad a los 7 días.
   - Se borran los círculos que ella creó, **incluidos los datos que ven sus familiares**.
   - Durante esos 7 días puede volver a entrar y recuperar la cuenta.
3. Ofrece descargar los datos antes de borrar.
4. Si vuelve a entrar dentro del plazo, ve solo una pantalla: "Tu cuenta está por borrarse el [fecha]", con el botón "Recuperar mi cuenta".
5. Pasado el plazo, el borrado es real: no queda copia utilizable en la app.

**Cerrar un círculo**

1. La cuidadora puede cerrar un círculo y elegir un motivo: "Ya no cuido a esta persona", "Falleció" u "Otro".
2. **Desde el primer momento se silencian todos los recordatorios** de ese círculo: ningún aviso más.
3. Se ofrece descargar la bitácora y los informes.
4. El círculo cerrado queda guardado para leer y descargar; no se puede seguir registrando en él.
5. Cuando el motivo es el fallecimiento, el lenguaje es especialmente cuidadoso: frases cortas, sin exclamaciones, sin pedir nada más. Por ejemplo: "Lo sentimos mucho. Ya detuvimos todos los avisos. Lo que escribiste sigue aquí, por si quieres guardarlo." Sole no pide comentarios ni muestra encuestas en esa pantalla.

**Inactividad**

Si una cuenta pasa 12 meses sin uso, Sole avisa por correo un mes antes y después borra los datos. Entrar a la app cancela el borrado.

### Datos

- `consents`: el historial de cada capa; revocar agrega una fila, no borra las anteriores.
- `profiles`: la fecha de solicitud de borrado, la de desactivación y la del aviso de inactividad. La usuaria no puede cambiarlas directamente.
- `circles`: la fecha y el motivo de cierre.
- La exportación lee todo lo que pertenece a la usuaria: perfil, consentimientos, círculos, recordatorios, ocurrencias, bitácora, tareas, contactos, bienestar, respuestas de encuestas e intereses de puertas falsas.
- Los eventos de investigación se borran junto con la cuenta, por su identificador seudónimo.

### Permisos

- Cada persona ve, descarga y borra solo lo suyo.
- Solo la cuidadora que administra un círculo puede cerrarlo.
- El borrado definitivo lo hace un trabajo diario del servidor; ninguna usuaria puede ejecutarlo sobre otra cuenta.
- El panel del fundador no puede leer los datos de cuidado de nadie.

### Criterios de aceptación

- "Mi cuenta" muestra las tres capas de consentimiento con su estado.
- La investigación se activa y desactiva sin perder acceso a la app.
- La descarga entrega un JSON completo y CSV por tema, con los campos cifrados ya legibles.
- Borrar la cuenta toma pocos toques y explica las consecuencias antes de confirmar.
- La pantalla de borrado advierte que también se borran los datos que ven los familiares.
- Una cuenta en borrado se puede recuperar durante 7 días y se elimina de verdad después.
- Al cerrar un círculo no llega ningún aviso más de ese círculo.
- Al cerrar por fallecimiento, la pantalla no muestra encuestas ni pide comentarios.
- Una cuenta inactiva recibe un aviso antes de borrarse.
