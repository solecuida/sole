# FASE 2 — ARQUITECTURA TÉCNICA Y SEGURIDAD
## Ecosistema digital de acompañamiento para personas con Alzheimer y sus familias

**Documento de planificación arquitectónica — v1.0**
**Fecha:** 10 de julio de 2026
**Estado:** Borrador para revisión técnica y legal
**Clasificación:** Interno — Fundación del proyecto
**Documento predecesor:** [FASE-1-Descubrimiento-y-Validacion.md](FASE-1-Descubrimiento-y-Validacion.md)

---

> **Nota metodológica.** Este documento traduce las decisiones de producto y las restricciones legales de la Fase 1 a decisiones de arquitectura. No contiene código: contiene *decisiones justificadas*, cada una con sus alternativas descartadas y su porqué, en formato apto para due diligence técnica de inversión. Donde la Fase 1 dijo "hipótesis a validar", aquí decimos "decisión reversible vs. irreversible": las irreversibles (modelo de datos de consentimiento, residencia de datos, particionado de PHI) se toman con máximo rigor; las reversibles (framework de UI, proveedor de push) se toman rápido y se documentan como sustituibles.

### Restricciones heredadas de la Fase 1 (contrato de esta arquitectura)

Toda la arquitectura que sigue está subordinada a estas seis restricciones. Si una decisión técnica contradice una de ellas, la decisión técnica está mal:

| # | Restricción de Fase 1 | Consecuencia arquitectónica |
|---|---|---|
| C1 | El MVP es producto de **bienestar/organización**, no producto sanitario (MDR regla 11) | Ningún componente de "scoring", predicción ni decisión clínica en el MVP. La arquitectura deja *hueco versionado* para ello (§1.1.6), no lo implementa |
| C2 | Mercado inicial **España/UE**; GDPR art. 9 como estándar máximo; HIPAA como norte de seguridad, no como claim | Residencia de datos en regiones UE; arquitectura "HIPAA-eligible" sin comunicar "HIPAA-compliant" (§2.1.5) |
| C3 | La **falsa seguridad mata** (R4): un fallo silencioso de alerta crítica es el peor escenario del producto | El camino de la alerta crítica es el componente con mayor presupuesto de fiabilidad de todo el sistema; se diseña como sistema de misión crítica, el resto no (§1.1.3, §3.2) |
| C4 | El paciente **no interactúa con la app**; el dispositivo del paciente es pasivo y su batería/conectividad la gestiona el cuidador | El sistema asume dispositivos de paciente intermitentes por diseño: heartbeat, degradación explícita y honestidad de estado (§3.2.2) |
| C5 | El **círculo de cuidado** con roles (admin, familiar, profesional limitado, observador, profesional invitado) es la unidad de privacidad | El círculo es la unidad de autorización (tenancy lógica) en todos los servicios y en el modelo de datos (§2.2) |
| C6 | **Consentimiento evolutivo** (fase leve → moderada → avanzada, Ley 8/2021, guardador de hecho) y offboarding digno (R3/L5) | El consentimiento es un servicio de primer orden con historial inmutable, no una columna booleana (§2.2.4); existe un flujo de "cierre del círculo" con semántica de datos definida (§2.3.5) |

---

# 1. ARQUITECTURA DE SOFTWARE Y STACK RECOMENDADO

## 1.1 Estilo arquitectónico: ni microservicios puros ni serverless puro

### 1.1.1 El análisis honesto de las dos opciones de moda

**Microservicios puros (estilo Netflix/Uber):** decenas de servicios pequeños, un equipo por servicio, despliegue independiente.

- *A favor:* aislamiento de fallos, escalado granular, autonomía de equipos.
- *En contra para nosotros:* somos una startup de 2–6 ingenieros durante los próximos 18–24 meses. Los microservicios resuelven un problema **organizacional** (muchos equipos pisándose) que no tenemos, y a cambio importan toda su fiscalidad: red entre servicios, trazabilidad distribuida, contratos de API internos, consistencia eventual en todas partes, y un coste operativo que en HealthTech se multiplica porque **cada frontera de red entre servicios es una superficie de auditoría** (¿viaja PHI por ese canal? ¿está cifrado? ¿está logado?). El consejo de la industria es unánime y aburrido: *no empieces con microservicios; extrae servicios cuando el dominio te lo pida.*

**Serverless puro (todo Lambda/Cloud Functions):**

- *A favor:* coste cero en reposo (relevante: de noche casi no hay tráfico… excepto las alertas), escalado automático, menos superficie de parcheo (relevante para cumplimiento).
- *En contra para nosotros:* los **cold starts** son inaceptables en el camino de alerta crítica (una Lambda fría + VPC + conexión a base de datos puede añadir segundos en el peor momento posible); las conexiones WebSocket persistentes y el fan-out en tiempo real encajan mal en el modelo puramente efímero; y el debugging distribuido de cien funciones sueltas es una forma sofisticada de perder los primeros seis meses.

### 1.1.2 Decisión: **monolito modular + carril crítico segregado**, evolución event-driven

La arquitectura recomendada tiene tres piezas, y la separación entre las dos primeras es *la* decisión estructural de este documento:

**Pieza A — El "Core" (monolito modular contenedorizado).**
Un solo desplegable con módulos internos de frontera estricta (enforced por el sistema de módulos del lenguaje y por revisión de arquitectura), corriendo en contenedores auto-escalados (ECS Fargate en AWS / Cloud Run en GCP). Módulos:

- `circles` — círculos, miembros, roles, invitaciones (el corazón de la autorización, C5).
- `care-log` — registro observacional de 10 segundos, diario de relevo, medicación (§2.3 de Fase 1).
- `coordination` — tareas, turnos de guardia, calendario de cuidado.
- `moments` — fotos, audios, legado (datos con semántica emocional y jurídica propia, L5).
- `reports` — generación del informe de consulta de 1 página (asíncrono).
- `notifications-n2-n3` — notificaciones importantes e informativas y digests (los niveles 2 y 3 de la taxonomía de Fase 1 §2.1 **viven en el Core**, no en el carril crítico).
- `consent` — el servicio de consentimiento evolutivo (§2.2.4). Módulo interno hoy; es el primer candidato a extraerse como servicio porque lo consultan todos los demás.
- `billing` — suscripciones (Stripe), aislado porque nunca debe mezclarse con PHI.

*Por qué monolito modular:* una sola base de datos transaccional para el 90 % de los casos de uso (ACID gratis, sin sagas), un solo pipeline de despliegue que auditar, una sola superficie de cumplimiento, y velocidad de producto — que es la variable de supervivencia real de la startup. Las fronteras modulares internas preservan la opción de extraer microservicios más adelante *por costura natural, no por cirugía*.

**Pieza B — El "Carril Crítico de Alertas" (servicio segregado, siempre caliente).**
Un servicio pequeño, separado física y lógicamente del Core, que implementa exclusivamente el **Nivel 1** de la taxonomía de alertas de Fase 1: recepción de eventos de riesgo (geovalla, caída/botón, inactividad anómala, medicación crítica, crisis conductual), la **máquina de estados de escalado** (cuidador de guardia → 2º contacto → círculo → teléfono configurado), el acuse de recibo y el registro forense de quién respondió y cuándo.

Características no negociables del carril crítico:

1. **Siempre caliente:** instancias reservadas mínimas (nunca escala a cero, nunca cold start). Su coste fijo es el "seguro" del producto y se presupuesta como tal.
2. **Dependencias mínimas:** no depende del Core para decidir escalar una alerta. Mantiene una **réplica local de solo-lectura** de lo único que necesita (miembros del círculo, cadena de escalado, tokens de push, teléfonos), sincronizada por eventos. Si el Core está caído, las alertas críticas siguen saliendo.
3. **Multi-canal por diseño:** push (FCM/APNs con prioridad máxima), y si no hay acuse en X segundos, degradación automática a SMS y a **llamada de voz sintetizada** (Twilio/Amazon Connect). El push no es fiable al 100 % (Doze mode, permisos revocados, App Standby) y este producto no puede permitirse descubrirlo en producción. La llamada de voz es además el canal más apropiado para el perfil demográfico del cuidador (55–65 años): el teléfono sonando *significa* urgencia.
4. **Idempotencia y deduplicación:** una geovalla que oscila (GPS drift en el borde de la zona segura) no puede generar 14 alertas. Ventanas de deduplicación e histéresis espacial (§3.1.4).
5. **Registro append-only:** cada transición de la máquina de estados de cada alerta se registra en almacenamiento inmutable con sello temporal. Es la evidencia ante la pregunta legal de L5 ("¿el sistema avisó?") y el insumo del simulacro mensual prometido en Fase 1.

**Pieza C — El bus de eventos (la espina dorsal de la evolución).**
Desde el día 1, todo hecho de dominio relevante se publica como evento (`RegistroCreado`, `TomaMedicacionConfirmada`, `SalidaZonaSegura`, `TurnoSinCubrir`, `MiembroInvitado`, `ConsentimientoRevocado`): EventBridge/SNS+SQS en AWS, Pub/Sub en GCP. Consumidores iniciales: el carril crítico (su réplica local), el generador de digests, el pipeline de analítica anonimizada (§2.3). Esto compra tres cosas: desacoplamiento sin microservicios, un **registro de auditoría natural**, y el camino de crecimiento — cuando un módulo del Core necesite escalar o aislarse, ya se comunica por eventos y la extracción es mecánica.

**Funciones serverless: sí, en los bordes.** Lambdas/Cloud Functions para lo que son excelentes: generación asíncrona del informe PDF, transcripción de audios del diario, redimensionado de fotos de "Momentos", digests programados, webhooks de Stripe. Nada de eso está en un camino crítico de latencia y todo tiene tráfico irregular: el perfil serverless perfecto.

### 1.1.3 Presupuestos de disponibilidad diferenciados (la decisión que un auditor de inversión querrá ver)

Prometer "99,99 % en todo" es de amateur: cuesta una fortuna y no distingue lo que importa. Presupuestos explícitos por camino:

| Camino | Objetivo (SLO) | Justificación |
|---|---|---|
| **Ingesta + escalado de alerta crítica (extremo a extremo: evento → primer canal disparado)** | 99,95 % mensual; p99 < 5 s | C3. Es el contrato moral del producto. Multi-AZ activo-activo, siempre caliente, multi-canal |
| Acuse de recibo y visualización de alerta | 99,9 % | Depende también del dispositivo del cuidador; el sistema compensa con reintentos multi-canal |
| API del Core (registro, tareas, chat del círculo) | 99,5 % | Una hora de mantenimiento nocturno no daña a nadie; el móvil tiene modo offline (§1.2.4) |
| Informes, digests, "Momentos" | 99 % / best-effort | Asíncrono por naturaleza |

Esta tabla es también la respuesta corta a "¿microservicios o serverless?": *la pregunta correcta era qué caminos merecen qué garantías*, y la arquitectura segrega exactamente por esa línea.

### 1.1.4 API y contratos

- **API pública móvil→backend:** REST/JSON sobre HTTPS con OpenAPI 3 como contrato versionado (`/v1/…`). GraphQL se descarta en MVP: su flexibilidad de consulta complica el razonamiento de autorización por rol (C5) — con REST, cada endpoint tiene una política de acceso auditable; con GraphQL, cada resolver la necesita.
- **Tiempo real hacia apps:** WebSocket gestionado (§3.1.2) para presencia, chat del círculo y estado vivo de alertas; push como mecanismo de despertar cuando la app no está en primer plano. Regla: **el WebSocket es una optimización de experiencia; ninguna garantía crítica depende de que esté conectado.**
- **Ingesta desde dispositivos del paciente (wearable/tracker):** MQTT sobre TLS (AWS IoT Core / un broker gestionado) — el estándar de facto para dispositivos con batería y conectividad pobre; soporta QoS 1 (at-least-once), sesiones persistentes y last-will (el broker detecta la desconexión del dispositivo → alimenta el heartbeat de C4).
- **Rate limiting y cuotas (endpoint por endpoint, no un límite global):** el API Gateway aplica throttling por API key/usuario desde el día 1, pero el límite duro que importa es sobre los **endpoints caros**, no sobre el CRUD normal:
  - *Endpoints que consumen IA o cómputo asíncrono pesado* (transcripción de audio del relevo/diario S3-01, generación del informe PDF S3-06, cualquier resumen o extracción con LLM): cuota diaria por círculo (no por request) más un límite de tamaño de entrada (duración de audio, longitud de texto). Motivo de negocio, no solo técnico: son los únicos endpoints con coste variable por uso — sin cuota, un círculo con un bug de reintento en el cliente puede quemar en una noche el margen de varios meses de esa familia.
  - *Ingesta de geolocalización/heartbeat del dispositivo del paciente* (§1.1.3, §3.1.4): límite de frecuencia por dispositivo en el broker MQTT (además de la deduplicación por histéresis espacial ya descrita), para que un dispositivo con firmware defectuoso no inunde el carril crítico — sin que ese límite pueda nunca retrasar o descartar la *primera* alerta de una geovalla real.
  - *Endpoints de autenticación* (login, recuperación de contraseña, invitación al círculo): throttling agresivo por IP y por cuenta para mitigar fuerza bruta y credential stuffing — el mínimo exigible de OWASP ASVS, independiente de si el resto de la API tiene tráfico bajo.
  - El resto de la API del Core (registro, tareas, chat) usa el límite por defecto del API Gateway; no necesita presupuesto propio porque su coste marginal por request es plano.
  - Toda respuesta `429` se registra como evento de negocio (no solo de infraestructura): un círculo que choca contra su cuota repetidamente es una señal de producto (¿la cuota es demasiado baja para el uso real?) tanto como una señal de seguridad.

### 1.1.5 Backend: lenguaje y framework (recomendación con alternativa válida)

**Recomendación: TypeScript/Node.js (NestJS) para el Core + el carril crítico.**

- Un solo lenguaje en backend y frontend móvil (si se elige React Native) o al menos en backend y web reduce el coste de contexto de un equipo diminuto.
- NestJS impone la modularidad que el monolito modular necesita (módulos, inyección de dependencias, guards de autorización declarativos — estos últimos son literalmente la implementación del RBAC de §2.2).
- El ecosistema de SDKs de AWS/GCP, Stripe, Twilio y FCM es de primera clase.
- El perfil de carga es I/O-bound (notificaciones, mensajería, CRUD): el punto dulce de Node.

*Alternativa igual de defendible:* **Go** para el carril crítico (latencias más predecibles, sin GC pauses relevantes, binario mínimo) manteniendo NestJS en el Core. Es una optimización que puede hacerse *después* sin romper nada, precisamente porque el carril es un servicio separado. Se descarta Python como lenguaje principal de backend (no por calidad, sino porque su ventaja —ecosistema de datos/IA— pertenece a la fase de analítica, donde sí se usará en los pipelines de §2.3).

### 1.1.6 El "hueco versionado" para el futuro producto sanitario (C1)

La Fase 1 exige que la hoja de ruta regulatoria sea consciente. Traducción arquitectónica: si algún día se construye scoring cognitivo o predicción de crisis (clase IIa+), será un **servicio nuevo, aislado, con su propio ciclo de vida documentado bajo IEC 62304** (software de dispositivo médico), consumiendo datos del bus de eventos mediante una interfaz contractual. El sistema actual no necesita cumplir IEC 62304 — pero el bus de eventos y la calidad del dato longitudinal (esquemas versionados, §1.3.6) son lo que hará posible ese módulo sin reescribir la plataforma. Decisión de hoy que compra la opción de mañana: **esquemas de eventos versionados y documentados desde el día 1** (schema registry ligero, aunque sea un directorio de JSON Schemas en el repositorio).

---

## 1.2 Stack móvil multiplataforma: accesibilidad y rendimiento de fondo

### 1.2.1 El matiz que cambia la decisión: son DOS aplicaciones con requisitos opuestos

El error de encuadre sería elegir "un framework para la app". Hay dos artefactos con perfiles técnicos casi opuestos:

| | **App del Cuidador** | **App/Dispositivo del Paciente** |
|---|---|---|
| Usuario | Cuidador 45–65 años, alfabetización media | Nadie (C4): interacción pasiva o nula |
| Requisito dominante | Accesibilidad, claridad, fiabilidad de notificaciones | **Ejecución en segundo plano permanente** (geofencing, heartbeat), consumo mínimo de batería |
| Interacción | Diaria, rica (registro, tareas, chat) | Cero exigida; marco de fotos / voz ambiental |
| Riesgo técnico | Fatiga de permisos de notificación | Que el SO mate el proceso de tracking |

### 1.2.2 App del Cuidador: **Flutter**

**Recomendación: Flutter** sobre React Native, y ambos sobre nativo puro (dos codebases nativas son inviables con este tamaño de equipo).

Justificación específica para *este* producto (no la comparativa genérica de blog):

1. **Consistencia de render para accesibilidad:** Flutter pinta sus propios píxeles (motor Impeller), de modo que el tema de accesibilidad —tipografías grandes, contrastes AAA, objetivos táctiles de 48dp+— se comporta **idéntico en el Android de gama media de 2021 y en el iPhone del hijo que vive fuera**. Con React Native, los componentes puente-nativos divergen sutilmente por plataforma y versión de SO; en un público que no tolera fricción (el listón es WhatsApp, Fase 1 §R2), esa divergencia es coste de soporte.
2. **Soporte de accesibilidad maduro:** integración completa con TalkBack/VoiceOver, `Semantics` como ciudadano de primera clase, escalado de texto del sistema respetado por defecto. Compromiso de diseño formal: **WCAG 2.2 AA como mínimo, AAA en contraste y tamaño de toque** para las pantallas de uso diario (registro de 10 segundos, alertas, medicación).
3. **Rendimiento en gama media-baja:** el cuidador tipo en España/LatAm no lleva un flagship. Flutter compilado AOT rinde de forma más predecible que el puente JS en dispositivos modestos.
4. **Un solo equipo, una sola suite de tests de UI** para la matriz de dispositivos.

*Lo que se pierde y se acepta:* el ecosistema JS/TS compartido con el backend (si el equipo fundador fuera fuertemente React, React Native sería defendible — es una decisión reversible de coste medio; se documenta y se sigue adelante).

**Decisiones de accesibilidad que van más allá del framework** (y que ningún framework regala):

- Modo "texto grande permanente" propio, no dependiente de que el usuario sepa configurar su SO.
- Navegación de profundidad máxima 2 desde el home para toda acción diaria; las acciones críticas (ver alerta, confirmar toma) a profundidad 0–1.
- Cero gestos no descubribles (nada de swipe-to-action como único camino).
- Contenido de voz: todas las alertas críticas se pueden *escuchar*, no solo leer.
- Idioma: español como primera lengua de diseño (no traducción), con arquitectura i18n desde el día 1 para portugués/catalán/inglés.

### 1.2.3 Dispositivo/App del Paciente: estrategia por capas, no una app

Coherente con Fase 1 ("el paciente nunca usa la app"):

- **MVP (human-in-the-loop):** el "sensor" es el círculo. El teléfono del paciente —si existe y la familia lo decide (consentimiento §2.2.4)— ejecuta un **agente pasivo mínimo**: geofencing y heartbeat. Aquí la recomendación es **módulo nativo** (Kotlin + `GeofencingClient` de Google Play Services; Swift + Core Location Region Monitoring), aunque el cascarón sea Flutter. Motivo técnico duro: el geofencing fiable en segundo plano **debe** delegarse a las APIs de geovallas del SO (que usan torres de telefonía/Wi-Fi y despiertan a la app solo al cruzar el perímetro) y no a un bucle GPS del framework — es la única forma de sobrevivir a Doze/App Standby (Android) y a la suspensión de iOS con consumo de batería aceptable (C4: la batería la gestiona el cuidador; cada punto porcentual de consumo es una conversación difícil menos).
- **Fase 2 de producto:** wearable comercial con SDK (p. ej. smartwatch con eSIM para independencia del teléfono) o dispositivo GPS dedicado tipo colgante con MQTT directo al broker (§1.1.4). La arquitectura de ingesta ya lo soporta sin cambios: es *otro publicador* de los mismos eventos.
- **Pantalla pasiva ("Momentos"):** tablet Android en modo kiosco (Fully Kiosk / Android Enterprise dedicated device) renderizando una vista web simplísima. No merece app propia en MVP.

### 1.2.4 Offline-first en la app del cuidador (consecuencia directa de C3/C4)

El registro de 10 segundos y el diario de relevo **funcionan sin conexión** y se sincronizan después (cola local persistente con resolución last-write-wins por campo + sello temporal; los conflictos reales son raros porque cada registro tiene un solo autor). La visualización de "última posición conocida" y "último heartbeat" muestra **siempre la antigüedad del dato** ("hace 4 h") — nunca una posición vieja como si fuera actual. Es la traducción a UI del principio anti-falsa-seguridad.

---

## 1.3 Estrategia de bases de datos: polyglot persistence con frontera de PHI

### 1.3.1 Principio rector: separar por *régimen jurídico y patrón de acceso*, no por moda

Cada almacén se elige respondiendo tres preguntas: ¿qué régimen de protección tiene el dato (PHI art. 9 / personal ordinario / anonimizado)?, ¿cuál es su patrón de escritura/lectura?, ¿cuál es su ciclo de vida (retención, borrado, legado)? El resultado es una topología de cinco almacenes:

### 1.3.2 Almacén 1 — **PostgreSQL gestionado** (Aurora PostgreSQL / Cloud SQL): el sistema de registro relacional

**Contiene:** usuarios y cuentas, círculos, miembros y roles, invitaciones, **el modelo de consentimiento** (§2.2.4), pautas de medicación, tareas y turnos, configuración de alertas y cadenas de escalado, suscripciones (referencias a Stripe, nunca PANs), y el **catálogo maestro de pacientes** con los identificadores pseudonimizados (§2.1.4).

**Por qué relacional y por qué PostgreSQL:** este dominio es un grafo denso de relaciones con invariantes duras (un profesional limitado no puede ver X; una revocación de consentimiento debe cascar en todas las vistas) — integridad referencial y transacciones ACID no son negociables aquí. PostgreSQL además aporta **Row-Level Security (RLS)** nativa, que usaremos como *segunda línea* de defensa del RBAC (§2.2.3): incluso si un bug de aplicación olvida un filtro, la base de datos se niega a devolver filas de otro círculo. Es defensa en profundidad demostrable ante un auditor.

**Decisión de tenancy:** multi-tenant lógico por `circle_id` en cada tabla con RLS, no una base por familia (inviable operativamente) ni schema-per-tenant (complejidad de migraciones sin beneficio a esta escala). El `circle_id` es obligatorio, indexado y verificado por RLS en toda tabla que contenga datos de cuidado.

### 1.3.3 Almacén 2 — **Serie temporal / documental** para el dato observacional y de telemetría

**Contiene:** registros observacionales (conductual ABC, sueño, comidas, caídas — el `care-log`), confirmaciones de toma, eventos de dispositivo (heartbeats, batería, cruces de geovalla), historial de posiciones (mínimo imprescindible, ver §2.1.6), y el **log append-only de la máquina de estados de alertas**.

**Patrón:** escritura continua de eventos inmutables, lectura por rangos temporales ("el sueño de las últimas 3 semanas"), agregaciones para tendencias e informes. Nunca se actualiza, solo se añade (una corrección es un evento de corrección — semántica de bitácora clínica y de auditoría).

**Recomendación concreta: TimescaleDB (extensión de PostgreSQL) en el MVP**, evolucionando a DynamoDB/Bigtable solo si el volumen lo exige.

- *Por qué Timescale primero:* mantiene TODO el dato bajo el mismo motor (una sola superficie de cifrado, backup, RLS y auditoría — enorme para cumplimiento), da compresión automática por chunks e hipertables particionadas por tiempo, y las consultas de tendencia del informe médico son SQL directo.
- *Por qué no DynamoDB desde el día 1:* su modelo de acceso hay que diseñarlo alrededor de consultas conocidas de antemano; en fase de descubrimiento de producto, el esquema de consultas cambiará mensualmente. La regla de decisión documentada: **si un círculo medio supera ~50 escrituras/minuto sostenidas o superamos ~200 GB de serie temporal caliente, se migra la telemetría de dispositivos (solo ella) a DynamoDB/Bigtable.** Las coordenadas y heartbeats son el único dato con perfil real de "big data"; el registro humano de 10 segundos jamás lo será (es tecleado por humanos).

### 1.3.4 Almacén 3 — **Objetos** (S3 / Cloud Storage): blobs y evidencia

**Contiene:** fotos y audios de "Momentos", audios del diario (y sus transcripciones), informes PDF generados, y los **exports del legado** (offboarding digno, §2.3.5). Cifrado SSE-KMS por defecto, buckets segregados por sensibilidad (`media-phi/`, `reports-phi/`, `legacy-exports/`), acceso exclusivamente por URLs prefirmadas de vida corta emitidas por el Core tras la comprobación RBAC — **nunca buckets públicos, nunca URLs adivinables**. Lifecycle policies alineadas con el calendario de retención (§2.1.6).

### 1.3.5 Almacén 4 — **Caché/efímero** (Redis gestionado): estado vivo

Presencia de WebSocket, deduplicación de alertas en ventana, rate-limits, sesiones. **Regla dura: Redis no persiste PHI.** Todo lo que pasa por él es reconstruible desde los almacenes 1–2; su pérdida total degrada latencia, no verdad.

### 1.3.6 Almacén 5 — **Zona analítica separada** (data lake mínimo): el activo longitudinal

El pipeline de eventos (§1.1.2-C) alimenta, mediante un proceso de **pseudonimización/anonimización irreversible** (§2.3), un almacén analítico físicamente separado (S3+Athena/Glue o BigQuery) en **otra cuenta/proyecto cloud** con otro perímetro IAM. Aquí viven las métricas de producto y, en el futuro y con consentimiento separado (L5), el dataset de investigación. La separación física de cuentas es deliberada: un acceso indebido a analítica *no puede* alcanzar PHI identificada, y la frontera es demostrable en auditoría.

**Sobre bases de datos vectoriales (mencionadas en el encargo):** hoy **no** — no hay caso de uso de recuperación semántica en el MVP y añadir infraestructura sin caso de uso es exactamente el error que este documento existe para evitar. El hueco queda definido: cuando exista el asistente de recursos para cuidadores ("¿cómo manejo el sundowning?") sobre el contenido curado con las AFAs, la búsqueda semántica se resuelve con **pgvector sobre el mismo PostgreSQL** (contenido público, sin PHI, sin nueva pieza de infraestructura). Si algún día se hace RAG sobre el diario del propio círculo, será un proyecto con DPIA propia — los embeddings de texto clínico-conductual son PHI a todos los efectos y se tratan como tal.

### 1.3.7 Mapa resumen

| Dato | Almacén | Régimen | Cifrado | Retención |
|---|---|---|---|---|
| Identidad, círculos, roles, consentimiento | PostgreSQL | Personal + art. 9 | TDE + campo (§2.1.3) | Vida de la cuenta + obligaciones legales |
| Registro observacional, medicación | TimescaleDB (mismo clúster) | **PHI art. 9** | TDE + campo selectivo | Configurable por familia; default 5 años |
| Posiciones y heartbeats | TimescaleDB → (futuro) DynamoDB | **PHI art. 9** (localización) | TDE | **Mínima: 72 h posición fina; agregados después** (§2.1.6) |
| Fotos, audios, informes | S3/GCS | PHI + imagen | SSE-KMS | Vida del círculo + legado |
| Estado vivo (presencia, dedup) | Redis | Ninguno persistente | En tránsito | Minutos |
| Analítica / investigación | Lake separado (otra cuenta) | Anonimizado | SSE-KMS | Indefinida solo si anonimización robusta validada |

---

# 2. SEGURIDAD Y CUMPLIMIENTO REGULATORIO (GDPR primero, HIPAA como norte)

## 2.1 Encriptación y protección del dato

### 2.1.1 En tránsito

- **TLS 1.3** (mínimo aceptado 1.2 con suites AEAD) en absolutamente todo canal externo: apps→API, dispositivos→MQTT (TLS mutuo con certificado por dispositivo, provisionado en el enrolamiento), webhooks. HSTS, y **certificate pinning en las apps móviles** contra el intermediario de red hostil (Wi-Fi públicas, SSL-strip) — con plan de rotación de pins documentado para no auto-bloquearse.
- **Interno:** dentro de la VPC, TLS también entre servicios (el "perímetro seguro" interno sin cifrar es una fe que los auditores ya no comparten): mTLS vía service mesh ligero o, más pragmático a nuestra escala, TLS terminado en cada servicio con certificados de ACM Private CA. Cifrado en tránsito hacia las bases de datos y Redis activado siempre (es una casilla, no un proyecto).

### 2.1.2 En reposo — la capa base

**AES-256** en todos los almacenes vía KMS gestionado (AWS KMS / Cloud KMS) con **CMKs propias por dominio de datos** (una clave para PHI relacional, otra para objetos multimedia, otra para backups, otra para la zona analítica): la segregación de claves convierte "acceso a una clave" en "acceso a un dominio", no a todo. Rotación anual automática, política de claves con separación de roles (quien administra KMS no accede a datos), y **CloudTrail/Cloud Audit Logs sobre cada uso de clave** — el registro de uso de claves es una de las evidencias más apreciadas en due diligence de seguridad.

### 2.1.3 Cifrado a nivel de campo/aplicación — la capa que de verdad protege PHI

El cifrado de disco (TDE) protege contra el robo del disco, no contra la consulta indebida con credenciales válidas — que es el riesgo real. Por eso, **cifrado adicional a nivel de aplicación (envelope encryption vía KMS) para las categorías de máxima sensibilidad**:

- Identificadores directos del paciente (nombre, dirección del domicilio = centro de la zona segura).
- Contenido libre del diario y transcripciones (texto clínico-conductual).
- El check-in emocional del cuidador (PHI *del cuidador*, L5 — y además con visibilidad "privado por defecto" reforzada aquí).
- Coordenadas de geolocalización en reposo.

Con esto, un volcado de la base de datos (backup extraviado, SQL injection, insider con acceso de lectura) expone estructura pero no contenido sensible. Coste asumido: esos campos no son consultables por SQL directamente — correcto, *no deben serlo*.

### 2.1.4 Pseudonimización estructural (GDPR art. 25 hecho arquitectura)

Separación entre **identidad** y **dato clínico-conductual**: la tabla de identidad (nombres reales, contacto) vive aparte y el resto del sistema opera con identificadores opacos (`patient_uuid`, `member_uuid`). Los servicios de informes, tendencias y el carril de analítica **nunca ven nombres**; la re-identificación ocurre solo en la capa de presentación para miembros autorizados del círculo. Esto reduce el radio de cada brecha posible y es la implementación literal de la pseudonimización que el art. 32 GDPR cita como medida ejemplar.

### 2.1.5 Postura de cumplimiento comunicable (C2, L3)

- **Lo que se hace:** GDPR/LOPDGDD como marco operativo (DPIA antes del primer usuario real, registro de actividades de tratamiento, DPO designado, contratos art. 28 con cada subprocesador — AWS/GCP, Twilio, Stripe, FCM…, notificación de brechas 72 h con runbook ensayado §3.2.6). Seguridad a estándar HIPAA Security Rule / **ISO 27001 como objetivo de certificación a 18–24 meses** (la certificación es el desbloqueador comercial del futuro B2B2C con aseguradoras y del canal institucional).
- **Lo que se dice:** "Cifrado de extremo a extremo del transporte, AES-256 en reposo, arquitectura conforme a GDPR art. 9 y 25, diseñada según los estándares de la HIPAA Security Rule". **Nunca "HIPAA-compliant"** mientras no haya covered entity/BAA (L3). El texto de marketing de seguridad lo revisa el DPO igual que los claims clínicos los revisa el regulatorio (Fase 1, punto ciego 8).
- Servicios cloud elegidos solo de la lista **HIPAA-eligible** del proveedor: no cuesta nada hoy y evita re-arquitectura si llega el B2B2C estadounidense.

### 2.1.6 Minimización y retención de geolocalización (la función más invasiva merece la política más estricta)

Coherente con la proporcionalidad de L2:

- **Modo por defecto: geovalla, no tracking.** El sistema conoce "dentro/fuera de zona segura", no la posición continua. El dispositivo solo emite posición fina cuando hay cruce de geovalla o alerta activa.
- Durante una alerta de deambulación: posición fina cada 30–60 s, visible para el círculo, **hasta el cierre de la alerta**.
- Retención: posición fina 72 h y se destruye; queda el evento agregado ("salida de zona el 12/07, resuelta en 40 min por Ana"). La familia no necesita —y el paciente no merece— un historial perpetuo de movimientos.
- Toda activación/cambio del modo de localización queda registrada en el historial de consentimiento (§2.2.4) con quién lo decidió y sobre qué base.

## 2.2 Control de acceso: RBAC sobre el círculo, con capa contextual

### 2.2.1 Modelo conceptual

La unidad de autorización es el **círculo** (C5). Un usuario no "tiene un rol": tiene un rol *en un círculo* (y puede estar en varios — la hija que cuida de padre y madre, la auxiliar profesional en tres familias). El modelo es RBAC por círculo con condiciones contextuales (una pizca de ABAC donde el rol no basta):

```
Usuario ──< Membresía >── Círculo ── Paciente
              │
              ├─ rol: admin | familiar | profesional_limitado | observador | profesional_invitado
              ├─ condiciones: ventana_temporal (invitado), de_guardia (calendario), estado (activo/suspendido)
              └─ base_de_actuación: titular | guardador_de_hecho | curatela | consentimiento_delegado  ← (L2)
```

### 2.2.2 Matriz de permisos (extracto normativo; la matriz completa es un anexo vivo)

| Capacidad | Admin (cuidador ppal.) | Familiar | Prof. limitado (auxiliar) | Observador | Prof. invitado (médico) |
|---|---|---|---|---|---|
| Ver alertas críticas y acusar recibo | ✔ | ✔ | ✔ (solo en su turno) | — | — |
| Registrar observaciones / medicación | ✔ | ✔ | ✔ | — | — |
| Ver tendencias y diario completo | ✔ | ✔ | Solo pautas y sus propios registros | — | — |
| Ver chat familiar | ✔ | ✔ | **✘** (Fase 1 §2.2a) | ✘ | ✘ |
| Ver informe médico de 1 página | ✔ | ✔ | ✘ | ✘ | ✔ (**solo lectura, acceso temporal, con marca de agua y registro de acceso**) |
| Ver posición en alerta activa | ✔ | ✔ | ✔ (en turno) | ✘ | ✘ |
| Configurar geolocalización/alertas | ✔ (con decisión de círculo registrada, §R5) | propone | ✘ | ✘ | ✘ |
| Invitar / cambiar roles | ✔ | ✘ | ✘ | ✘ | ✘ |
| Check-in emocional de otro cuidador | ✘ (privado por defecto de su titular) | ✘ | ✘ | ✘ | ✘ |
| Finanzas/suscripción | ✔ | ✘ | ✘ | ✘ | ✘ |

Dos decisiones de la matriz responden directamente al encargo ("que un familiar solo vea a su paciente y un médico solo con autorización"):

- **Aislamiento inter-círculo absoluto:** ninguna consulta del sistema cruza círculos. Se aplica en tres capas: middleware de autorización (guards por endpoint), *scoping* obligatorio de toda query por `circle_id`, y **RLS en PostgreSQL como red final** (§1.3.2). Tres capas porque las dos primeras las escribe un humano que se equivoca; la tercera es estructural.
- **El médico entra por invitación explícita, temporal y auditada:** el profesional invitado recibe un acceso con caducidad (p. ej. 30 días renovables), limitado al informe y tendencias (jamás chat ni finanzas), con cada visualización registrada y visible para la familia ("la Dra. Ruiz consultó el informe el martes"). La transparencia de acceso es una *feature* de confianza, no solo un log.

### 2.2.3 Implementación

- **Autenticación:** proveedor de identidad gestionado (Cognito / Firebase Auth / Auth0) — no construir auth propia jamás. MFA opcional pero *no forzada* para el cuidador (fricción vs. este público; se fuerza para el rol admin en la gestión de datos sensibles y para todo acceso profesional), enlaces mágicos por SMS/email como camino de recuperación pensado para alfabetización digital media. Tokens JWT de vida corta + refresh con revocación (la revocación instantánea importa: "he echado a mi hermano del círculo" debe ser inmediato, es un escenario emocionalmente real).
- **Autorización:** política centralizada (guards NestJS declarativos generados desde la matriz de permisos como fuente única de verdad — la matriz es un fichero versionado del que se derivan los tests). **Tests de autorización como suite de primera clase:** cada celda "✘" de la matriz tiene un test negativo automatizado. En un producto donde el fallo de permisos es una violación de intimidad familiar, la suite de "noes" vale más que la de "síes".
- **Auditoría de acceso:** todo acceso a PHI (quién, qué recurso, qué círculo, cuándo, desde dónde) → log inmutable append-only (CloudWatch Logs → S3 Object Lock / equivalente) con retención ≥ 6 años (horizonte HIPAA, válido como norte). Es simultáneamente: evidencia forense, materia prima del derecho de acceso GDPR ("¿quién ha visto los datos de mi madre?") y feature de transparencia (§2.2.2).

### 2.2.4 El servicio de consentimiento (la pieza jurídica hecha software — L2)

El consentimiento se modela como **entidad de primera clase con historial inmutable**, no como checkbox:

- Cada consentimiento registra: titular, alcance (finalidad concreta: geolocalización / momentos / videollamada auto-contestada / investigación futura), base jurídica, **quién lo otorgó y en calidad de qué** (titular en fase leve; guardador de hecho/curatela después — el campo `base_de_actuación` de la membresía), versión del texto informado mostrado, fecha, y estado (vigente/revocado/expirado).
- **Consentimiento anticipado** (la "agencia anticipada" de Fase 1): en fase leve, el paciente puede dejar registradas sus preferencias para fases posteriores; el sistema las conserva selladas y las *muestra al círculo* cuando se activa una función que el titular condicionó ("Tu madre pidió en 2026 que la localización solo se activara si salía sola de noche"). Técnicamente trivial; jurídica y emocionalmente, la feature más diferencial del producto.
- La **revocación se propaga por evento** (`ConsentimientoRevocado` en el bus) y cada módulo consumidor debe reaccionar (apagar geovalla, ocultar momentos, excluir del pipeline de investigación) — con test de extremo a extremo por cada finalidad.
- Los flujos de derechos GDPR (acceso, portabilidad, supresión) se implementan como procesos semiautomáticos con SLA interno de 30 días: el export de portabilidad reutiliza la maquinaria del "legado" del offboarding (§2.3.5) — una sola inversión, dos obligaciones cubiertas.

## 2.3 Anonimización para analítica e investigación futura

### 2.3.1 Honestidad técnica primero

La "anonimización" perfecta de datos longitudinales de salud es uno de los problemas más difíciles de la privacidad: la combinación *edad + código postal + fechas de eventos + trayectoria de deterioro* puede re-identificar sin ningún nombre. La estrategia por tanto es **escalonada, con la pretensión correcta en cada escalón**:

### 2.3.2 Escalón 1 — Telemetría de producto (día 1)

Métricas de uso (círculos activos, registros/semana, tiempos de respuesta a alertas — las métricas clave del Lean Canvas) con identificadores pseudonimizados y **sin ningún contenido**: nunca texto del diario, nunca posiciones, nunca conducta. Herramienta de producto self-hosted o con residencia UE (PostHog EU / Matomo); **prohibido** enviar eventos con PHI a analíticas de terceros tipo Firebase Analytics/Mixpanel US por defecto — este es uno de los errores sancionados con más frecuencia en apps de salud (casos FTC citados en L3).

### 2.3.3 Escalón 2 — Analítica interna agregada

En la zona analítica separada (§1.3.6): datos pseudonimizados con **claves de pseudonimización custodiadas fuera de la zona** (en el KMS del entorno de producción, inaccesible para los roles analíticos). Generalización aplicada en el pipeline de entrada: edad → franja quinquenal, localización → provincia, fechas → semana ISO. Bajo GDPR esto sigue siendo dato personal (pseudonimizado) y se trata como tal — no se llama "anónimo" a lo que no lo es.

### 2.3.4 Escalón 3 — Dataset de investigación (futuro, con consentimiento separado L5)

Cuando llegue (y solo con consentimiento específico, granular y revocable, jamás empaquetado en el alta):

- **Anonimización formal evaluada, no declarada:** k-anonimato/l-diversidad como mínimo técnico con validación experta (el estándar práctico tipo "expert determination"), agregación temporal (trayectorias en ventanas, no eventos fechados), supresión de cuasi-identificadores raros, y **ruido diferencialmente privado en los agregados publicados** si se publican estadísticas (differential privacy donde aporta, no como palabra de moda: aplica a *salidas agregadas*, no al dataset crudo).
- Para el entrenamiento de futuros modelos de seguimiento cognitivo (C1): explorar **datos sintéticos validados** y/o aprendizaje sobre agregados antes que mover microdatos; y cualquier modelo que haga afirmaciones clínicas nace dentro del marco de producto sanitario de §1.1.6, no fuera.
- Gobernanza: comité de acceso a datos (fundador + DPO + asesor clínico), registro público de estudios apoyados, y compromiso verificable de no venta de datos — coherencia total con la marca de dignidad (Fase 1 §L2: el liderazgo ético como diferenciación).

### 2.3.5 Offboarding digno: la semántica de datos del duelo (R3/L5 hecho arquitectura)

El "cierre del círculo" tiene un flujo de datos definido, no solo una pantalla triste bien escrita:

1. Evento `CirculoEnCierre` → **silenciamiento inmediato e irreversible de todos los recordatorios y alertas del paciente** (el error atroz de Fase 1 R3 se previene por diseño: es un estado de la máquina, no una lista de switches que alguien olvida).
2. Ventana de legado (90 días, extensible): exportación de "Momentos" y diario en formato legible y portable (el mismo motor de portabilidad GDPR).
3. Decisión del círculo sobre los datos: conservar como memorial (acceso lectura), exportar y suprimir, o donar a investigación (si existía consentimiento del titular o lo ejercen las personas legitimadas por LOPDGDD arts. 3 y 96).
4. Supresión efectiva con certificado: borrado criptográfico (destrucción de las claves de campo de §2.1.3 asociadas al paciente) + purga física en backups según su ciclo (documentado: los backups cifrados expiran en ≤ 35 días, con lo que la supresión total es verificable en ese plazo).

---

# 3. INFRAESTRUCTURA CLOUD Y RESILIENCIA

## 3.1 Proveedor, topología y componentes

### 3.1.1 Proveedor: **AWS, región primaria eu-west-1 (Irlanda) o eu-south-2 (España)**

GCP es un segundo clasificado perfectamente digno (Cloud Run es más elegante que Fargate; BigQuery es mejor que Athena). AWS gana por tres motivos pragmáticos: la madurez del par **IoT Core + geovallas de Location Service** (Amazon Location Service trae evaluación de geofences gestionada, útil como validador servidor de las geovallas del dispositivo), la profundidad del programa de cumplimiento (artefactos HIPAA-eligible/ISO listos para due diligence), y la liquidez de talento y soporte en España/LatAm. **eu-south-2 (España)** como opción si la residencia nacional resulta valiosa comercialmente con instituciones; eu-west-1 si prima la amplitud de servicios. Decisión reversible-cara: se toma una vez, se documenta, y toda la infraestructura nace como código (§3.3) para que "cara" no sea "imposible".

### 3.1.2 Diagrama conceptual de componentes

```
                                   ┌──────────────────────────────────────────────────────────────┐
                                   │                        USUARIOS / DISPOSITIVOS               │
                                   │                                                              │
   App Cuidador (Flutter)      App/Agente Paciente         Tablet "Momentos"       Web ligera     │
        │      │                (geofence nativo)              (kiosco)           (invitado prof.) │
        │      │                      │                           │                     │          │
        ▼      ▼                      ▼                           ▼                     ▼          │
   ┌─────────────────┐        ┌───────────────┐           ┌──────────────────────────────────┐     │
   │  push FCM/APNs  │        │  MQTT + TLSm  │           │            HTTPS/TLS 1.3         │     │
   │  (canal de      │        │  (AWS IoT     │           └──────────────────────────────────┘     │
   │   despertar)    │        │   Core)       │                           │                        │
   └─────────────────┘        └───────┬───────┘                           ▼                        │
                                      │                    ┌───────────────────────────┐           │
                                      │                    │  CloudFront + WAF + Shield│           │
                                      │                    │  (CDN, anti-DDoS, filtro) │           │
                                      │                    └────────────┬──────────────┘           │
                                      │                                 ▼                          │
                                      │                    ┌───────────────────────────┐           │
                                      │                    │       ALB (multi-AZ)      │           │
                                      │                    └───────┬───────────┬───────┘           │
                                      │                            │           │                   │
              ┌───────────────────────┘                            ▼           ▼                   │
              │                                        ┌───────────────┐  ┌───────────────────┐    │
              ▼                                        │  CORE (ECS    │  │ API Gateway       │    │
   ┌────────────────────────┐   eventos de riesgo      │  Fargate,     │  │ WebSocket         │    │
   │  CARRIL CRÍTICO DE     │◄──────────────────────── │  monolito     │  │ (chat, presencia, │    │
   │  ALERTAS (servicio     │   (IoT Rules → carril)   │  modular)     │  │  estado de alerta)│    │
   │  siempre caliente,     │                          └──────┬────────┘  └───────────────────┘    │
   │  multi-AZ activo-activo│                                 │                                    │
   │  réplica local propia) │◄———— sync por eventos ——————────┤                                    │
   └─────┬──────────────────┘                                 │                                    │
         │ escalado multicanal                                ▼                                    │
         ▼                                     ┌──────────────────────────────┐                    │
   ┌──────────────────────────┐                │   BUS DE EVENTOS             │                    │
   │ FCM/APNs (prioridad máx.)│                │   (EventBridge / SNS+SQS     │                    │
   │ SMS (SNS/Twilio)         │                │    con DLQs en todo)         │                    │
   │ Llamada voz (Connect/    │                └──────┬───────────┬───────────┘                    │
   │ Twilio)                  │                       │           │                                │
   └──────────────────────────┘                       ▼           ▼                                │
                                            ┌───────────────┐  ┌─────────────────────┐             │
   ┌──────────────────────────┐             │ Lambdas borde │  │ Pipeline analítico   │             │
   │ Amazon Location Service  │             │ (PDF informes,│  │ (pseudonimización →  │             │
   │ (geovallas servidor —    │             │ transcripción,│  │  cuenta separada:    │             │
   │ validador secundario,    │             │ digests, media)│ │  S3 + Athena/Glue)   │             │
   │ mapas para el círculo)   │             └───────────────┘  └─────────────────────┘             │
   └──────────────────────────┘                                                                    │
                                                                                                   │
   DATOS (multi-AZ, cifrado KMS por dominio):                                                      │
   ┌───────────────────┐ ┌──────────────────┐ ┌──────────────┐ ┌────────────────────────┐          │
   │ Aurora PostgreSQL │ │ TimescaleDB      │ │ ElastiCache  │ │ S3 (media-phi, reports,│          │
   │ (relacional+RLS,  │ │ (serie temporal, │ │ Redis        │ │  legacy, backups,      │          │
   │  writer+replica)  │ │  mismo clúster)  │ │ (sin PHI)    │ │  audit con Object Lock)│          │
   └───────────────────┘ └──────────────────┘ └──────────────┘ └────────────────────────┘          │
                                                                                                   │
   TRANSVERSAL: KMS (CMKs por dominio) · Cognito (identidad) · CloudTrail+CloudWatch+X-Ray         │
   (observabilidad y auditoría) · Secrets Manager · Terraform (IaC) · GuardDuty+Security Hub       │
   └───────────────────────────────────────────────────────────────────────────────────────────────┘
```

Lecturas clave del diagrama:

- **Dos planos de entrada:** el plano humano (HTTPS/WebSocket vía CloudFront+ALB) y el plano de dispositivos (MQTT vía IoT Core). Las reglas de IoT Core enrutan los eventos de riesgo **directamente al carril crítico**, sin pasar por el Core: el camino de la alerta tiene el mínimo número de saltos posible.
- **WebSocket gestionado (API Gateway WebSocket)** para el tiempo real de las apps: presencia del círculo, chat, y la vista viva de una alerta en curso ("Ana ha acusado recibo, va de camino"). Se elige gestionado sobre servidores WebSocket propios (socket.io en ECS) por eliminación de gestión de estado de conexión a cambio de sus límites (idle timeout ~10 min con reconexión — aceptable porque, regla de §1.1.4, ninguna garantía crítica depende del WebSocket: el canal garantizado de una alerta es push→SMS→voz).
- **Geofencing en dos capas:** primaria en el dispositivo (APIs nativas del SO, §1.2.3 — únicas viables en batería) y **validación secundaria en servidor** (Amazon Location evalúa las posiciones que sí llegan contra la geovalla): si el SO del teléfono mató el agente y deja de haber posiciones, eso NO es "todo en orden": es el disparador del heartbeat (§3.2.2). La falsa seguridad se combate con esta asimetría deliberada: *ausencia de señal = señal*.

### 3.1.3 Entornos y cuentas

Cuatro cuentas AWS bajo AWS Organizations: `prod` (PHI real, acceso humano mínimo y siempre auditado, JIT), `staging` (datos sintéticos — **jamás copias de producción**; generador de familias sintéticas como herramienta de equipo desde el día 1), `dev`, y `analytics` (§1.3.6). SCPs que impiden, entre otras cosas, crear recursos fuera de regiones UE en las cuentas con PHI — el guardarraíl de residencia de datos como política, no como costumbre.

### 3.1.4 Detalles del camino de geolocalización (la función estrella merece su párrafo de ingeniería)

- **Histéresis espacial y temporal:** la geovalla dispara "salida" solo tras N metros fuera del perímetro sostenidos M segundos (el GPS urbano tiene deriva de 10–50 m; sin histéresis, el borde de la zona es una fábrica de falsas alarmas y de fatiga — R4).
- **Deduplicación en el carril:** ventana de supresión tras una alerta activa (una salida = una alerta con actualizaciones, no un goteo).
- **Zonas seguras múltiples y horarios:** casa, centro de día, casa de la hija; una salida acompañada del centro de día un martes a las 17:00 puede ser rutina configurada, no emergencia — la configurabilidad es la otra mitad de la lucha contra la fatiga de alertas.

## 3.2 Estrategia de tolerancia a fallos

Organizada según los dos escenarios que plantea el encargo más el tercero que la Fase 1 obliga a tratar (el dispositivo del paciente desaparece).

### 3.2.1 Escenario A — "La app del cuidador pierde conexión"

- **El sistema nunca asume la entrega del push.** Toda alerta de nivel 1 exige acuse de recibo; sin acuse en el plazo configurado, la máquina de estados escala al siguiente humano *y* al siguiente canal (push → SMS → llamada de voz). El SMS y la voz no dependen de datos móviles ni de permisos de notificación: solo de cobertura telefónica — el mínimo común denominador correcto para este público.
- **Cola local y reconciliación al reconectar:** la app sincroniza el estado real de alertas al volver ("hubo una alerta a las 4:12, la atendió tu hermana a las 4:15") — nunca notificaciones fantasma de crisis ya resueltas, que son pequeños infartos gratuitos para un cuidador.
- **El trabajo offline no se pierde** (§1.2.4): registro y diario en cola local persistente.
- **Estado honesto visible:** si el sistema no puede garantizar la cadena de alerta (todos los miembros inalcanzables > X min), lo dice — al reconectar, y en el peor caso, con la llamada de voz automática al contacto de respaldo definido por la familia. Nunca silencio que se pueda confundir con normalidad.

### 3.2.2 Escenario B (obligado por C4) — "El dispositivo del paciente se apaga/queda sin batería/pierde cobertura"

- **Heartbeat con presupuesto:** el agente del paciente emite señal de vida periódica (aprovechando el last-will de MQTT y check-ins programados). La ausencia de heartbeat durante el umbral configurado genera una alerta de **nivel 2** propia ("el dispositivo de mamá lleva 3 h sin conexión — última batería conocida 12 %") — visible, honesta, accionable, y deliberadamente *no* de nivel 1 (un teléfono sin batería cada semana no puede sonar como una deambulación, o mata el sistema por fatiga).
- **Predicción de batería:** aviso al cuidador de guardia cuando la batería proyectada no llega a la noche ("ponle el teléfono a cargar cuando llegues"). La batería la gestiona el cuidador (C4): el producto le da la información para poder hacerlo.
- **Comunicación de límites como feature:** la pantalla de estado del círculo muestra siempre la salud del sistema de cuidado (dispositivo ✓, geovalla ✓, 3 cuidadores alcanzables ✓ / última sync hace 4 h ⚠). Es la traducción de "esto complementa, no sustituye, la supervisión humana" (R4) a interfaz.

### 3.2.3 Escenario C — "El servidor de alertas se satura o falla"

- **Sobredimensionado permanente:** el carril crítico corre en N+2 instancias en ≥ 2 AZ (activo-activo tras el balanceador); su carga real será ridícula comparada con su capacidad, y ese despilfarro es correcto (§1.1.3: es el seguro).
- **Backpressure selectivo:** si llega una tormenta de eventos (bug de un lote de dispositivos, oscilación masiva de geovallas), el carril **degrada lo no crítico primero**: pausa digests y nivel 2–3, mantiene nivel 1. Colas separadas por nivel con prioridad estricta — la alerta crítica jamás espera detrás de mil digests. DLQs en todas las colas con alarma inmediata: un mensaje muerto en la cola de nivel 1 es un incidente de gravedad máxima, no una métrica.
- **Aislamiento de fallos del Core:** caída total del Core = los usuarios no pueden registrar comidas ni chatear (molesto), pero las geovallas, caídas y medicación crítica siguen escalando (el carril decide con su réplica local, §1.1.2-B). Este aislamiento se **verifica mensualmente en staging** apagando el Core a propósito (game day), y es el simulacro técnico que complementa el simulacro familiar mensual de Fase 1.
- **Si el propio carril crítico cae** (el escenario residual): health-checks externos independientes (Route 53 health checks + un monitor de tercero tipo Pingdom/Better Stack fuera de AWS) detectan la caída en < 1 min y alertan al on-call por un canal ajeno a la propia plataforma (PagerDuty). El auto-scaling y el multi-AZ hacen el resto; el runbook define el failover manual a región secundaria si la caída es regional (abajo).
- **Dependencias externas con fallback:** proveedor de SMS/voz primario y secundario (Twilio + SNS/Connect) con conmutación automática por tasa de error; los proveedores de push no tienen alternativa (FCM/APNs son monopolios del SO) — razón adicional por la que el push nunca es el único canal.

### 3.2.4 Resiliencia de datos y región

- **Multi-AZ en todo lo con estado** (Aurora writer+réplica en AZ distinta con failover automático < 60 s; Redis con réplica; S3 es multi-AZ por naturaleza).
- **Backups:** snapshots automáticos diarios + PITR continuo (RPO ≤ 5 min en Aurora); copia cifrada cross-region (eu-central-1/París) para el escenario de desastre regional. **RTO/RPO declarados:** fallo de AZ → RTO minutos, RPO ~0; desastre regional → RTO ≤ 4 h (restauración IaC + backups en región secundaria, runbook ensayado 2 veces/año), RPO ≤ 1 h. No se paga multi-región activo-activo en esta etapa: para una startup pre-tracción es teatro de resiliencia; el dinero de resiliencia está mejor gastado en el carril crítico multi-canal, que cubre el riesgo real (la alerta que no llega) incluso durante un desastre de región (la llamada de voz sale de Twilio, no de nuestra región).
- **Restauraciones ensayadas:** un backup no probado es una hipótesis. Restauración completa de producción a entorno efímero **cada trimestre**, cronometrada y documentada (además, es evidencia ISO 27001).

### 3.2.5 Observabilidad (la otra mitad de la resiliencia)

- Métricas, logs estructurados y trazas (CloudWatch + X-Ray u OpenTelemetry → Grafana) con el **SLO del camino crítico como panel número uno**: latencia extremo a extremo evento→canal, tasa de acuse, tasa de degradación a SMS/voz, edad del mensaje más viejo en cada cola.
- **Sondas sintéticas de extremo a extremo:** una "familia sintética" en producción genera cada 15 minutos un evento de geovalla de prueba y verifica que el push llega a un dispositivo de laboratorio. El sistema de alertas se vigila a sí mismo con el mismo mecanismo que promete a las familias — coherencia entre lo que se predica y lo que se opera.
- Presupuesto de error explícito: si el SLO del carril se consume, se congela el despliegue de features y se trabaja en fiabilidad (regla de equipo escrita, al estilo SRE).

### 3.2.6 Respuesta a incidentes y brechas

Runbook de incidentes con clasificación (¿afecta a PHI? → activa el reloj GDPR de 72 h a la AEPD, con plantillas de notificación pre-redactadas revisadas por el DPO), on-call definido desde el primer usuario real, post-mortems sin culpa publicados internamente, y GuardDuty+Security Hub como detección gestionada (a este tamaño de equipo, la detección se compra, no se construye).

## 3.3 Infraestructura como Código y cadena de suministro

- **Terraform (+ Terragrunt para el layout multi-cuenta) para el 100 % de la infraestructura desde el día 0.** En HealthTech, IaC no es productividad: es **cumplimiento** — el entorno es reproducible, revisado por PR (cuatro ojos también para la infraestructura), con historial auditable de cada cambio de política de seguridad, y con la deriva detectada automáticamente. Para un auditor de inversión, `git log` del directorio de Terraform ES la evidencia de gobernanza de infraestructura.
- **Políticas como código:** checks automáticos en CI sobre el plan de Terraform (tfsec/Checkov + OPA): prohibido bucket público, prohibido security group 0.0.0.0/0, prohibido recurso sin cifrado, prohibido recurso fuera de UE en cuentas PHI. El guardarraíl de cumplimiento se ejecuta en cada PR, no en la auditoría anual.
- **CI/CD:** pipeline único (GitHub Actions) con: tests (incluida la suite de autorización de §2.2.3 como bloqueante), escaneo de dependencias y contenedores (Dependabot + Trivy), SBOM generado por build (transparencia de cadena de suministro — creciente exigencia de compradores institucionales), despliegue azul/verde en el Core y canario en el carril crítico (un despliegue roto del carril es el único tipo de despliegue que puede hacer daño físico: se trata con el máximo cuidado, feature flags y rollback automático por métrica).
- **Secretos:** Secrets Manager/Parameter Store, rotación automática donde el servicio lo permita, cero secretos en código o variables de CI en claro.

## 3.4 Hoja de ruta de certificación y madurez (para inversores)

| Horizonte | Hito de seguridad/cumplimiento | Desbloquea |
|---|---|---|
| Antes del primer usuario real | DPIA completada; registro de tratamientos; contratos art. 28 firmados; cifrado y RBAC según este documento; runbook de brechas | Piloto legal con familias reales vía AFAs |
| + 6 meses | Pentest externo anual (primero pre-lanzamiento); programa de divulgación responsable; simulacro de restauración y de brecha ejecutados | Confianza demostrable; seed due diligence |
| 12–18 meses | ISO 27001 (alcance: plataforma completa) — antes que SOC 2, por mercado europeo | B2B2C con aseguradoras/SAD; convenios institucionales |
| 18–24+ meses | Evaluación formal de frontera MDR si el roadmap clínico se activa (§1.1.6); SOC 2 Type II si se abre mercado EE. UU. | Producto sanitario planificado, no accidental (L4) |

---

# CIERRE — Las 10 decisiones de arquitectura que definen este sistema (síntesis para due diligence)

1. **Monolito modular + carril crítico segregado**, no microservicios ni serverless puros: la complejidad se gasta exactamente donde el producto no puede fallar (la alerta), y en ningún otro sitio.
2. **El carril de alertas nunca depende del Core, nunca escala a cero y nunca confía en un solo canal** (push → SMS → voz). El coste fijo de tenerlo siempre caliente es el seguro del contrato moral del producto.
3. **Presupuestos de disponibilidad diferenciados y escritos** (99,95 % la alerta, 99,5 % el resto): madurez de ingeniería es saber qué no necesita cuatro nueves.
4. **Flutter para el cuidador; geofencing nativo del SO para el paciente**: la accesibilidad consistente en gama media manda en una app; la supervivencia en segundo plano y la batería mandan en la otra. Son requisitos opuestos y se resuelven por separado.
5. **PostgreSQL con RLS como segunda línea del RBAC y TimescaleDB para lo longitudinal**: un solo motor mientras sea posible (una sola superficie de auditoría), particionado por régimen jurídico del dato, con reglas escritas de cuándo migrar.
6. **Pseudonimización estructural + cifrado de campo sobre el cifrado de disco**: el volcado de la base de datos no expone contenido sensible; los servicios internos operan sin nombres.
7. **El consentimiento es un servicio con historial inmutable y revocación por eventos**, incluido el consentimiento anticipado del paciente en fase leve — la pieza jurídica de L2 convertida en la feature más diferencial.
8. **Geovalla antes que tracking; 72 h de retención de posición fina; ausencia de señal = señal**: la función más invasiva tiene la política de minimización más estricta y la lucha contra la falsa seguridad está en la topología (validación en dos capas + heartbeat).
9. **Cuentas separadas por entorno y por finalidad (analítica sin PHI), residencia UE por política (SCP), y Terraform + políticas-como-código desde el día 0**: el cumplimiento se ejecuta en cada PR, no se redacta para la auditoría.
10. **Anonimización honesta y escalonada**: telemetría sin contenido hoy, pseudonimización llamada por su nombre mañana, y anonimización formal evaluada (k-anonimato, DP en agregados, datos sintéticos) solo cuando exista el consentimiento de investigación — nunca "anonimizado" como eufemismo.

---

# PRÓXIMOS PASOS (salida de Fase 2)

| # | Acción | Criterio de éxito |
|---|---|---|
| 1 | **Revisión legal de este documento** (DPO/asesor externo): modelo de consentimiento §2.2.4, retención de geolocalización §2.1.6, semántica de offboarding §2.3.5 | Dictamen que valide o corrija antes de escribir una línea de código |
| 2 | **Prototipo técnico de riesgo (spike) del camino crítico:** geofence nativo Android/iOS → IoT Core → carril → push+SMS+voz, medido extremo a extremo en dispositivos reales de gama media | p99 < 5 s demostrado; consumo de batería < objetivo en 72 h de prueba |
| 3 | **DPIA formal** sobre la arquitectura aquí descrita | DPIA aprobada; medidas residuales incorporadas a este documento (v1.1) |
| 4 | **Esqueleto IaC:** las 4 cuentas, guardarraíles (SCPs, políticas-como-código), pipeline CI/CD con suite de autorización vacía pero ejecutándose | `terraform apply` reproduce el entorno desde cero; primer game day trivial ejecutado |
| 5 | **Matriz de permisos completa como anexo versionado** + generador de familias sintéticas para staging | Cada celda ✘ tiene test negativo; staging funciona sin ningún dato real |
| 6 | Solo tras 1–5: **Fase 3 — definición del MVP construible y plan de desarrollo** | Este documento, corregido por el spike y el dictamen legal |

*Documento vivo. Cada decisión lleva su porqué escrito para poder ser revocada con el mismo rigor con que fue tomada. La arquitectura más segura no es la que más tecnología acumula: es la que sabe exactamente qué no puede fallar — y aquí, lo que no puede fallar es que una familia confió en que sonaría una alarma.*
