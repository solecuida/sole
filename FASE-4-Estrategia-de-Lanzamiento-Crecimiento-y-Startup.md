# FASE 4 — ESTRATEGIA DE LANZAMIENTO, CRECIMIENTO Y STARTUP
## Ecosistema digital de acompañamiento para personas con Alzheimer y sus familias

**Documento de estrategia de crecimiento — v1.0**
**Fecha:** 11 de julio de 2026
**Estado:** Borrador para validación con el piloto y las AFAs aliadas
**Clasificación:** Interno — Fundación del proyecto
**Documentos predecesores:** [FASE-1-Descubrimiento-y-Validacion.md](FASE-1-Descubrimiento-y-Validacion.md) · [FASE-2-Arquitectura-Tecnica-y-Seguridad.md](FASE-2-Arquitectura-Tecnica-y-Seguridad.md) · [FASE-3-Roadmap-MVP-e-Historias-de-Usuario.md](FASE-3-Roadmap-MVP-e-Historias-de-Usuario.md)

---

> **Nota metodológica.** Este documento traduce el producto de las Fases 1–3 a una estrategia de adquisición, activación, retención y monetización. Sigue el marco de growth de la industria (AARRR de Dave McClure, North Star framework de Amplitude/Reforge, bucles de crecimiento de Reforge, PLG de OpenView) **adaptado a la restricción que lo cambia todo**: nuestro usuario compra en su peor momento vital, nuestro dato es de categoría especial, y nuestro cliente se va del producto porque su madre fallece. El growth hacking clásico (urgencia artificial, gamificación de vanidad, viralidad forzada, dark patterns de cancelación) no es que sea inapropiado aquí: **es directamente destructivo del único activo que tenemos, la confianza.** Cada táctica de este documento pasa un doble filtro: ¿funciona? y ¿la defenderíamos delante de una asociación de familiares y de la AEPD a la vez?

### Restricciones heredadas (contrato de esta estrategia)

| # | Restricción heredada | Consecuencia en growth |
|---|---|---|
| G1 | El competidor real es WhatsApp + libreta + "más o menos" (Fase 1, punto ciego 3) | El mensaje de adquisición nunca compara con otras apps; compara con el caos actual. La activación compite en fricción contra WhatsApp |
| G2 | **El LTV tiene techo biológico** (R3): vida de cliente típica 2–4 años, acotada por progresión de la enfermedad | El CAC debe ser estructuralmente bajo → canales de confianza y bucles orgánicos, **no paid como motor principal, jamás** |
| G3 | MVP = bienestar/organización, nunca producto sanitario (C1) | Ningún mensaje de marketing, landing, App Store listing, post o nota de prensa usa "detecta / diagnostica / predice / monitoriza clínicamente". La lista de términos vetados de la Fase 3 §0.3 aplica al marketing con más dureza que a la UI: *la frontera MDR se cruza con palabras* (L4) |
| G4 | El pagador probable es el cuidador a distancia ("compra tranquilidad, no tiempo") | El funnel de monetización se diseña para el hijo que vive lejos, aunque quien se registra primero suele ser la cuidadora principal |
| G5 | El círculo (3–8 miembros) es la unidad de valor y de privacidad (C5) | La métrica atómica de crecimiento es el **círculo**, nunca el usuario individual. La viralidad primaria es intra-familiar y viene de serie en el producto |
| G6 | El duelo es parte del customer journey (R3); el offboarding digno es el caso final de todos los clientes | El churn por fallecimiento no es fracaso: es el momento de mayor potencial prescriptor de todo el ciclo. Se mide y se trata por separado del churn por abandono |
| G7 | Datos de salud art. 9 + telemetría sin PHI (Fase 2 §2.3.2) | Toda la analítica de growth opera sobre eventos pseudonimizados sin contenido. Prohibido retargeting con audiencias construidas sobre uso de la app (una audiencia de "cuidadores de Alzheimer" derivada de nuestros datos es en sí una filtración de dato de salud) |

---

# 1. ESTRATEGIA GO-TO-MARKET (GTM) E INICIO

## 1.1 Tesis GTM: en este mercado no se compra un producto, se deposita una confianza

Tres hechos del descubrimiento (Fase 1) determinan el GTM completo:

1. **La compra es emocional y la barrera es la confianza, no el precio.** Una familia no instala "una app que vigila a mamá" porque la vio en un anuncio de Instagram; la instala porque se la recomendó la psicóloga de la AFA, su grupo de apoyo o su neuróloga. La implicación es dura: **los canales de bajo coste por clic son los de peor conversión y peor calidad aquí, y los canales "lentos" (asociaciones, prescripción profesional) son los de mejor economía real.** El GTM correcto es trust-first, no volume-first.
2. **El mercado no busca la solución porque ha normalizado el problema.** La cuidadora no googlea "app coordinación cuidado demencia"; googlea "mi madre esconde las pastillas" a las 2 de la mañana. La demanda es latente y se activa por *momentos de crisis* (diagnóstico reciente, primer episodio de deambulación, primera discusión fuerte entre hermanos, ingreso hospitalario). El GTM debe estar presente en esos momentos, que ocurren en consultas, grupos de apoyo y buscadores — no en feeds.
3. **La ventana de adopción es estrecha.** En fase leve, la familia está en negación ("todavía no necesitamos esto"); en fase avanzada, ya claudicó o institucionalizó. El punto dulce de entrada es **GDS 4–5**: el diagnóstico está aceptado, el miedo al wandering ha aparecido, y el círculo todavía tiene energía para organizarse. Los mensajes y los aliados se calibran para interceptar exactamente esa ventana.

**Consecuencia estratégica:** el GTM se construye como una escalera de círculos concéntricos de confianza — piloto acompañado → alfa por invitación de AFAs → beta cerrada de 100 familias → apertura regional — donde **cada escalón se financia con la prueba social del anterior** y ningún escalón se abre hasta que las métricas del anterior lo autorizan (gates explícitos, §1.2).

## 1.2 Fases de lanzamiento con puertas de decisión

```
   PILOTO (8 sem)          ALFA CERRADA (8-10 sem)      BETA CERRADA (12-16 sem)       APERTURA REGIONAL
 ┌──────────────────┐    ┌────────────────────────┐   ┌──────────────────────────┐   ┌──────────────────────┐
 │ 5–10 familias    │    │ 25–30 familias         │   │ 100 familias (cohortes   │   │ Stores públicas,     │
 │ vía 1–2 AFAs     │───▶│ 2–3 AFAs + primeros    │──▶│ de 20–25; lista de       │──▶│ 2–3 provincias,      │
 │ Onboarding       │    │ profesionales aliados  │   │ espera pública)          │   │ freemium activo      │
 │ presencial       │    │ Onboarding remoto      │   │ Onboarding self-serve    │   │                      │
 │ Gratis, TestFlight│   │ asistido               │   │ + soporte humano         │   │                      │
 └──────────────────┘    └────────────────────────┘   └──────────────────────────┘   └──────────────────────┘
   Valida: bucle de        Valida: onboarding sin      Valida: PLG intra-círculo,     Valida: CAC por canal,
   valor y seguridad       presencialidad, canal        NSM a escala, primeras         conversión freemium,
   (métricas Fase 3)       profesional, retención       señales de willingness         economía unitaria
                           mes 2                        to pay (§2.4)                  completa
```

**Puertas (gates) entre fases — números concretos, revisables con el piloto pero nunca eliminables:**

| Transición | Criterios de avance (todos) | Criterio de parada (cualquiera) |
|---|---|---|
| Piloto → Alfa | ≥ 70 % de círculos cumplen activación (≥ 2 miembros activos + 1 rutina en semana 1, métrica de Fase 1 §R2) · ≥ 60 % de círculos activos en semana 8 · 0 incidentes de falsa seguridad (R4) · NPS cuidador ≥ 40 | Cualquier incidente grave del carril crítico sin causa raíz cerrada · < 40 % de activación (el onboarding no está listo) |
| Alfa → Beta | Activación ≥ 70 % **sin onboarding presencial** · retención de círculo mes 2 ≥ 55 % · coste de soporte por círculo/mes conocido y sostenible · ≥ 3 profesionales usando el informe de 1 página espontáneamente | El soporte no escala (más de ~2 h de soporte humano por círculo/mes de media) — se arregla el producto antes de crecer |
| Beta → Apertura | NSM (§2.1) creciendo ≥ 10 % intermensual dentro de la beta por bucles orgánicos · K intra-círculo ≥ 2,5 (§1.5) · ≥ 25 % de las familias de la lista de espera llegan por recomendación no incentivada · pentest externo y revisión de claims completados (Fase 2 §3.4) | Churn voluntario mes 3 > 8 % mensual (hay una fuga en el bucle de valor que el volumen solo amplificaría) |

**Regla anti-vanidad:** crecer con un bucle roto no adelanta el éxito, adelanta el fracaso a mayor escala y con más familias defraudadas. En este producto, una familia defraudada no es un churn: es una historia negativa contada en el grupo de apoyo donde íbamos a reclutar a las diez siguientes.

## 1.3 Canales de alta confianza para las primeras 100 familias (playbook por canal)

### Canal 1 — Asociaciones de familiares (AFAs / CEAFA / federaciones): el canal fundacional

Es el canal nº 1 declarado desde la Fase 1 y el único imprescindible. No se "usa" a las AFAs como canal: se construye con ellas un **programa de partenariado con intercambio de valor explícito**, porque su activo (la confianza de sus familias) es exactamente lo que no pueden permitirse arriesgar con una startup.

**Qué les ofrecemos (antes de pedir nada):**
- **Herramienta gratuita para sus programas** de apoyo a familias, para siempre, para las familias que ellas acompañan (compromiso escrito: las familias derivadas por AFA tienen el plan completo sin coste durante todo el piloto/alfa/beta, y condiciones preferentes a perpetuidad).
- **Métricas de impacto agregadas y anónimas** para sus memorias y solicitudes de subvención ("las familias del programa redujeron los huecos de guardia sin cubrir un X %") — para una asociación que vive de justificar impacto, esto es oro (Fase 1 §1.3, UVP profesional).
- **Contenido co-creado y co-firmado** (guías por estadio, recursos de respiro) donde la AFA aparece como autoridad, no como logo decorativo.
- **Canal de derivación inverso:** cuando el producto detecta sobrecarga (§3), deriva a los recursos de *esa* AFA local (grupos de apoyo, respiro, psicólogas). El producto les trae familias a sus programas, no solo al revés.

**Qué les pedimos, escalonado:** (1) entrevistas de validación —ya en curso desde Fase 1—; (2) 5–10 familias para el piloto con acompañamiento conjunto; (3) presentación del programa en sus charlas y grupos; (4) carta de apoyo para subvenciones/inversores. Nunca se les pide "acceso a su base de datos" — se les pide que *ellas* inviten, con nuestro material.

**Mecánica operativa:** una "embajadora" por AFA (habitualmente la trabajadora social o psicóloga del programa de familias), formada por nosotros (1 sesión + guía de 2 páginas), con línea directa al equipo. Objetivo de la beta: **6–10 AFAs activas**, cada una aportando 8–15 familias. Este canal solo, bien trabajado, cubre el 60–70 % de las primeras 100 familias.

**Coste real del canal:** no es dinero, es tiempo del fundador/PO (2–3 días/semana durante meses) + el compromiso de gratuidad. Se contabiliza como CAC en horas (§2.3) para no engañarnos con un "CAC cero" ficticio.

### Canal 2 — Grupos de apoyo online de cuidadores (Facebook, Telegram, foros): presencia, no promoción

Los grupos de cuidadores de Alzheimer en Facebook (España: decenas de grupos de 5.000–60.000 miembros) son donde el problema se verbaliza cada noche. Son también comunidades heridas y muy sensibles al spam de productos.

**Reglas de compromiso (código de conducta escrito del equipo):**
1. **Prohibido el astroturfing** (cuentas falsas fingiendo ser cuidadores) y el mensaje directo no solicitado. Un solo episodio detectado destruiría el canal y la marca.
2. La presencia la lleva **el fundador con nombre, cara e historia real** (ventaja injusta nº 1, Fase 1 §1.4): responde preguntas, comparte recursos útiles *sin enlace al producto* el 90 % de las veces, y solo menciona el producto cuando alguien pide explícitamente herramientas o cuando el admin del grupo lo autoriza.
3. La vía formal es **el acuerdo con administradores de grupo**: ofrecerles lo mismo que a las AFAs (acceso preferente para su comunidad, contenido útil, AMA del fundador). Muchos admins de estos grupos son cuidadores veteranos o profesionales que agradecen contenido serio.
4. El activo que se lleva a los grupos no es la app: es **contenido de utilidad inmediata** (guía del sundowning, checklist para la consulta de neurología, plantilla de reparto de tareas entre hermanos) con la marca presente y un camino opcional hacia la lista de espera.

**Rendimiento esperado:** canal lento de goteo (2–5 familias/mes por grupo trabajado) pero con la segunda mejor calidad de usuario tras las AFAs, y el mejor coste marginal una vez creado el contenido.

### Canal 3 — Profesionales prescriptores (neurólogos, geriatras, enfermería de memoria, trabajadores sociales)

El gancho existe y ya está construido: **el informe de 1 página (M10/HU-003)**. El profesional no adopta una plataforma; adopta *recibir mejores datos en consulta sin hacer nada*.

**Playbook:**
- **Entrada por los profesionales del grupo de validación de Fase 1** (≥ 8 entrevistados): se les invita a "recetar" el piloto a 1–2 familias que ellos elijan (las que llegan a consulta con el caos más doloroso). El médico que ve volver a una familia con el informe de 1 página se convierte en prescriptor recurrente sin programa de incentivos alguno.
- **Material de prescripción física:** un "talonario" (tarjetas A6 con QR a la lista de espera y el texto "un diario del cuidado para traer a la consulta") que el profesional entrega en 5 segundos. En consultas de 15 minutos, el material que exige explicación no se usa.
- **Consultas de enfermería de demencias y unidades de memoria** (hospitalarias y de AP) como objetivo prioritario sobre el neurólogo estrella: tienen más tiempo de consulta, más foco en el cuidador y más frustración con la falta de datos.
- **Trabajadores sociales municipales y de dependencia:** el argumento es la **evidencia para el grado de dependencia** (Fase 1 §2.3d-3): un registro fechado del deterioro funcional acelera y fortalece las valoraciones — valor institucional puro, sin fricción regulatoria porque es observacional.
- **Guardarraíl C1 explícito en todo el material:** el producto se presenta como "diario estructurado del cuidado para la familia, que genera un informe *para* el médico" — nunca como herramienta clínica, de cribado ni de seguimiento médico. El material de prescriptores lo revisa el DPO/regulatorio igual que la UI.

### Canal 4 — Contenido orgánico y la historia fundacional (SEO de crisis + relaciones públicas de propósito)

- **SEO de long-tail de crisis:** los momentos de activación (§1.1) generan búsquedas muy específicas y con poquísima oferta de contenido de calidad en español: "mi madre con alzhéimer se escapa de casa", "cómo repartir el cuidado de un padre con demencia entre hermanos", "qué contar al neurólogo en la consulta de mi madre". Un corpus de 30–50 artículos profundos (co-firmados con profesionales de las AFAs cuando sea posible) construido durante la beta captura demanda latente a coste marginal cero durante años. Este corpus es, además, el futuro contenido del asistente de recursos (Fase 2 §1.3.6) — una inversión, dos usos.
- **La historia fundacional como palanca de medios, con una regla de dignidad:** la historia real (construido en memoria de una madre) abre reportajes en medios generalistas y verticales de salud/mayores que ningún presupuesto de PR compraría. Regla escrita: la historia se cuenta para abrir la puerta a hablar *del problema de los cuidadores*, nunca como storytelling lacrimógeno de producto. El fundador habla del burnout del cuidador y de la soledad del cuidado; el producto aparece como consecuencia, no como protagonista.
- **Newsletter "para quien cuida"** desde el primer mes de la alfa: el activo propio de audiencia (correo) que ningún cambio de algoritmo puede quitarnos, alimentado por el corpus SEO y los aprendizajes del piloto (anonimizados y con consentimiento).

### Canal 5 — Explícitamente descartados o pospuestos (disciplina de canal)

| Canal | Decisión | Porqué |
|---|---|---|
| Paid social / SEM de captación | **Pospuesto a post-apertura, y solo como amplificador** (≤ 20 % del mix) | G2: el techo biológico del LTV no soporta CAC de subasta. Además el pixel/retargeting sobre este público roza G7. Si se usa: campañas de alcance de contenido, nunca de instalación con audiencias sensibles |
| Influencers / afiliados con comisión | **Descartado en fase temprana** | Incentivar económicamente la recomendación de un producto de cuidado a población vulnerable contamina exactamente la confianza que nos diferencia. La recomendación aquí solo vale si es gratuita |
| App Store Optimization agresivo | Básico sí (ficha impecable, keywords honestas), growth-ASO no | La ficha de la store es *intended purpose* a ojos del regulador (L4): cada palabra revisada |
| Partnerships con residencias/SAD | **Pospuesto a V3+ (B2B2C)** | Fase 1 §1.1-C: construir para instituciones antes de tener tracción familiar multiplica el ciclo de venta. Se cultivan relaciones, no se venden contratos |

### Síntesis: plan de las primeras 100 familias (beta cerrada)

| Fuente | Familias objetivo | Mecanismo |
|---|---|---|
| AFAs (6–10 activas) | 55–65 | Derivación por embajadoras + charlas + programa conjunto |
| Recomendación de familias del piloto/alfa | 15–20 | Bucle orgánico (§1.5): invitación de círculo a círculo, sin incentivos económicos |
| Profesionales prescriptores | 10–15 | Talonario + informe de 1 página como gancho |
| Grupos online + contenido + lista de espera | 10–15 | Presencia del fundador + corpus de utilidad + newsletter |

La lista de espera pública se abre al inicio de la beta con expectativa honesta ("abrimos 25 plazas al mes; priorizamos familias derivadas por asociaciones") — la escasez aquí no es growth hack: es la verdad de nuestra capacidad de soporte humano (R2), y comunicarla como cuidado ("queremos acompañarte bien, no solo darte de alta") convierte una limitación en señal de seriedad.

## 1.4 Onboarding como extensión del GTM: la activación es parte de la adquisición

En este producto, adquirir una familia que no se activa es peor que no adquirirla (G1: vuelve al "más o menos" con la conclusión "esto no es para nosotros" y lo cuenta). El GTM incluye por tanto el diseño del primer contacto completo:

- **Métrica de activación (heredada de Fase 1):** círculo con ≥ 2 miembros activos + 1 rutina configurada en la semana 1. Es el "aha moment" operativizado: la cuidadora principal ya no está sola en la app.
- **El onboarding pide primero lo que da valor primero:** 1 medicación + 1 segundo miembro. Zona segura, turnos y demás llegan por plantillas de estadio (M11) en los días siguientes, empujados por el propio producto ("¿quieres que Luis reciba las alertas de noche?").
- **Onboarding asistido escalonado por fase GTM:** presencial (piloto, en la AFA) → videollamada de 15 min opcional (alfa) → self-serve con teléfono humano visible (beta). El coste de cada modalidad se mide y se incluye en el CAC de su cohorte — el soporte humano no es un coste oculto, es una línea del modelo (Fase 1 §R2).
- **El primer digest es el primer momento mágico del pagador:** el hijo a distancia invitado el día 1 recibe en ≤ 48 h su primer "día tranquilo: paseo, comió bien, siesta larga" (M9). Ese digest es el producto entero para él, y es quien pagará (G4). El onboarding se diseña para que ese momento ocurra siempre en las primeras 72 h.

## 1.5 Product-Led Growth: el círculo como motor orgánico

### 1.5.1 La tesis PLG de este producto

El PLG clásico dice: el producto se distribuye a sí mismo porque usarlo exige o premia invitar a otros. Aquí esa mecánica **viene dada por la naturaleza del producto** (G5): un círculo de cuidado con una sola persona es un oxímoron — el valor central (turnos, relevos, "no estás sola") *no existe* sin invitar. No hay que forzar la viralidad; hay que **eliminar toda fricción del acto de invitar y multiplicar los momentos naturales en que invitar es la solución a un dolor inmediato.**

Distinguimos dos bucles de naturaleza distinta:

- **Bucle 1 — Expansión intra-círculo (viralidad "hacia dentro"):** más miembros en el mismo círculo. No trae círculos nuevos, pero es el motor de activación, retención y monetización (más miembros = más valor = más coste de cambio emocional = más probabilidad de que uno de ellos sea el pagador a distancia). Métrica: **miembros activos por círculo** (objetivo: mediana ≥ 3 en semana 4; K intra-círculo ≥ 2,5 invitaciones aceptadas por círculo activado).
- **Bucle 2 — Contagio inter-círculo (viralidad "hacia fuera"):** un miembro de un círculo crea o provoca un círculo nuevo (otra familia). Es el que reduce el CAC de verdad. Es más lento y delicado, y se apoya en los artefactos compartibles y en los momentos de prueba social (abajo).

### 1.5.2 Bucle 1 — Mecánicas de expansión intra-círculo (todas ya soportadas por el MVP)

Cada mecánica conecta una **fricción real del cuidado** con una **invitación como solución**, que es la única viralidad que este público tolera:

| Momento de producto (trigger) | Mecánica de invitación | Por qué es ético y funciona |
|---|---|---|
| Onboarding, paso 2 | "¿Quién más cuida de [nombre]? Invítale por WhatsApp/SMS" con enlace que ya lleva rol propuesto (M1: invitar es trivial) | Sin segundo miembro no hay producto; la invitación viaja por WhatsApp — el hábitat del usuario (G1) |
| **Hueco de guardia visible en rojo** (M6) | "Este hueco lo podría cubrir alguien más de la familia. ¿Invitamos a…?" | Convierte el dolor nº 1 (pedir ayuda cuesta culpa, Fase 1 §2.2b) en un acto de un toque. El producto pide por ti |
| Tarea sin dueño > 48 h (M8) | Sugerir invitar al familiar que "siempre dice dime si necesitas algo" | La invitación llega con una tarea concreta adjunta: el invitado entra sabiendo cómo ayudar (activación del invitado) |
| Alerta crítica con cadena corta (M3) | "Tu cadena de escalado tiene solo 2 personas. Las familias con 3+ responden más rápido" | Seguridad real, comunicada con datos honestos, no miedo fabricado |
| Primer informe generado (M10) | "¿Compartimos el informe con tu hermana antes de la cita?" → la hermana lo ve → invitación a unirse | El artefacto de valor viaja primero; la cuenta después. El informe es el señuelo honesto |
| Preparación de la cita médica (M9-N2) | Checklist incluye "¿va alguien más a la consulta? Añádelo al círculo" | El momento de máxima orquestación familiar del mes |
| Digest diario (M9-N3) | Pie del digest: "reenvíaselo a quien pregunta cada día cómo está" con vista previa compartible | El hijo a distancia que lo recibe reenviado 3 días seguidos acaba dentro (y es el pagador, G4) |

**Regla dura anti-spam:** máximo una sugerencia de invitación por semana por círculo, jamás dos por el mismo trigger, y silencio absoluto de sugerencias durante alertas activas y tras eventos duros (caída, hospitalización registrada, cierre de círculo). El presupuesto de notificaciones de la Fase 1 §2.1 gobierna también al growth. **Growth nunca toca el nivel 1.**

### 1.5.3 Bucle 2 — Mecánicas de contagio inter-círculo

1. **El invitado que vive el mismo problema en otra familia.** Un círculo de 5 miembros contiene estadísticamente nueras, yernos y amigos que cuidan o cuidarán de *sus propios* padres. El producto lo facilita sin explotarlo: al miembro no-admin con ≥ 4 semanas de actividad se le muestra (una vez) "¿Cuidas también de alguien más? Puedes crear otro círculo" — la realidad estadística dolorosa de la Fase 1 §R3 (el segundo progenitor) tratada con sobriedad: existe, se ofrece, no se persigue.
2. **El informe de 1 página como artefacto viajero.** Cada PDF lleva un pie sobrio ("Elaborado por la familia de forma estructurada con [marca]"). El médico que recibe dos informes buenos de dos familias distintas pregunta por el tercero. Es el bucle profesional: familia → informe → médico → prescripción a nuevas familias (cierra con el Canal 3).
3. **La prueba social en el grupo de apoyo.** No se incentiva ni se pide; se hace *fácil*: contenido compartible real (la guía del sundowning, la plantilla de turnos imprimible) que los cuidadores comparten en sus grupos porque es útil, con la marca dentro. Compartir utilidad, no testimonios fabricados.
4. **El offboarding digno como semilla (G6).** La familia que vivió un cierre de círculo bien hecho — silencio inmediato, legado entregado, acompañamiento — es el prescriptor más creíble que existe en los grupos de apoyo, donde el duelo se comparte abiertamente. No se le pide nada en el duelo (regla absoluta: cero comunicación comercial durante ≥ 90 días tras el cierre); pero 6 meses después, una única carta del fundador agradeciendo y ofreciendo — si quieren — contar su experiencia a otras familias, convierte el final del ciclo de vida en el principio de otros. Este es el bucle que ningún competidor sin alma puede copiar, y la razón última por la que el offboarding se construyó en el MVP (M12).

### 1.5.4 Instrumentación del PLG (sin PHI, G7)

Eventos de growth en la telemetría pseudonimizada (Fase 2 §2.3.2): invitación sugerida/enviada/aceptada por trigger, tiempo hasta 2º y 3º miembro activo, origen del círculo (AFA / recomendación / profesional / orgánico — atribución declarada en onboarding con una pregunta, no con trackers), reenvíos de digest, accesos de profesional invitado por círculo. Con esto se calculan K intra-círculo, tasa de contagio inter-círculo y el CAC real por canal — **nunca** contenido, nombres ni datos de cuidado.

---

# 2. MÉTRICAS CLAVE DEL NEGOCIO (NORTH STAR METRIC Y PIRÁMIDE)

## 2.1 North Star Metric: Círculos Coordinados Semanales (CCS)

### 2.1.1 Candidatas evaluadas y descartadas

| Candidata | Por qué se descarta |
|---|---|
| Descargas / registros | Métrica de vanidad canónica: un registro sin círculo activado es un futuro churn (G1). No mide valor entregado a nadie |
| DAU/MAU de usuarios individuales | Rompe G5: el usuario individual no es la unidad de valor. Una cuidadora sola hiperactiva en la app es una *señal de burnout*, no de éxito (¡el anti-patrón exacto del producto!) |
| Nº de registros de cuidado totales | Goodhart inmediato: presionaría al producto a pedir más registro, contra el principio de 10 segundos y contra el descanso del cuidador |
| Alertas gestionadas | Las alertas son el seguro, no el uso deseado: una familia sin alertas en un mes puede ser el círculo más sano de la base |
| Suscripciones de pago | Lagging total; en fase freemium temprana no guía ninguna decisión de producto |

### 2.1.2 Definición

> **CCS — Círculos Coordinados Semanales:** número de círculos de cuidado que en los últimos 7 días cumplen las tres condiciones a la vez:
> 1. **≥ 2 cuidadores distintos activos** (abrieron la app o actuaron: registro, relevo, tarea, acuse, guardia),
> 2. **≥ 4 días con al menos un acto de cuidado registrado** (toma confirmada, relevo, observación, tarea completada),
> 3. **Cobertura de guardia ≥ 80 %** de las franjas definidas por la propia familia (o familia sin turnos configurados aún excluida del denominador de esta condición durante sus primeras 3 semanas).

**Por qué esta y no otra:** la CCS es la operativización exacta de la promesa de marca ("la familia cuida junta, nadie carga solo y nada importante se pierde"): la condición 1 mide *nadie carga solo*, la 2 mide *nada se pierde* (el dato longitudinal, ventaja injusta nº 2), la 3 mide *la familia cuida junta*. Une valor para el cliente y valor para el negocio (un círculo CCS es el que renueva, invita y prescribe), es semanal (accionable en ciclos de producto cortos), es resistente a Goodhart (inflarla exige mejorar de verdad la coordinación multi-persona, que es el producto), y **no premia el sobreuso**: un círculo puede ser CCS con 15 minutos totales de app a la semana entre tres personas — coherente con un producto cuyo éxito es que el cuidador *descanse*.

**Métrica guardiana (por diseño, en el mismo panel):** junto a la CCS vive siempre el **índice de concentración del cuidado** (% de actos realizados por el miembro más activo del círculo). Si la CCS sube pero la concentración media sube también, estamos creciendo a costa de las cuidadoras principales — crecimiento contra la misión. La pareja CCS + concentración es el tablero completo; una sin la otra miente.

### 2.1.3 Descomposición en palancas (input metrics)

```
                        CCS = Círculos Coordinados Semanales
                                        │
        ┌───────────────────────────────┼─────────────────────────────────┐
        ▼                               ▼                                 ▼
  ADQUISICIÓN DE CÍRCULOS         ACTIVACIÓN                        RETENCIÓN/PROFUNDIDAD
  · círculos nuevos/sem           · % círculos con ≥2 miembros      · retención de círculo sem. 4/8/12
    por canal (AFA, recom.,         + 1 rutina en semana 1 (≥70 %)  · miembros activos por círculo (≥3)
    profesional, orgánico)        · tiempo hasta 2º miembro         · % semanas en estado CCS por círculo
  · K intra-círculo ≥ 2,5           activo (< 72 h)                 · cobertura de guardia
  · tasa contagio inter-círculo   · primer digest recibido          · concentración del cuidado (guardiana)
    (círculos hijo / 100            por miembro a distancia         · tiempo de acuse de alerta (confianza)
    círculos activos / trim.)       en < 72 h                       · churn separado: compasivo vs voluntario
```

Cada equipo/ciclo de producto trabaja una palanca de este árbol y ninguna otra cosa; la revisión semanal de métricas empieza por la CCS y su guardiana, baja al árbol solo donde algo se movió.

## 2.2 Pirámide de métricas de salud de la startup

**Nivel 1 — La estrella y su guardiana:** CCS · concentración del cuidado.

**Nivel 2 — Motor económico (mensual):** CAC por canal (blended y marginal) · LTV por cohorte y por plan · ratio LTV:CAC · payback del CAC en meses · churn mensual **desdoblado** (§2.3.3) · % de ingresos por canal de origen.

**Nivel 3 — Bucles (semanal):** activación (funnel completo registro→círculo→2º miembro→rutina→CCS) · K intra-círculo · contagio inter-círculo · conversión free→premium por cohorte y por disparador de upgrade · NPS del cuidador (trimestral) y NPS post-offboarding (el más importante de todos, G6).

**Nivel 4 — Impacto en la misión (trimestral; nunca claims clínicos, C1):** Zarit-lite agregado y anónimo de quienes lo consienten (V2) · % de círculos donde la concentración bajó ≥ 10 puntos en 8 semanas · huecos de guardia sin cubrir por círculo/mes (tendencia) · tiempo medio de respuesta a alertas críticas. Estas métricas alimentan a las AFAs (Canal 1), a futuros inversores de impacto y a la moral del equipo — y son el guardarraíl de que el negocio no se desacople de la misión.

## 2.3 Economía unitaria adaptada al techo biológico

### 2.3.1 CAC — con las horas contadas, no solo los euros

| Canal | CAC objetivo (beta→apertura) | Composición |
|---|---|---|
| AFAs | 25–45 € por círculo activado | ~0 € media; el coste es tiempo de fundador/embajadoras + gratuidad del plan AFA, imputados |
| Recomendación orgánica / PLG | 5–15 € | Coste marginal del onboarding asistido y soporte del primer mes |
| Profesional prescriptor | 20–40 € | Material, visitas, tiempo |
| Contenido/SEO | 15–30 € (mejora con el tiempo) | Producción de corpus amortizada |
| Paid (si algún día, como amplificador) | tope duro 90 € | Si supera el tope, se apaga: G2 no es negociable |

**CAC blended objetivo: ≤ 40 € por círculo activado** (no por registro: por círculo que cumple activación). La regla de imputar horas de fundador a precio de mercado evita el autoengaño clásico del "crecimiento gratis" que en realidad consume el 60 % del recurso más escaso de la startup.

### 2.3.2 LTV — modelo con techo biológico explícito

Hipótesis de partida (a validar en beta; el modelo importa más que los números):

- **Modelo freemium/premium** (§2.4): plan gratuito funcional + premium familiar a **9–14 €/mes por círculo** (precio único por círculo, no por miembro: cobrar por miembro penalizaría la invitación, que es el motor PLG — error estructural a evitar).
- **Conversión free→premium objetivo:** 12–18 % de círculos activados a los 3 meses (el disparador natural: el hijo a distancia y las funciones de tranquilidad, G4).
- **Vida media del círculo de pago:** 24–30 meses (acotada por G2: progresión, institucionalización, fallecimiento — se modela con curva de supervivencia por estadio de entrada, no con churn plano: una familia que entra en GDS 4 tiene más LTV esperado que una que entra en GDS 6, lo que refuerza el GTM de interceptar temprano, §1.1-3).
- **LTV bruto premium ≈ 11,5 €/mes × 27 meses ≈ 310 €**; neto de coste de servicio y soporte (~25–30 %) ≈ **215–235 €**.
- **Ratio LTV:CAC objetivo ≥ 5:1** (más exigente que el 3:1 canónico, deliberadamente: el techo biológico impide compensar un CAC alto alargando la vida del cliente, así que el margen de seguridad se toma en el ratio) · **Payback del CAC ≤ 4 meses**.
- **Extensiones de LTV que el modelo contempla sin cinismo:** el círculo que repite con el segundo progenitor (realidad estadística, Fase 1 §R3 — se ofrece con descuento de círculo existente, V3+), y el futuro B2B2C (aseguradoras/SAD pagando por familia) que convierte el techo biológico individual en un contrato institucional recurrente. Ninguna de las dos se necesita para que el modelo D2C cierre; ambas son upside.

### 2.3.3 Churn — la taxonomía que este producto exige

Un churn plano mentiría en ambas direcciones. Se separa contablemente desde el día 1:

| Tipo | Definición | Cómo se trata |
|---|---|---|
| **Churn compasivo** | Cierre de círculo por fallecimiento o institucionalización | **No es fracaso del producto** y se excluye del churn de calidad (se modela como vida natural del cliente en el LTV). Su métrica de éxito propia: calidad del offboarding (NPS post-cierre, % que exporta legado, % que 6+ meses después recomienda o repite). Meta: que el 100 % de los cierres sean dignos |
| **Churn voluntario** | El círculo abandona con el paciente aún en casa | **La única señal verdadera de fracaso de producto.** Objetivo: ≤ 3 % mensual en círculos CCS; entrevista de salida humana (no encuesta) a cada círculo que se va en los primeros 12 meses de la beta |
| **Churn de downgrade** | Premium → free sin abandonar | Señal de pricing/valor premium, no de producto; se analiza por disparador |
| **Churn silencioso (pre-churn)** | Círculo activo que deja de ser CCS ≥ 3 semanas | La métrica operativa del sistema anti-burnout (§3): es ahí donde se interviene, no cuando ya se fueron |

### 2.3.4 Cadencia de gobierno de métricas

Semanal: CCS + guardiana + funnel de activación (equipo completo, 30 min, panel único). Mensual: economía unitaria por canal y cohorte + churn desdoblado (fundador + advisors). Trimestral: impacto (nivel 4) con las AFAs aliadas — compartirles el impacto agregado es parte del contrato de canal (§1.3-1).

## 2.4 Diseño freemium/premium con línea ética explícita

**El principio innegociable, escrito antes que el pricing:** **la seguridad nunca se degrada por impago.** Las alertas críticas de nivel 1, el escalado multicanal y el estado honesto del sistema (M3, M13) funcionan igual en free que en premium, siempre. Cobrar por que la alarma suene sería moralmente indefendible y reputacionalmente suicida; además convertiría cada impago en un riesgo físico (R4 auto-infligido). Se monetiza la **comodidad, la profundidad y la tranquilidad ampliada** — jamás el seguro básico.

| | **Free (Círculo Esencial)** | **Premium (Círculo Completo, 9–14 €/mes por círculo)** |
|---|---|---|
| Círculo y roles | Hasta 4 miembros | Miembros ilimitados + rol profesional limitado (auxiliar) |
| Alertas críticas N1 + escalado + estado del sistema | **Completo, siempre** | Idéntico (línea ética) |
| Zona segura | 1 geovalla | Geovallas múltiples + horarios (casa, centro de día, casa de la hija) |
| Medicación | Pauta completa + confirmaciones | + historial extendido y adherencia por rangos largos |
| Registro y diario | 10 segundos + relevo, completo | + tendencias visuales completas e historial > 90 días |
| Informe de consulta | 1 informe/trimestre | Ilimitados + consola del profesional invitado + recordatorio pre-cita |
| Digest diario | Sí | + resumen semanal enriquecido para el círculo a distancia |
| Turnos de guardia | Sí (esencial anti-burnout: no se paywalled) | + estadísticas de equidad (V2) y planificación avanzada |
| Soporte | Humano, en horario | Humano prioritario |

**Lógica de la línea free/premium:** lo gratuito cubre íntegro el bucle de seguridad y el anti-burnout básico (misión y motor PLG); lo premium empaqueta exactamente lo que el **pagador a distancia** valora (G4: visibilidad profunda, informes, historial, círculo grande) y lo que las familias con auxiliar contratada necesitan (rol profesional). El upgrade se dispara en momentos honestos: tercera geovalla necesitada, quinto miembro invitado, segunda cita médica del trimestre — el producto pide dinero cuando ya demostró el valor, nunca antes.

**Reglas de monetización ética (escritas, publicadas en la web):** cancelación en dos toques sin retención agresiva · congelación automática y gratuita de la cuota durante hospitalizaciones prolongadas (se detecta porque la familia lo registra; gesto que vale más que su coste) · **el cierre de círculo detiene el cobro inmediatamente, prorratea y no pide "confirmar cancelación" a una familia en duelo** (extensión de M12 al billing) · precios AFA a perpetuidad para familias derivadas (contrato de canal).

---

# 3. MITIGACIÓN DEL BURNOUT DEL CUIDADOR COMO ESTRATEGIA DE RETENCIÓN

## 3.1 La tesis: en este producto, retención y misión son la misma curva

La cadena causal que une burnout y negocio es directa y está documentada desde la Fase 1 (P2): sobrecarga del cuidador principal → claudicación → institucionalización prematura o colapso familiar → fin del contexto de cuidado en casa → churn. **El burnout del cuidador principal es la primera causa raíz de churn voluntario y la aceleradora del compasivo.** Por tanto el sistema anti-burnout no es una feature de responsabilidad social adosada al negocio: *es* la estrategia de retención, y la guardiana de la NSM (concentración del cuidado, §2.1.2) es su métrica ejecutiva.

Corolario incómodo y central: **la retención de este producto se mide en descanso, no en tiempo de pantalla.** Todo el instrumental clásico de engagement (streaks, badges, notificaciones de re-enganche, FOMO) queda vetado por diseño; el modelo Hook (Nir Eyal) se usa invertido: el trigger es el momento de necesidad real, la acción dura 10 segundos, la recompensa es tranquilidad verificable y la inversión es el historial del cuidado — un hábito de *confianza*, no de compulsión.

## 3.2 Detección: señales conductuales del producto, sin cruzar la frontera clínica (C1)

El producto ya captura, como subproducto de su uso normal, las señales de sobrecarga que la literatura del cuidador (Zarit) describe — sin preguntar nada y sin computar ninguna "puntuación de burnout" (que sería interpretación clínica, vetada por C1). Son **reglas simples y transparentes sobre datos de coordinación**, no modelos:

| Señal (regla simple, umbral configurable) | Qué indica | Nivel de certeza |
|---|---|---|
| Concentración: un miembro ejecuta > 80 % de los actos del círculo durante ≥ 3 semanas | El círculo existe en la app pero no en la práctica | Alta |
| Cobertura de guardia en caída + huecos recurrentes sin que nadie los tome | La red de apoyo se está desconectando | Alta |
| El mismo miembro acusa todas las alertas, incluidas las nocturnas, aun cuando no está de guardia | No confía en el relevo o no lo tiene: no desconecta jamás | Alta |
| Actividad de registro sistemática en franja 1:00–5:00 | Insomnio del cuidador (el registro nocturno es el termómetro más honesto del producto) | Media |
| Botón "necesito un respiro" pulsado ≥ 2 veces/mes, o pulsado y sin respuesta del círculo | Petición de ayuda explícita — y peor aún si cae en vacío | Muy alta |
| Registros de crisis conductuales en aumento + relevos escritos cada vez más cortos o abandonados | Sobrecarga que erosiona hasta la capacidad de documentar | Media |
| (V2) Check-in emocional Zarit-lite con tendencia descendente | Auto-reporte directo, privado por defecto (PHI del cuidador, L5) | Alta, con consentimiento |

**Gobernanza de estas señales (línea ética y legal):** las señales conductuales se procesan para *actuar dentro del producto*, no para etiquetar a nadie; jamás se muestran a otros miembros del círculo ("Ana está quemada" dicho por una app a sus hermanos sería una traición íntima); jamás se usan para marketing ni pricing; el lenguaje de toda intervención es de situación, nunca de diagnóstico ("estas semanas estás cubriendo casi todas las guardias" ✔ / "detectamos síntomas de burnout" ✘ — la misma disciplina de claims de C1 aplicada al cuidador). El check-in Zarit-lite (V2) es siempre opt-in, privado por defecto, cifrado a nivel de campo (Fase 2 §2.1.3).

## 3.3 Intervención: la escalera de valor inmediato

Cada señal dispara una intervención cuyo criterio de diseño es único: **quitar carga en menos de un minuto o conectar con un humano.** Nunca "contenido sobre el burnout" como primera respuesta (mandarle un artículo a quien no duerme es burlarse).

**Peldaño 1 — Automatizar (el producto absorbe la tarea):**
- Ofrecer plantillas y defaults que eliminen decisiones: "¿Quieres que el digest se envíe solo a tus hermanos cada noche, para que dejen de preguntarte?" (la pregunta repetida "¿cómo está mamá?" es una micro-carga diaria enorme del cuidador principal; M9 la elimina).
- Pre-rellenar el informe de consulta y el checklist de cita (M10): la preparación de la consulta pasa de una tarde de angustia a una revisión de 5 minutos.
- Sugerir conversión de patrones en rutinas: "Registras el paseo cada día a las 10:00 — ¿lo convertimos en rutina para que solo toques si algo cambia?"

**Peldaño 2 — Redistribuir (el producto pide ayuda por ella):**
- La intervención insignia, heredada del diseño de Fase 1 §2.2b: **convertir la petición en visibilidad.** Ante concentración alta, el producto no le dice a Ana "pide ayuda" (culpa); publica al círculo los datos neutros: el calendario con los huecos en rojo y las tareas sin dueño, con nudge a los *demás* miembros ("hay 3 franjas sin cubrir esta semana — ¿puedes tomar alguna?"). La presión social recae sobre quien no ayuda, no sobre quien no pide.
- **Botón "necesito un respiro" con garantía de respuesta:** si en 4 h ningún miembro responde a un respiro, el producto sugiere a Ana —en privado— el recurso de respiro de su AFA local (Canal 1 cerrando el círculo: el partner recibe la derivación). Un respiro sin respuesta jamás muere en silencio.
- **Transferencia rápida del mando (la feature anti-claudicación):** un flujo de un toque para traspasar temporal o permanentemente el rol de guardia por defecto, la administración del círculo o la gestión de medicación a otro miembro — "esta semana, que el sistema descanse de ti": vacaciones del cuidador, ingreso propio, o simplemente límite alcanzado. Técnicamente es un cambio de roles (M1/M6 ya lo soportan); productizarlo como *permiso emocional* ("cuidarte también es cuidar") es lo que lo convierte en retención: la alternativa real a esta feature no es que Ana siga; es que Ana rompa y el círculo entero abandone.

**Peldaño 3 — Conectar (humanos, no software):**
- Derivación cálida a los recursos de la AFA aliada (grupos de apoyo, psicólogas, respiro subvencionado) con el contexto que la familia autorice llevar — el producto como puerta al ecosistema humano, que es donde el burnout de verdad se trata. El software organiza; no acompaña duelos ni trata depresiones, y decirlo honestamente es parte de la marca (coherencia con R4: complementa, no sustituye).
- Soporte humano propio con guion para señales de riesgo: si en una llamada de soporte aparece ideación de abandono o desbordamiento agudo, el equipo tiene protocolo (escrito con la psicóloga de la AFA) de derivación — el soporte de este producto es parte del producto (R2), y también del sistema anti-burnout.

**Peldaño 4 — Descansar del producto sin perderlo (retención por pausa):**
- **Modo respiro:** silenciar todo lo no crítico durante N días con relevo automático configurado, sin culpa y sin perder el historial. Paradoja asumida y correcta: *facilitar no usar la app es retención* — el círculo que descansó vuelve; el que se saturó desinstala.

## 3.4 El bucle de retención completo (síntesis operativa)

```
   señal de sobrecarga (reglas §3.2)
            │
            ▼
   intervención de valor inmediato (escalera §3.3)     ← medida: ¿la señal remitió en 2 semanas?
            │
            ▼
   redistribución real del cuidado                      ← medida: concentración ↓, cobertura ↑
            │
            ▼
   la cuidadora principal descansa y confía             ← medida: acuses fuera de guardia ↓, Zarit-lite (V2)
            │
            ▼
   el círculo permanece CCS más meses                   ← medida: retención, churn voluntario ≤ 3 %
            │
            ▼
   más miembros ven el valor → invitan → prescriben     ← alimenta §1.5 y baja el CAC (§2.3)
```

**KPIs propios del sistema anti-burnout (se revisan con la NSM):** % de círculos con señal activa de sobrecarga (prevalencia) · % de señales que remiten en 2 semanas tras intervención (eficacia) · concentración media del cuidado por cohorte (tendencia) · respiros pedidos vs. respondidos por el círculo (salud de la red) · correlación retención×concentración (la prueba del algodón de toda esta sección: si los círculos que redistribuyen no retienen más, la tesis se revisa con el piloto).

---

# CIERRE — Los 10 principios de crecimiento de este proyecto (síntesis)

1. **La confianza es el canal.** AFAs, grupos y prescriptores no son "canales baratos": son los únicos canales cuya conversión sobrevive a un producto que pide entrar en la intimidad de una familia.
2. **El CAC bajo no es una aspiración, es una restricción estructural** (techo biológico del LTV): si un canal exige CAC de subasta, el canal está mal, no el presupuesto.
3. **La viralidad viene de serie: es el círculo.** El trabajo de growth no es inventar bucles, es quitar fricción a las invitaciones que el cuidado ya necesita — y jamás sugerir nada durante una crisis o un duelo.
4. **Crecer con un bucle roto es fracasar más grande.** Las puertas entre piloto→alfa→beta→apertura tienen números y se respetan; la lista de espera es honestidad de capacidad, no growth hack.
5. **La North Star es el círculo coordinado, con guardiana.** CCS mide la promesa completa; la concentración del cuidado vigila que no crezcamos a costa de las cuidadoras principales. Una sin la otra miente.
6. **El churn se desdobla o miente.** El compasivo se honra (y su métrica es la dignidad del cierre); el voluntario se investiga cara a cara; el silencioso (círculo que deja de ser CCS) es donde se interviene.
7. **La seguridad nunca está detrás de un paywall.** Se monetiza tranquilidad ampliada para el pagador a distancia; la alarma suena igual para todos, siempre.
8. **Retención = descanso, no tiempo de pantalla.** Todo el instrumental de engagement compulsivo queda vetado; el "modo respiro" y la transferencia de mando retienen más que cualquier streak.
9. **El anti-burnout es el motor de retención y se mide como tal**: señales conductuales transparentes (nunca diagnósticos), intervenciones que quitan carga en un minuto o conectan con humanos, y la correlación retención×redistribución como prueba del algodón.
10. **El final del ciclo es el principio del siguiente.** El offboarding digno, hecho con verdad y sin pedir nada, convierte a las familias que se van en las voces que traen a las que llegan — el único growth loop que un competidor con más capital no puede comprar.

---

# PRÓXIMOS PASOS (salida de Fase 4)

| # | Acción | Criterio de éxito |
|---|---|---|
| 1 | **Formalizar el programa de partenariado con 1–2 AFAs** (el acuerdo semilla de Fase 1 elevado a programa: embajadora, gratuidad, métricas de impacto, derivación inversa) | Acuerdo escrito firmado antes del inicio del piloto; embajadora formada |
| 2 | **Instrumentar la CCS, su guardiana y el funnel de activación** en la telemetría sin PHI (los eventos de Fase 2 §2.3.2 + los de growth de §1.5.4) | Panel único operativo el día 1 del piloto; definiciones versionadas en el repo como los esquemas de eventos |
| 3 | **Redactar y revisar con el DPO/regulatorio el kit de mensajes** (landing, ficha de stores, talonario de prescriptores, guías compartibles) contra la lista de claims vetados (C1/L4) | Kit v1 aprobado; ningún material público sin revisión previa — regla permanente |
| 4 | **Test de disposición a pagar durante la beta** (entrevistas de pricing con hijos a distancia + señal de upgrade simulada sin cobro real) antes de activar Stripe | Precio y línea free/premium validados con ≥ 20 pagadores potenciales; la línea ética de §2.4 confirmada como innegociable |
| 5 | **Diseñar el protocolo de intervención anti-burnout con la psicóloga de la AFA** (umbrales de señales, textos de intervención, guion de soporte, derivaciones) | Protocolo aprobado por AFA y DPO (las señales tocan datos del cuidador, L5); se pilota junto al piloto de producto |
| 6 | Solo con datos del piloto/beta: **revisar este documento contra la realidad** (canales que rindieron, CCS real, churn real, willingness to pay real) | Fase 4 v2.0 escrita por las métricas, no por las hipótesis — este documento deja de mandar el día que los datos hablen |

*Documento vivo. El crecimiento de este proyecto tiene una vara de medir que ningún dashboard sustituye: cada nueva familia debe estar mejor cuidada por habernos encontrado, y cada despedida debe dejar la sensación de que la tecnología, por una vez, estuvo a la altura. Ese es el growth loop que importa — y el homenaje.*
