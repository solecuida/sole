-- Sole · contenido inicial (escrita a mano). Producción también lo necesita, por eso es migración y no seed.
-- Plantillas por tipo de cuidado (F1), consejos y actividades (F2) y directorio de recursos (F8).
--
-- Reglas de este contenido:
--   · Organización práctica y cálida. Sin consejo médico, de alimentación, de líquidos ni cantidades de medicamentos.
--   · Todo es editable por el fundador desde el panel (F15).
--   · Los recursos entran con verified_at = null: no se muestran a nadie hasta que el fundador
--     confirme cada dato en su fuente oficial. Todo teléfono o cifra lleva [VERIFICAR].
--   · weekdays usa días ISO: 1 = lunes … 7 = domingo.

-- ---------------------------------------------------------------- plantillas por tipo de cuidado
insert into public.care_templates (care_type, name, description, items) values
(
  'adulto_mayor',
  'Adulto mayor',
  'Para acompañar el día a día de una persona mayor: sus remedios, sus controles y un poco de movimiento.',
  $json$[
    {"title": "Medicamentos de la mañana", "kind": "medication", "importance": "important", "rule": {"freq": "daily", "times": ["09:00"]}, "advanceDays": [], "visibleToCared": false},
    {"title": "Medicamentos de la noche", "kind": "medication", "importance": "important", "rule": {"freq": "daily", "times": ["21:00"]}, "advanceDays": [], "visibleToCared": false},
    {"title": "Ofrecer un vaso de agua", "kind": "food", "importance": "normal", "rule": {"freq": "daily", "times": ["11:00", "16:00"]}, "advanceDays": [], "visibleToCared": false},
    {"title": "Caminata corta", "kind": "activity", "importance": "whenever", "rule": {"freq": "weekly", "weekdays": [1, 3, 5], "times": ["17:00"]}, "advanceDays": [], "visibleToCared": false},
    {"title": "Control en el centro de salud", "kind": "appointment", "importance": "important", "rule": {"freq": "monthly", "dayOfMonth": 5, "times": ["10:00"]}, "advanceDays": [3, 1, 0], "visibleToCared": false}
  ]$json$::jsonb
),
(
  'demencias',
  'Alzheimer y otras demencias',
  'Rutinas estables y avisos claros para los días en que cuesta más. Cambia las horas según cómo es su día.',
  $json$[
    {"title": "Medicamentos de la mañana", "kind": "medication", "importance": "important", "rule": {"freq": "daily", "times": ["09:00"]}, "advanceDays": [], "visibleToCared": false},
    {"title": "Medicamentos de la noche", "kind": "medication", "importance": "important", "rule": {"freq": "daily", "times": ["21:00"]}, "advanceDays": [], "visibleToCared": false},
    {"title": "Rutina de la mañana: aseo y vestirse", "kind": "activity", "importance": "normal", "rule": {"freq": "daily", "times": ["08:30"]}, "advanceDays": [], "visibleToCared": false},
    {"title": "Actividad tranquila: música o fotos", "kind": "activity", "importance": "whenever", "rule": {"freq": "daily", "times": ["16:30"]}, "advanceDays": [], "visibleToCared": false},
    {"title": "Rutina para ir a dormir", "kind": "activity", "importance": "normal", "rule": {"freq": "daily", "times": ["20:30"]}, "advanceDays": [], "visibleToCared": false},
    {"title": "Control con su médico", "kind": "appointment", "importance": "important", "rule": {"freq": "monthly", "dayOfMonth": 5, "times": ["10:00"]}, "advanceDays": [3, 1, 0], "visibleToCared": false}
  ]$json$::jsonb
),
(
  'dialisis',
  'Diálisis',
  'Para ordenar las sesiones, lo que hay que llevar y los controles. Ajusta los días a su turno.',
  $json$[
    {"title": "Sesión de diálisis", "kind": "appointment", "importance": "important", "rule": {"freq": "weekly", "weekdays": [1, 3, 5], "times": ["08:00"]}, "advanceDays": [], "visibleToCared": false},
    {"title": "Preparar el bolso para la sesión", "kind": "errand", "importance": "normal", "rule": {"freq": "weekly", "weekdays": [7, 2, 4], "times": ["20:00"]}, "advanceDays": [], "visibleToCared": false},
    {"title": "Confirmar el traslado a la sesión", "kind": "errand", "importance": "normal", "rule": {"freq": "weekly", "weekdays": [7, 2, 4], "times": ["18:00"]}, "advanceDays": [], "visibleToCared": false},
    {"title": "Medicamentos indicados", "kind": "medication", "importance": "important", "rule": {"freq": "daily", "times": ["09:00"]}, "advanceDays": [], "visibleToCared": false},
    {"title": "Control mensual", "kind": "appointment", "importance": "important", "rule": {"freq": "monthly", "dayOfMonth": 5, "times": ["10:00"]}, "advanceDays": [3, 1, 0], "visibleToCared": false}
  ]$json$::jsonb
),
(
  'discapacidad_fisica',
  'Discapacidad física',
  'Para organizar terapias, ejercicios en casa y trámites de apoyos.',
  $json$[
    {"title": "Medicamentos indicados", "kind": "medication", "importance": "important", "rule": {"freq": "daily", "times": ["09:00"]}, "advanceDays": [], "visibleToCared": false},
    {"title": "Sesión de terapia", "kind": "appointment", "importance": "important", "rule": {"freq": "weekly", "weekdays": [2, 4], "times": ["11:00"]}, "advanceDays": [1, 0], "visibleToCared": false},
    {"title": "Ejercicios en casa", "kind": "activity", "importance": "normal", "rule": {"freq": "weekly", "weekdays": [1, 3, 5], "times": ["17:00"]}, "advanceDays": [], "visibleToCared": false},
    {"title": "Revisar la silla, el bastón o las ayudas que usa", "kind": "errand", "importance": "whenever", "rule": {"freq": "monthly", "dayOfMonth": 1, "times": ["12:00"]}, "advanceDays": [0], "visibleToCared": false},
    {"title": "Control en el centro de salud", "kind": "appointment", "importance": "important", "rule": {"freq": "monthly", "dayOfMonth": 5, "times": ["10:00"]}, "advanceDays": [3, 1, 0], "visibleToCared": false}
  ]$json$::jsonb
),
(
  'discapacidad_intelectual',
  'Discapacidad intelectual',
  'Rutinas claras para el día, sus actividades y sus controles.',
  $json$[
    {"title": "Medicamentos indicados", "kind": "medication", "importance": "important", "rule": {"freq": "daily", "times": ["09:00"]}, "advanceDays": [], "visibleToCared": false},
    {"title": "Rutina de la mañana", "kind": "activity", "importance": "normal", "rule": {"freq": "daily", "times": ["08:00"]}, "advanceDays": [], "visibleToCared": false},
    {"title": "Taller o actividad de la semana", "kind": "activity", "importance": "normal", "rule": {"freq": "weekly", "weekdays": [2, 4], "times": ["15:00"]}, "advanceDays": [], "visibleToCared": false},
    {"title": "Un rato de juego o paseo", "kind": "activity", "importance": "whenever", "rule": {"freq": "daily", "times": ["17:30"]}, "advanceDays": [], "visibleToCared": false},
    {"title": "Control en el centro de salud", "kind": "appointment", "importance": "important", "rule": {"freq": "monthly", "dayOfMonth": 5, "times": ["10:00"]}, "advanceDays": [3, 1, 0], "visibleToCared": false}
  ]$json$::jsonb
),
(
  'cronica_general',
  'Enfermedad crónica',
  'Para no perder el hilo de los remedios, los controles y el retiro de medicamentos.',
  $json$[
    {"title": "Medicamentos de la mañana", "kind": "medication", "importance": "important", "rule": {"freq": "daily", "times": ["09:00"]}, "advanceDays": [], "visibleToCared": false},
    {"title": "Medicamentos de la noche", "kind": "medication", "importance": "important", "rule": {"freq": "daily", "times": ["21:00"]}, "advanceDays": [], "visibleToCared": false},
    {"title": "Retirar medicamentos", "kind": "errand", "importance": "normal", "rule": {"freq": "monthly", "dayOfMonth": 1, "times": ["10:00"]}, "advanceDays": [3, 0], "visibleToCared": false},
    {"title": "Control en el centro de salud", "kind": "appointment", "importance": "important", "rule": {"freq": "monthly", "dayOfMonth": 5, "times": ["10:00"]}, "advanceDays": [3, 1, 0], "visibleToCared": false}
  ]$json$::jsonb
),
(
  'recuperacion_cirugia',
  'Recuperación de una cirugía',
  'Para las semanas después de una operación: remedios, curaciones y controles. Sigue siempre lo que indicó su equipo de salud.',
  $json$[
    {"title": "Medicamentos indicados", "kind": "medication", "importance": "important", "rule": {"freq": "daily", "times": ["08:00", "20:00"]}, "advanceDays": [], "visibleToCared": false},
    {"title": "Curación, según lo indicado", "kind": "activity", "importance": "important", "rule": {"freq": "daily", "times": ["10:00"]}, "advanceDays": [], "visibleToCared": false},
    {"title": "Movimiento suave, según lo indicado", "kind": "activity", "importance": "normal", "rule": {"freq": "daily", "times": ["17:00"]}, "advanceDays": [], "visibleToCared": false},
    {"title": "Control después de la cirugía", "kind": "appointment", "importance": "important", "rule": {"freq": "interval", "everyDays": 14, "times": ["10:00"]}, "advanceDays": [3, 1, 0], "visibleToCared": false}
  ]$json$::jsonb
),
(
  'ninez_necesidades_especiales',
  'Niñez con necesidades especiales',
  'Para ordenar terapias, rutinas, el colegio y los controles de una niña o un niño.',
  $json$[
    {"title": "Medicamentos indicados", "kind": "medication", "importance": "important", "rule": {"freq": "daily", "times": ["08:00"]}, "advanceDays": [], "visibleToCared": false},
    {"title": "Sesión de terapia", "kind": "appointment", "importance": "important", "rule": {"freq": "weekly", "weekdays": [2, 4], "times": ["16:00"]}, "advanceDays": [1, 0], "visibleToCared": false},
    {"title": "Ejercicios o actividades en casa", "kind": "activity", "importance": "normal", "rule": {"freq": "weekly", "weekdays": [1, 3, 5], "times": ["18:00"]}, "advanceDays": [], "visibleToCared": false},
    {"title": "Preparar la mochila y lo del colegio", "kind": "errand", "importance": "normal", "rule": {"freq": "weekly", "weekdays": [7, 1, 2, 3, 4], "times": ["20:00"]}, "advanceDays": [], "visibleToCared": false},
    {"title": "Rutina para ir a dormir", "kind": "activity", "importance": "normal", "rule": {"freq": "daily", "times": ["20:30"]}, "advanceDays": [], "visibleToCared": false},
    {"title": "Control con su especialista", "kind": "appointment", "importance": "important", "rule": {"freq": "monthly", "dayOfMonth": 5, "times": ["10:00"]}, "advanceDays": [3, 1, 0], "visibleToCared": false}
  ]$json$::jsonb
),
(
  'desde_cero',
  'Empezar desde cero',
  'Sin nada cargado. Tú agregas solo lo que necesites, a tu ritmo.',
  '[]'::jsonb
);

-- ---------------------------------------------------------------- consejos y actividades del día
-- care_types vacío = sirve para cualquier tipo de cuidado.
insert into public.tips (kind, text, activity_title) values
  ('consejo', 'Recuerda tomar agua tú también.', null),
  ('consejo', 'No tienes que hacerlo todo hoy. Elige lo importante y deja el resto para mañana.', null),
  ('consejo', 'Pedir ayuda no es fallar. Es cuidar mejor.', null),
  ('consejo', 'Si hoy fue un día difícil, anótalo en la bitácora. Mañana puede servirte recordarlo.', null),
  ('consejo', 'Cinco minutos para ti también cuentan.', null),
  ('consejo', 'Ten a mano los teléfonos importantes. Puedes guardarlos en Contactos.', null),
  ('consejo', 'Una rutina parecida cada día suele dar tranquilidad a los dos.', null),
  ('consejo', 'Antes de un control, anota las preguntas que quieres hacer. Así no se te olvida ninguna.', null),
  ('consejo', '¿Hay alguien que pueda acompañarte una tarde esta semana? Pregunta: a veces la gente quiere ayudar y no sabe cómo.', null),
  ('consejo', 'Dormir bien también es parte de cuidar. Si puedes, descansa cuando la otra persona descansa.', null),
  ('consejo', 'Lo que haces importa, aunque nadie te lo diga hoy.', null),
  ('consejo', 'Deja preparado lo de mañana antes de dormir: la ropa, los documentos, el bolso.', null),
  ('consejo', 'Está bien sentirse cansada. No significa que quieras menos.', null),
  ('consejo', 'Guarda en un solo lugar los papeles y las órdenes de los controles. Te ahorra vueltas.', null),
  ('consejo', 'Hablar con alguien que también cuida puede aliviar. No estás sola en esto.', null),
  ('actividad', '¿Una caminata de 10 minutos hoy?', 'Caminata de 10 minutos'),
  ('actividad', '¿Escuchan juntos una canción que le guste?', 'Escuchar música juntos'),
  ('actividad', '¿Un rato al sol o junto a la ventana?', 'Un rato al sol'),
  ('actividad', '¿Miran fotos antiguas y conversan un rato?', 'Mirar fotos y conversar'),
  ('actividad', '¿Llamas hoy a alguien que te haga bien?', 'Llamar a alguien querido'),
  ('actividad', '¿Tres respiraciones lentas antes de seguir?', 'Pausa para respirar'),
  ('actividad', '¿Un té tranquila, sentada, sin hacer nada más?', 'Un té con calma'),
  ('actividad', '¿Riegan las plantas o salen un momento al patio?', 'Regar las plantas');

-- ---------------------------------------------------------------- directorio de recursos en Chile
-- verified_at queda en null a propósito: el fundador confirma cada dato en la fuente y recién
-- entonces el recurso se muestra. El teléfono también se guarda sin confirmar.
insert into public.resources (name, description, phone, url, source_url, verified_at, region) values
  (
    'SAMU · Urgencias médicas',
    'Servicio de atención médica de urgencia. Para una emergencia de salud, llama al 131 [VERIFICAR]. Sole no reemplaza a un servicio de emergencia.',
    '131',
    'https://www.minsal.cl/',
    'https://www.minsal.cl/',
    null,
    'nacional'
  ),
  (
    'Salud Responde',
    'Línea del Ministerio de Salud para orientación en salud, atendida por profesionales. Teléfono 600 360 7777 y horario de atención [VERIFICAR].',
    '600 360 7777',
    'https://saludresponde.minsal.cl/',
    'https://saludresponde.minsal.cl/',
    null,
    'nacional'
  ),
  (
    'Chile Cuida · Sistema Nacional de Apoyos y Cuidados',
    'Sitio del Estado con los apoyos disponibles para personas cuidadoras y personas que necesitan cuidados, incluida la Red Local de Apoyos y Cuidados de las municipalidades. Requisitos y comunas con cobertura [VERIFICAR].',
    null,
    'https://www.chilecuida.gob.cl/',
    'https://www.chilecuida.gob.cl/',
    null,
    'nacional'
  ),
  (
    'SENAMA · Servicio Nacional del Adulto Mayor',
    'Programas y orientación para personas mayores y sus familias, como centros diurnos y cuidados domiciliarios. Teléfono de orientación Fono Mayor [VERIFICAR].',
    null,
    'https://www.senama.gob.cl/',
    'https://www.senama.gob.cl/',
    null,
    'nacional'
  ),
  (
    'SENADIS · Servicio Nacional de la Discapacidad',
    'Información sobre ayudas técnicas, programas y derechos de las personas con discapacidad y de quienes las cuidan. Requisitos de cada programa [VERIFICAR].',
    null,
    'https://www.senadis.gob.cl/',
    'https://www.senadis.gob.cl/',
    null,
    'nacional'
  ),
  (
    'ChileAtiende · Trámites y beneficios del Estado',
    'Guía de trámites y beneficios, entre ellos la inscripción como persona cuidadora en el Registro Social de Hogares y su credencial. Requisitos y pasos [VERIFICAR].',
    null,
    'https://www.chileatiende.gob.cl/',
    'https://www.chileatiende.gob.cl/',
    null,
    'nacional'
  ),
  (
    'Línea de prevención del suicidio',
    'Si tú o alguien cercano está pasando por un momento muy difícil, hay atención gratuita por teléfono. Número *4141 y horario [VERIFICAR].',
    '*4141',
    'https://www.minsal.cl/',
    'https://www.minsal.cl/',
    null,
    'nacional'
  );
