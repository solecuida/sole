# Sole — Brief de construcción del prototipo

> **Estado:** v1.3 · 2026-11-13 · incluye las ideas de producto del fundador, las listas de verificación de seguridad, legal y web, y el **plano de construcción** en `blueprints/sole-prototipo/` (método The Architect, validado y probado).
> **Destino:** este documento se entrega a Fable 5.2 con la instrucción: *"Construye lo que dice `PROTOTIPO-Brief-Fable.md` siguiendo el plano `blueprints/sole-prototipo/`. Empieza por la sección 0."*
> **Marcas:** **DECIDIDO** = no se reabre · **PROPUESTA ACEPTADA** = el fundador la aprobó en conversación · **A CRITERIO** = Fable decide y deja registro en `DECISIONES.md`.

---

## 0. Instrucciones para Fable

### 0.0 El plano de construcción manda en el *cómo*

Este brief dice **qué** construir y **por qué**. El **cómo** ya está resuelto en `blueprints/sole-prototipo/`:

| Archivo | Para qué |
|---|---|
| `blueprint.md` | Arquitectura, modelo de datos, sistema de diseño, seguridad y los **70 pasos** en orden (§9), cada uno con criterios "Done when", comandos `Verify` y su etiqueta de git |
| `tasks.json` | Los mismos 70 pasos en formato reanudable: marca cada tarea al cerrarla; si se corta la sesión, se retoma desde la primera `pending` |
| `epics/` | Los pasos agrupados en 10 épicas, alineadas con las fases de la sección 9 |
| `workspace/` | `CLAUDE.md`, `AGENTS.md`, `.claude/` (skills y reglas) y la configuración inicial de `app/`, incluidas las migraciones de Supabase |

Cómo empezar:
1. Lee este brief completo y luego `blueprints/sole-prototipo/blueprint.md` completo.
2. Corre el bloque **Bootstrap** de §10 del plano en Git Bash, desde la raíz del repo, con Docker Desktop abierto. Es seguro repetirlo.
3. Construye paso a paso desde `E1-T1`. Un paso está terminado solo cuando todos sus `Verify` salen con código 0. Después haces su commit y su etiqueta.

Reglas de convivencia:
- Si el plano y este brief se contradicen, **gana este brief** en el *qué* y el plano en el *cómo*. Registra el conflicto en `DECISIONES.md`.
- Si un `Verify` no puede pasar sin cambiar el plano, no lo debilites: corrige el código o registra la desviación en `DECISIONES.md` con el motivo.
- Las reglas de recorte de la sección 9 siguen vigentes. La épica 10 (F16, F17 y rendimiento) es "si sobra tiempo".
- El plano se verificó el 2026-11-13 en el computador del fundador:
  - el Bootstrap corrió 2 veces;
  - se probaron el paso 1, el build de producción, las migraciones y las pruebas pgTAP.

  Si algo de eso falla al empezar, es una diferencia del entorno, no del plano: revisa Docker, Node 22 y la conexión.

### 0.1 Quién eres y cómo trabajas

Eres el **orquestador** de este proyecto. Despliegas subagentes por rol (sección 8), integras su trabajo y respondes por la calidad final. El fundador es una sola persona, con empleo, y va a mantener este sistema solo. Por eso:

1. **Lee el documento completo antes de escribir código.** Después lee, solo como contexto, `web/README.md` y la sección 2 de `FASE-1-Descubrimiento-y-Validacion.md`. Los documentos `FASE-1` a `FASE-5` describen la visión de largo plazo: donde contradigan este brief, manda este brief (esos documentos asumen España/GDPR, Flutter y una nube pagada).
2. **No reabras decisiones marcadas DECIDIDO.** Si una te bloquea de verdad, regístrala en `DECISIONES.md` con tu alternativa y sigue con lo demás.
3. **Ambición alta y tiempo limitado.** Tienes una ventana de uso intensivo (unos 3 días, con un reinicio de cuota). La meta es llegar **lo más lejos y lo más completo posible**, en el orden de la sección 9. Si el tiempo no alcanza, lo que quede debe estar terminado y funcionando, y lo que falte debe quedar documentado en `PENDIENTES.md` con instrucciones para retomarlo.
4. **Todo se planifica, aunque no todo se construya.** Las funcionalidades secundarias (por ejemplo, F16) deben quedar **diseñadas por completo**, con flujos, modelo de datos, permisos y criterios de aceptación, aunque se construyan solo si sobra tiempo.
5. **Simplicidad mantenible antes que sofisticación.** Si dudas entre dos soluciones, elige la que el fundador pueda entender y arreglar con ayuda de Claude en una tarde.
6. **Costo recurrente cero.** No agregues servicios pagados. Si un servicio gratuito tiene un límite relevante, documéntalo en `docs/limites.md`.
7. **Puntos de control:** al cerrar cada fase de la sección 9, detente y entrega un resumen corto al fundador: qué funciona, la URL para probarlo, qué decidiste y qué necesitas de él. No sigas sin su visto bueno, salvo que él te diga explícitamente que avances sin parar.
8. **Nunca inventes datos verificables.** Teléfonos, leyes, programas públicos o direcciones de organizaciones: verifícalos en una fuente oficial y cítala, o márcalos `[VERIFICAR]`.
9. **Idioma:** español de Chile, tuteo cálido, sin modismos forzados. El código, los commits y los comentarios técnicos pueden ir en inglés; todo lo que lee una persona usuaria va en español.

### 0.2 Archivos que debes mantener vivos

| Archivo | Contenido |
|---|---|
| `DECISIONES.md` | Cada decisión A CRITERIO: qué se eligió, por qué y qué alternativa se descartó |
| `PENDIENTES.md` | Lo que no se alcanzó, en orden de prioridad |
| `docs/diseno/` | Diseño funcional de cada F, incluidas las que no se construyan |
| `docs/limites.md` | Límites de los planes gratuitos y qué pasa al alcanzarlos |
| `docs/mantenimiento.md` | Manual para el fundador: desplegar, respaldar, rotar claves, revisar errores, agregar una organización |
| `docs/seguridad/` | Evidencia de la sección 6 |

### 0.3 Contexto humano que no puedes olvidar

- **Sole es la tía del fundador, está viva y es cuidadora.** Nada puede sugerir que falleció; no se usa "en memoria de".
- El proyecto nace del cuidado de la Nonó, la mamá del fundador, que sí falleció. No se menciona en la app.
- El público principal son cuidadoras de 45 a 65 años, cansadas, con celulares Android de gama media y poco tiempo.

---

## 1. Propósito **DECIDIDO**

- Prototipo funcional, **público y gratuito**, para **personas que cuidan a otra persona**, con cualquier necesidad de cuidado: adultos mayores, demencias, discapacidad, diálisis y otras enfermedades crónicas, recuperación, niñez con necesidades especiales.
- Cumple dos funciones a la vez:
  1. **Puerta de entrada a organizaciones**: en vez de pedir reuniones, se les ofrece algo usable que pueden recomendar.
  2. **Fuente de evidencia de uso real**: telemetría de uso, errores y retroalimentación que sustenten la app definitiva.
- **Concepto central: Sole acompaña el día a día del cuidado.** Centraliza todo lo que hay que hacer y recordar, y la persona interactúa con Sole todos los días: confirma, registra, programa y revisa cómo va.
- **Principios de producto:**
  - **Sole no es solo alarmas.** Es compañía: historial, avances, resúmenes, consejos y cuidado de quien cuida.
  - **Sole no es solo para la cuidadora.** El modelo está pensado para el círculo completo (familia, persona cuidada, profesionales), aunque esta versión se centra en la cuidadora.
- **Sin IA, sin cobros y sin publicidad** en esta versión. Las funciones que serán pagadas se prueban como "Premium, gratis durante el piloto" o como puertas falsas (F11).

### 1.1 Hipótesis que el piloto debe confirmar o refutar **PROPUESTA ACEPTADA**

| # | Hipótesis | Métrica | Umbral de éxito orientativo |
|---|---|---|---|
| H1 | Las cuidadoras usan Sole a diario y lo mantienen | Días activos por semana; retención en las semanas 1, 4 y 8 | ≥ 4 días/semana; ≥ 40 % activas en la semana 4 |
| H2 | Las tareas clave son rápidas y sin fricción | Tiempo por tarea; abandono por flujo; errores por pantalla | Registrar en la bitácora en < 15 s; crear un recordatorio en < 60 s |
| H3 | Sole aporta valor percibido | Microencuesta: "¿Cómo te sentirías si Sole dejara de existir?" | ≥ 40 % "muy decepcionada" |
| H4 | Hay disposición a pagar | Uso de las funciones Premium en piloto (F14); clics y "avísame" en las puertas falsas (F11); plan elegido en la pantalla de planes | Comparativo por función |
| H5 | Las cuidadoras quieren sumar a otras personas | Invitaciones a familiares (F16, o su puerta falsa); vinculación de la persona cuidada (F12) | % de usuarias que lo intentan |
| H6 | Qué organizaciones y canales traen usuarias que se quedan | Código o enlace de origen; retención por origen | Comparativo entre orígenes |

Los umbrales son orientativos: sirven para leer resultados, no para bloquear nada.

---

## 2. Usuarios y escenario del piloto **DECIDIDO**

- **Rol principal:** la persona cuidadora.
- **Persona cuidada:** vista mínima en esta versión (F12).
- **Familiar:** versión liviana, **secundaria** (F16). Se diseña completa y se construye si sobra tiempo; mientras tanto se mide con una puerta falsa.
- **Profesional o terapeuta:** futuro; el modelo de datos lo soporta, sin interfaz.
- **Unidad central del modelo de datos: el *círculo de cuidado***, formado por una persona cuidada y sus miembros con rol. Una cuidadora puede tener varios círculos (por ejemplo, cuida a su mamá y a su tía). Este modelo es la base del futuro plan familiar.
- **Acceso:** público desde `solecuida.com`. Cada organización recibe un enlace con código propio (`app.solecuida.com/?org=CODIGO`) para medir de dónde viene cada usuaria.
- **Cohortes de referencia:** 8 semanas. No hay tope de usuarias; el sistema avisa al fundador antes de llegar a los límites gratuitos.
- **Sin datos clínicos** (sin diagnósticos, signos vitales, escalas médicas ni historia clínica). Los recordatorios de medicamentos y la bitácora, incluido el estado de ánimo, sí entran y se tratan como **datos sensibles** según la sección 6.

---

## 3. Funcionalidades **DECIDIDO**

Basadas en las ideas del fundador y en los módulos de `FASE-1`, adaptadas a esta versión: web, sin datos clínicos, sin IA y con costo cero.

**Prioridad:** P1 = imprescindible · P2 = importante · P3 = si alcanza el tiempo · **S** = secundaria: se diseña completa y se construye si sobra tiempo o cuota.

### F1 · Bienvenida y configuración en menos de 5 minutos — P1
- Registro con correo y enlace mágico (sin contraseña), con contraseña opcional.
- Consentimientos por capas (sección 6.3) **antes** de guardar cualquier dato.
- Crear la persona cuidada: nombre o apodo, relación ("mi mamá", "mi hijo") y tipo de cuidado.
- **Plantillas por tipo de cuidado:** precargan recordatorios, rutinas y fechas típicas, todo editable. Las mínimas: adulto mayor, Alzheimer y otras demencias, diálisis, discapacidad física, discapacidad intelectual, enfermedad crónica general, recuperación de una cirugía, niñez con necesidades especiales y "empezar desde cero".
  - Las plantillas son organización práctica, **no consejo médico**. Ejemplo para diálisis: "sesión de diálisis lun-mié-vie", "preparar bolso para la sesión", "control mensual". No incluyen indicaciones de dieta, líquidos ni dosis.
  - El contenido de las plantillas lo edita el fundador desde F15.
- Pedir permiso de notificaciones explicando para qué sirven, nunca al abrir la app por primera vez.
- Instrucciones para instalar la app en la pantalla de inicio, por separado para Android/Chrome e iPhone/Safari.

### F2 · "Hoy": el centro del día a día — P1
Inspirado en apps como Fitia: al entrar, la persona ve su día.
- Saludo y **lo pendiente de hoy**, ordenado por hora y agrupado por importancia: **importante**, **normal** y **cuando puedas**.
- Muestra lo hecho, lo atrasado y lo próximo (fechas importantes de los siguientes días).
- Cada ítem se resuelve con un toque: **hecho / no se hizo / posponer**.
- **Consejo o actividad del día:** un mensaje breve y cálido ("¿Una caminata de 10 minutos hoy?", "Recuerda tomar agua tú también"). Si es una actividad, se puede **aceptar** y queda en el día como un ítem más. El banco de consejos es editable desde F15 y no incluye consejos médicos.
- Un indicador amable del avance del día y de la semana, sin presión ni culpa.
- Si la cuidadora tiene varios círculos, se cambia entre ellos arriba.

### F3 · Recordatorios para todo — P1
Una sola herramienta para centralizar el cuidado.
- Tipos: **medicamento**, **comida o hidratación**, **actividad** (caminata, ejercicio, terapia), **control o cita**, **trámite**, **fecha importante** (cumpleaños, aniversarios) y **personalizado**.
- Cada recordatorio tiene un nivel de importancia (importante / normal / cuando puedas), que define su lugar en "Hoy" y la insistencia de los avisos.
- Medicamento: nombre en texto libre, indicación en texto libre ("1 pastilla con comida"), horarios y días. **Sin catálogo de fármacos ni cálculo de dosis.**
- Repetición diaria, por días de la semana, cada N días, mensual o anual (para cumpleaños); fecha de término opcional.
- **Confirmación activa:** notificación a la hora; si no hay respuesta, a los **15 minutos** (configurable) llega *"¿Lo hiciste? ¿Se lo tomó?"* con los botones **"Sí, listo"** y **"No"**. Si responde "No", se puede indicar un motivo opcional ("lo rechazó", "no había", "otro") o posponer.
- **Fechas con anticipación:** los controles, trámites y fechas importantes avisan con los días de anticipación que la persona elija (por defecto: 3 días antes, el día anterior y el mismo día).
- Zona horaria `America/Santiago`, con manejo correcto del cambio de horario.

### F4 · Calendario — P1
- Vista de mes y de semana con todo lo programado.
- Desde el calendario se crea cualquier recordatorio de F3.

### F5 · Tareas sin fecha — P2
- Lista de cosas por hacer que no tienen día fijo (comprar pañales, retirar una receta, llamar al banco).
- Se puede pasar una tarea al día de hoy con un toque.
- Cada tarea tiene un botón **"pedir ayuda con esto"**: es la puerta de entrada a F16 (o a su puerta falsa mientras F16 no exista).

### F6 · Bitácora diaria — P1
- Registro rápido, en menos de 15 segundos:
  - **Cómo fue el día:** bueno / regular / difícil.
  - **Cómo estuvo la persona** (selección múltiple): tranquila, feliz, triste, irritable, ansiosa, desorientada, con dolor, cansada, otro.
  - **Sueño** y **comida:** bien / regular / poco.
  - **Nota libre** opcional. La pantalla invita a usar el micrófono del teclado del celular para dictar (sin costo).
- Sole sugiere registrar una vez al día, a la hora que la cuidadora elija.
- Es observación cotidiana: **sin vocabulario clínico, sin escalas médicas y sin interpretaciones** ("desorientada" es lo que la cuidadora observa, no un diagnóstico).

### F7 · Informes y avances — P1
- **Resumen diario** (al final del día, opcional), **semanal** (cada domingo) y **mensual**.
- Contenido: cumplimiento de medicamentos y de cada tipo de recordatorio, actividades hechas, días de la bitácora con su resumen de ánimo, tareas cerradas y el estado de la propia cuidadora (este último, solo para ella).
- Gráficos simples y legibles. Frases como "esta semana se cumplió el 90 % de los medicamentos" o "hubo 3 días difíciles", nunca interpretaciones médicas.
- **Hitos:** Sole reconoce los logros ("30 días seguidos sin olvidar un medicamento", "un mes cuidando con Sole").
- **Compartir:** un informe o un hito se puede compartir como imagen o PDF con el botón de compartir del celular (WhatsApp, correo). Se genera en el navegador, sin servidor, y se advierte que lo compartido sale de Sole.

### F8 · Cuidar a quien cuida — P1
- Pregunta breve de cómo está la propia cuidadora (1 a 5), máximo una vez al día. **Es privada:** no la ve nadie más.
- Si hay varios días bajos seguidos, Sole lo nota con suavidad y ofrece recursos. No diagnostica ni alarma.
- **Botón "necesito un respiro":** pausas cortas, recursos y contactos de apoyo.
- **Directorio de recursos en Chile:** programas públicos de cuidado, líneas de ayuda y organizaciones. Cada recurso lleva fuente oficial verificada y fecha de verificación, y se edita desde F15.

### F9 · Contactos importantes — P2
- Contactos de la persona cuidada: familia, médico tratante, centro de salud, farmacia, transporte. Se llaman con un toque.
- Uno o más se marcan como **contacto de emergencia** (lo usa F12).
- Sin datos clínicos: no se guardan alergias, diagnósticos ni previsión.

### F10 · Escuchar a la usuaria — P1
- Botón permanente **"Contarle algo a Sole"** para comentarios libres o para reportar un problema.
- Microencuestas de 1 o 2 preguntas en los días 3, 14, 28 y 56 desde el registro (sección 4).

### F11 · Puertas falsas (sin funcionalidad real) — P1
Cada una muestra una pantalla honesta: *"Esto todavía no existe. ¿Quieres que te avisemos cuando esté?"*, y registra el interés.
- **Sole con IA:** le hablas a Sole como en una conversación y ella toma nota, resume y ordena lo que dijiste en la bitácora y los recordatorios ("hoy fue un buen día, estuvo tranquila, le dolía la rodilla").
- **Recetas y recomendaciones** según la rutina de cuidado.
- **Plan familiar:** 3 o 4 personas con un inicio común. Muestra 2 o 3 precios de prueba y registra cuál se elige.
- **Comunidad:** "¿Te gustaría conocer a otras personas que cuidan en una situación como la tuya?"
- **Fotos e historial visual:** guardar fotos como comprobante o como historial de la persona.
- **Invitar a un familiar**, solo mientras F16 no esté construida.

### F12 · Vista mínima de la persona cuidada — P2
- La cuidadora genera un **enlace o código de vinculación** para abrir en el teléfono de la persona cuidada, sin crear una cuenta ni ingresar un correo.
- Esa vista muestra **solo** los recordatorios del día que la cuidadora marcó como "visibles para [nombre]", en letra muy grande, con un botón **"Listo"**. La confirmación le llega a la cuidadora.
- **Botón de emergencia:** al presionarlo, y tras una confirmación sencilla para evitar toques accidentales:
  1. **Abre la llamada telefónica** al contacto de emergencia (F9) o al **131 (SAMU)** `[VERIFICAR en fuente oficial]`. Es el camino confiable, porque usa la línea telefónica.
  2. **Además**, envía una notificación urgente a la cuidadora y, si F16 existe, a todo el círculo.
  3. Queda registrado en el historial.
- La vista y la configuración dicen claramente: **"Sole no reemplaza a un servicio de emergencia y no puede garantizar que un aviso llegue."**
- La cuidadora puede revocar la vinculación en cualquier momento.

### F13 · Mi cuenta y mis datos — P1
- Ver, cambiar y revocar consentimientos.
- **Descargar todos mis datos** en formato legible (JSON y CSV).
- **Borrar mi cuenta**, con confirmación; el borrado es real y en un plazo definido.
- **Cerrar un círculo**, incluido el caso del fallecimiento de la persona cuidada: desde el primer momento **se silencian todos los recordatorios**, se ofrece descargar la bitácora y los informes, y el lenguaje es especialmente cuidadoso.

### F14 · Premium, gratis durante el piloto — P2
Funciones que serán pagadas, construidas y marcadas con la etiqueta **"Premium · gratis durante el piloto"** para medir su uso real:
- **Informe para el médico:** una página mensual pensada para llevar a un control: cumplimiento de medicamentos, actividades, resumen de la bitácora y espacio para las preguntas de la familia. Se genera como PDF imprimible desde el navegador.
- A CRITERIO: si sobra tiempo, otra función candidata (por ejemplo, informes con más historial o plantillas avanzadas), documentada en `docs/negocio/planes.md`.

### F15 · Panel de administración del fundador — P1
- Métricas de la sección 1.1 con gráficos, filtrables por organización y por cohorte.
- Gestionar organizaciones y sus códigos.
- Editar el banco de consejos y actividades, el directorio de recursos y las plantillas.
- Leer comentarios y errores.
- Exportar datos de investigación seudonimizados.
- Ver el uso frente a los límites gratuitos (sección 5).

### F16 · Familiares en el círculo (versión liviana) — S
**Se diseña completa en `docs/diseno/familiares.md` desde la fase 1 (el modelo de datos la soporta desde el principio). Se construye en la fase 8, si sobra tiempo o cuota.**
- La cuidadora invita a familiares por enlace.
- El familiar ve el "Hoy" y el calendario del círculo, y recibe las notificaciones que la cuidadora defina. Por defecto: fechas importantes, controles y emergencias.
- Puede **marcar un ítem como hecho o verificado** a distancia. Queda registrado para todo el círculo como **"verificado por [nombre]"**. Ejemplo: el hijo llama a su mamá, ella se toma el remedio y él lo marca.
- Puede **tomar** una tarea de F5 ("yo me encargo").
- Ve los informes de F7, salvo el estado personal de la cuidadora, que es siempre privado.
- No puede cambiar la configuración, los recordatorios ni los permisos: solo la cuidadora administra el círculo.
- Feed del círculo: lo que fue pasando, quién verificó qué y los hitos compartidos.

### F17 · Panel para organizaciones — P3
- Acceso de solo lectura con enlace privado. Muestra **solo datos agregados** de las usuarias que llegaron con su código y nunca grupos de menos de 5 personas.

### Aspectos transversales
- **Funciona sin conexión** para consultar "Hoy" y marcar ítems; sincroniza cuando vuelve la señal.
- **Rendimiento:** la carga inicial es rápida en un Android de gama media con 4G.
- **Textos:** frases cortas, verbos claros, cero jerga técnica o médica.

---

## 4. Capa de investigación **PROPUESTA ACEPTADA**

- **Eventos propios** en la base de datos, con un identificador seudónimo por usuaria: pantalla vista, acción, duración del flujo, resultado y error. Nunca nombre, correo ni texto libre en un evento.
- **Catálogo de eventos** documentado en `docs/eventos.md`: nombre, cuándo se dispara, propiedades e hipótesis que alimenta. Ningún evento existe sin una hipótesis asociada.
- **Errores técnicos** capturados con Sentry (sección 5), con los datos personales filtrados antes del envío.
- **Microencuestas** (F10): días 3 (facilidad), 14 (valor), 28 (pregunta H3) y 56 (cierre de cohorte y disposición a recomendar Sole a una organización).
- **Consentimiento de investigación separado** del uso de la app: quien lo rechaza puede usar Sole igual, y solo se registran los eventos técnicos mínimos para el funcionamiento.
- **Paneles:** F15 para el fundador y F17 para las organizaciones.

---

## 5. Plataforma y stack **DECIDIDO**

**Solo web. Sin Google Play ni App Store en esta versión.**

| Pieza | Decisión | Notas |
|---|---|---|
| App | **PWA instalable** en `app.solecuida.com` | Se instala desde Chrome (Android) o Safari (iPhone) como acceso directo |
| Framework | Next.js (App Router) + TypeScript + Tailwind CSS | A CRITERIO: librería de componentes accesible |
| Backend | **Supabase**: Postgres, Auth, Row Level Security, Edge Functions, `pg_cron` | Un proyecto de producción en la región São Paulo; desarrollo local con la CLI de Supabase |
| Hosting | **Vercel**, plan gratuito, en un proyecto separado del sitio `web/` | |
| Notificaciones | **Web Push** (VAPID), enviadas desde una Edge Function programada con `pg_cron` | En iPhone solo funcionan con la app instalada en la pantalla de inicio (iOS 16.4+); la bienvenida lo explica |
| Informes PDF | Generados en el navegador | Sin servidor ni costo |
| Correo de la app | **Resend** (plan gratuito) como SMTP de Supabase Auth, en el subdominio `notificaciones.solecuida.com` con SPF y DKIM propios | **Nunca por Zoho**: `CORREO-Configuracion-Zoho.md` §6 lo prohíbe para proteger la reputación de `solecuida.com`. Zoho sigue siendo el correo personal (`hola@`, `jose@`) |
| Errores | **Sentry**, plan gratuito | Con filtrado de datos personales |
| Analítica de la app | **Tabla de eventos propia** en Supabase | No se envían datos de usuarias a terceros de analítica |
| Analítica de la web | Vercel Web Analytics o Cloudflare Web Analytics, sin cookies, más Google Search Console | No se usa GA4 |
| Anti-bots | Cloudflare Turnstile, gratuito | Integrado con el captcha de Supabase Auth y el formulario de la web |
| Repositorio | Este mismo, en la carpeta `app/` | El sitio sigue en `web/` |

**Límites gratuitos que hay que gestionar** (verificar los valores actuales y documentarlos en `docs/limites.md`):
- Supabase pausa los proyectos gratuitos tras 7 días sin actividad: configurar un keep-alive (por ejemplo, con GitHub Actions).
- Tamaño de la base de datos, usuarias activas mensuales e invocaciones de Edge Functions.
- Condiciones de uso no comercial del plan gratuito de Vercel.

### 5.1 Lo que el fundador debe preparar antes de la sesión de Fable

- [ ] Cuenta y proyecto de Supabase (región São Paulo).
- [ ] Proyecto de Vercel conectado al repositorio, con raíz en `app/`.
- [ ] Subdominio `app.solecuida.com` apuntando a Vercel.
- [ ] Cuenta gratuita de Sentry.
- [ ] Cuenta gratuita de Cloudflare, para Turnstile.
- [ ] Propiedad `solecuida.com` verificada en Google Search Console.
- [ ] Cuenta gratuita de Resend, con el dominio `notificaciones.solecuida.com` verificado (registros SPF y DKIM en el DNS). La clave se carga como variable de entorno, nunca en el código.
- [ ] Docker Desktop instalado y abierto, para la base de datos local de desarrollo.

Si falta algo, Fable avanza con el desarrollo local y despliega cuando esté listo.

---

## 6. Seguridad y privacidad **DECIDIDO**

### 6.1 Estándares de referencia
Cumplimiento verificable, no certificación formal:
- **OWASP ASVS 5.0, nivel 2**: estándar principal. Entregable: `docs/seguridad/asvs-checklist.md`, con cada requisito marcado como cumplido, no aplica o pendiente, y su evidencia.
- **OWASP Top 10**: una prueba documentada por cada riesgo.
- **ISO/IEC 27001:2022 Anexo A / 27002**: tabla de los controles aplicables y de cómo se cumplen.
- **ISO/IEC 27701**: referencia para la gestión de privacidad.
- **Ley 19.628** y **Ley 21.719**: se diseña como si la Ley 21.719 ya estuviera vigente.

### 6.2 Lista de verificación técnica obligatoria
Cada punto debe tener evidencia en `docs/seguridad/` antes de la fase 5. Consolida los estándares de 6.1 y las listas de verificación previas al lanzamiento que revisó el fundador.

**A. Secretos y claves**
1. En el cliente solo se usa la clave **pública** de Supabase (publishable/anon). La clave de servicio (service role/secret) vive únicamente en Edge Functions o en el servidor, nunca en una variable `NEXT_PUBLIC_*`.
2. Ningún secreto en Git: `.env*` en `.gitignore`, **gitleaks** en pre-commit y en CI, y un escaneo inicial de todo el historial.
3. Planes gratuitos sin tarjeta cuando sea posible; donde haya tarjeta, tope de gasto en cero y alertas.

**B. Acceso y autorización**
4. Row Level Security en **todas** las tablas, con **tests automáticos** que comprueben que nadie puede leer ni escribir datos de un círculo al que no pertenece, y que cada rol (cuidadora, persona cuidada vinculada, familiar) solo hace lo que le corresponde.
5. Autenticación verificada **en el servidor** en cada ruta protegida (middleware) y en cada Edge Function o RPC. La interfaz nunca es la barrera de seguridad.
6. **Sin manipulación de campos:** una usuaria no puede modificar `role`, `circle_id`, dueño, `created_by`, marcas de tiempo ni ningún indicador de administración. Se usan privilegios por columna, triggers o RPC con lista blanca de campos.
7. **Nadie se hace admin solo:** el rol de administrador se asigna solo por SQL manual del fundador; ninguna vía de la app lo concede.
8. Panel de administración (F15): verificación de rol en el servidor y **MFA (TOTP) obligatorio** para cuentas de administración.
9. El enlace de vinculación de la persona cuidada (F12) es un token largo, revocable, con expiración y permisos mínimos.

**C. Sesiones y credenciales**
10. Cookies `HttpOnly`, `Secure` y `SameSite=Lax`; expiración de sesión y rotación del token de refresco.
11. Las contraseñas las guarda Supabase Auth con hash (bcrypt). La app nunca las almacena ni las registra. Largo mínimo y verificación de contraseñas filtradas, si el plan lo permite.
12. Límites de frecuencia en inicio de sesión, enlace mágico, registro, invitaciones, botón de emergencia y comentarios.
13. **Protección contra bots:** Cloudflare Turnstile (gratuito, vía el soporte de captcha de Supabase Auth) en registro, inicio de sesión, enlace mágico y en el formulario de contacto de la web.

**D. Entradas y salidas**
14. Toda entrada se valida con esquemas (por ejemplo, zod) en el cliente **y** en el servidor, además de restricciones en la base de datos (largo, valores permitidos).
15. Solo consultas parametrizadas: nada de SQL armado concatenando texto en RPC ni en Edge Functions.
16. El contenido de las usuarias se escapa siempre: nada de `dangerouslySetInnerHTML`, y las notas se muestran como texto plano.
17. **Sin subida de archivos en esta versión.** Si se agrega después: lista blanca de tipos, tamaño máximo y bucket privado.
18. Respuestas acotadas: paginación, número máximo de filas y solo las columnas necesarias.
19. Los errores que ve la usuaria no revelan información interna; el detalle va solo a Sentry, con los datos personales filtrados.

**E. Transporte y navegador**
20. HTTPS forzado y HSTS.
21. Cabeceras de seguridad: CSP estricta, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` y `frame-ancestors 'none'`.
22. CORS con lista explícita de orígenes (`app.solecuida.com` y localhost en desarrollo), **nunca `*`**.

**F. Operación**
23. Cifrado a nivel de campo para las notas libres de la bitácora y los nombres e indicaciones de medicamentos.
24. Escaneo de dependencias en CI (`npm audit` u OSV, más Dependabot), lockfile versionado; antes de agregar una librería, comprobar que se mantiene y su licencia.
25. Análisis estático en CI (CodeQL o Semgrep, gratuitos).
26. Escaneo base de OWASP ZAP contra el entorno desplegado.
27. **Monitoreo de la base de datos:** los Security y Performance Advisors de Supabase sin hallazgos críticos antes de cada publicación; revisión de consultas lentas y de los logs.
28. **Respaldos automáticos:** verificar qué ofrece el plan gratuito `[VERIFICAR]` y complementarlo con una exportación diaria (`pg_dump`) por GitHub Actions, **cifrada antes de guardarse**, con retención corta y una restauración probada al menos una vez.
29. **Producción limpia:** sin rutas de depuración, cuentas de prueba ni datos de ejemplo; mapas de código fuente no públicos (solo se suben a Sentry) y sin `console.log` con datos.
30. Registro de auditoría de los accesos administrativos.

### 6.3 Privacidad y consentimiento
- Consentimiento por capas: (1) términos y uso básico; (2) datos sensibles de rutina, ánimo y medicamentos; (3) investigación (opcional).
- La cuidadora declara que cuenta con la autorización de la persona cuidada o que actúa en su interés, con texto claro y sin jerga legal.
- Lo que se comparte fuera de Sole (F7) sale bajo responsabilidad de quien lo comparte, y se avisa en el momento.
- Minimización: no se pide nada que no se use.
- Retención: los datos se borran cuando la persona lo pide o tras 12 meses de inactividad, con aviso previo.
- Entregables: política de privacidad y términos (actualizar `web/privacidad.html`), registro de actividades de tratamiento, evaluación de impacto en privacidad simplificada, plan de respuesta a incidentes y modelo de amenazas.

### 6.4 Lista de verificación legal y de prácticas justas
1. **Política de privacidad**, **términos y condiciones** y **política de cookies**, enlazados desde la app y la web.
2. **Cookies:** la app y la web usan solo cookies esenciales, como la de sesión. Por eso no se necesita banner. Si algún día se agregan cookies no esenciales, el banner debe permitir rechazar con la misma facilidad que aceptar.
3. **Sin política de reembolsos** por ahora: los términos dicen que el servicio es gratuito. Se redacta cuando exista un cobro.
4. **Responsable de los datos visible:** quién es el responsable (persona natural), cómo contactarlo (`hola@solecuida.com`) y para qué se usan los datos.
5. **Inventario de terceros** (Supabase, Vercel, Sentry, Zoho, Cloudflare): qué datos recibe cada uno y en qué país, porque hay transferencia internacional. Se publica en la política de privacidad.
6. **Edad:** las usuarias deben ser mayores de 18 años. Si la persona cuidada es menor, sus datos los ingresa su madre, padre o tutor, y así se declara en el consentimiento.
7. **Sin patrones oscuros:** borrar la cuenta es tan fácil como crearla; ningún consentimiento viene marcado por defecto; las puertas falsas lo dicen honestamente; las notificaciones nunca culpan ni presionan.
8. **Sin afirmaciones sin respaldo:** no se promete que Sole "mejora la salud", "reduce el estrés" ni "previene" nada. No se inventan testimonios, cifras ni reseñas, y no se usan logos de organizaciones sin su permiso escrito.
9. **Baja de correos:** todo correo no transaccional incluye cómo darse de baja, y la app tiene preferencias de notificación.
10. **Licencias:** solo imágenes, íconos y tipografías propias o con licencia que lo permita, registradas en `docs/licencias.md`.
11. **Accesibilidad explícita:** texto alternativo, contraste suficiente y navegación completa con teclado (parte de WCAG 2.2 AA, sección 7).

---

## 7. Diseño **DECIDIDO**

- **No** se usa la estética "carta editorial" de la web; se conserva el logo.
- Estética neutra y cálida para personas cansadas: letra base de 18 px o más, botones grandes, pocos pasos, alto contraste y **WCAG 2.2 AA** verificada.
- La vista de la persona cuidada (F12) es aún más simple: letra muy grande, uno o dos botones por pantalla.
- Todo el aspecto visual vive en **variables de diseño** (colores, tipografías, espaciados, radios), para que un estudio de marca posterior lo cambie sin tocar componentes.
- Modo claro y oscuro.
- Prioridad al celular; en escritorio funciona bien, pero no es el foco.

---

## 8. Equipo de subagentes **PROPUESTA ACEPTADA**

| Rol | Responsable de | Entregables | No toca |
|---|---|---|---|
| **Orquestador** (tú) | Plan, integración, puntos de control, `DECISIONES.md` | Resúmenes de fase | — |
| **UX / UI** | Flujos, pantallas, sistema de diseño, textos de la interfaz, diseño funcional de cada F en `docs/diseno/` | Variables de diseño, componentes base, revisión de accesibilidad | Lógica de negocio |
| **Frontend** | La PWA: pantallas, funcionamiento sin conexión, instalación, notificaciones en el cliente, PDF | `app/` | Esquema de la base de datos |
| **Backend y datos** | Esquema, RLS, Edge Functions, tareas programadas, envío de notificaciones | Migraciones, funciones, tests de RLS | Interfaz |
| **Seguridad y privacidad** | Sección 6 completa; revisa cada fase antes del punto de control | `docs/seguridad/`, informes de escaneo | — (puede bloquear una fase) |
| **Calidad (QA)** | Tests unitarios y de extremo a extremo de los flujos P1, accesibilidad, pruebas en un celular de gama media emulado | Suite de tests en CI, informe por fase | — |
| **Investigación y analítica** | Sección 4, F10, F15 y F17; gráficos de F7 | `docs/eventos.md`, paneles | — |
| **Contenidos** | Plantillas de F1, banco de consejos de F2, directorio de F8, textos de hitos | Contenido verificado, con fuentes | Consejos médicos |
| **Monetización** | F11, F14 y el modelo de negocio futuro | `docs/negocio/planes.md`: planes, precios de prueba, qué incluiría la versión con IA y cómo leer los datos de H4 | No implementa cobros |
| **Web** | Actualizar `solecuida.com` (sección 8.1) | Cambios en `web/`, coherentes con `web/README.md` | La app |
| **Alianzas** | Encontrar organizaciones y preparar el contacto (sección 8.2) | Lista, plantillas, kit de piloto | No envía correos |
| **Legal y documentación** | Privacidad, términos, acuerdo de piloto, manual de mantenimiento | `docs/legal/`, `docs/mantenimiento.md` | — |

### 8.1 Cambio de relato en la web
- La web deja de presentar Sole como "una idea que voy a validar con entrevistas" y pasa a decir: *este es el mismo contexto, decidí construir esto y ahora lo estoy probando con personas reales.*
- Se agregan: qué es la app, cómo probarla (con instrucciones de instalación), qué datos se recogen y para qué, y una sección para organizaciones que quieran sumarse al piloto.
- Se mantiene la voz de la carta y su diseño editorial. La app tiene su propio diseño (sección 7).
- La tía Sole sigue presentándose como alguien vivo (sección 0.3).

**Lista de verificación de la web (posicionamiento en buscadores y asistentes de IA, conversión y calidad):**
1. Título y meta descripción **distintos en cada página**, con un solo H1 diferente del título y jerarquía H2/H3 ordenada.
2. Texto escrito para la **intención de búsqueda** real ("app para cuidadores Chile", "recordatorio de medicamentos adulto mayor", etc.), con un resumen breve al inicio de cada página.
3. **Una sola llamada a la acción principal** por página ("Probar Sole"), que aparece después del primer párrafo y queda **fija en el celular**.
4. Sección de **preguntas frecuentes** con datos estructurados `FAQPage`, más datos `Organization` y `WebSite`. No `LocalBusiness`, porque no hay local físico.
5. Enlaces internos entre páginas; listas y tablas donde ayuden a leer.
6. Imágenes con nombre descriptivo, texto alternativo, comprimidas (WebP/AVIF) y con tamaño declarado.
7. URLs limpias y en español.
8. `sitemap.xml` y `robots.txt` actualizados (ya existen); sitemap enviado a **Google Search Console**. En `app.solecuida.com` se indexa solo la portada de la app.
9. **`llms.txt`** con un resumen del proyecto para asistentes de IA.
10. Favicon e íconos de la PWA en todos los tamaños.
11. Página 404 (ya existe) y revisión automática de enlaces rotos en CI.
12. Formulario de contacto protegido contra spam (Turnstile y campo trampa).
13. Botón para compartir.
14. **Analítica sin cookies** (Vercel Web Analytics o Cloudflare Web Analytics, gratuitas) más Google Search Console. **No se usa GA4.**
15. Velocidad: Lighthouse ≥ 90 en rendimiento, accesibilidad, buenas prácticas y SEO, en el celular.
16. **No se agrega botón de WhatsApp**: se quitó a propósito (ver `web/README.md`). Tampoco se crea ficha de Google Business, porque no hay local físico.

### 8.2 Trabajo de alianzas (fuera de la app)
- `alianzas/organizaciones.csv`: organizaciones chilenas relacionadas con el cuidado (fundaciones, corporaciones, agrupaciones de cuidadoras, centros diurnos, programas municipales y de salud, asociaciones de pacientes por condición). **Solo datos institucionales públicos:** nombre, tipo, condición o población que atiende, comuna o región, web, correo o formulario institucional, fuente y fecha. Nunca datos personales de individuos.
- `alianzas/plantillas/`: **varias versiones de correo** por tipo de organización (fundación, municipio, centro de salud, agrupación de cuidadoras, asociación de pacientes) y por tono (breve, completo y de seguimiento), para comparar cuál responde mejor. Todas en la voz de la carta de la web, con el enlace con código de cada organización.
- `alianzas/seguimiento.csv`: registro de contacto (fecha de envío, versión usada, respuesta), para medir qué versión funciona mejor.
- `alianzas/kit-piloto.md`: qué se le pide a una organización, qué recibe a cambio (el panel F17 y el informe de cierre de cohorte) y un acuerdo de piloto de una página.
- Integrar `seguimiento-entrevistas.csv` como pauta de seguimiento cualitativo para las usuarias que acepten conversar.
- **Los correos los envía el fundador**, nunca los agentes.

---

## 9. Fases y puntos de control **DECIDIDO**

Se ejecutan en orden. Dentro de cada fase, los subagentes trabajan en paralelo donde no se pisen archivos.

| Fase | Contenido | Punto de control: el fundador puede… |
|---|---|---|
| **0. Preparación** | Leer el brief, estructura de `app/`, CI, Supabase local, variables de diseño, `DECISIONES.md` inicial | Ver el plan detallado y el esqueleto |
| **1. Cimientos y diseño completo** | Esquema completo (círculos, miembros y todos los roles, consentimientos, eventos), Auth, RLS y sus tests, F1, capa de eventos base. **Diseño funcional de todas las F en `docs/diseno/`, incluida F16** | Registrarse, elegir una plantilla, crear una persona cuidada; leer el diseño de F16 |
| **2. Núcleo del día a día** | F2, F3 (con notificaciones reales y confirmación a los 15 minutos), F4, F6, F8, F13 | Recibir un recordatorio en su teléfono, confirmarlo, ver el calendario y usar la bitácora |
| **3. Informes y escucha** | F7, F10, F11, F15, catálogo de eventos | Ver sus resúmenes y sus propias métricas en el panel |
| **4. Seguridad y calidad** | Sección 6 completa, escaneos, accesibilidad, tests de extremo a extremo de P1 | Leer el checklist de ASVS y los informes |
| **5. Despliegue** | Producción en `app.solecuida.com`, keep-alive, respaldos, `docs/mantenimiento.md` | Usar la app real instalada en su celular |
| **6. Ampliación** | F5, F9, F12 (con botón de emergencia), F14 | Vincular un segundo teléfono como persona cuidada y probar el botón de emergencia |
| **7. Fuera de la app** | Web (8.1), alianzas (8.2), contenidos, documentos legales, `docs/negocio/planes.md` | Revisar la web nueva, la lista de organizaciones y los correos |
| **8. Si sobra tiempo o cuota** | **F16** (familiares) primero; luego F17, rendimiento y pulido visual | Invitar a un familiar y ver "verificado por [nombre]" |

**Reglas de corte:** las fases 1, 2, 4 y 5 son el mínimo para lanzar. Si el tiempo se acaba, llega a la fase 5 con menos funcionalidades antes que tener más funcionalidades sin desplegar ni asegurar. Si se agota la cuota a mitad de una fase, deja `PENDIENTES.md` al día antes de detenerte.

---

## 10. Fuera del alcance de esta versión **DECIDIDO**

- Apps en Google Play o App Store.
- Inteligencia artificial, recetas, comunidad y fotos: existen solo como puertas falsas (F11).
- Cobros reales y publicidad.
- Datos clínicos: diagnósticos, signos vitales, escalas médicas, catálogo de fármacos, dosis calculadas, consejos médicos o de dieta.
- Interfaz para profesionales (el modelo de datos sí los soporta).
- Geolocalización y cualquier promesa de seguridad física. El botón de emergencia (F12) solo facilita llamar y avisar.
- Envío de correos a organizaciones por parte de los agentes.

---

## 11. Definición de terminado

Una funcionalidad está terminada cuando:
1. Funciona en un Android de gama media emulado y en Safari de iPhone.
2. Tiene tests de sus casos principales y de los permisos (RLS) que la afectan.
3. Emite los eventos de `docs/eventos.md` que le corresponden.
4. Cumple WCAG 2.2 AA en sus pantallas.
5. Sus textos están en español claro y revisados por el rol de UX.
6. No introduce secretos en el repositorio ni nuevas alertas en los escaneos de seguridad.
7. Su diseño funcional en `docs/diseno/` coincide con lo construido.
