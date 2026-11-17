// Preguntas de las microencuestas: las comparten el servidor (valida) y la
// tarjeta del cliente (muestra). Vive en `lib` para que ambos lados reciban el valor real.

export const SURVEY_KEYS = ["d3", "d14", "d28", "d56"] as const;
export type SurveyKey = (typeof SURVEY_KEYS)[number];

export interface SurveyOption {
  value: string;
  label: string;
}

export interface SurveyDefinition {
  key: SurveyKey;
  /** Días desde el registro a partir de los cuales se ofrece. */
  day: number;
  question: string;
  options: SurveyOption[];
}

export const SURVEY_DEFINITIONS: Record<SurveyKey, SurveyDefinition> = {
  d3: {
    key: "d3",
    day: 3,
    question: "¿Qué tan fácil te resulta usar Sole?",
    options: [
      { value: "1", label: "1 · Muy difícil" },
      { value: "2", label: "2 · Difícil" },
      { value: "3", label: "3 · Normal" },
      { value: "4", label: "4 · Fácil" },
      { value: "5", label: "5 · Muy fácil" },
    ],
  },
  d14: {
    key: "d14",
    day: 14,
    question: "¿Sole te ayuda en tu día a día?",
    options: [
      { value: "si", label: "Sí" },
      { value: "algo", label: "Algo" },
      { value: "no", label: "No" },
    ],
  },
  d28: {
    key: "d28",
    day: 28,
    question: "¿Cómo te sentirías si Sole dejara de existir?",
    options: [
      { value: "muy_decepcionada", label: "Muy decepcionada" },
      { value: "algo_decepcionada", label: "Algo decepcionada" },
      { value: "no_importaria", label: "No me importaría" },
    ],
  },
  d56: {
    key: "d56",
    day: 56,
    question: "¿Recomendarías Sole a una organización que conozcas?",
    options: [
      { value: "si", label: "Sí" },
      { value: "tal_vez", label: "Tal vez" },
      { value: "no", label: "No" },
    ],
  },
};
