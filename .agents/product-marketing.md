# Product Marketing Context

**Document version:** v0.1 (draft de trabajo — lluvia de ideas, pendiente de revisión)
**Last updated:** 2026-09-16

> **Nota sobre el estado de este documento.** Es un primer borrador armado a partir del material ya escrito en el repo (FASE-1 a FASE-4, la landing en `web/`). No es una decisión cerrada de posicionamiento: es un punto de partida para que el equipo lo corrija, discuta y recorte. Igual que el propio proyecto, trata todo lo que sigue como **hipótesis a validar, no verdades** — así lo dice explícitamente la Fase 1. Dos capas conviven aquí y hay que no mezclarlas: (A) **el estado real hoy** — investigación, sin producto, sin cobro — y (B) **la hipótesis de producto futuro** de las Fases 1–4, que todavía no está validada con las entrevistas.

## Product Overview

**Estado actual (A — lo real, hoy):** Sole **no es un producto todavía**. Es una investigación en curso (2026, Chile) sobre lo que viven las personas que cuidan en casa a un familiar — entrevistas de 30–40 minutos con cuidadoras/es, profesionales de salud y organizaciones. No hay app, no hay lista de espera, no hay cobro. La landing (`web/index.html`) lo dice de frente: "Sole fue la que cuidó" / "escuchar antes de construir".

**One-liner (hipótesis de producto, fase futura):** El círculo de cuidado que tu familia necesita y tu madre merece — un ecosistema cerrado y privado para que toda la familia cuida junta, nadie carga solo y ningún detalle importante se pierde.

**Qué haría (2–3 frases):** Un sistema para el círculo de cuidado de una persona con Alzheimer/demencia (u otras dependencias severas): alertas jerarquizadas en vez de 40 notificaciones sueltas, coordinación familiar estructurada (tareas y turnos, no un grupo de WhatsApp caótico), y registro observacional de 10 segundos que se convierte en un informe de una página para la consulta médica. El paciente no "usa la app" — la app lo rodea (voz, wearable, cero pantalla exigida).

**Categoría de producto:** Ecosistema digital de acompañamiento al cuidado familiar / coordinación de cuidado (care coordination) para demencia — no telemedicina, no dispositivo médico, no app de "monitorización" clínica.

**Tipo de producto:** App/plataforma (círculo familiar cerrado) con componente B2B2C futuro (asociaciones, profesionales, residencias/aseguradoras).

**Modelo de negocio (hipótesis):** Freemium familiar → suscripción premium, pagada probablemente por el cuidador a distancia ("compra tranquilidad, no tiempo"). B2B2C con AFAs/aseguradoras/SAD pospuesto a fases posteriores — nunca como motor inicial.

## Target Audience

**A quién sirve hoy la investigación:** cuidadoras/es familiares en Chile, profesionales de salud, y organizaciones/centros que acompañan a familias — es a quienes se entrevista, no a quienes se les vende algo.

**Cliente y usuario del producto futuro — nunca la misma persona que el paciente:**
- **Beneficiario clínico:** la persona con Alzheimer/demencia. Segmentado por estadio funcional (GDS/FAST): leve (usuario activo limitado), moderado (usuario pasivo — wearable/voz), avanzado (sujeto de cuidado, 100% del valor va al cuidador).
- **Usuario primario y cliente early-adopter:** el cuidador familiar. Arquetipo principal: "la hija cuidadora", 45–65 años, generación sándwich, alfabetización digital media (WhatsApp y banca móvil, no mucho más), 15–70 h/semana de cuidado.
  - Sub-segmentos: cuidador principal conviviente (necesita respiro y alertas fiables), cuidador a distancia (necesita visibilidad y tranquilidad — mayor disposición a pagar), círculo secundario (hermanos/nietos que quieren ayudar sin invadir), cuidador profesional contratado (bisagra operativa hoy excluida de la información).
- **Canal, prescriptor y futuro cliente B2B:** profesionales (neurólogos, geriatras, enfermería, trabajadores sociales) y asociaciones de familiares (AFAs).

**Caso de uso principal:** que el cuidador familiar deje de cargar solo con la coordinación y la memoria del cuidado, y que la familia entera vea y comparta lo que antes vivía solo en la cabeza de una persona agotada.

**Jobs to be done (cuidador):**
- Funcional: "que no se me escape nada" (medicación, citas, síntomas nuevos).
- Emocional: "poder dormir una noche sin miedo"; "no sentirme sola en esto".
- Social: "que mis hermanos vean lo que hago y me ayuden de verdad"; "llegar al médico con datos y que me tome en serio".

**Jobs to be done (paciente, fase leve):** "seguir siendo yo el mayor tiempo posible"; "no quiero ser una carga"; "decidir hoy cómo quiero ser cuidado mañana" (agencia anticipada: mensajes grabados, fotos etiquetadas, preferencias).

## Personas

| Persona | Le importa | Su problema | Valor que le prometemos |
|---------|-------------|-----------|------------------|
| Cuidadora principal conviviente | No perder ningún detalle, poder descansar | Sobrecarga 24/7, memoria agotada, "¿está peor o soy yo?" | Un sistema que registra por ella y avisa solo lo que importa |
| Cuidador/a a distancia | Tranquilidad, visibilidad real | Ansiedad por no estar, depender de reportes vagos ("bien, más o menos") | Ver el círculo sin tener que preguntar; paga por dormir tranquilo |
| Círculo secundario (hermanos, nietos) | Ayudar sin generar conflicto | "Tú no haces nada" / "tú no me dejas hacer nada" | Tareas y turnos visibles y concretos, no "avísame si necesitas algo" |
| Profesional (neurólogo, geriatra, TS) | Decidir con datos, no con la foto fija de 15 minutos | Consulta corta, cuidador nervioso que no recuerda cuándo empezó el síntoma | Informe longitudinal de 1 página, lenguaje neutro, sin interpretación clínica |
| Asociación de familiares (AFA) | Dar más apoyo a sus familias con los recursos que tienen | Recursos limitados, familias dispersas | Herramienta de apoyo a sus programas + métricas de impacto agregadas y anónimas |

## Problems & Pain Points

**Problema central:** el cuidado de una persona con demencia en casa no genera ningún dato — vive en libretas, mensajes de WhatsApp a uno mismo y en la memoria sobrecargada del cuidador principal. Además, ese cuidador se quema en silencio porque el sistema familiar no se coordina (grupo de WhatsApp donde lo urgente sepulta lo importante).

**Por qué las alternativas actuales no alcanzan:**
- La "solución" de hoy es libreta + WhatsApp + pastillero + llamadas de comprobación + notas en la puerta — coste cero, fricción cero, "más o menos funciona". **Ese es el verdadero competidor, no otra app.**
- Apps de demencia existentes asumen un paciente capaz de usar pantalla (falla estructural frente al deterioro cognitivo).
- Teleasistencia clásica ("botón rojo") exige iniciativa de un usuario que precisamente ya la perdió.
- Coordinación de cuidado genérica (Lotsa Helping Hands, CircleOf) no tiene alertas ni seguimiento conductual, y es anglocéntrica.

**Qué les cuesta:** consultas médicas de baja calidad informativa, ajustes de medicación tardíos, crisis evitables (caídas, hospitalizaciones), depresión/ansiedad del cuidador, abandono laboral, conflictos entre hermanos que duran después del fallecimiento, institucionalización prematura del paciente.

**Tensión emocional:** culpa crónica, agotamiento, duelo anticipado, miedo concreto (medicación, deambulación, la noche) que hoy se enfrenta con cerrojos altos y llamadas cada dos horas.

## Competitive Landscape

**Directa:**
- Apps específicas de demencia (MindMate, Tweri) — foco en el paciente, mono-función, sin círculo familiar.
- Coordinación de cuidado familiar genérica (Lotsa Helping Hands, CaringBridge, Ianacare, CircleOf) — sirven cualquier enfermedad, sin alertas ni seguimiento clínico-conductual, mayormente en inglés.
- Recordatorio de medicación (Medisafe, MyTherapy) — buena adherencia, pero asumen que quien recibe el recordatorio puede actuar; no escalan al cuidador.
- Teleasistencia/GPS senior (Tunstall, Atenzia, Durcal, AngelSense) — hardware probado, pero modelo "botón rojo" y sin dimensión familiar.
- Plataformas de cuidado a domicilio (Qida, Cuideo, Aiudo) — venden horas de cuidador, no continuidad de información.

**Indirecta (la que de verdad compite):** el sistema improvisado (WhatsApp + libreta + pastillero), Alexa/Google Home con rutinas caseras, la cuidadora contratada como "sensor humano", y — en fase temprana — la negación: la familia que todavía no acepta que necesita ayuda.

**Dónde fallan todas:** ninguna resuelve a la vez las tres piezas — datos del cuidado, coordinación familiar sin conflicto, y seguridad en casa — sin exigirle nada al paciente y sin cruzar la frontera de dispositivo médico.

## Differentiation

**Diferenciadores clave (hipótesis, ventaja injusta embrionaria — hay que construirla, no solo enunciarla):**
- Ecosistema cerrado por diseño → efecto red intrafamiliar (cada familia trae 3–8 usuarios) + dato longitudinal propietario con consentimiento.
- Foco vertical absoluto en demencia (estadios GDS, sundowning, wandering, duelo anticipado) — no un genérico de "cuidado senior".
- Autenticidad fundacional: la historia real del fundador (hijo de una madre fallecida por Alzheimer, proyecto nombrado por la tía que la cuidó) abre puertas con AFAs, grupos de apoyo y medios que el presupuesto de marketing no abre — pero solo se vuelve ventaja real si se institucionaliza en comunidad y alianzas, no si queda en storytelling.

**Por qué eligen Sole (cuando exista):** porque no compite contra otra app — compite contra el caos actual — y porque el paciente nunca tiene que "usar" nada. La familia entera, no una sola persona, sostiene el cuidado.

## Objections & Anti-Personas

| Objeción (anticipada) | Respuesta |
|-----------|-----------|
| "Otra app que promete vigilar/monitorear a mi familiar" | Sole no diagnostica, no predice ni monitoriza clínicamente nada — es organización y acompañamiento, nunca dispositivo médico. El lenguaje del producto usa "acompañar" y "zona segura", nunca "vigilar" o "rastrear". |
| "Mis papás/mi familiar no van a saber usar esto" | El paciente no usa la app: recordatorios por voz, wearable sin pantalla, reconocimiento pasivo de rutinas. La app rodea al paciente, no le exige nada. |
| "No tengo tiempo ni ganas de aprender otra herramienta" | El estándar de fricción es WhatsApp — si es más difícil que eso, no sirve. Interfaz de carga cognitiva cero. |

**Anti-persona:** quien busca una herramienta de vigilancia/control del paciente sin su consentimiento, o una institución que quiera comprar acceso a datos de salud agregados sin las garantías de anonimización (choca directo con G7 y con la ética declarada del proyecto).

## Switching Dynamics

- **Push (qué los aleja del sistema actual):** una crisis puntual — el primer episodio de deambulación, una discusión fuerte entre hermanos, un ingreso hospitalario, un diagnóstico reciente que ya empieza a pesar.
- **Pull (qué atrae hacia Sole):** la promesa de dormir tranquilo, de que la familia vea y comparta lo que antes cargaba una sola persona, y de llegar a la consulta con datos reales.
- **Habit (qué los mantiene en lo de siempre):** WhatsApp y la libreta ya "más o menos funcionan", coste cero, cero curva de aprendizaje.
- **Anxiety (qué preocupa del cambio):** exponer datos de salud sensibles de un familiar vulnerable; que el paciente se sienta vigilado o tratado como un niño; sumar "una app más" a la carga en vez de restarla.

## Customer Language

**Cómo describen el problema (verbatim, de las Fases 1 y de la landing):**
- "¿Está peor que hace tres meses o soy yo que estoy más cansada?"
- "Ya se lo diré al médico."
- "Avísame si necesitas algo" (la ayuda que nunca se convierte en tarea concreta).
- "Mi madre esconde las pastillas" (búsqueda real a las 2 de la mañana).
- "Tú no haces nada" / "tú no me dejas hacer nada" (conflicto fraternal).

**Cómo describen el problema que Sole busca resolver (marca paraguas, hipótesis):**
- "El círculo de cuidado que tu familia necesita y tu madre merece."
- "No estás sola. Y por fin puedes dormir."

**Palabras/frases a usar:** acompañar, zona segura, círculo de cuidado, organización, bienestar, "el sueño empeora desde hace 3 semanas" (patrón neutro, sin interpretar).

**Palabras/frases a evitar (lista de términos vetados — regulatorio, no solo de estilo):** detecta, diagnostica, predice, monitoriza clínicamente, monitorización clínica, vigilar, rastrear, puntuación cognitiva, índice de deterioro, "deterioro detectado". Ningún texto de marketing, ficha de store o nota de prensa puede cruzar esta línea (frontera de dispositivo médico, MDR/FDA).

**Glosario:**
| Término | Significado |
|------|---------|
| Círculo (de cuidado) | Unidad atómica de valor y de privacidad: los 3–8 miembros de la familia/red que coordinan el cuidado de una persona. Nunca se mide "usuario individual", se mide el círculo. |
| GDS/FAST | Escalas de estadio funcional del Alzheimer (leve/moderado/avanzado) usadas para segmentar necesidades del paciente. |
| Cuidador a distancia | Hijo/a que vive lejos; "compra tranquilidad, no tiempo" — sub-segmento con mayor disposición a pagar. |
| CCS | Círculos Coordinados Semanales — North Star Metric propuesta (hipótesis). |

## Brand Voice

**Tono:** cercano, honesto, sin urgencia artificial ni tono corporativo. Habla en primera persona (carta del fundador), no en "nosotros" de empresa. Nunca lacrimógeno como estrategia de venta — la historia se cuenta para abrir la conversación sobre el burnout del cuidador, no para vender: "el fundador habla del problema; el producto aparece como consecuencia, no como protagonista".

**Estilo de comunicación:** editorial/epistolar (formato carta), directo, sin rodeos ("para que puedan decidir en cinco minutos si vale la pena darme treinta"). Frases cortas, sin jerga de startup.

**Personalidad de marca (adjetivos):** digna, honesta, paciente, cálida, rigurosa (en lo legal/ético), nunca alarmista.

**Identidad visual ya en uso (`web/assets/estilo.css`):** paleta cálida — terracota `#9c5b34` sobre crema `#faf6ef`. Tipografías serif editoriales: Fraunces (títulos), Newsreader (texto), Courier Prime (notas de campo/metadatos), Caveat (firma manuscrita). Regla de accesibilidad explícita: el texto tenue debe mantener mínimo 4.5:1 de contraste, pensado para cuidadoras de 45–65 años en celulares de gama media.

**Reglas de marca no negociables (ya documentadas en el repo):**
- La tía Sole está viva — nunca escribir "en memoria de" sobre ella; es "en reconocimiento a quien cuida". Quien falleció fue la madre del fundador, Dinora García ("la Nonó").
- Sin WhatsApp como canal de contacto en el sitio (decisión ya tomada).
- Ninguna táctica de urgencia artificial, gamificación de vanidad ni dark pattern de cancelación — "cada táctica pasa un doble filtro: ¿funciona? y ¿la defenderíamos delante de una asociación de familiares y de la autoridad de protección de datos a la vez?".

## Proof Points

**Métricas actuales (fase de investigación, no de producto):** bitácora pública en la landing — conversaciones con cuidadoras/es (meta 25), profesionales de salud (meta 8), organizaciones/centros (meta 3). Se actualiza a mano y a propósito se publica aunque los números sean bajos ("si esto va a pedir confianza, tiene que mostrar en qué va").

**Métricas de negocio futuras (hipótesis, aún sin datos reales):** North Star candidata = Círculos Coordinados Semanales (CCS); pirámide de salud de startup, CAC/LTV con techo biológico explícito (vida de cliente típica 2–4 años, acotada por la progresión de la enfermedad).

**Testimonios / clientes:** ninguno todavía — es la tarea de la fase de investigación en curso.

**Temas de valor y su respaldo (hipótesis a validar):**
| Tema | Respaldo |
|-------|-------|
| "No cargas sola" | Coordinación familiar estructurada (tareas y turnos, no chat libre) |
| "Puedes dormir" | Alertas jerarquizadas con escalado, no 40 notificaciones sueltas |
| "Llega preparada a la consulta" | Informe de 1 página generado del registro de 10 segundos |

## Goals

**Objetivo de negocio actual (fase real):** completar la fase de descubrimiento — validar o refutar las hipótesis de la Fase 1 con entrevistas reales (25 cuidadores, 8 profesionales, 3 organizaciones) antes de construir nada.

**Acción de conversión actual (la landing):** que un cuidador o una organización escriba a través del formulario de contacto para conversar — no una demo, no un signup de producto.

**Objetivo de negocio futuro (si la investigación lo justifica):** GTM trust-first vía AFAs, prescriptores y contenido — nunca paid como motor principal — escalando piloto → alfa cerrada → beta cerrada → apertura regional, con cada escalón financiado por la prueba social del anterior.

**Métricas actuales:** las tres cifras de la bitácora de la landing (conversaciones con cuidadores, profesionales, organizaciones).

## Changelog

*Newest first. One line per revision: what changed and why.*
- v0.1 (2026-09-16) — Borrador inicial autogenerado a partir de FASE-1 a FASE-4 y `web/` (landing, README de `web/`). Pendiente de revisión humana: es lluvia de ideas de arranque, no posicionamiento cerrado.
