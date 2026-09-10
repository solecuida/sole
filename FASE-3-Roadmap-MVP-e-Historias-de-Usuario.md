# FASE 3 — ROADMAP DEL MVP E HISTORIAS DE USUARIO
## Ecosistema digital de acompañamiento para personas con Alzheimer y sus familias

**Documento de planificación ágil — v1.0**
**Fecha:** 11 de julio de 2026
**Estado:** Borrador para validación con el equipo de desarrollo y el asesor legal
**Clasificación:** Interno — Fundación del proyecto
**Documentos predecesores:** [FASE-1-Descubrimiento-y-Validacion.md](FASE-1-Descubrimiento-y-Validacion.md) · [FASE-2-Arquitectura-Tecnica-y-Seguridad.md](FASE-2-Arquitectura-Tecnica-y-Seguridad.md)

---

> **Nota metodológica.** Este documento traduce las decisiones de producto (Fase 1) y de arquitectura (Fase 2) a un plan de ejecución Scrum sin ambigüedades: qué se construye, qué se pospone, en qué orden, con qué criterio de "hecho" y con qué historias de usuario contractuales. Sigue tres reglas de la industria que un equipo primerizo suele violar:
>
> 1. **El MVP se define por exclusión, no por acumulación.** Cada funcionalidad excluida lleva su porqué escrito, porque la presión de "ya que estamos…" durante el desarrollo solo se resiste con decisiones documentadas.
> 2. **Un sprint entrega valor demostrable, no capas técnicas.** Prohibido el "sprint de base de datos": cada sprint termina con una demo que una cuidadora real podría tocar (aunque sea en staging con familias sintéticas).
> 3. **Las historias de usuario son contratos, no deseos.** Cada criterio de aceptación Gherkin es un test automatizable; si no se puede escribir el test, el criterio está mal redactado.
>
> **Vocabulario de roles (heredado de Fase 1 §2.2 y Fase 2 §2.2):** *admin* (cuidador principal), *familiar*, *profesional limitado* (auxiliar contratada), *observador*, *profesional invitado* (médico, solo lectura temporal). La unidad de privacidad y autorización es siempre el **círculo de cuidado**.

### Restricciones heredadas (contrato de este roadmap)

Ninguna historia de este backlog puede contradecir estas restricciones. Si durante el desarrollo una historia choca con una de ellas, gana la restricción y la historia vuelve a refinamiento:

| # | Restricción heredada | Consecuencia en el roadmap |
|---|---|---|
| C1 | MVP = producto de **bienestar/organización**, nunca producto sanitario (MDR regla 11) | Ninguna historia contiene scoring, predicción ni interpretación clínica. Los textos de UI de cada historia se revisan contra la lista de claims prohibidos antes de la demo |
| C2 | GDPR art. 9 como estándar; residencia UE | Las historias de datos incluyen criterios de aceptación de cifrado, minimización y auditoría — no son "no funcionales opcionales", son parte del "hecho" |
| C3 | La falsa seguridad mata (R4) | El carril crítico de alertas se construye en el Sprint 2 con presupuesto doble de QA y su propia definición de "hecho" reforzada (§2.3.3) |
| C4 | El paciente no interactúa con la app | No existe ninguna historia que exija iniciativa, memoria o aprendizaje del paciente. La "app del paciente" es un agente pasivo |
| C5 | El círculo es la unidad de autorización | La matriz de permisos con sus tests negativos se construye en el Sprint 1, antes que cualquier dato de cuidado |
| C6 | Consentimiento evolutivo y offboarding digno | El consentimiento v1 es historia del Sprint 1 (no "se añade luego"); el silenciamiento de cierre de círculo entra en el MVP en su versión mínima |

---

# 0. MARCO DE EJECUCIÓN: EQUIPO, CAPACIDAD Y REGLAS DEL JUEGO

Antes de clasificar funcionalidades, se fija el marco que hace creíbles (o no) las estimaciones. Un roadmap sin supuestos de capacidad explícitos es una lista de deseos con fechas.

## 0.1 Equipo asumido (a confirmar antes del Sprint 1)

| Rol | Dedicación | Responsabilidad principal |
|---|---|---|
| Tech Lead / Backend senior | 100 % | Carril crítico, arquitectura NestJS, revisión de todo lo que toca PHI |
| Backend | 100 % | Core (círculos, care-log, coordinación, informes), suite de autorización |
| Mobile Flutter senior | 100 % | App del cuidador, accesibilidad WCAG, offline-first |
| Mobile / full-stack | 100 % | Agente pasivo nativo (Kotlin/Swift), web ligera del profesional, apoyo Flutter |
| QA / DevOps | 50–100 % | Pipeline, tests E2E del camino crítico, game days, staging sintético |
| Product Owner (fundador/a) | 100 % | Backlog, criterios de aceptación, contacto con AFAs y familias piloto |
| Diseño UX (freelance) | ~40 % | Sistema de diseño accesible, lenguaje emocional de las transiciones |
| DPO / asesor legal externo | Bajo demanda | Revisión de textos de consentimiento, claims y matriz de permisos |

**Capacidad de planificación:** ~40 puntos de historia por sprint (escala Fibonacci; 1 punto ≈ media jornada de una persona con revisión incluida). Los tres sprints suman ~120 puntos; el backlog comprometido suma ~105, dejando **~12 % de holgura estructural** — en un dominio con tanta incertidumbre regulatoria y de dispositivo, planificar al 100 % es planificar el retraso.

## 0.2 Precondición: Sprint 0 (ya definido como "salida de Fase 2")

Este roadmap **asume ejecutados** los próximos pasos de la Fase 2. No son parte de los 3 sprints, pero son su puerta de entrada; si alguno falla, el roadmap se replanifica antes de empezar:

| Entregable de Sprint 0 | Estado exigido al iniciar Sprint 1 |
|---|---|
| Spike del camino crítico (geofence nativo → IoT Core → carril → push+SMS+voz) | p99 < 5 s demostrado en dispositivos de gama media; consumo de batería aceptable en 72 h |
| Esqueleto IaC (4 cuentas AWS, SCPs, políticas-como-código, CI/CD) | `terraform apply` reproduce los entornos; pipeline ejecuta una suite vacía |
| DPIA formal y dictamen legal preliminar | DPIA aprobada; textos de consentimiento v1 validados por el asesor |
| Matriz de permisos completa versionada + generador de familias sintéticas | Cada celda ✘ tiene test negativo definido (aunque aún en rojo); staging funciona sin datos reales |
| Reclutamiento del piloto vía AFAs | ≥ 5 familias comprometidas para el piloto post-Sprint 3 (ideal 8–10) |

## 0.3 Definición de Preparado (DoR) y de Hecho (DoD)

**Una historia está *Preparada* para entrar en sprint cuando:** tiene criterios Gherkin escritos y revisados por el PO; tiene identificado qué celdas de la matriz de permisos toca; declara si crea/lee PHI y bajo qué consentimiento; tiene diseño de UI (si aplica) validado contra las reglas de accesibilidad de Fase 2 §1.2.2; y cabe en un sprint (≤ 8 puntos; si no, se parte).

**Una historia está *Hecha* cuando:**
1. Los criterios Gherkin pasan como tests automatizados (unitarios + integración; E2E para los caminos críticos).
2. Los tests negativos de autorización de las celdas ✘ afectadas pasan.
3. Si toca PHI: cifrado de campo aplicado donde corresponde, evento de auditoría emitido, y dato ausente del pipeline de telemetría de producto.
4. Accesibilidad verificada: TalkBack/VoiceOver, texto grande, contraste AAA en pantallas diarias, profundidad de navegación ≤ 2.
5. Textos de UI en español revisados contra la lista de claims prohibidos (C1) — automatizado con lista de términos vetados ("detecta", "diagnostica", "predice", "monitoriza clínicamente") + revisión humana en la review.
6. Desplegada en staging con familias sintéticas y demostrada en la sprint review.

**DoD reforzada del carril crítico (solo Sprint 2, §2.3.3):** añade test de caos (matar el Core y verificar que la alerta escala), test de canal degradado (push bloqueado → SMS → voz), y registro forense verificado en almacenamiento append-only.

## 0.4 Ceremonias y cadencia

| Ceremonia | Cadencia | Particularidad de este proyecto |
|---|---|---|
| Sprint Planning | Día 1, 4 h | Cada historia se lee contra las restricciones C1–C6 antes de comprometerla |
| Daily | 15 min | Con panel del SLO del camino crítico visible desde que exista (Sprint 2) |
| Refinamiento | 2×/semana, 1 h | El PO trae verbatims de las entrevistas de Fase 1; las historias se redactan con lenguaje de cuidadores reales, no de ingenieros |
| Sprint Review | Último día, 2 h | Demo en staging con la "familia sintética García" (personas, medicaciones y rutinas ficticias pero realistas). Desde el Sprint 2 se invita a 1–2 cuidadoras del grupo de validación de Fase 1 |
| Retrospectiva | Último día, 1,5 h | Con una pregunta fija: "¿qué hemos construido esta quincena que un cuidador agotado no entendería?" |

---

# 1. DEFINICIÓN DEL MECE MVP

## 1.1 Método de clasificación

**MECE aplicado a producto:** las funcionalidades se particionan en cuatro conjuntos **mutuamente excluyentes** (ninguna funcionalidad vive en dos conjuntos) y **colectivamente exhaustivos** (todo lo mapeado en Fases 1–2 cae exactamente en uno):

- **MUST — Lanzamiento del MVP (piloto cerrado, semana 6).** Sin esto, el producto no resuelve ninguno de los 3 problemas validados o incumple una obligación legal/ética.
- **V2 — Nice-to-have pospuesto (meses 3–9).** Aporta valor real pero su ausencia no rompe el bucle de valor del día 1, o su coste (técnico, clínico o de privacidad) exige una validación que aún no existe.
- **V3+ — Horizonte condicionado.** Depende de tracción, capital o decisiones estratégicas (B2B2C, hardware propio).
- **NUNCA sin decisión regulatoria explícita.** Cruza la frontera de producto sanitario (C1); no entra en ningún backlog hasta que exista la hoja de ruta MDR de Fase 2 §1.1.6 con presupuesto propio.

**El filtro de admisión a MUST son cuatro preguntas; hay que responder "sí" a las cuatro:**
1. ¿Ataca directamente P1 (el dato no existe), P2 (burnout/descoordinación) o P3 (inseguridad en el hogar)?
2. ¿Funciona con el hardware que la familia ya tiene (dos smartphones), sin logística de dispositivos?
3. ¿Es construible en 6 semanas por este equipo sin comprometer la DoD de seguridad?
4. ¿Su ausencia haría fracasar el piloto o dejaría una promesa de seguridad a medias (R4)?

## 1.2 MUST-HAVES del MVP (con justificación de negocio y tecnológica)

| ID | Funcionalidad | Problema | Justificación de negocio | Justificación tecnológica |
|---|---|---|---|---|
| M1 | **Identidad, círculo de cuidado, roles e invitaciones** | P2 | El círculo es la unidad de valor y el efecto red intrafamiliar (ventaja injusta nº 2). La métrica de activación (≥ 2 miembros + 1 rutina en semana 1) depende de que invitar sea trivial | Es la tenancy lógica (C5): todo lo demás cuelga de `circle_id` + RLS. Construirlo después obligaría a re-securizar cada tabla. Cognito gestionado: cero auth propia |
| M2 | **Consentimiento evolutivo v1** | Legal (L2) | Diferenciación ética visible ("así protegemos las decisiones de tu madre") y requisito de legalidad del piloto: sin consentimiento válido no hay ni una familia real en producción | Entidad de primera clase con historial inmutable (Fase 2 §2.2.4). Es barato en Sprint 1 y carísimo de retro-instalar: cada módulo posterior consulta el consentimiento antes de actuar |
| M3 | **Carril crítico de alertas nivel 1 con escalado multicanal y acuse de recibo** | P3 | Es el contrato moral del producto y la razón nº 1 de disposición a pagar del cuidador a distancia ("compra tranquilidad"). Sin él, el producto es otra app de tareas | Servicio segregado, siempre caliente, réplica local, push→SMS→voz (Fase 2 §1.1.2-B). El spike de Sprint 0 des-riesgó el camino; el Sprint 2 lo industrializa |
| M4 | **Geovalla (zona segura) con agente pasivo en el teléfono del paciente** | P3 | El wandering es el detonante nº 1 de institucionalización y del insomnio del cuidador. Es la feature estrella del piloto | Geofencing nativo del SO (única opción viable en batería, C4) + validación secundaria en servidor + heartbeat. Sin hardware nuevo: teléfono Android del paciente si existe y la familia consiente |
| M5 | **Medicación: pauta, recordatorio al cuidador de turno, confirmación y escalado de medicación crítica** | P1+P3 | Los errores de medicación son el miedo cotidiano nº 1 con solución más barata. Diferencia clave frente a Medisafe: el actor es el cuidador, no el paciente | La pauta es CRUD relacional simple; el fármaco crítico sin confirmar es *un productor más* de eventos nivel 1 hacia el carril ya construido — coste marginal bajo, valor percibido altísimo |
| M6 | **Turnos de guardia (calendario de cuidado mínimo)** | P2 | Es el mecanismo anti-burnout central: "cuando no estás de guardia, desconectas de verdad". Sin turnos, todas las alertas van a todos = fatiga (R4) y sobrecarga de siempre-la-misma-persona | El enrutado del carril crítico necesita saber quién está de guardia; es dependencia técnica del M3, no una feature separable. Versión mínima: franjas asignables + huecos visibles |
| M7 | **Registro observacional de 10 segundos + diario de relevo** | P1 | Crea el dato longitudinal (ventaja injusta nº 2) y responde al job "que no se me escape nada". El diario de relevo mata el "¿le diste la pastilla de las 3?" | Escrituras append-only sobre TimescaleDB; cada dato se captura una vez y alimenta coordinación, tendencias e informe (regla de Fase 1 §2.2c). Offline-first con cola local |
| M8 | **Tablón de tareas del círculo** | P2 | Convierte "dime si necesitas algo" en tareas con dueño. Es lo que hace que el círculo entero (no solo la cuidadora principal) abra la app | CRUD simple sobre el modelo de círculo; los eventos `TurnoSinCubrir`/`TareaSinAsignar` reutilizan las notificaciones nivel 2 |
| M9 | **Notificaciones nivel 2–3 y digest diario** | P1+P2 | El digest ("día tranquilo: paseo, comió bien") es el momento de producto diario del cuidador a distancia — el pagador probable. Crea hábito sin fatiga | Módulo `notifications-n2-n3` del Core + Lambda programada. La taxonomía estricta (nunca push individual de nivel 3) es lógica de negocio, no infraestructura nueva |
| M10 | **Informe de consulta de 1 página (PDF) + consola de reportes con acceso de profesional invitado** | P1 | Es el artefacto que conecta cuidador y médico, el gancho de prescripción profesional y la evidencia para trámites de dependencia. En el piloto, es lo que las AFAs quieren ver | Generación asíncrona (Lambda) desde datos ya capturados por M5/M7; web ligera de solo lectura con acceso temporal, marca de agua y registro de acceso (matriz Fase 2 §2.2.2) |
| M11 | **Onboarding < 5 minutos con plantillas por estadio + soporte humano** | Adopción (R2) | El listón es WhatsApp. Un círculo con 2 personas y 1 medicación debe dar valor el día 1. El teléfono de soporte es coste de modelo de negocio desde el día 1, no un extra | Plantillas de configuración por estadio GDS (Fase 1 §2.1) para no configurar alertas desde cero; el onboarding asistido se apoya en las AFAs |
| M12 | **Cierre del círculo — versión mínima (silenciamiento inmediato + export del diario)** | Ético (R3) | El offboarding digno no es un edge case: es el caso final de todos los clientes, y puede ocurrir durante el propio piloto. El error atroz (recordar la medicación de quien falleció) queda prevenido por diseño | Estado de la máquina (`CirculoEnCierre` → silenciamiento irreversible) + export reutilizando el motor de portabilidad GDPR. La versión completa (memorial, donación de datos) es V2 |
| M13 | **Estado de salud del sistema visible ("dispositivo ✓, geovalla ✓, 3 cuidadores alcanzables ✓")** | R4 | La honestidad de límites es la traducción a UI de "complementa, no sustituye". Sin esto, el MVP fabrica falsa seguridad — el peor escenario reputacional y legal | Heartbeat + last-will MQTT ya existentes en el camino del M4; esta historia es *presentarlos* con antigüedad del dato siempre visible |

**Regla de exclusividad verificada:** cada must-have vive en exactamente un módulo del Core o en el carril crítico (Fase 2 §1.1.2); ninguna funcionalidad aparece en dos historias de sprints distintos salvo como dependencia declarada.

## 1.3 NICE-TO-HAVES pospuestos a V2 (meses 3–9), con el porqué de cada aplazamiento

| Funcionalidad | Por qué NO está en el MVP (negocio) | Por qué NO está en el MVP (técnico) |
|---|---|---|
| **"Momentos" (fotos/audios como marco digital) y tablet en modo kiosco** | Valor emocional alto pero no ataca P1–P3 directamente; el piloto debe validar el bucle de seguridad y coordinación primero | Añade gestión de un tercer dispositivo (tablet, kiosco, logística) y un dominio de datos con semántica jurídica propia (imagen, legado). Coste de QA desproporcionado para 6 semanas |
| **Videollamada auto-contestada hacia el paciente** | Función de mayor riesgo ético-legal (L2): exige proporcionalidad documentada, señal previa, y validación con familias reales antes de generalizarse | WebRTC + auto-respuesta en segundo plano es un frente técnico entero (permisos, fabricantes Android agresivos con background). El piloto usará el teléfono normal |
| **Recordatorios por voz con la voz grabada del familiar** | Pendiente de validación clínica (Fase 1 §2.1): en algunos pacientes la voz del ausente genera confusión o angustia. Se valida en piloto con TTS neutro configurable antes de invertir | Pipeline de grabación/almacenamiento/reproducción de voz = más PHI (voz es biométrico) y más superficie DPIA. El altavoz inteligente añade otro dispositivo |
| **Check-in emocional del cuidador (Zarit-lite) y recursos de respiro** | El anti-burnout del MVP se entrega vía turnos + botón de respiro (más barato y más accionable). El check-in necesita el catálogo de recursos por AFA local para que la detección lleve a algo | Es PHI *del cuidador* (L5): cifrado de campo adicional, visibilidad privado-por-defecto reforzada y textos revisados. Mejor hacerlo bien en V2 que rápido en MVP |
| **Contador de equidad de contribución** | Arma de doble filo familiar (Fase 1 §2.2b): mal diseñado es un marcador de reproches. Exige diseño emocional validado con círculos reales del piloto | Trivial técnicamente — la posposición es 100 % de producto. Se instrumenta la captura de datos desde el MVP (los eventos ya existen) para que V2 solo añada presentación |
| **Wearable / colgante GPS dedicado (MQTT directo)** | Logística de hardware (compra, enrolamiento, soporte) que el piloto no necesita: el teléfono del paciente cubre la validación de la geovalla | La ingesta MQTT ya queda desplegada (el agente del teléfono la usa); añadir flota de dispositivos es gestión de certificados, firmware y RMA — un proyecto en sí mismo |
| **Sensórica doméstica (puerta, presencia, cocina)** | "Inactividad anómala" v1 se aproxima con heartbeat + rutinas del círculo (human-in-the-loop). Sensores = coste e instalación que matan la conversión del piloto | Cada tipo de sensor es una integración con su modo de fallo propio. La arquitectura de eventos los admite después sin cambios (otro publicador más) |
| **Chat libre del círculo** | Contra WhatsApp no se gana en chat (Fase 1 §2.2). El MVP entrega comunicación *estructurada* (diario de relevo, tareas, alertas); el chat libre solo añade ruido al piloto | Tiempo real con historial, moderación y push propios. El WebSocket del MVP se limita a presencia y estado vivo de alertas |
| **Multi-idioma (PT/CA/EN) y expansión LatAm** | El piloto es España, en español, con AFAs españolas. Traducir antes de validar es traducir hipótesis | La arquitectura i18n queda instalada desde el día 1 (Fase 2 §1.2.2); solo se posponen los ficheros de traducción y la residencia legal por país |
| **Freemium/monetización (Stripe)** | El piloto es gratuito por diseño: se valida valor, no precio. Cobrar exige además soporte y SLA que aún no se pueden prometer | El módulo `billing` queda como esqueleto vacío aislado de PHI. Integrar Stripe son días, no semanas — se hace cuando haya pricing validado |
| **Cierre del círculo completo (memorial, donación de datos, acompañamiento del duelo)** | La versión mínima (M12) cubre la obligación ética; el memorial y la donación exigen diseño emocional y jurídico (LOPDGDD arts. 3 y 96) con calma | La semántica de datos ya está definida (Fase 2 §2.3.5); V2 implementa la ventana de legado de 90 días y el borrado criptográfico certificado completo |
| **Búsqueda semántica de recursos ("¿cómo manejo el sundowning?")** | Necesita el contenido curado con las AFAs, que se produce durante el piloto | pgvector sobre el mismo PostgreSQL cuando exista el corpus (Fase 2 §1.3.6): sin infraestructura nueva, sin PHI |

**V3+ (condicionado a tracción/capital):** B2B2C con SAD/aseguradoras y panel institucional · integración HL7 FHIR con historia clínica · smartwatch con eSIM · app para el segundo progenitor con descuento de círculo existente · SOC 2 / mercado EE. UU.

**NUNCA sin decisión regulatoria explícita (C1):** tests cognitivos administrados por la app (MMSE/MoCA) · "puntuación cognitiva" o índice de deterioro calculado · predicción de crisis/caídas · recomendaciones de ajuste farmacológico · cualquier claim de "detección" o "monitorización clínica". Si algún día se hace, nace como servicio aislado bajo IEC 62304 con organismo notificado (Fase 2 §1.1.6) — nunca como "una feature más" de un sprint.

## 1.4 Prueba de exhaustividad (el lado "CE" del MECE)

Verificación de que la partición cubre todo lo mapeado en la Fase 1 §2 y no deja huecos:

| Capacidad mapeada en Fase 1 | Destino |
|---|---|
| Taxonomía de alertas N1 (geovalla, ayuda/caída, inactividad, medicación crítica, crisis conductual) | **MUST** (M3+M4+M5; "crisis conductual" = botón "necesito relevo" del círculo, incluido en M8 como alerta social; detección de caída del wearable → V2 con el wearable) |
| Alertas N2 (medicación estándar, citas, tareas sin cubrir, desviaciones no urgentes) | **MUST** (M9; desviaciones de patrón: solo reglas simples tipo "3 noches malas", nunca modelos — C1) |
| Alertas N3 (digest, sugerencias, hitos) | **MUST** digest (M9) · V2 sugerencias e hitos |
| Recordatorios al paciente por voz/ambiente | **V2** (TTS neutro primero, voz familiar tras validación clínica). En MVP el recordatorio va al cuidador de turno, coherente con C4 |
| Círculo, roles, permisos, invitaciones | **MUST** (M1) |
| Tablón de tareas y turnos | **MUST** (M6+M8) · contador de equidad V2 |
| Diario de relevo | **MUST** (M7) |
| Cuidar al cuidador | **MUST** botón de respiro (M8) · V2 check-in Zarit-lite y recursos |
| Comunicación con el paciente (videollamada, Momentos) | **V2** completo |
| Registro conductual ABC, sueño, cognitivo-funcional observado, físico (medicación, caídas, comidas, peso, dolor, continencia) | **MUST** (M5+M7) con el catálogo de chips completo; los campos sensibles delicados (continencia, dolor) entran con textos revisados por el asesor clínico |
| Tendencias visuales + informe de 1 página + evidencia de dependencia | **MUST** (M10) |
| Contribución a investigación | **NUNCA en MVP**; el hueco de consentimiento separado queda modelado en M2 sin activarse |
| Offboarding digno | **MUST mínimo** (M12) · V2 completo |

No existe capacidad de las Fases 1–2 sin destino asignado. **El MVP resultante es deliberadamente estrecho y profundo:** un solo bucle de valor completo — *configuro el círculo en 5 minutos → el sistema vigila lo crítico y honesto → registro en 10 segundos → la familia se coordina por turnos → el médico recibe una página con la verdad longitudinal* — construido a calidad de misión crítica donde toca (M3/M4) y a calidad de CRUD honrado en el resto.

---

# 2. PLANIFICACIÓN DE SPRINTS (ROADMAP DE 6 SEMANAS)

## 2.1 Visión de conjunto y lógica de secuenciación

```
      SPRINT 1 (sem. 1–2)          SPRINT 2 (sem. 3–4)             SPRINT 3 (sem. 5–6)
 ┌──────────────────────────┐ ┌───────────────────────────┐ ┌────────────────────────────────┐
 │ Autenticación, círculo,  │ │ Carril crítico: geovalla, │ │ Diario de relevo, registro     │
 │ roles, consentimiento,   │ │ escalado multicanal,      │ │ de síntomas, tareas, digest,   │
 │ onboarding, esqueleto    │ │ medicación, turnos de     │ │ informe 1 página y consola     │
 │ Flutter accesible        │ │ guardia, estado honesto   │ │ del profesional; hardening     │
 └──────────────────────────┘ └───────────────────────────┘ └────────────────────────────────┘
  Demo: "la familia García    Demo: "Elena sale de la zona    Demo: "una quincena de cuidado
  existe, con roles, y nadie  segura y la alerta escala      real simulada termina en un
  ve lo que no debe"          hasta que alguien responde"    informe que una neuróloga lee"
        │                             │                              │
        ▼                             ▼                              ▼
  La seguridad y la           El contrato moral del          El bucle de valor completo
  privacidad primero          producto, demostrado           → PILOTO con 5–10 familias
```

**Por qué este orden y no otro:** el Sprint 1 construye la *unidad de privacidad* (sin círculo ni permisos no se puede guardar ni un dato de cuidado legalmente); el Sprint 2 construye la *promesa de seguridad* (lo más arriesgado técnicamente, lo antes posible tras el spike, con máximo tiempo de estabilización por delante); el Sprint 3 construye el *hábito diario y la salida hacia el profesional* (lo que convierte el MVP en algo que se usa cada día y se prescribe). Valor incremental real: cada sprint termina con algo estrictamente más valioso que el anterior, y un corte de emergencia tras el Sprint 2 aún dejaría un producto piloto honesto (alertas + medicación) en manos de familias.

## 2.2 SPRINT 1 — Autenticación, Roles y Configuración del Ecosistema

**Sprint Goal:** *"Una familia real podría crear su círculo, invitar a sus miembros con los roles correctos, registrar los consentimientos y no ver jamás nada de otro círculo — todo en menos de 5 minutos y accesible para una cuidadora de 60 años."*

**Entregable demostrable (Sprint Review):** onboarding completo de la familia sintética García en un Android de gama media, con TalkBack activado en parte de la demo; intento de acceso cruzado entre círculos fallando en las tres capas (guard, scoping, RLS); historial de consentimiento visible.

### Backlog comprometido (≈ 38 puntos)

| ID | Historia (resumen) | Pts | Notas de implementación |
|---|---|---|---|
| S1-01 | Como cuidadora principal quiero registrarme con email o teléfono y recuperar el acceso con enlace mágico, para entrar sin contraseñas que olvidar | 5 | Cognito; MFA forzada solo para admin en gestión sensible; sesiones JWT corta vida + refresh con revocación |
| S1-02 | Como cuidadora principal quiero crear el círculo de mi madre con una plantilla por estadio (leve/moderado/avanzado), para no configurar desde cero | 5 | Plantillas de Fase 1 §2.1; crea paciente (pseudonimizado desde el minuto 1: identidad separada del `patient_uuid`) |
| S1-03 | Como admin quiero invitar por enlace/SMS a familiares, auxiliar y observadores con su rol, para que cada uno vea solo lo que le corresponde | 8 | Invitaciones con caducidad; aceptación = membresía con rol + `base_de_actuación`; revocación inmediata ("echar a mi hermano" propaga en < 1 min) |
| S1-04 | Como sistema debo negar toda operación fuera del círculo y rol del solicitante (matriz de permisos ejecutable) | 8 | Guards NestJS generados desde la matriz versionada; RLS activa en toda tabla con `circle_id`; **la suite negativa completa en verde es el criterio de éxito del sprint** |
| S1-05 | Como paciente en fase leve quiero registrar mi consentimiento (y mis preferencias anticipadas) con lenguaje claro, para decidir hoy cómo quiero ser cuidada mañana | 8 | Servicio de consentimiento v1: historial inmutable, versión del texto, quién/en calidad de qué; revocación publica `ConsentimientoRevocado`; texto validado por el asesor (Sprint 0) |
| S1-06 | Como cuidadora quiero un home con texto grande, navegación de profundidad ≤ 2 y modo accesible propio, para usar la app aunque no configure nada en mi teléfono | 5 | Sistema de diseño Flutter: tokens de accesibilidad, Semantics, i18n instalado (solo ES poblado); pantallas: home, círculo, ajustes |
| S1-07 | Como equipo necesitamos el bus de eventos con esquemas versionados y el log de auditoría de acceso a PHI operativos, para que todo lo siguiente nazca auditado | 4 (habilitador) | EventBridge + directorio de JSON Schemas en el repo; log append-only a S3 Object Lock; telemetría PostHog EU sin PHI |

*Nota de transparencia:* S1-07 es un habilitador técnico, no una historia de usuario — se declara como tal en vez de disfrazarlo. Es el único del roadmap; el resto del andamiaje vino del Sprint 0.

### Riesgos del sprint y mitigación

| Riesgo | Mitigación |
|---|---|
| La matriz de permisos genera discusión de producto a mitad de sprint (¿puede el observador ver X?) | La matriz quedó congelada como anexo en Sprint 0; cambios = PR sobre el anexo con aprobación del PO + DPO, nunca decisión de pasillo |
| El flujo de consentimiento se vuelve un formulario legal ilegible | El texto lo escribe el asesor **con** la diseñadora UX; test de comprensión con 3 cuidadoras del grupo de Fase 1 antes de la review |
| Onboarding > 5 min | Cronometrado en la review con usuaria invitada; si excede, se recorta configuración (todo lo recortado tiene default conservador) |

## 2.3 SPRINT 2 — Módulo Core de Alertas, Geolocalización y Recordatorios de Medicamentos

**Sprint Goal:** *"Si Elena cruza la geovalla o nadie confirma su anticoagulante, alguien de la familia se entera aunque tenga el móvil en silencio, aunque el Core esté caído y aunque el push no llegue — y si el sistema no puede vigilar, lo dice."*

**Entregable demostrable (Sprint Review):** simulacro en vivo con dispositivos reales: salida de geovalla → push con acuse en app → sin acuse → SMS al segundo contacto → sin acuse → llamada de voz sintetizada; después, el mismo simulacro **con el Core apagado** (game day). Confirmación de medicación crítica omitida escalando al cuidador de guardia. Pantalla de estado del sistema mostrando heartbeat y antigüedad de datos.

### Backlog comprometido (≈ 37 puntos)

| ID | Historia (resumen) | Pts | Notas de implementación |
|---|---|---|---|
| S2-01 | Como familia queremos definir la(s) zona(s) segura(s) y horarios de rutina, con decisión de círculo registrada, para que la localización sea proporcional y consentida | 5 | Config de geovallas múltiples + horarios (Fase 2 §3.1.4); activación exige consentimiento vigente (M2) y queda en su historial; default: geovalla sí, tracking no |
| S2-02 | Como sistema debo detectar el cruce de geovalla en el teléfono del paciente con consumo mínimo, para vigilar sin exigirle nada (C4) | 8 | Agente pasivo: Kotlin `GeofencingClient` / Swift Region Monitoring (spike de Sprint 0 industrializado); histéresis N metros / M segundos; publica por MQTT/IoT Core directo al carril |
| S2-03 | Como cuidadora de guardia quiero recibir la alerta crítica con acuse de recibo, y que escale a otro canal y otra persona si no respondo, para que ninguna alerta muera silenciada | 8 | Carril crítico: máquina de estados de escalado, colas por nivel con prioridad estricta, dedup en ventana, push FCM/APNs prioridad máx → SMS → voz (Twilio primario, SNS/Connect fallback); registro forense append-only de cada transición |
| S2-04 | Como familia queremos ver la posición fina del paciente **solo durante una alerta activa**, para encontrarle sin vigilarle a perpetuidad | 5 | Posición cada 30–60 s solo en alerta; retención 72 h y purga; vista viva por WebSocket ("Ana acusó recibo, va de camino") con push como despertador |
| S2-05 | Como admin quiero cargar la pauta de medicación (con foto y marcado de fármacos críticos) y como cuidador de turno confirmar cada toma en un toque, para que ningún error de medicación pase inadvertido | 8 | CRUD de pauta + recordatorio N2 al cuidador de turno + confirmación/rechazo offline-first; fármaco crítico sin confirmar en ventana → evento N1 al carril |
| S2-06 | Como círculo queremos un calendario de guardias con huecos visibles, para que las alertas vayan primero a quien está de guardia y los demás puedan desconectar | 5 | Versión mínima (M6): franjas, asignación, hueco en rojo → notificación N2; el carril consume la guardia desde su réplica local |
| S2-07 | Como cuidadora quiero ver el estado de salud del sistema de cuidado (dispositivo, batería proyectada, cuidadores alcanzables, antigüedad del último dato), para saber qué está vigilado y qué no | 3 | Heartbeat + last-will → alerta N2 de dispositivo sin conexión; predicción simple de batería; "última posición hace 4 h", nunca posición vieja como actual |

### DoD reforzada específica de este sprint (además de §0.3)

1. **Game day en la review:** Core apagado → la alerta N1 sigue escalando desde la réplica local del carril.
2. **Test de canal degradado automatizado:** push bloqueado a nivel de SO → SMS en ≤ X s → voz en ≤ Y s (umbrales del spike).
3. **SLO instrumentado desde el primer despliegue:** panel evento→primer canal p99 < 5 s; sonda sintética cada 15 min con dispositivo de laboratorio.
4. **Anti-fatiga verificado:** suite de simulación de GPS drift en el borde de la geovalla → exactamente una alerta con actualizaciones, jamás un goteo.
5. **Despliegue canario con rollback automático por métrica** en el carril (Fase 2 §3.3): queda ensayado en este sprint, no descrito.

### Riesgos del sprint y mitigación

| Riesgo | Mitigación |
|---|---|
| Fabricantes Android agresivos (Xiaomi/Huawei) matan el agente pasivo | Matriz de dispositivos del piloto definida ya (se pregunta a las familias qué teléfono tiene el paciente); guía de exclusión de batería por fabricante en el onboarding; si un dispositivo no es fiable, **se dice** (M13) — nunca se finge vigilancia |
| El escalado a voz/SMS acumula coste por pruebas | Entorno de pruebas con números virtuales y proveedor sandbox; presupuesto de telefonía del sprint aprobado de antemano |
| La histéresis mal calibrada genera falsas alarmas o retardo excesivo | Parámetros del spike como punto de partida; ajustables por configuración remota sin redesplegar; se recalibra con datos del piloto |
| Scope creep: "ya que estamos, detección de caídas" | No hay wearable en MVP (decisión MECE §1.3); la tentación se anota en el backlog de V2 y se sigue |

## 2.4 SPRINT 3 — Canales de Mensajería, Registro de Síntomas y Consola de Reportes

**Sprint Goal:** *"Una quincena de cuidado real cabe en la app: relevos con contexto, síntomas registrados en 10 segundos, tareas con dueño, un resumen diario que tranquiliza al hijo que vive lejos — y todo termina en una página que la neuróloga lee en 2 minutos y se toma en serio."*

**Entregable demostrable (Sprint Review):** la familia sintética García "vive" dos semanas simuladas (script de datos realistas); se demuestra el flujo completo: relevo de turno → registro ABC de un episodio de sundowning → tarea "recoger receta" cogida por un hermano → digest de la noche → generación del informe → la "Dra. Ruiz" accede por invitación temporal, con su acceso visible para la familia. Cierre del círculo demostrado con la familia sintética de pruebas (silenciamiento + export).

### Backlog comprometido (≈ 39 puntos)

| ID | Historia (resumen) | Pts | Notas de implementación |
|---|---|---|---|
| S3-01 | Como cuidadora saliente quiero dejar un relevo estructurado de 30 segundos (comida, ánimo, incidencias, pendientes) con audio opcional, para que quien entra sepa lo que yo sé | 5 | Plantilla de toques + audio → transcripción (Lambda); alimenta care-log sin doble registro; el profesional limitado escribe relevos pero no ve el resto del diario (matriz) |
| S3-02 | Como cuidador quiero registrar un episodio conductual en formato ABC con 3 chips y una intensidad, en menos de 10 segundos, para que el patrón exista cuando el médico lo pida | 8 | Catálogo completo de chips (agitación, sundowning, deambulación nocturna, delirios, apatía, negativas…); sueño, comidas semáforo, caídas con contexto, peso, dolor observado, continencia; offline-first; cero texto obligatorio |
| S3-03 | Como miembro del círculo quiero ver y coger tareas con dueño y fecha, y pedir relevo con un botón ("necesito un respiro"), para que ayudar sea concreto y pedir ayuda no cueste culpa | 5 | Tablón (M8); botón de respiro = alerta social N1 al círculo completo vía carril (ya construido); `TareaSinAsignar`/`TurnoSinCubrir` → N2 |
| S3-04 | Como hijo que vive lejos quiero un resumen diario del día de mi madre, para tener tranquilidad sin bombardear a mi hermana a preguntas | 3 | Digest N3 generado de care-log + eventos; "día tranquilo: paseo, comió bien, siesta larga"; nunca push individual N3; hora configurable |
| S3-05 | Como familia queremos tendencias visuales simples (sueño, comidas, episodios, adherencia) sin interpretación clínica, para ver patrones sin que nadie nos diagnostique | 5 | SQL de agregación sobre TimescaleDB; visualización de patrones con lenguaje neutro validado contra lista de claims (C1): "el sueño empeora desde hace 3 semanas" ✔ / "deterioro detectado" ✘ |
| S3-06 | Como cuidadora quiero generar el informe de consulta de 1 página antes de la cita, para llegar al médico con datos y que me tome en serio | 5 | PDF asíncrono: adherencia, incidentes, cambios conductuales, preguntas de la familia; recordatorio N2 con checklist 24 h antes de la cita; sin logos de "informe médico" — es un informe *para* el médico, no *de* un médico |
| S3-07 | Como neuróloga invitada quiero acceder con un enlace temporal de solo lectura al informe y las tendencias, para ajustar el manejo con la evolución real — y que la familia vea que accedí | 5 | Web ligera (consola de reportes): acceso 30 días renovables, marca de agua, registro de acceso visible ("la Dra. Ruiz consultó el informe el martes"); jamás chat ni finanzas (matriz) |
| S3-08 | Como admin, en el momento más difícil, quiero cerrar el círculo y que todo recordatorio y alerta cese inmediatamente, para que la tecnología no añada dolor | 3 | M12 mínimo: `CirculoEnCierre` → silenciamiento irreversible por estado + export del diario/registros (motor de portabilidad GDPR); textos escritos con la diseñadora y revisados con una psicóloga de AFA |

### Semana 6 — hardening y preparación del piloto (dentro del Sprint 3, capacidad reservada)

La estimación del Sprint 3 deja deliberadamente ~15 % de su capacidad a: triage de bugs de los sprints 1–2 encontrados en staging, prueba de restauración de backup cronometrada, revisión final de textos con el DPO (claims, consentimiento, límites del sistema), ensayo del runbook de brechas, y el **ensayo general del piloto**: onboarding real de la primera familia (del equipo extendido/AFA) en producción con acompañamiento presencial.

**DoD de hardening — checklist de los "10 puntos" (auditoría de app vendible, adaptada de la metodología de tododeia.com) antes de dar por cerrada la semana 6.** Cada punto se audita contra el código real en staging, no contra la intención de Fase 2 — si algo de lo decidido en Fase 2 no llegó a implementarse, este es el gate que lo atrapa:

| # | Punto | Qué se audita | Decisión de Fase 2 que debería sostenerlo |
|---|---|---|---|
| 1 | RLS / aislamiento multi-tenant | Ninguna query cruza `circle_id`; RLS activo en Postgres como red final, no solo en el middleware | §2.2.2–2.2.3 |
| 2 | Cero secretos en el repo/historial | `git log` + escaneo de secretos (gitleaks o equivalente) limpio; todo en Secrets Manager con rotación | §3.3 |
| 3 | APIs con auth, permisos y validación de entrada | Guards de rol en cada endpoint (no solo en los "sensibles"); validación de payload en el borde | §2.2.3, §1.1.4 |
| 4 | Hosting/despliegue con entornos separados | Staging y producción con credenciales y datos distintos; variables de entorno fuera de código | §3.1.3 |
| 5 | Seguridad de sesión y login | Expiración e invalidación de sesión al cambiar rol/salir del círculo; vulnerabilidades OWASP Top 10 cerradas | §2.1, §2.2 |
| 6 | Rate limiting en endpoints caros | Cuotas de IA (transcripción/informe) y throttling de auth activos y probados con carga sintética, no solo documentados | §1.1.4 (nuevo, añadido en este hardening) |
| 7 | Caché donde corresponde | Redis sirviendo el estado vivo de alertas y presencia sin servir datos de un círculo ajeno | §1.3.5 |
| 8 | Escalabilidad | Auto-scaling del Core probado con el game day mensual de §3.2.4; carril crítico nunca escala a cero | §1.1.2-B, §3.2 |
| 9 | Monitoreo de errores, rendimiento y gasto, con alertas | Health checks externos + PagerDuty ya operativos (§3.2.5); se añade aquí alerta de **gasto por círculo** sobre las cuotas del punto 6, no solo alertas de caída | §3.2.5 |
| — | Multi-tenancy a nivel de plan (contexto de la metodología, no aplica aún) | El MVP no tiene niveles de plan (Starter/Pro/Enterprise); se deja anotado como precondición de V2 si se monetiza por tiers, no como deuda de este piloto | Fase 4/5 |

Un fallo en cualquiera de los puntos 1, 2, 5 o 6 bloquea el piloto (no se onboardea a la primera familia real); un fallo en 3, 4, 7, 8 o 9 se corrige en la propia semana 6 con la holgura reservada.

### Riesgos del sprint y mitigación

| Riesgo | Mitigación |
|---|---|
| El catálogo de chips del registro se debate infinitamente | Catálogo v1 congelado desde el refinamiento de la semana 4 con el asesor clínico; el piloto lo corregirá con uso real, no con opiniones |
| El informe de 1 página "engorda" (todos quieren añadir su campo) | Regla dura: 1 página A4 imprimible o no se aprueba la historia; lo que no cabe, no entra (los médicos de Fase 1 pidieron 1 página, no un dashboard) |
| La consola del profesional se convierte en "producto para médicos" | Alcance blindado por la matriz: solo lectura, solo informe+tendencias, solo temporal. Todo lo demás es V3+ (B2B) |
| Fatiga del equipo en la recta final | La holgura del §0.1 existe para esto; si se consume, cae primero S3-05 (tendencias) — el informe (S3-06/07) es el compromiso con el piloto, las tendencias in-app pueden llegar una semana tarde |

## 2.5 Lo que este roadmap NO compra (honestidad de alcance)

Al terminar la semana 6 **hay**: un MVP piloto desplegable con 5–10 familias reclutadas vía AFAs, con el bucle de valor completo, el camino crítico a calidad de misión crítica, DPIA aprobada y evidencia de auditoría desde el primer dato.

Al terminar la semana 6 **no hay**: app en las stores públicas (el piloto distribuye por TestFlight/track cerrado de Play — la publicación pública con su revisión de claims es el hito del mes 3), pentest externo completado (contratado para pre-lanzamiento público, Fase 2 §3.4), monetización, wearables, ni ninguna funcionalidad de la lista V2. El éxito del piloto se mide con las métricas del Lean Canvas (círculos activos semanales, ≥ 2 miembros activos + 1 rutina en semana 1, registros/semana, tiempo de respuesta a alertas, NPS del cuidador) durante 8 semanas antes de comprometer el backlog de V2 — **el backlog de V2 lo escribe el piloto, no este documento.**

---

# 3. HISTORIAS DE USUARIO CRÍTICAS (ESTILO GHERKIN)

Las tres historias siguientes son las *historias faro* del MVP: una por rol, elegidas porque cada una concentra el mayor valor y el mayor riesgo de su segmento. No sustituyen al backlog (§2); lo presiden — cuando una decisión de implementación dude, se resuelve a favor de estas tres. Se redactan completas: narrativa, contexto, criterios de aceptación funcionales, criterios negativos (lo que NO debe pasar) y criterios no funcionales, porque en este producto los "noes" y los no-funcionales son la mitad del valor.

---

## HU-001 — PACIENTE · "Salir a pasear sin dejar de ser yo"

> **Como** persona con Alzheimer en fase leve (GDS 3–4) que aún sale sola a la calle,
> **quiero** que mi familia solo sea avisada si me alejo de mis zonas de siempre — sin que nadie mire dónde estoy el resto del tiempo, y habiéndolo decidido yo mientras puedo —,
> **para** conservar mi autonomía y mi dignidad el mayor tiempo posible sin convertirme en una preocupación constante.

**Epic:** Seguridad con dignidad · **Sprint:** 2 (consentimiento en Sprint 1) · **Prioridad:** Crítica · **Estimación:** S1-05 (8) + S2-01 (5) + S2-02 (8) + S2-04 (5)
**Regla de diseño rectora (C4):** el paciente no ejecuta ninguna acción en ningún criterio. Toda interacción suya es pasiva; el test de cada escenario es *"¿funciona si la paciente no recuerda que esto existe?"*

### Criterios de aceptación

**Escenario 1 — Consentimiento otorgado en fase leve con preferencias anticipadas**
- **Dado que** Elena tiene un diagnóstico en fase leve y capacidad de consentir, y su hija Ana (admin) ha propuesto activar la zona segura,
- **Cuando** Elena revisa en la app de Ana (acompañada, en una pantalla de lenguaje llano con texto grande y opción de escucha por voz) la explicación de qué se vigila (solo cruces de zona), qué no (su posición continua) y quién será avisado,
- **Entonces** el sistema registra un consentimiento con titular=Elena, alcance=geolocalización-por-geovalla, base=consentimiento explícito del titular, la versión exacta del texto mostrado y la fecha; **y** le ofrece registrar preferencias anticipadas (p. ej., "si empeoro, quiero que la localización solo se use cuando salga sola de noche"), que quedan selladas en el historial inmutable; **y** la geovalla no puede activarse antes de que este consentimiento exista.

**Escenario 2 — Paseo rutinario: el sistema calla**
- **Dado que** la zona segura incluye el barrio de Elena y su horario de paseo habitual, y su teléfono lleva el agente pasivo activo,
- **Cuando** Elena pasea 40 minutos dentro de la zona, o el GPS deriva 20 metros fuera del borde durante 15 segundos y regresa,
- **Entonces** no se genera ninguna alerta ni notificación de ningún nivel, no se almacena ninguna posición fina, y el único rastro es el heartbeat técnico del dispositivo; **y** el consumo de batería atribuible al agente en 24 h no supera el presupuesto validado en el spike.

**Escenario 3 — Salida real de zona: alerta única con posición solo mientras dure**
- **Dado que** Elena cruza el perímetro y permanece fuera más de la histéresis configurada (N metros sostenidos M segundos),
- **Cuando** el agente (o la validación secundaria del servidor) detecta el cruce,
- **Entonces** el carril crítico genera **una** alerta de nivel 1 (no un goteo de alertas por oscilación) dirigida al cuidador de guardia en ≤ 5 s (p99) desde el evento; **y** solo a partir de ese momento el dispositivo emite posición fina cada 30–60 s, visible para el círculo en el mapa de la alerta activa; **y** al cerrarse la alerta ("Elena está con Ana") la emisión de posición cesa, y la posición fina se purga a las 72 h quedando solo el evento agregado ("salida de zona el 12/07, resuelta en 40 min por Ana").

**Escenario 4 — Revocación: la voluntad de Elena manda**
- **Dado que** Elena (o, en fase posterior, quien acredite base de actuación como guardador de hecho, con el cambio registrado) revoca el consentimiento de geolocalización,
- **Cuando** la revocación se registra,
- **Entonces** el evento `ConsentimientoRevocado` se propaga y la geovalla queda desactivada extremo a extremo (agente incluido) en menos de 5 minutos, la desactivación es visible en el estado del sistema ("zona segura: desactivada por decisión de Elena"), y ningún miembro del círculo puede reactivarla sin un nuevo consentimiento registrado.

**Escenario 5 (negativo) — Sin señal no hay teatro de vigilancia**
- **Dado que** el teléfono de Elena se queda sin batería o el SO mata el agente,
- **Cuando** el heartbeat deja de llegar durante el umbral configurado,
- **Entonces** el sistema **no** muestra la última posición como si fuera actual ni el estado "todo en orden"; muestra "dispositivo sin conexión desde hace 3 h — última batería conocida 12 %" y genera una alerta de nivel 2 al cuidador de guardia; **y** en ningún caso se genera una alerta de nivel 1 por mera pérdida de señal (anti-fatiga, R4).

**Criterios no funcionales vinculantes:** coordenadas cifradas a nivel de campo en reposo; retención de posición fina ≤ 72 h verificada por test automatizado de purga; todo acceso de un miembro al mapa de alerta queda en el log de auditoría; los textos de esta función nunca usan "vigilar", "rastrear" ni "monitorizar" — el lenguaje es "acompañar" y "zona segura" (revisión C1/L2).

---

## HU-002 — CUIDADORA · "Poder dormir cuando no me toca"

> **Como** cuidadora principal de mi madre, agotada y de guardia permanente desde hace dos años,
> **quiero** que las alertas lleguen primero a quien está de guardia según nuestro calendario, con acuse de recibo, y que escalen solas de persona en persona y de canal en canal hasta que alguien responda,
> **para** poder desconectar de verdad cuando no me toca — sabiendo que si no suena, es que no pasa nada, y que si pasa, sonará hasta encontrarnos.

**Epic:** Anti-burnout / carril crítico · **Sprint:** 2 · **Prioridad:** Crítica (es el contrato moral del producto, C3) · **Estimación:** S2-03 (8) + S2-06 (5)

### Criterios de aceptación

**Escenario 1 — La alerta va a quien está de guardia, no a todos**
- **Dado que** el calendario del círculo marca que esta noche está de guardia el hermano Luis, y Ana (cuidadora principal) no está de guardia,
- **Cuando** se produce una alerta de nivel 1 (salida de zona, o anticoagulante de las 22:00 sin confirmar en su ventana),
- **Entonces** la alerta suena **solo** en el dispositivo de Luis, con sonido propio que atraviesa el modo silencio (permiso previamente concedido), con las acciones "Estoy en ello" y "No puedo ahora"; **y** Ana no recibe nada en ese momento; **y** el panel de la alerta muestra al círculo su estado vivo ("esperando acuse de Luis").

**Escenario 2 — Escalado por personas y por canales hasta el acuse**
- **Dado que** Luis no acusa recibo,
- **Cuando** transcurre el plazo configurado (por defecto: 2 min para push),
- **Entonces** el sistema reintenta con Luis por SMS y, en paralelo según configuración, notifica al segundo contacto de la cadena; **cuando** tampoco hay acuse en el siguiente plazo, **entonces** escala a llamada de voz sintetizada a Luis y al segundo contacto ("Esto es una alerta del círculo de cuidado de Elena: ha salido de su zona segura. Pulse 1 para confirmar que se ocupa"); **cuando** se agota la cadena sin acuse, **entonces** alerta al círculo completo y, si la familia lo configuró, llama al teléfono de respaldo definido — y el estado "nadie ha respondido aún" es visible con honestidad, nunca silencioso.

**Escenario 3 — El acuse detiene el ruido y deja constancia**
- **Dado que** la alerta está escalando,
- **Cuando** cualquier miembro autorizado pulsa "Estoy en ello",
- **Entonces** cesan inmediatamente todos los reintentos y llamadas pendientes a todos los miembros; el círculo ve "Luis se está ocupando (acusó a las 4:15)"; y el registro forense append-only contiene cada transición: emisión, canales disparados con timestamps, quién acusó y en cuánto tiempo — consultable después ("¿el sistema avisó?", L5).

**Escenario 4 — Desconexión real fuera de guardia, sin agujeros**
- **Dado que** Ana termina su guardia a las 8:00 y Luis toma el relevo,
- **Cuando** Ana consulta su app a las 8:01,
- **Entonces** su estado muestra "No estás de guardia — Luis cubre hasta las 20:00" y sus notificaciones de nivel 1–2 quedan en reposo (salvo escalado que la alcance por cadena); **y dado que** un hueco de guardia queda sin cubrir mañana, **cuando** faltan menos de 12 h para el hueco, **entonces** el círculo completo recibe una notificación de nivel 2 ("mañana 14:00–20:00 sin nadie de guardia") — el hueco es visible sin que Ana tenga que pedir cobertura.

**Escenario 5 (negativo) — Reconexión sin infartos gratuitos**
- **Dado que** Ana estuvo sin cobertura durante una alerta que Luis ya resolvió,
- **Cuando** su app reconecta,
- **Entonces** ve el estado reconciliado ("hubo una alerta a las 4:12; la atendió Luis a las 4:15; resuelta") y **no** recibe la notificación cruda original de crisis como si estuviera activa.

**Escenario 6 (negativo) — El fallo del Core no apaga la promesa**
- **Dado que** el Core está caído (game day mensual),
- **Cuando** se produce un evento de nivel 1,
- **Entonces** el carril crítico decide y escala con su réplica local (miembros, guardia, cadena, teléfonos) sin degradación del SLO; lo único indisponible es lo no crítico (registrar comidas, tareas), que muestra su propio estado honesto en la app.

**Criterios no funcionales vinculantes:** SLO evento→primer canal 99,95 % mensual, p99 < 5 s, con panel público interno; sonda sintética cada 15 min; simulacro mensual con la familia (test de confianza prometido en Fase 1 §2.1); presupuesto de notificaciones: ninguna alerta de nivel 3 llega jamás como push individual — el test de fatiga es parte de la suite.

---

## HU-003 — PROFESIONAL · "Dejar de decidir a ciegas entre consulta y consulta"

> **Como** neuróloga que ve a Elena 15 minutos cada 6 meses,
> **quiero** recibir, mediante una invitación temporal y auditada de la familia, un informe longitudinal de una página con la evolución observada en casa (adherencia, sueño, conducta, incidentes) y sus tendencias,
> **para** ajustar el manejo con la evolución real del día a día en lugar de la memoria estresada de una cuidadora en consulta — sin acceder jamás a la intimidad familiar que no me corresponde.

**Epic:** Consola de reportes / puente cuidador–médico · **Sprint:** 3 · **Prioridad:** Alta (gancho de prescripción y valor del piloto ante AFAs) · **Estimación:** S3-06 (5) + S3-07 (5)
**Guardarraíl regulatorio (C1):** el informe presenta *observaciones estructuradas del cuidador*, nunca conclusiones, puntuaciones ni interpretación clínica generada por el sistema. La inteligencia clínica la pone la médica; el sistema pone la memoria ordenada.

### Criterios de aceptación

**Escenario 1 — Invitación temporal, mínima y auditada**
- **Dado que** Ana (admin) tiene cita con la Dra. Ruiz la próxima semana,
- **Cuando** la invita como *profesional invitado* introduciendo su email,
- **Entonces** la Dra. Ruiz recibe un enlace de acceso de solo lectura a la consola de reportes con caducidad de 30 días (renovable por la familia), limitado exclusivamente al informe y las tendencias del paciente de ese círculo; **y** el acceso no incluye —ni por URL directa, ni por API— el chat/relevos familiares, las tareas, el check-in de cuidadores ni las finanzas (tests negativos de la matriz); **y** cada visualización queda registrada y visible para la familia ("la Dra. Ruiz consultó el informe el martes a las 9:40").

**Escenario 2 — El informe de una página, generado de lo ya registrado**
- **Dado que** el círculo lleva semanas registrando medicación, relevos y observaciones de 10 segundos,
- **Cuando** Ana pulsa "preparar informe para la consulta" (o acepta la sugerencia automática que llega con el checklist 24 h antes de la cita),
- **Entonces** el sistema genera en menos de 2 minutos un PDF de **una sola página A4** con: rango temporal, adherencia a la medicación (confirmadas/omitidas/rechazadas, con los críticos destacados), incidentes fechados (caídas, salidas de zona con su resolución), frecuencia y patrón temporal de episodios conductuales en formato ABC, evolución observada de sueño y alimentación, cambios funcionales reportados, y las preguntas que la familia quiere hacer; **y** todo el contenido usa lenguaje observacional ("la familia registró 9 episodios de agitación vespertina, frente a 3 el periodo anterior") sin ningún término diagnóstico generado por el sistema.

**Escenario 3 — Lectura en consola con contexto longitudinal**
- **Dado que** la Dra. Ruiz abre su enlace vigente,
- **Cuando** consulta la consola,
- **Entonces** ve el informe actual, los informes anteriores del mismo paciente y las tendencias visuales por rangos temporales, todo con marca de agua con su nombre y fecha de acceso; **y** puede descargar el PDF para adjuntarlo a la historia clínica de su centro (la interoperabilidad HL7/FHIR queda explícitamente fuera: el puente del MVP es un PDF impecable, no una integración).

**Escenario 4 — Expiración y revocación sin residuos**
- **Dado que** el acceso caduca a los 30 días o la familia lo revoca antes,
- **Cuando** la Dra. Ruiz intenta entrar después,
- **Entonces** el enlace muestra "acceso finalizado — pida a la familia una renovación si la necesita", sin filtrar ningún dato (ni siquiera el nombre del paciente); la revocación surte efecto en menos de 1 minuto; y el historial de accesos pasados permanece en el log de auditoría del círculo.

**Escenario 5 (negativo) — El profesional no es una puerta lateral a la intimidad**
- **Dado que** la Dra. Ruiz tiene sesión válida,
- **Cuando** manipula la URL o llama a la API intentando acceder a relevos, tareas, otro paciente u otro círculo,
- **Entonces** cada intento recibe denegación en las tres capas (guard por endpoint, scoping por `circle_id`, RLS) y queda registrado; estos casos forman parte de la suite negativa automatizada que bloquea el despliegue si falla.

**Criterios no funcionales vinculantes:** la consola web cumple los mismos estándares de cifrado y auditoría que la app (es PHI); el informe se genera desde los identificadores pseudonimizados y la re-identificación (nombre de Elena) ocurre solo en la capa de presentación para el acceso autorizado; el diseño de la página lo valida al menos un médico real del grupo de Fase 1 antes de congelar la plantilla ("¿lo leerías en 2 minutos? ¿te fiarías?").

---

# CIERRE — Las 10 reglas de delivery de este roadmap (síntesis)

1. **El MVP se defiende por exclusión.** Cada "ya que estamos…" se contrasta con las cuatro preguntas del filtro MECE (§1.1) y, si no las pasa, se anota en V2 y se sigue adelante.
2. **Primero la unidad de privacidad, luego la promesa de seguridad, luego el hábito.** El orden de los sprints no es negociable porque cada uno es precondición legal o técnica del siguiente.
3. **La suite de "noes" manda.** Ninguna release sale con un test negativo de la matriz de permisos en rojo. En este producto, un fallo de permisos es una violación de intimidad familiar.
4. **El carril crítico tiene su propia definición de hecho** (game day, canal degradado, SLO instrumentado, canario con rollback). Lo que no puede fallar se construye distinto de lo que puede.
5. **Cada sprint termina en una demo que una cuidadora entendería.** Si hay que explicar la demo con un diagrama, el sprint entregó arquitectura, no valor.
6. **Los textos son producto y son cumplimiento.** La lista de términos vetados (C1) corre en CI; el lenguaje emocional de las transiciones difíciles (cierre del círculo) se escribe con ayuda profesional, no a las 23:00 de un viernes de sprint.
7. **La honestidad del sistema es una feature con historias propias** (M13, escenarios negativos de HU-001/002): nunca un dato viejo presentado como actual, nunca silencio confundible con normalidad.
8. **La holgura es estructural, no vergonzante.** ~12 % de capacidad sin comprometer, y una lista escrita de qué cae primero (tendencias in-app) y qué jamás (el camino de alerta).
9. **El piloto es el árbitro.** Las métricas de activación y respuesta del Lean Canvas deciden el backlog de V2; este documento deja de mandar el día que la primera familia real entra en producción.
10. **Las tres historias faro presiden las dudas.** Ante cualquier disyuntiva de implementación, gana la interpretación que mejor sirva a Elena paseando con dignidad, a Ana durmiendo cuando no está de guardia y a la Dra. Ruiz leyendo la verdad en una página.

---

# PRÓXIMOS PASOS (salida de Fase 3)

| # | Acción | Criterio de éxito |
|---|---|---|
| 1 | **Validar este roadmap con el equipo real** (planning poker sobre el backlog completo; ajustar puntos y holgura a la velocidad real del equipo contratado) | Backlog re-estimado y comprometido por quienes lo ejecutarán, no por el documento |
| 2 | **Confirmar el cierre del Sprint 0** (spike, IaC, DPIA, matriz, familias piloto) | Checklist de §0.2 completo; cualquier rojo re-planifica antes de arrancar |
| 3 | **Refinar las historias del Sprint 1 a nivel de tarea** con los criterios Gherkin como fuente de los tests | 100 % del Sprint 1 en estado *Preparado* (DoR) el día del planning |
| 4 | **Congelar el catálogo v1 de chips de registro y la plantilla del informe** con el asesor clínico y un médico del grupo de Fase 1 | Ambos artefactos versionados como anexos antes de la semana 4 |
| 5 | **Diseñar el protocolo del piloto** (8 semanas, 5–10 familias, consentimientos, soporte humano asignado, métricas de éxito/parada) | Protocolo aprobado por DPO y AFA aliada antes del fin del Sprint 3 |

*Documento vivo. Los sprints están escritos con la humildad de quien sabe que el primer contacto con una familia real corregirá este papel — y con la firmeza de quien sabe qué tres cosas no se negocian: la dignidad de Elena, el descanso de Ana y la verdad de una alarma que suena cuando debe.*
