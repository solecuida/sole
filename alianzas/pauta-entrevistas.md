# Pauta de entrevistas de seguimiento

Para conversar con personas que cuidan a un familiar, usan Sole (o llegaron por una organización) y **aceptaron conversar**. Sirve para entender qué les sirve, qué no y qué les falta. No es una evaluación de la persona ni de cómo cuida.

Cada conversación se anota en `seguimiento-entrevistas.csv` (en la raíz del repo), una fila por entrevista. No se escribe ningún dato clínico de la persona cuidada.

## Antes de empezar

- Duración: 20 a 30 minutos. Por videollamada, teléfono o en persona, a la hora que le acomode.
- Agenda la conversación solo con quien dijo que sí. No se insiste a quien no responde.
- Ten a mano `seguimiento-entrevistas.csv` para completarlo apenas termines. No grabes si la persona no lo autorizó.

## Frase inicial de consentimiento

Léela tal cual, con calma:

> «Gracias por darme este rato. Te cuento para qué es: quiero entender cómo es tu día cuando cuidas y qué te ha servido o no de Sole, para mejorarla. No hay respuestas buenas ni malas. No necesito datos de salud de la persona que cuidas, así que no me los cuentes. Voy a anotar solo lo que me sirve para mejorar, sin tu apellido ni datos que te identifiquen. Podemos parar cuando tú quieras, saltarnos cualquier pregunta o terminar sin dar explicaciones, y eso no cambia nada en tu uso de Sole. ¿Te parece bien que conversemos?»

Si dice que no, o duda, se agradece y se termina. Anota solo la fecha y que no aceptó, sin presionar.

## Preguntas abiertas

Pregunta una cosa a la vez y deja silencios. No ofrezcas soluciones ni defiendas la aplicación.

**1. El día a día (`P1_dato`)**
- Cuéntame cómo es un día cualquiera para ti cuando cuidas.
- ¿Cómo llevas hoy lo que hay que recordar: remedios, citas, tareas? ¿Dónde lo anotas?
- ¿Cuándo has sentido que te faltaba tener a mano algún dato?

**2. La carga y la familia (`P2_burnout`)**
- ¿Quién más ayuda y cómo se reparten las cosas?
- ¿Qué es lo más pesado de tu semana?
- ¿Cuándo fue la última vez que tuviste un rato para ti? ¿Cómo fue?

**3. La tranquilidad y la seguridad en casa (`P3_seguridad`)**
- ¿Qué te preocupa cuando no estás en casa o no puedes responder?
- ¿Qué haces hoy cuando algo no sale como esperabas?

**4. Lo que usan hoy (`solucion_actual`)**
- ¿Qué usas ahora para organizarte: libreta, mensajes, otra aplicación?
- ¿Qué te gusta de eso? ¿Qué no?

**5. Sobre Sole**
- ¿Qué parte has usado y cuál no? ¿Por qué?
- ¿Hubo algún momento en que te complicó en vez de ayudar?
- Si pudieras cambiar una sola cosa, ¿cuál sería?
- ¿Qué le falta para que la recomiendes a alguien que cuida?

**6. Para cerrar**
- ¿Hay algo que no te pregunté y quisieras contarme?
- ¿Conoces a alguien que cuide y quisiera conversar conmigo? Solo si tú quieres y si esa persona está de acuerdo (`referidos`).
- ¿Te gustaría seguir probando Sole y contarme cómo te va? (`candidato_piloto`)

Agradece, recuerda que puede escribir cuando quiera a hola@solecuida.com y dile cómo usarás lo conversado.

## Cómo se anota (`seguimiento-entrevistas.csv`)

Una fila por entrevista, con estas columnas, en este orden:

| Columna | Qué se anota |
|---|---|
| `fecha` | Día de la conversación (AAAA-MM-DD). |
| `nombre` | Solo el nombre de pila o un apodo. Sin apellido. |
| `contacto` | Una vía de contacto, solo si la persona la dio para esto. Nunca la copies a otro lugar. |
| `segmento` | A-principal, B-distancia, C-profesional o D-organización. |
| `origen` | Cómo llegó (por ejemplo, el código de la organización). |
| `perfil` | Una línea sobre su situación de cuidado. Sin datos clínicos de la persona cuidada. |
| `P1_dato` | 0 = no le pasa · 1 = le pasa · 2 = es de lo más importante en su vida, con una historia concreta. Vale 2 solo si lo dijo ella o él, sin asentir a una pregunta tuya. |
| `P2_burnout` | Igual, para la carga y la coordinación con la familia. |
| `P3_seguridad` | Igual, para la inseguridad o el miedo en casa. |
| `solucion_actual` | Qué usa hoy para organizarse. |
| `verbatim` | Una frase suya, textual, que no la identifique. |
| `refuta` | Todo lo que contradiga lo que creemos. Se anota igual de grande que lo que lo confirma. |
| `candidato_piloto` | si / no / tal vez, según lo que ella o él haya dicho. |
| `referidos` | Personas que quiso recomendar, solo con su acuerdo. |

Reglas de cuidado:

- Nada de diagnósticos, remedios con dosis ni datos de salud de la persona cuidada, aunque los mencionen. Si aparecen, no se anotan.
- No se interpreta el estado de ánimo de la persona ni se le da consejo. Si cuenta algo que preocupa, se la escucha y se le dice que puede buscar apoyo en su centro de salud.
- Cuando alguien pide borrar lo conversado, se borra su fila.
