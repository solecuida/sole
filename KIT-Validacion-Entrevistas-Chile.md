# KIT DE VALIDACIÓN — ENTREVISTAS DE PROBLEMA (CHILE)
## Ecosistema digital de acompañamiento para personas con Alzheimer y sus familias

**Documento operativo — v1.0**
**Fecha:** 14 de julio de 2026
**Estado:** Listo para usar — este documento no se valida: se ejecuta
**Propósito:** Ejecutar la salida de la Fase 1 (≥ 25 cuidadores, ≥ 8 profesionales, ≥ 3 organizaciones) en el contexto chileno
**Documentos relacionados:** FASE-1 a FASE-5 (⚠ redactados bajo hipótesis España/UE; ver §0)

---

# 0. PARÉNTESIS — ADAPTACIÓN AL CONTEXTO CHILENO

Las Fases 1–5 asumieron España/UE como mercado inicial (GDPR, AEPD, CEAFA/AFAs, MDR). **El proyecto ocurre en Chile.** La buena noticia: casi todas las decisiones estructurales sobreviven, porque se diseñaron "para el marco más exigente". Lo que cambia:

| Tema | Decía (España/UE) | Realidad Chile | Impacto |
|---|---|---|---|
| **Protección de datos** | GDPR art. 9, AEPD, DPIA, brechas 72 h | **Ley 21.719** (publicada dic-2024, **vigente 1-dic-2026** — es decir, entra en vigor durante la construcción del MVP). Crea la **Agencia de Protección de Datos Personales**; datos de salud y geolocalización precisa = **datos sensibles**; derechos ARCO; notificación de brechas; multas hasta 20.000 UTM / 4 % de ingresos. Es deliberadamente símil-GDPR | **Bajo.** La arquitectura de Fase 2 (consentimiento como servicio, cifrado, minimización, DPIA) sirve tal cual: diseñar a estándar GDPR = cumplir 21.719 con holgura. El asesor legal debe ser chileno y el dictamen sobre 21.719. Ventaja de timing: lanzar ya conforme a la ley nueva cuando la mayoría del mercado estará corriendo a adaptarse |
| **Frontera "producto sanitario"** | MDR UE 2017/745, regla 11 | **ISP** (Instituto de Salud Pública), Código Sanitario art. 111 y DS 825/98; control obligatorio de dispositivos médicos en expansión (Decreto Exento N°25, marzo 2026, suma 39 tipos al régimen); la regulación de software como dispositivo médico es aún incipiente | **Bajo hoy, vigilar siempre.** La disciplina de claims (C1: nunca "detecta/diagnostica/predice") se mantiene íntegra — protege ante el ISP, ante la ley de protección al consumidor (SERNAC) y ante una futura regulación de SaMD que llegará. La lista de términos vetados no cambia |
| **Canal nº 1 (era "AFAs/CEAFA")** | Asociaciones de familiares españolas | **Corporación Alzheimer Chile** (~30 años, familiares + profesionales, miembro de ADI), **COPRAD** (Corporación Profesional Alzheimer y otras Demencias), **GAFA** (Viña del Mar, cuidadores informales), **Movimiento Yo Cuido** (nacido en Villa Alemana 2017, red de cuidadoras con peso político real) | **Cambia el directorio, no la estrategia.** El playbook de partenariado de Fase 4 §1.3 aplica igual (§3 de este kit) |
| **Canal institucional (no existía en el plan España)** | — | **Viento de cola enorme:** GES problema N°85 "Alzheimer y otras demencias" (2019, garantías de acceso/oportunidad/protección financiera) · **Plan Nacional de Demencia** (2017-18) · **~66→100 Centros Comunitarios de Apoyo a personas con demencia** (modelo Kintun, pionero en Peñalolén) · **Ley Chile Cuida** (promulgada feb-2026: Sistema Nacional de Apoyos y Cuidados, **credencial de persona cuidadora** vía Registro Social de Hogares, Red Local de Apoyos y Cuidados con municipios como puerta de entrada) · SENAMA, COSAM y unidades de memoria | **Alto y positivo.** Chile está construyendo *ahora* la infraestructura pública del cuidado; un actor privado con vocación de impacto que llega con datos y herramienta para cuidadores conversa directo con esta agenda. Los centros comunitarios son el análogo funcional de las AFAs para el piloto |
| **Pagador y precios** | Premium 9–14 €/mes | Repriorizar en CLP tras entrevistas (hipótesis inicial de trabajo: $7.000–12.000 CLP/mes por círculo). El "hijo a distancia" chileno incluye migración interna (regiones→Santiago y viceversa) y chilenos en el extranjero — este último paga en USD/EUR y es quizás el mejor pagador | Se valida en entrevistas (Guion B) |
| **Residencia de datos** | Regiones AWS UE | GCP opera región **Santiago** (southamerica-west1); AWS tiene región Chile anunciada. La Ley 21.719 no exige residencia local, pero para convenios con el Estado puede ser un plus | Reabre (levemente) la decisión AWS-vs-GCP de Fase 2 §3.1.1 — decisión para el Sprint 0, no para hoy |
| **Sin cambios** | — | WhatsApp como estándar de fricción, Android de gama media dominante, la hija cuidadora "generación sándwich", el techo biológico del LTV, toda la taxonomía de alertas y la ética de producto | El corazón de las 5 fases queda intacto |

**Pendiente (no bloquea las entrevistas):** pasada de adaptación Chile sobre los 5 documentos de fase (reemplazar AEPD→Agencia PDP, GDPR→21.719, AFAs→directorio §3, añadir GES/Chile Cuida al GTM). Se hace en una tarde; las entrevistas valen más.

---

# 1. REGLAS DEL JUEGO (MOM TEST — resumen operativo)

Las tres reglas, antes de cada entrevista, releídas:

1. **Habla de su vida, no de tu idea.** El producto no se menciona jamás durante la entrevista. Si preguntan "¿y tú qué estás haciendo?", la respuesta es: "estoy investigando el problema antes de construir nada; si construyo algo, te lo cuento cuando exista" — y es la verdad.
2. **Pasado y hechos, no futuro ni opiniones.** "¿Usarías una app que…?" está prohibido. Se pregunta "¿qué pasó la última vez que…?", "¿qué hiciste?", "¿cuánto te costó?", "muéstrame cómo lo anotas hoy".
3. **Malas noticias = oro.** Un "la verdad, eso no me pasa" vale más que diez "qué buena idea". Se anota literal (verbatim), sin defenderse.

**Reglas de sensibilidad propias de este dominio (no negociables):**
- Consentimiento verbal explícito al inicio: qué es esto, que no hay grabación sin permiso, que puede parar cuando quiera, que nada se comparte con su nombre.
- Si la persona se quiebra (pasará): se para, se acompaña, y se le pregunta si quiere seguir otro día. La entrevista importa menos que la persona. Paradójicamente, así se consiguen las mejores entrevistas y los primeros embajadores.
- Nunca entrevistar al paciente sin mediación profesional (eso es investigación con personas vulnerables; queda para más adelante y con asesoría).
- Cierre siempre igual: agradecer + pedir 2 referidos + preguntar si querría probar un piloto gratuito cuando exista ("¿te aviso?") — esa lista ES el reclutamiento del piloto.

**Formato:** 30–40 min, presencial o videollamada; ideal en el espacio de la organización aliada. Registrar en la hoja de seguimiento (§5) el mismo día — la memoria de entrevistador a 48 h es ficción.

---

# 2. GUIONES DE ENTREVISTA POR SEGMENTO

## Guion A — Cuidador/a principal conviviente (objetivo: ≥ 13 entrevistas)

**Qué valida:** P1 (el dato del cuidado no existe), P2 (burnout y descoordinación familiar), P3 (inseguridad en el hogar), y la solución improvisada actual.

**Apertura (2 min):** "Gracias por el tiempo. Perdí a mi madre por Alzheimer y estoy investigando cómo viven esto las familias en Chile, para ver si algo de lo que aprendí puede servir a otros. No vengo a venderte nada — no existe nada que vender. ¿Te puedo hacer preguntas sobre tu día a día? Lo que me cuentes es confidencial."

**Bloque 1 — Contexto (5 min):**
- Cuéntame de [nombre]. ¿Hace cuánto el diagnóstico? ¿Cómo es un día normal de ustedes dos?
- ¿Quién más ayuda con el cuidado? ¿Cómo se reparten? *(anotar: nº de personas del círculo real, si hay cuidadora contratada)*

**Bloque 2 — P1, el dato (8 min):**
- La última vez que fueron al neurólogo/geriatra, ¿cómo te preparaste? ¿Qué te preguntó el médico que no supiste responder con seguridad?
- ¿Anotas cosas de cómo está? ¿Dónde? **Muéstrame** *(la libreta/las notas del celular/nada — foto si lo permite)*.
- ¿Cómo saben si está peor que hace tres meses?
- ¿Han hecho el trámite de credencial de discapacidad / algún beneficio (GES, Registro Social de Hogares, credencial de cuidadora)? ¿Qué les pidieron demostrar y cómo fue?

**Bloque 3 — P2, la carga y la familia (10 min):**
- ¿Cuándo fue la última vez que dormiste una noche completa tranquila? ¿Qué te despierta?
- La última vez que necesitaste que alguien te reemplazara un día, ¿qué hiciste? ¿Qué pasó?
- ¿Cómo se comunican entre los que ayudan? *(¿grupo de WhatsApp? pedir que lo describa: qué se pierde, qué peleas genera)*
- ¿Qué dicen tus hermanos/familia de cómo repartes el cuidado? *(aquí sale el conflicto fraternal — anotar verbatims)*
- ¿Has dejado de trabajar / reducido jornada / dejado cosas tuyas por esto?

**Bloque 4 — P3, el miedo (8 min):**
- ¿Se ha salido de la casa alguna vez / se ha perdido? Cuéntame esa vez. ¿Qué hicieron? ¿Qué cambiaron después? *(cerrojos, esconder llaves, GPS…)*
- ¿Cómo manejan los remedios? ¿Alguna vez hubo doble dosis, dosis saltada, o los escondió/rechazó? ¿Qué pasó?
- ¿Qué es lo que más miedo te da que pase cuando no estás mirando?

**Bloque 5 — La billetera y el cierre (5 min):**
- ¿Qué han comprado o contratado para esto? (cuidadora, cámaras, GPS, teleasistencia, pastillero, día de centro diurno) ¿Cuánto pagan al mes, más o menos? ¿Qué funcionó y qué fue plata perdida?
- Si pudieras borrar UNA sola parte de todo esto (no la enfermedad — una parte del día a día), ¿cuál?
- ¿Conoces a otras dos personas cuidando a alguien con demencia que aceptarían conversar conmigo?
- Si algún día armo algo gratuito para probar con pocas familias, ¿te aviso?

**Señales de validación:** menciona espontáneamente ≥ 2 de los 3 problemas como lo peor de su día a día · ya gasta plata o improvisó soluciones · muestra la libreta/el caos de WhatsApp · acepta el piloto sin que se le insista. **Señales de refutación (anotar igual de grande):** "no, eso lo tenemos resuelto con…", "la verdad no anoto nada y no me hace falta", "plata no gastaríamos".

## Guion B — Cuidador/a a distancia (objetivo: ≥ 12 entrevistas — es el pagador hipotético, mitad del cupo)

**Qué valida:** el job "compro tranquilidad", la disposición a pagar (G4 de Fase 4) y la dinámica de ayuda a distancia.

Apertura idéntica al Guion A. Preguntas núcleo:

- ¿Cómo te enteras de cómo estuvo tu mamá/papá hoy? ¿A quién le preguntas y cada cuánto? ¿Cómo reacciona esa persona a tus preguntas? *(la tensión preguntón↔cuidadora principal es el dolor exacto que el digest resuelve — dejar que la describa)*
- Cuéntame la última vez que supiste tarde de algo importante (caída, cambio de remedio, hospitalización). ¿Cómo te sentiste? ¿Qué cambiaron?
- ¿Qué haces tú concretamente para ayudar, viviendo lejos? ¿Qué te gustaría hacer que hoy no puedes? ¿Qué te han dicho cuando ofreces ayuda?
- ¿Aportas plata al cuidado? ¿En qué se va? ¿Quién decide en qué se gasta? *(mapa del pagador real)*
- La última vez que viajaste de urgencia (o pensaste que tenías que hacerlo), ¿qué la gatilló? ¿Cuánto costó (pasajes, días de trabajo)?
- ¿Qué has buscado en internet a las 2 AM sobre esto? *(literal — valida el SEO de crisis de Fase 4)*
- Cierre igual (referidos + piloto). Si vive en el extranjero, anotarlo: sub-segmento de pago premium.

**Señal de oro:** describe pagar por cosas cuyo valor es *información y tranquilidad* (cámara, cuidadora "para que me cuente", llamadas diarias). Eso es la disposición a pagar del premium, dicha sin preguntarla.

## Guion C — Profesional de salud (objetivo: ≥ 8: neurólogo/geriatra, médico APS, enfermera de unidad de memoria, terapeuta ocupacional de centro diurno, psicóloga, trabajadora social)

**Qué valida:** el gancho del informe de 1 página, el rol de prescriptor, y la realidad del sistema chileno (GES, APS, centros comunitarios).

- ¿Cuántos pacientes con demencia ves al mes? ¿Cada cuánto ves al mismo paciente? ¿Cuánto dura la consulta?
- ¿Cómo te enteras de lo que pasó en la casa entre consulta y consulta? ¿Qué tan confiable es ese relato? Cuéntame una decisión que tomaste "a ciegas" y que con mejor información habría sido distinta.
- ¿Qué le pides hoy a las familias que registren? ¿Alguna lo hace? ¿En qué formato te llega?
- Si una familia llegara con una hoja con adherencia a medicamentos, episodios conductuales con patrón (qué pasó antes/qué hizo/cómo se resolvió), sueño y caídas del último trimestre — ¿la leerías? ¿Qué debería tener para que **te fíes** de ella? ¿Qué la haría inútil o sospechosa? *(única pregunta "de concepto" permitida: valida el artefacto, no la app)*
- ¿Qué papel juega el GES N°85 en tu consulta? ¿Y los informes para credencial de discapacidad/dependencia — quién los arma y con qué evidencia?
- ¿Derivan a centros comunitarios / COSAM / agrupaciones? ¿Cómo funciona esa red en tu comuna?
- Cierre: ¿me presentarías a 1–2 familias que estén en el caos ahora? ¿Y a un colega que piense distinto a ti?

## Guion D — Organizaciones y centros (objetivo: ≥ 3: Corporación Alzheimer Chile, COPRAD, Yo Cuido/GAFA, un centro comunitario tipo Kintun, encargado municipal de Red Local de Apoyos y Cuidados)

**Qué valida:** el canal (¿derivarían familias?), el intercambio de valor del partenariado (Fase 4 §1.3-1) y el mapa real del ecosistema.

- ¿Cuántas familias atienden/acompañan al año? ¿Cómo llegan a ustedes? ¿En qué momento de la enfermedad llegan? *(valida la ventana GDS 4–5)*
- ¿Qué les piden las familias que ustedes no alcanzan a dar? ¿Dónde se les quema el cuidador?
- ¿Qué herramientas (papel, planillas, apps) usan con las familias hoy? ¿Qué les ha ofrecido la industria y por qué no cuajó? *(cementerio de apps: oro competitivo)*
- ¿Cómo demuestran impacto ante fondos/subvenciones (fondos concursables, municipio, donantes)? ¿Qué dato les encantaría tener y no tienen?
- ¿Cómo se relacionan con Chile Cuida / la Red Local / SENAMA? ¿Qué cambia para ustedes con la ley nueva?
- Si existiera una herramienta gratuita para sus familias, co-diseñada con ustedes, con métricas de impacto agregadas para sus rendiciones — ¿qué condiciones pondrían para recomendarla? ¿Qué la haría inaceptable? *(los "noes" de la organización son los requisitos del partenariado)*
- Cierre: ¿podemos partir con entrevistas a 5–8 de sus familias, con su mediación y sus reglas?

---

# 3. DIRECTORIO INICIAL DE CONTACTO (CHILE)

| Organización | Qué es / por qué | Primer paso |
|---|---|---|
| **Corporación Alzheimer Chile** | ~30 años, familiares + profesionales, miembro de Alzheimer's Disease International. El análogo directo de las AFAs del plan original | Email + Instagram (@corporacionalzheimerchile); pedir reunión con su equipo de apoyo a familias |
| **COPRAD** (coprad.cl) | Corporación profesional (investigación, educación, orientación a cuidadores/familia); conectada al Plan Nacional | Formulario/email de coprad.cl; entrada por el ángulo "investigación del problema del cuidador" |
| **Movimiento Yo Cuido** | Red de cuidadoras nacida en Villa Alemana (2017), con capítulos regionales y peso en la agenda pública del cuidado | Redes sociales; entrada por la historia personal, jamás por el producto |
| **GAFA** (Viña del Mar) | Agrupación de apoyo a cuidadores informales de pacientes con Alzheimer (2016) | Redes/contacto local si estás en la V Región |
| **Centro comunitario de apoyo a demencia de tu comuna** (modelo Kintun; ~66–100 centros en el país) | El punto físico donde están las familias en la ventana correcta; equipo profesional (TO, psicólogo, trabajador social) | Llamar al centro o al DISAM/COSAM municipal; pedir hablar con la coordinación |
| **Red Local de Apoyos y Cuidados / Chile Cuida** (municipio) | Puerta de entrada municipal del nuevo Sistema Nacional; maneja el registro de personas cuidadoras | Oficina municipal (Dideco/Chile Cuida); apoyosycuidados.ministeriodesarrollosocial.gob.cl |
| **Unidad de memoria / neurología de hospital o clínica + médicos APS (CESFAM)** | Prescriptores; el GES N°85 pasa por aquí | Vía los profesionales del Guion C; pedir presentaciones en cadena |

**Meta de la semana 1:** 5 primeros contactos enviados (2 corporaciones + 1 centro comunitario + 1 municipio + 1 profesional conocido). **Meta del mes 1:** 3 organizaciones con reunión hecha y ≥ 10 entrevistas de cuidadores agendadas.

---

# 4. PLANTILLAS DE CONTACTO

## 4.1 Email a corporaciones/centros (adaptar, no copiar robóticamente)

> **Asunto:** Investigación sobre la carga del cuidador de personas con demencia — solicitud de conversación
>
> Estimada/o [nombre / equipo de {organización}]:
>
> Mi nombre es [nombre]. Cuidé a mi madre, que falleció de Alzheimer, y desde esa experiencia estoy dedicando este año a investigar en profundidad cómo viven las familias chilenas el cuidado en casa: la coordinación entre familiares, la carga de quien cuida y la seguridad cotidiana (medicamentos, desorientación, emergencias).
>
> No represento a ninguna empresa ni vengo a ofrecer un producto: estoy en la etapa de escuchar antes de decidir si algo de lo que aprendí puede convertirse en una ayuda real. Si algún día lo hace, mi compromiso es que sea gratuito para las familias que las organizaciones como la suya acompañan, y co-diseñado con ustedes.
>
> ¿Sería posible una reunión de 30 minutos con quien lidera el apoyo a familias? Me interesa entender su trabajo y, si les parece bien y bajo sus reglas, conversar con algunas familias dispuestas (con total confidencialidad).
>
> Quedo atento/a y agradezco de antemano,
> [nombre, teléfono, comuna/ciudad]

## 4.2 WhatsApp a profesional referido

> Hola [nombre], le escribe [nombre] — me dio su contacto [referente]. Cuidé a mi madre con Alzheimer y estoy investigando el problema de la información entre la casa y la consulta (lo que el médico no alcanza a ver entre control y control). ¿Tendría 20–30 minutos para una conversación? No vendo nada; estoy en etapa de estudio y su mirada clínica me serviría muchísimo.

## 4.3 Publicación en grupos de Facebook de cuidadores (SOLO con permiso del administrador; regla de Fase 4 §1.3-2)

> Hola. Cuidé a mi mamá con Alzheimer hasta que partió. Estoy dedicando este tiempo a investigar seriamente cómo lo viven otras familias en Chile — la coordinación entre hermanos, el cansancio de quien carga con casi todo, el miedo a los remedios y a que se salgan de la casa. Busco conversar 30 minutos (por videollamada o presencial) con personas que estén cuidando ahora. No es una venta ni una encuesta de empresa: es escuchar, con confidencialidad total. Si te sirve desahogarte con alguien que pasó por lo mismo, quizás nos sirva a los dos. Me escriben por interno. Gracias 💜

**Regla:** el 90 % de tu actividad en el grupo es aportar (responder dudas, compartir recursos públicos: GES 85, credencial de cuidadora, centros comunitarios de la comuna). El post de reclutamiento es el 10 %.

---

# 5. HOJA DE SEGUIMIENTO Y CRITERIOS DE CIERRE

Archivo: [seguimiento-entrevistas.csv](seguimiento-entrevistas.csv) (ábrelo en Excel/Google Sheets; una fila por entrevista).

**Columnas y cómo llenarlas:**

| Columna | Contenido |
|---|---|
| `fecha`, `nombre`, `contacto` | Datos mínimos (trátalos con el mismo respeto que pides: no compartas la planilla) |
| `segmento` | A-principal / B-distancia / C-profesional / D-organización |
| `origen` | Quién lo refirió (mide qué canal de reclutamiento funciona — ensayo del GTM) |
| `perfil` | Edad aprox., comuna, relación con el paciente, estadio aprox. del paciente, tamaño del círculo real |
| `P1_dato`, `P2_burnout`, `P3_seguridad` | 0 = no le pasa / 1 = le pasa / 2 = **top de su vida, con historia concreta** (solo vale 2 si salió espontáneo o con evidencia, no asintiendo) |
| `solucion_actual` | Qué usa hoy (libreta, WhatsApp, cámara, cuidadora, nada) y cuánto gasta CLP/mes |
| `verbatim` | 1–3 frases literales (el material más valioso de todo el proceso: de aquí salen los mensajes de marketing y las historias de usuario corregidas) |
| `refuta` | Todo lo que contradiga las hipótesis — la columna que te hace honesto |
| `candidato_piloto` | sí/no — ¿aceptó que le avises del piloto? |
| `referidos` | Nombres/contactos que entregó |

**Criterios de cierre de la validación (los de Fase 1, ejecutados):**

- ✅ **Valida:** ≥ 70 % de cuidadores (A+B) puntúan 2 en al menos 2 de los 3 problemas · ≥ 10 candidatos a piloto · ≥ 3 organizaciones dispuestas a colaborar · los profesionales confirman que leerían y confiarían en el informe de 1 página.
- ❌ **Refuta (y se agradece):** los problemas puntúan mayoritariamente 0–1, o la "solución improvisada" resulta suficiente para la mayoría → se revisan las hipótesis de Fase 1 con los verbatims en la mano, antes de gastar un peso en construir.
- **Revisión intermedia obligatoria a las 10 entrevistas:** si un guion no está funcionando (respuestas planas, nada nuevo), se ajusta el guion, no se fuerza la muestra.

---

*Documento operativo. Su métrica de éxito no es estar bien escrito: es la fecha de la primera entrevista. Esta semana.*
