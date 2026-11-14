// Opciones de la bitácora con su nombre para personas. Es observación cotidiana:
// sin vocabulario clínico. Los valores son los mismos que acepta la base.
// Vive en lib (y no en el formulario) porque también lo usa la página del servidor.

export const DAY_OPTIONS = [
  { value: "bueno", label: "Bueno" },
  { value: "regular", label: "Regular" },
  { value: "dificil", label: "Difícil" },
];

export const MOOD_OPTIONS = [
  { value: "tranquila", label: "Tranquila" },
  { value: "feliz", label: "Feliz" },
  { value: "triste", label: "Triste" },
  { value: "irritable", label: "Irritable" },
  { value: "ansiosa", label: "Ansiosa" },
  { value: "desorientada", label: "Desorientada" },
  { value: "con_dolor", label: "Con dolor" },
  { value: "cansada", label: "Cansada" },
  { value: "otro", label: "Otro" },
];

export const LEVEL_OPTIONS = [
  { value: "bien", label: "Bien" },
  { value: "regular", label: "Regular" },
  { value: "poco", label: "Poco" },
];
