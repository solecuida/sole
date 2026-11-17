# Diseño funcional · Aspectos transversales

Fuente: `PROTOTIPO-Brief-Fable.md` §3 ("Aspectos transversales"), §4, §7 y §11. No describe una funcionalidad, sino cuatro cualidades que cruzan todas.

## Sin conexión

Quien cuida suele estar en una sala de espera, en un bus o en una casa con mala señal. Sin conexión, Sole permite **consultar "Hoy" y marcar ítems**; todo lo demás espera a que vuelva la señal.

- **Consultar.** La app guarda en el teléfono la última versión de "Hoy" de cada círculo. Sin señal, muestra esa versión con un aviso en texto: "Sin conexión · estás viendo lo guardado."
- **Marcar.** Hecho, No se hizo y Posponer funcionan sin señal. El ítem cambia de inmediato y aparece: "Guardado sin conexión · se enviará cuando vuelva la señal."
- **Sincronizar.** Al volver la señal, las marcas pendientes se envían solas. Cada marca lleva una clave propia, así un reenvío no la duplica.
- **Lo que no funciona sin conexión:** crear o editar recordatorios, escribir la bitácora, ver informes y recibir avisos nuevos. La app lo dice con claridad en vez de fallar en silencio.
- **Instalación.** Sole se instala en la pantalla de inicio desde Chrome en Android o Safari en iPhone. En iPhone, los avisos solo funcionan con la app instalada (iOS 16.4 o posterior).

Criterios: con el teléfono en modo avión, "Hoy" abre y deja marcar; al reconectar, las marcas llegan una sola vez.

## Rendimiento

El teléfono de referencia es un Android de gama media con conexión 4G.

- La carga inicial es rápida en ese teléfono; "Hoy" es lo primero que se ve y lo que menos pesa.
- Las listas son acotadas por diseño: un día, una semana, un mes, los últimos 14 días de bitácora.
- La tipografía se sirve desde el propio dominio de la app.
- Las animaciones son mínimas (150 ms) y se apagan si la persona pidió reducir el movimiento.
- Meta de referencia: Lighthouse de 90 o más en rendimiento, accesibilidad, buenas prácticas y SEO, medido en el celular sobre la portada de la app (se mide en producción).
- Tiempos que el piloto mide (hipótesis H2): registrar la bitácora en menos de 15 segundos y crear un recordatorio en menos de 60.

## Textos

Todo lo que lee una persona usuaria va en español de Chile, con tuteo cálido y sin modismos forzados.

- **Frases cortas y verbos claros.** Los botones dicen exactamente qué pasa: "Hecho", "No se hizo", "Posponer", "Guardar".
- **Cero jerga técnica o médica.** "Avisos", no "notificaciones push"; "enlace", no "token"; "desorientada" es lo que se observa, no una conclusión médica.
- **Sin culpa ni presión.** "Vas 3 de 5 hoy", nunca "Fallaste" ni "Te faltan 2".
- **Sin promesas sin respaldo.** Sole no dice que mejora la salud, reduce el estrés ni previene nada. No hay testimonios, cifras ni reseñas inventadas.
- **Honestidad en lo que no existe.** Las puertas falsas dicen "Esto todavía no existe" antes de pedir cualquier cosa.
- **Los errores no asustan ni revelan detalles internos:** "Algo salió mal. Ya nos llegó el aviso."
- **La tía Sole está viva.** Ningún texto puede sugerir lo contrario.
- **Accesibilidad (WCAG 2.2 AA):** letra base de 18 px, botones de 48 px o más, contraste suficiente en claro y oscuro, todo usable con teclado, y nada que se comunique solo con color.
- **Estados siempre presentes:** cada lista y cada acción tiene su versión cargando, vacía y con error. El vacío trae una frase cálida y el paso siguiente.

## Investigación

El piloto existe para aprender. La regla: medir el uso sin espiar a nadie.

- **Eventos propios, en la base de datos de Sole.** No se envía nada de las usuarias a servicios de analítica de terceros.
- **Identificador seudónimo.** Cada evento lleva un identificador que no es el de la cuenta. Nunca lleva nombre, correo ni texto libre.
- **Qué se registra:** pantalla vista, acción, duración del flujo, resultado y error.
- **Ningún evento sin hipótesis.** El catálogo vive en `docs/eventos.md`: nombre, cuándo se dispara, propiedades y qué hipótesis (H1 a H6) alimenta.
- **Consentimiento separado.** La investigación es la tercera capa de consentimiento y es opcional. Quien la rechaza usa Sole igual, y de ella solo se registran los eventos técnicos mínimos para que la app funcione.
- **Microencuestas** en los días 3, 14, 28 y 56 (F10).
- **Errores técnicos** van a Sentry con los datos personales filtrados antes de salir.
- **Quién mira:** el fundador en su panel (F15) y, si se construye, cada organización en el suyo, solo con datos agregados y nunca de grupos de menos de 5 personas (F17).
- **Al borrar la cuenta** se borran también sus eventos.
