# FASE 1 — DESCUBRIMIENTO Y VALIDACIÓN DEL PROBLEMA
## Ecosistema digital de acompañamiento para personas con Alzheimer y sus familias

**Documento de planificación estratégica — v1.0**
**Fecha:** 10 de julio de 2026
**Estado:** Borrador para validación con entrevistas de problema
**Clasificación:** Interno — Fundación del proyecto
**Naturaleza del proyecto:** Startup HealthTech de impacto social, nacida para honrar la memoria de una madre fallecida por Alzheimer.

---

> **Nota metodológica.** Este documento sigue el marco Lean Startup (Ash Maurya) adaptado a las particularidades de HealthTech: en salud digital, el *usuario*, el *cliente que paga* y el *beneficiario clínico* casi nunca son la misma persona, y el error más caro de un fundador primerizo es diseñar como si lo fueran. Todo lo aquí planteado son **hipótesis a validar**, no verdades. La Fase 1 termina cuando estas hipótesis hayan sido confirmadas o refutadas con entrevistas reales (mínimo sugerido: 25 cuidadores familiares, 8 profesionales, 3 asociaciones de familiares).

---

# 1. LEAN CANVAS ADAPTADO A HEALTHTECH

## 1.1 Segmentos de clientes

### Principio rector (el punto ciego nº 1 de HealthTech)

En este producto conviven tres figuras que en un SaaS normal serían una sola:

| Figura | Quién es aquí | Implicación de diseño |
|---|---|---|
| **Beneficiario clínico** | El paciente | Recibe el valor, pero **no puede ser el usuario de pantalla** en fases moderadas/avanzadas |
| **Usuario primario** | El cuidador familiar | Usa la app a diario; su experiencia decide la retención |
| **Comprador / pagador** | El cuidador (D2C) o una institución (B2B2C: aseguradora, servicios sociales, residencia) | Decide la monetización; puede no ser quien usa el producto |

Diseñar "una app para el paciente de Alzheimer" es la trampa clásica. El producto real es **un sistema operativo para el círculo de cuidado**, donde el paciente es el centro pero no el operador.

---

### Segmento A — La persona con Alzheimer (beneficiario clínico)

**No es un segmento homogéneo.** La enfermedad es progresiva y el producto debe segmentar por estadio funcional (escalas GDS/FAST de referencia):

| Estadio | Perfil funcional | Relación con el producto |
|---|---|---|
| **Leve (GDS 3–4)** | Consciente del diagnóstico, autonomía parcial, usa smartphone con ayuda | Usuario activo limitado: recordatorios simples, botón de ayuda, videollamada asistida. **Ventana de consentimiento válido** (ver §3.2) |
| **Moderado (GDS 5–6)** | Desorientación temporal/espacial, riesgo de deambulación, dependencia creciente | Usuario **pasivo**: wearable, sensores, altavoz inteligente. Cero interacción de pantalla exigida |
| **Avanzado (GDS 7)** | Dependencia total, pérdida de lenguaje | Sujeto de cuidado monitorizado. El 100 % del valor se entrega al cuidador |

**Demografía tipo (España/LatAm, a validar):** 75–85 años, mayoría mujeres, vive en su domicilio o en el del hijo/a cuidador/a, baja o nula alfabetización digital previa.

**Jobs-to-be-done del paciente (en fase leve, en sus propias palabras hipotéticas):**
- "Quiero seguir siendo yo el mayor tiempo posible."
- "No quiero ser una carga para mis hijos."
- "Quiero acordarme de las caras y los nombres de los míos."
- "Quiero salir a la calle sin que me traten como a un niño."

**Insight de diseño:** el paciente en fase leve *sabe* lo que viene. El producto puede ofrecerle algo que casi nadie ofrece: **agencia anticipada** — grabar mensajes, etiquetar fotos, expresar preferencias de cuidado mientras aún puede. Esto es diferenciación emocional y, además, resuelve parcialmente el problema legal del consentimiento (§3.2).

---

### Segmento B — El cuidador familiar (usuario primario y cliente early-adopter)

**Este es el cliente.** Toda la validación de Fase 1 se hace principalmente con este segmento.

**Arquetipo principal — "La hija cuidadora" (a validar):**
- Mujer, 45–65 años (el perfil estadístico dominante del cuidador informal en España e Iberoamérica).
- "Generación sándwich": trabaja, tiene hijos y cuida de su madre/padre.
- Dedica 15–70 h/semana al cuidado; ha reducido jornada o abandonado empleo en los casos graves.
- Alfabetización digital media: WhatsApp, banca móvil, poco más. **WhatsApp es el estándar de usabilidad que no podemos superar en fricción.**
- Estado emocional: culpa crónica, agotamiento, duelo anticipado, conflictos con hermanos por el reparto del cuidado.

**Sub-segmentos con necesidades distintas:**

1. **Cuidador principal conviviente** — necesita respiro, registro rápido, alertas nocturnas fiables.
2. **Cuidador a distancia** ("caregiving remoto", hijos en otra ciudad/país) — necesita visibilidad, tranquilidad, forma de ayudar sin estar. *Sub-segmento con alta disposición a pagar: compra tranquilidad, no tiempo.*
3. **Círculo secundario** (hermanos, nietos, nueras/yernos) — necesita saber cómo ayudar sin invadir; hoy es fuente de conflicto ("tú no haces nada" / "tú no me dejas hacer nada").
4. **Cuidador profesional contratado** (empleada de hogar/auxiliar SAD) — bisagra operativa entre familia y paciente; suele estar excluida de la información. Incluirla con permisos limitados es una decisión de producto valiosa y poco frecuente en el mercado.

**Jobs-to-be-done del cuidador:**
- Funcional: "que no se me escape nada" (medicación, citas, síntomas nuevos).
- Emocional: "poder dormir una noche sin miedo"; "no sentirme sola en esto".
- Social: "que mis hermanos vean lo que hago y me ayuden de verdad"; "llegar al médico con datos y que me tome en serio".

---

### Segmento C — Profesional y red de apoyo (canal, prescriptor y futuro cliente B2B)

No es un segmento único; son cuatro actores con roles distintos en el go-to-market:

| Actor | Rol para nosotros | Qué necesita |
|---|---|---|
| **Neurólogo / geriatra / médico de primaria** | Prescriptor de confianza y consumidor de datos | Información longitudinal estructurada entre consultas (hoy decide con 15 min de consulta cada 6 meses y la memoria estresada del cuidador). Informes de 1 página, no dashboards |
| **Asociaciones de familiares (AFAs, Alzheimer's Association, CEAFA en España, federaciones locales en LatAm)** | **Canal de distribución nº 1 y socio de validación** | Herramientas para sus programas de apoyo; visibilidad de impacto. Son la puerta de entrada a entrevistas de Fase 1 |
| **Trabajador social / gestor de dependencia** | Prescriptor institucional | Coordinación del plan de cuidados; evidencia para valoraciones de dependencia |
| **Empresas de ayuda a domicilio (SAD), centros de día, teleasistencia** | Cliente B2B2C potencial (fase posterior) y competidor parcial | Diferenciarse ante familias; reducir rotación de auxiliares con mejor información |

**Decisión estratégica de Fase 1:** el profesional **no** es usuario del MVP. Es fuente de validación y canal. Construir para médicos desde el día 1 (integraciones HL7/FHIR, historia clínica) es el segundo error clásico del fundador primerizo: multiplica el coste regulatorio y el ciclo de venta antes de tener tracción con familias.

---

## 1.2 Los 3 problemas críticos del cuidado del Alzheimer en el hogar

> Criterio de selección: problemas (a) frecuentes, (b) dolorosos hasta el punto de que ya se paga o improvisa una solución, (c) abordables con software sin cruzar la frontera de dispositivo médico en el MVP (§3.2).

### Problema 1 — El dato del cuidado no existe: todo vive en la memoria agotada del cuidador

El deterioro es gradual y quien convive con él pierde la referencia ("¿está peor que hace tres meses o soy yo que estoy más cansada?"). Los síntomas nuevos, los episodios de agitación, los cambios de sueño y la adherencia a la medicación no se registran en ningún sitio — o se registran en libretas, notas del móvil y la memoria de una persona con sobrecarga cognitiva propia.

**Consecuencias medibles:** consultas médicas de baja calidad informativa; ajustes de medicación tardíos o a ciegas; crisis (hospitalizaciones, caídas, delirium) que eran predecibles por señales previas que nadie capturó; imposibilidad de demostrar el deterioro en valoraciones oficiales de dependencia.

**Solución improvisada actual (la verdadera competencia):** libreta + notas de WhatsApp a uno mismo + "ya se lo diré al médico".

### Problema 2 — El cuidador principal se quema en silencio y el sistema familiar no se coordina

El 60–85 % del cuidado recae en una sola persona (a validar en entrevistas, la literatura de sobrecarga del cuidador —escala de Zarit— respalda la concentración). La coordinación familiar ocurre en un grupo de WhatsApp caótico donde lo urgente sepulta lo importante, nadie sabe qué se ha hecho y qué falta, y la ayuda ofrecida ("dime si necesitas algo") nunca se convierte en tareas concretas.

**Consecuencias medibles:** depresión y ansiedad del cuidador (prevalencias muy superiores a población general); abandono laboral; conflictos fraternales que persisten tras el fallecimiento; claudicación del cuidado → institucionalización prematura del paciente, que es además el mayor coste del sistema.

**Este es el problema con mayor disposición a pagar y menor riesgo regulatorio.** El burnout del cuidador es el eje del MVP.

### Problema 3 — Inseguridad en el hogar: medicación, deambulación y detección tardía de emergencias

Tres riesgos concretos dominan el miedo cotidiano:
1. **Errores de medicación** — pautas complejas (anticolinesterásicos, antipsicóticos, anticoagulantes de comorbilidades), dobles tomas u omisiones, y un paciente que puede negarse o esconder pastillas.
2. **Deambulación errante (wandering)** — salir de casa y desorientarse; es el detonante nº 1 de la decisión de institucionalizar y la fuente principal del insomnio del cuidador.
3. **Emergencias silenciosas** — caídas, inmovilidad anómala, no responder al teléfono, cocina encendida.

**Solución improvisada actual:** cerrojos altos, esconder llaves, notas pegadas, llamadas de comprobación constantes, GPS genéricos mal adaptados, teleasistencia clásica de "botón rojo" que **el paciente con Alzheimer no sabe o no recuerda pulsar** (fallo estructural de la teleasistencia tradicional frente a demencia: exige iniciativa del usuario que precisamente ha perdido la iniciativa).

---

## 1.3 Propuesta de Valor Única (UVP) por segmento

### Marca paraguas (hipótesis de posicionamiento)

> **"El círculo de cuidado que tu familia necesita y tu madre merece."**
> Un ecosistema cerrado y privado donde toda la familia cuida junta, nadie carga solo y ningún detalle importante se pierde.

### UVP — Paciente

| Dimensión | Propuesta |
|---|---|
| **Emocional** | *"Seguir siendo tú, en tu casa, más tiempo."* Dignidad y autonomía prolongada: la tecnología te acompaña sin vigilarte como a un preso ni tratarte como a un niño. En fase leve: *"decide hoy cómo quieres ser cuidado mañana"* (agencia anticipada: mensajes grabados, fotos etiquetadas, preferencias registradas) |
| **Técnica** | Interfaz de **carga cognitiva cero**: nada que aprender, nada que recordar. Recordatorios por voz en altavoz con la voz de un familiar; wearable sin botones ni pantallas que exijan iniciativa; reconocimiento pasivo de rutinas. El paciente nunca "usa la app": la app le rodea |

### UVP — Cuidador familiar

| Dimensión | Propuesta |
|---|---|
| **Emocional** | *"No estás sola. Y por fin puedes dormir."* Convertimos la angustia difusa de 24/7 en un sistema: sabrás si pasa algo, y si no suena, es que no pasa nada. Y tu familia por fin verá —y compartirá— lo que llevas encima |
| **Técnica** | Un único panel del círculo de cuidado: alertas jerarquizadas con cadena de escalado (no 40 notificaciones, una que importa), registro de síntomas en 10 segundos, reparto de tareas con turnos visibles para toda la familia, e informe médico automático de 1 página para llevar a la consulta |

### UVP — Profesional / red de apoyo

| Dimensión | Propuesta |
|---|---|
| **Emocional** | *"Deja de decidir a ciegas entre consulta y consulta."* Ver la evolución real del paciente en su casa, no la foto fija de 15 minutos en tu despacho con un cuidador nervioso que no recuerda cuándo empezó el síntoma |
| **Técnica** | Informe longitudinal estandarizado (tendencias de sueño, conducta, adherencia, incidentes) generado por observación estructurada del cuidador; exportable en PDF de 1 página; diseñado con vocación futura de interoperabilidad (HL7 FHIR) sin exigir integración alguna en fase temprana. Para asociaciones: herramienta de apoyo a sus programas con métricas de impacto agregadas y anónimas |

**Regla de oro de mensajes (crítica para §3.2):** todas las UVP se formulan en lenguaje de *bienestar, organización y acompañamiento*. Ninguna promete *diagnosticar, tratar, predecir o monitorizar clínicamente* la enfermedad. Esa línea semántica es la frontera regulatoria del software como producto sanitario (MDR/FDA) y cruzarla por descuido en la web de marketing es un error de fundador primerizo con consecuencias legales reales.

---

## 1.4 Alternativas existentes y ventaja injusta

### Mapa competitivo (a actualizar con desk research en el sprint de validación; el mercado de apps de cuidado tiene alta mortalidad y estos actores deben verificarse uno a uno)

**Competencia directa (cuidado de demencia / coordinación familiar):**

| Categoría | Ejemplos de referencia | Qué hacen bien | Dónde fallan |
|---|---|---|---|
| Apps específicas de demencia | MindMate; apps de estimulación cognitiva; Tweri (deambulación, origen español) | Foco en el paciente | Mono-función; asumen un paciente capaz de usar pantalla; sin círculo familiar |
| Coordinación de cuidado familiar | Lotsa Helping Hands, CaringBridge, Ianacare, CircleOf | Círculo de ayuda, tareas | Genéricas (cualquier enfermedad), anglocéntricas, sin alertas ni seguimiento clínico-conductual |
| Recordatorio de medicación | Medisafe, MyTherapy | Adherencia excelente | Presuponen que el usuario que recibe el recordatorio puede actuar sobre él; no escalan al cuidador como actor principal |
| Teleasistencia y GPS senior | Tunstall, Atenzia, teleasistencia pública, Durcal, Neki, AngelSense | Hardware probado, canal institucional | Modelo "botón rojo" que exige iniciativa del usuario; datos aislados; nula dimensión familiar y conductual |
| Plataformas de cuidado a domicilio | Qida, Cuideo, Aiudo, Honor/Papa (EE. UU.) | Canal y confianza | Venden horas de cuidador, no continuidad de información; la familia sigue a ciegas |

**Competencia indirecta (la que de verdad nos mata si la ignoramos):**

1. **El sistema improvisado**: grupo de WhatsApp + libreta + pastillero semanal + llamadas + notas pegadas en la nevera. Coste cero, fricción cero de adopción, y *ya funciona más o menos*. Nuestro producto no compite contra otras apps: compite contra "más o menos".
2. **Alexa/Google Home con rutinas** configuradas por un hijo con perfil técnico.
3. **La cuidadora contratada** como "sensor humano" — para familias con recursos, resuelve la visibilidad.
4. **No hacer nada** (negación de la fase temprana de la enfermedad: el mayor competidor en fase leve es que la familia aún no ha aceptado el diagnóstico).

### Ventaja injusta

Con rigor de VC: *un propósito no es una ventaja injusta por sí solo* — no se puede comprar, pero tampoco bloquea a un competidor con más capital. La ventaja injusta real es lo que el propósito **hace posible y un competidor no puede copiar con dinero**:

1. **Autenticidad fundacional como palanca de confianza y comunidad.** La historia real del fundador (hijo/a de una madre fallecida por Alzheimer) abre puertas que el marketing no abre: asociaciones de familiares, grupos de apoyo, medios. En un mercado donde la compra es emocional y la confianza es la barrera nº 1, "esto lo construyó alguien que vivió lo mismo que tú" es un activo de distribución. **Se convierte en ventaja injusta solo si se institucionaliza**: comunidad propia de cuidadores, contenido, alianzas con AFAs con exclusividad práctica.
2. **Ecosistema cerrado por diseño = efecto red intrafamiliar + dato longitudinal propietario.** Cada familia que entra trae 3–8 usuarios (círculo de cuidado) con coste de adquisición marginal cero, y el valor del producto crece con cada miembro y cada mes de historia registrada. El coste de cambio emocional (ahí está la historia del cuidado de mamá: fotos, notas, hitos) es altísimo. Con escala, el dataset longitudinal conductual del Alzheimer en el hogar —que hoy no existe de forma estructurada en ningún sitio— es un activo científico y de negocio único (siempre bajo consentimiento y anonimización, §3.2).
3. **Foco vertical absoluto en demencia.** Los generalistas del cuidado senior no pueden permitirse diseñar para la asimetría radical paciente-que-no-puede-usar-pantalla; nosotros partimos de ella. La profundidad vertical (estadios GDS, sundowning, wandering, duelo anticipado) es una barrera de conocimiento de dominio.

**Riesgo honesto:** las tres ventajas son embrionarias. La Fase 1 debe empezar a construirlas (comunidad y alianzas), no solo enunciarlas.

### Lean Canvas — síntesis en una página

| Bloque | Contenido |
|---|---|
| **Problema** | 1) El dato del cuidado no existe. 2) Burnout del cuidador y descoordinación familiar. 3) Inseguridad en el hogar (medicación, wandering, emergencias) |
| **Segmentos** | Cuidador familiar (cliente/usuario) · Paciente por estadios (beneficiario) · Profesional/AFAs (canal, futuro B2B) |
| **UVP** | El círculo de cuidado cerrado: la familia cuida junta, nadie carga solo, nada importante se pierde |
| **Solución (concepto)** | Alertas jerarquizadas + coordinación familiar estructurada + registro observacional de 10 segundos |
| **Canales** | AFAs y asociaciones · comunidades online de cuidadores · prescripción de neurólogos/trabajadores sociales · contenido orgánico (historia fundacional) |
| **Ingresos (hipótesis)** | Freemium familiar → suscripción premium (cuidador a distancia como pagador probable) → B2B2C con aseguradoras/SAD/residencias en fase 3 |
| **Costes (hipótesis)** | Desarrollo, cumplimiento GDPR/seguridad, soporte humano (crítico en este público), coste de servidor/infra sanitaria |
| **Métricas clave** | Círculos activos semanales · nº de miembros por círculo · registros/semana · tiempo de respuesta a alertas críticas · NPS del cuidador · Zarit-lite trimestral (impacto) |
| **Ventaja injusta** | Autenticidad fundacional institucionalizada en comunidad + efecto red intrafamiliar + dato longitudinal vertical |

---

# 2. MAPEO DE SOLUCIONES Y ECOSISTEMA (alcance conceptual)

> **Alcance:** mapeo funcional, no especificación técnica. Objetivo: definir *qué* debe existir y *por qué*, y qué queda explícitamente fuera del MVP.

## 2.1 Módulo "Alertas y Recordatorios"

### Principio de diseño: la fatiga de alertas es el enemigo nº 1

Un sistema que grita todo el tiempo se silencia en dos semanas — y entonces la alerta que importaba de verdad muere silenciada con las demás. Es la causa de muerte más común de los productos de monitorización. Por tanto: **taxonomía estricta, presupuesto de notificaciones y cadena de escalado con acuse de recibo**.

### Taxonomía de alertas

**Nivel 1 — CRÍTICAS (interrumpen; requieren acuse de recibo; escalan si nadie responde):**

| Alerta | Disparador (conceptual) | Cadena de escalado |
|---|---|---|
| Salida de zona segura (wandering) | Geovalla del wearable/dispositivo del paciente | Cuidador principal → 2º contacto a los X min sin acuse → círculo completo → (opcional, configurado) teléfono de emergencias con ficha del paciente |
| Botón/gesto de ayuda | Pulsación o detección de caída del wearable | Idéntica, con tiempos más cortos |
| Inactividad anómala | Sin movimiento/rutina detectada en franja donde siempre la hay | Cuidador principal → verificación por llamada asistida → escalado |
| Medicación crítica omitida | Fármaco marcado como crítico por la familia (p. ej., anticoagulante) sin confirmación de toma en la ventana | Cuidador de turno → cuidador principal |
| Crisis conductual registrada | El cuidador presente pide ayuda al círculo ("episodio de agitación, necesito relevo") | Círculo completo — es una alerta *social*, no médica |

Reglas duras del nivel 1: sonido propio que atraviesa el modo silencio (con permiso del usuario), acuse de recibo obligatorio ("estoy en ello"), registro de quién respondió y en cuánto tiempo, y *test mensual de simulacro* para mantener la confianza en el sistema.

**Nivel 2 — IMPORTANTES (notifican sin interrumpir; se agrupan):**
- Recordatorio de medicación estándar (al cuidador de turno, no solo al paciente — diferencia clave frente a Medisafe).
- Cita médica en 24 h / hoy, con checklist de preparación (informes, preguntas al médico).
- Tarea del círculo sin asignar o sin completar (relevo de mañana sin cubrir).
- Desviación de patrón no urgente (tres noches seguidas de mal sueño → "coméntalo en la próxima consulta").

**Nivel 3 — INFORMATIVAS (resumen diario/semanal digest; nunca push individual):**
- Resumen del día del paciente ("día tranquilo: paseo, comió bien, siesta larga") — este resumen es oro emocional para el cuidador a distancia, y un momento de producto diario que crea hábito.
- Sugerencias de estimulación/actividad, contenido de la comunidad, hitos ("6 meses cuidando juntos").

**Recordatorios dirigidos AL PACIENTE (canal separado, filosofía distinta):**
- Solo por voz/ambiente (altavoz, wearable con voz), nunca exigiendo interacción de pantalla.
- Con la voz grabada de un familiar cuando sea posible ("Mamá, soy Ana, acuérdate de tomar la pastilla del desayuno") — la voz familiar multiplica la eficacia y la calidez frente al TTS genérico. *A validar clínicamente: en algunos pacientes la voz del familiar ausente puede generar confusión o angustia; debe ser configurable por familia.*
- Adaptativos al estadio: en fase leve, recordatorios de autonomía (citas, llaves, medicación); en moderada, orientación básica (día, hora, "hoy viene Carmen"); en avanzada, se desactivan — insistir a quien ya no puede procesar es maltrato involuntario.

### Configuración y gobernanza
- La familia define qué es crítico, los umbrales y las horas de silencio, con plantillas por estadio para no configurar desde cero.
- Turnos de guardia: las alertas de nivel 1–2 van primero al cuidador "de guardia" según el calendario del círculo — esto conecta alertas con coordinación y es el mecanismo anti-burnout central: *cuando no estás de guardia, puedes desconectar de verdad.*

## 2.2 Módulo "Mensajería y Coordinación Familiar" (anti-burnout)

### Principio de diseño: estructura sobre chat libre

Un chat libre reproduce el caos de WhatsApp que ya tienen (y contra WhatsApp no ganaremos en chat). El valor diferencial es la **comunicación estructurada alrededor del cuidado**:

**a) El Círculo de Cuidado (roles y permisos)**
- Roles: administrador del círculo (cuidador principal), cuidador familiar, cuidador profesional (permisos limitados: ve pautas y registra, no ve conversaciones familiares ni finanzas), observador (nieto adolescente, amiga íntima), profesional invitado (solo lectura de informes, temporal).
- Todo el modelo de privacidad del producto se apoya aquí: **ecosistema cerrado, invitación explícita, nada es público jamás**.

**b) Tablón de tareas y turnos (el corazón anti-burnout)**
- Calendario de cuidado compartido: quién está con el paciente cada franja; huecos visibles en rojo para que el círculo los vea sin que el cuidador principal tenga que *pedir* (pedir ayuda es la barrera psicológica nº 1; el producto convierte la petición en visibilidad).
- Tareas con dueño y fecha: recoger receta, acompañar al podólogo, comprar pañales, llamar al banco. Ofrecer ayuda se convierte en "coger" una tarea concreta.
- Contador de equidad (delicado; a validar): visibilidad suave de la distribución del cuidado. Bien diseñado, legitima al cuidador principal ante la familia; mal diseñado, es un marcador de reproches. Decisión de producto: mostrar contribución propia siempre, comparativas solo si el círculo lo activa por unanimidad.

**c) Diario de relevo (handoff)**
- Nota estructurada de 30 segundos al terminar un turno: cómo ha comido, ánimo, incidencias, pendientes. Plantilla de toques rápidos + audio opcional transcrito.
- Resuelve el "¿le diste la pastilla de las 3?" y alimenta directamente el módulo de seguimiento (§2.3) sin doble registro. **Regla de arquitectura funcional: cada dato se captura una sola vez y sirve a coordinación, seguimiento e informe médico a la vez.**

**d) Cuidar al cuidador (explícito, no accesorio)**
- Check-in emocional periódico del cuidador (versión ligera inspirada en Zarit, 4–6 preguntas mensuales, privado por defecto): detecta deterioro del cuidador y sugiere acciones (pedir relevo, recursos de respiro, grupos de apoyo de la AFA local).
- Botón "necesito un respiro": publica al círculo una petición de relevo sin tener que redactar la culpa.
- Recursos por etapa: contenido curado con asociaciones (qué esperar en cada fase, trámites de dependencia, autocuidado, duelo anticipado).

**e) Comunicación con el paciente**
- Videollamada simplificada hacia el dispositivo del paciente con contestación automática configurable (solo desde miembros del círculo, con señal previa por voz: "Mamá, te llama Ana, se abrirá la pantalla"). El consentimiento y la dignidad se gobiernan en §3.2.
- "Momentos": fotos y audios cortos del círculo que se muestran al paciente como marco digital — mantiene el vínculo con nietos y familiares lejanos con cero esfuerzo del paciente, y en fase leve el propio paciente puede responder.

## 2.3 Herramientas de seguimiento (registro conductual, cognitivo y físico)

### Principio de diseño: observación estructurada de 10 segundos, no historia clínica

El cuidador no es enfermero ni tiene tiempo. Cada registro debe hacerse en menos de 10 segundos con toques (chips predefinidos + intensidad + audio opcional). La exhaustividad es enemiga de la constancia; preferimos 5 señales registradas el 90 % de los días que 40 campos registrados una semana y abandonados.

**a) Registro conductual** (inspirado en la lógica del inventario neuropsiquiátrico NPI, sin reclamarlo como instrumento clínico):
- Episodios: agitación/agresividad, ansiedad vespertina (*sundowning*), deambulación nocturna, alucinaciones/delirios ("dice que le roban"), apatía, desinhibición, negativa a comer/medicarse/asearse.
- Formato ABC simplificado: qué pasaba antes (Antecedente), qué hizo (Conducta), cómo se resolvió (Consecuencia) — tres chips. El patrón ABC es lo que el neurólogo y el psicólogo necesitan para ajustar manejo no farmacológico, y ninguna app de consumo lo captura.
- Sueño: hora de acostarse/levantarse, despertares, siestas (manual o pasivo por wearable en fases posteriores).

**b) Registro cognitivo-funcional** (línea regulatoria: observación funcional sí, testeo diagnóstico no):
- Orientación observada: reconoce a familiares, sabe qué día es, se ubica en casa (escala de 3 niveles reportada por el cuidador, no un test al paciente).
- Actividades de la vida diaria (índice funcional tipo Barthel/Lawton simplificado): come solo, se viste, se asea, controla esfínteres — el marcador de progresión que determina estadio, necesidad de ayudas y grado de dependencia oficial.
- Lenguaje y comunicación: encuentra palabras, sigue conversaciones, repite preguntas (frecuencia).
- **Explícitamente fuera del MVP:** tests cognitivos administrados por la app (MMSE, MoCA) y cualquier "puntuación cognitiva" calculada. Eso es territorio de producto sanitario (§3.2) y de profesionales.
- Reminiscencia con métrica pasiva: el módulo "Momentos" (fotos familiares etiquetadas) registra engagement (sonríe, nombra, se agita) como observación del cuidador — valor emocional primero, señal longitudinal después.

**c) Registro físico:**
- Medicación: pauta completa con foto del medicamento, confirmación de toma por el cuidador de turno (no autoreporte del paciente), registro de rechazos.
- Caídas e incidentes: registro con contexto (dónde, cuándo, consecuencia) — la frecuencia de caídas es el predictor duro que todo geriatra pregunta.
- Alimentación e hidratación: semáforo por comida (bien/regular/poco) — la pérdida de peso y la deshidratación son las urgencias evitables más comunes.
- Peso (semanal), dolor en no verbales (escala observacional tipo PAINAD simplificada: gestos, quejidos, postura), estreñimiento/continencia (delicado pero clínicamente esencial; el delirium por retención/infección de orina es una urgencia clásica y evitable).
- Fase posterior (no MVP): integración de wearables (pasos, FC, sueño pasivo) y sensórica doméstica (apertura de puerta, presencia). El MVP es *human-in-the-loop*: el sensor es el círculo.

**d) Salidas del seguimiento (para qué sirve todo esto):**
1. **Tendencias visuales para la familia** ("el sueño empeora desde hace 3 semanas") — sin diagnósticos, solo patrones.
2. **Informe de consulta de 1 página** — generado automáticamente antes de cada cita médica: adherencia, incidentes, cambios conductuales, preguntas de la familia. Es el artefacto que conecta el segmento B con el C y el gancho de prescripción profesional.
3. **Evidencia para trámites de dependencia** — registro fechado y estructurado del deterioro funcional.
4. (Futuro, con consentimiento explícito y anonimización) contribución a investigación — el activo de dato longitudinal de §1.4.

---

# 3. ANÁLISIS DE RIESGOS INICIALES

## 3.1 Riesgo de adopción

### R1 — "¿Cómo interactúa un paciente con Alzheimer avanzado con la app?" — Respuesta: no lo hace, y esa es la decisión de diseño fundacional

- **Riesgo:** diseñar cualquier flujo que dependa de la iniciativa, memoria o aprendizaje del paciente. Fracasará y, peor, generará frustración y sensación de fracaso en el paciente ("ya ni esto sé hacer").
- **Mitigación estructural:** el paciente interactúa con *el ecosistema*, nunca con *la app*: voz ambiental, wearable sin fricción (mejor colgante/reloj que algo que hay que cargar a diario — **la carga de batería la gestiona el cuidador o no se gestionará**), pantalla pasiva tipo marco de fotos. Toda interacción del paciente debe superar el test: *"¿funciona si el paciente no recuerda que esto existe?"*
- **Riesgo derivado (punto ciego):** el producto debe **degradarse con dignidad** a lo largo de la progresión. Funciones útiles en GDS 3 son inútiles o dañinas en GDS 6. El producto necesita "modos por estadio" y transiciones acompañadas ("parece que los recordatorios de voz ya no ayudan; te sugerimos desactivarlos") — nadie quiere que una app le notifique que su madre ha empeorado; el lenguaje de estas transiciones es un trabajo de diseño emocional de primer orden.

### R2 — Adopción del cuidador: el usuario está en su peor momento vital

- El cuidador tipo tiene 50–65 años, alfabetización digital media-baja, cero tiempo y agotamiento. **Umbral de fricción: WhatsApp.** Onboarding < 5 minutos, un círculo funcional con 2 personas y 1 medicación ya da valor el día 1.
- **Punto ciego del fundador técnico:** este público necesita **soporte humano** (teléfono/WhatsApp de ayuda real), no un chatbot ni un centro de ayuda. El coste de soporte debe estar en el modelo de negocio desde el día 1; las AFAs pueden ser aliadas de onboarding asistido.
- Adopción del *círculo*: el producto solo despliega su valor con 3+ miembros. Riesgo de "cuidador solo en la app" = churn. Métrica de activación propuesta: círculo con ≥2 miembros activos + 1 rutina configurada en la primera semana.

### R3 — Churn estructural y el duelo como parte del producto (el punto ciego que casi ningún founder primerizo ve)

- La vida del cliente está acotada por la progresión: fallecimiento o institucionalización en un horizonte de 3–10 años, a menudo 2–4 desde que la familia busca herramientas. **El LTV tiene techo biológico.** Implicaciones: el CAC debe ser bajo (canal AFAs/comunidad, no paid), y el modelo debe contemplar la expansión (residencia como nuevo contexto B2B, o el círculo que repite con el segundo progenitor — realidad estadística dolorosa pero cierta).
- **Offboarding digno:** cuando el paciente fallece, la app no puede seguir enviando recordatorios de su medicación (error atroz y frecuente en productos genéricos). Diseñar el "cierre del círculo": silenciar todo inmediatamente, ofrecer exportar/conservar los recuerdos ("Momentos", el diario) como legado, acompañar el duelo con recursos y una despedida cuidada. Hecho con verdad, convierte a la familia en el prescriptor más potente que existe; hecho mal, es la reseña de 1 estrella más devastadora imaginable.

### R4 — Fatiga de alertas y falsa seguridad (dos caras del mismo riesgo)

- Exceso de alertas → silenciamiento → el sistema muere (mitigado por la taxonomía de §2.1).
- Riesgo inverso y más grave: **falsa sensación de seguridad**. Si la familia confía en que "la app avisará" y un fallo técnico (batería, cobertura, permisos de notificación del SO) silencia una alerta crítica real, el daño es físico y la responsabilidad, reputacional y legalmente, enorme. Mitigaciones obligatorias: monitorización del propio sistema (heartbeat: "el dispositivo de mamá lleva 3 h sin conexión"), simulacros mensuales, y comunicación honesta de límites ("esto complementa, no sustituye, la supervisión humana") — que además es exactamente la frontera regulatoria correcta (§3.2).

### R5 — Resistencia del propio paciente y conflicto familiar sobre la vigilancia

- En fase leve, el paciente puede rechazar ser "vigilado" (con razón: es una cuestión de dignidad). Mitigación: implicarle en fase temprana como *decisor* (agencia anticipada, §1.1) y encuadre de acompañamiento, no de control.
- Las familias discrepan (un hermano quiere GPS, otro lo considera indigno). El producto necesita valores por defecto conservadores y decisiones de círculo explícitas, no imposiciones silenciosas del administrador.

## 3.2 Riesgos legales y de privacidad médica (preliminar)

> **Descargo:** análisis preliminar de planificación, no asesoramiento jurídico. Acción obligada de Fase 1–2: presupuesto para asesoría especializada en protección de datos sanitarios y regulación de producto sanitario en el/los mercados objetivo (hipótesis: España/UE primero; si algún día EE. UU., análisis HIPAA/FTC específico).

### L1 — Datos de salud = categoría especial (GDPR art. 9 / marco iberoamericano)

- Casi todo lo que el producto registra (medicación, conducta, sueño, caídas, estadio) es **dato de salud**: categoría especial con prohibición general de tratamiento salvo excepciones tasadas (consentimiento explícito la principal para nosotros).
- Implicaciones de diseño desde el día 1 (*privacy by design*, art. 25): minimización (no capturar lo que no sirve al cuidado), cifrado en tránsito y reposo, registro de actividades de tratamiento, Evaluación de Impacto (**DPIA obligatoria**: datos de salud + personas vulnerables + geolocalización = tratamiento de alto riesgo de manual), DPO probablemente exigible, notificación de brechas en 72 h a la autoridad (AEPD en España).
- En España se suma la LOPDGDD; en LatAm, marcos análogos por país (Ley 25.326 Argentina, LGPD Brasil, etc.) — la arquitectura de consentimiento debe diseñarse para el más exigente (GDPR) y así viajar bien.

### L2 — El consentimiento de una persona que pierde la capacidad de consentir (el problema jurídico central y nuestra oportunidad de liderazgo ético)

- El paciente es el titular de los datos y de la imagen/localización, pero su capacidad de consentir se deteriora. Puntos ciegos concretos:
  - **Fase leve:** consentimiento explícito, informado y documentado del propio paciente, con lenguaje accesible — y aquí la "agencia anticipada" (§1.1) se convierte en pieza jurídica: *consentimiento anticipado* que expresa sus preferencias para fases posteriores (análogo en espíritu a las voluntades anticipadas sanitarias).
  - **Fase moderada/avanzada:** ¿quién consiente? En España, tras la Ley 8/2021 (reforma de la discapacidad), el modelo ya no es la incapacitación/tutela sino las **medidas de apoyo** (curatela, guardador de hecho) — la mayoría de las familias operan como *guardadores de hecho sin resolución judicial*. El producto debe registrar quién actúa en nombre del paciente y sobre qué base, sin exigir papeles que el 90 % de familias no tiene (equilibrio producto-derecho delicado: resolverlo con el asesor legal, no improvisarlo).
  - **Geolocalización y videollamada auto-contestada = las funciones de mayor riesgo ético-legal.** Proporcionalidad: activables por decisión documentada del círculo, con la mínima invasividad eficaz (geovalla antes que tracking continuo; señal sonora previa antes de abrir cámara), y revisables.
- **Posicionamiento estratégico:** ninguna alternativa del mercado trata esto con seriedad. Hacer del consentimiento evolutivo y la dignidad una *feature* visible ("así protegemos las decisiones de tu madre") es diferenciación real ante familias, asociaciones y —llegado el momento— inversores y reguladores.

### L3 — HIPAA: el malentendido clásico del founder HealthTech (aplicable solo si se entra en EE. UU.)

- **Punto ciego frecuente: "cumplimos HIPAA" como eslogan.** HIPAA solo aplica a *covered entities* (proveedores sanitarios, aseguradoras, clearinghouses) y sus *business associates*. Una app directa a consumidor **normalmente NO está bajo HIPAA**; está bajo la FTC (incl. la Health Breach Notification Rule, que la FTC ha aplicado activamente contra apps de salud). Decir "HIPAA-compliant" sin serlo es en sí mismo un riesgo de publicidad engañosa.
- HIPAA sí entraría si vendemos B2B2C a proveedores/aseguradoras estadounidenses (seríamos *business associate*, con BAA firmado). Conclusión de planificación: diseñar la seguridad a estándar alto (equivalente HIPAA Security Rule / ISO 27001 como norte), pero comunicar cumplimiento con precisión jurídica por mercado.

### L4 — La frontera del producto sanitario (MDR UE 2017/745 / FDA SaMD): el riesgo existencial silencioso

- Si el software **reclama finalidad médica** (diagnosticar, prevenir, monitorizar, predecir o tratar una enfermedad), es producto sanitario: en la UE, con la regla 11 del MDR, el software de decisión clínica cae fácilmente en **clase IIa o superior** → organismo notificado, sistema de calidad ISO 13485, evaluación clínica, años y cientos de miles de euros.
- **La frontera se cruza con palabras, no solo con código:** "detectamos el deterioro cognitivo" (producto sanitario) vs. "te ayudamos a organizar el cuidado y a llevar un diario para el médico" (bienestar/organización). El marketing, el App Store listing y hasta un tuit del fundador cuentan como *intended purpose*.
- **Estrategia de planificación:** MVP deliberadamente fuera de la definición de producto sanitario (organización, coordinación, registro observacional, comunicación), con revisión legal de todos los claims; y una **hoja de ruta regulatoria consciente** para el futuro (si algún día queremos scoring cognitivo o predicción de crisis, se planifica como producto sanitario con tiempo y capital, no se descubre por una carta de la autoridad competente).

### L5 — Otros riesgos preliminares del registro

- **Datos de terceros dentro del círculo:** el diario y el chat contienen datos de salud del paciente pero también datos personales de los miembros (incluido el check-in emocional del cuidador, que es dato de salud *del cuidador*). Cada miembro es titular de derechos; los permisos por rol de §2.2 son también arquitectura jurídica.
- **Fallecimiento del titular:** el GDPR no aplica a difuntos, pero la LOPDGDD (arts. 3 y 96) da derechos a herederos y personas vinculadas sobre acceso/supresión y voluntades digitales. Encaja con el "offboarding digno" (R3): el legado digital debe tener un tratamiento jurídico definido, no solo emocional.
- **Menores en el círculo** (nietos): consentimiento y experiencia diferenciados.
- **Responsabilidad civil por fallo de alerta** (conecta con R4): los términos de servicio deben delimitar honestamente que el sistema no es un dispositivo de emergencias certificado, sin letra pequeña abusiva que destruya la confianza — coherencia entre promesa de marketing y promesa legal.
- **Investigación futura con datos:** requerirá consentimiento separado, específico y revocable (nunca empaquetado en el alta), y anonimización robusta. Se decide en fase posterior, pero la arquitectura de consentimiento del día 1 debe dejar el hueco.

---

# CIERRE — Los 10 puntos ciegos del fundador primerizo en este proyecto (síntesis)

1. **El paciente no es el usuario.** Diseñar pantalla para quien pierde la iniciativa es fracasar con cariño.
2. **El cliente, el usuario y el pagador son personas distintas** — y el pagador con más disposición puede ser el hijo que vive lejos, no el cuidador presente.
3. **El competidor real es WhatsApp + libreta + "más o menos".** El listón no es otra app: es la fricción cero de lo improvisado.
4. **La fatiga de alertas mata el producto; la falsa seguridad mata la reputación.** Taxonomía estricta y honestidad sobre los límites.
5. **El LTV tiene techo biológico.** CAC bajo vía comunidad/AFAs o el modelo no cierra.
6. **El duelo es parte del customer journey.** El offboarding digno no es un edge case: es EL caso final de todos los clientes.
7. **"HIPAA-compliant" no significa lo que crees.** D2C ≈ FTC/GDPR; HIPAA llega con el B2B2C estadounidense.
8. **La frontera de producto sanitario se cruza con el marketing, no solo con el código.** Cada claim se revisa como si lo leyera el regulador — porque lo hará.
9. **El consentimiento de quien pierde la capacidad de consentir** es el problema jurídico central; convertirlo en feature de dignidad es la oportunidad ética y de marca.
10. **El propósito solo es ventaja injusta si se institucionaliza**: comunidad, alianzas con asociaciones y dato longitudinal propio. La historia abre la puerta; el sistema construido detrás es lo que un competidor con capital no puede copiar.

---

# PRÓXIMOS PASOS (salida de Fase 1)

| # | Acción | Criterio de éxito |
|---|---|---|
| 1 | **Entrevistas de problema** (metodología Mom Test): ≥25 cuidadores familiares (mitad principales, mitad a distancia), ≥8 profesionales, ≥3 asociaciones | ≥70 % confirma al menos 2 de los 3 problemas como "top-3 de su vida"; identificados ≥10 early adopters dispuestos a piloto |
| 2 | **Desk research competitivo actualizado** (verificar vigencia de cada actor de §1.4, precios, reseñas negativas como mina de insights) | Mapa competitivo con evidencia de fecha 2026 |
| 3 | **Consulta legal exploratoria** (protección de datos sanitarios + frontera MDR) en el mercado inicial | Dictamen preliminar sobre claims del MVP y arquitectura de consentimiento |
| 4 | **Alianza semilla con 1–2 asociaciones de familiares** | Acuerdo de colaboración para entrevistas y futuro piloto |
| 5 | Solo tras validar: **Fase 2 — definición de MVP, prototipo de baja fidelidad y test con círculos reales** | Este documento, corregido por la realidad |

*Documento vivo. Cada hipótesis marcada "a validar" debe salir de este papel y entrar en una conversación con una familia real. Ese es el homenaje: construir sobre la verdad de quienes están viviendo lo que vivisteis.*
