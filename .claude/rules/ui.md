---
description: Convenciones de interfaz, accesibilidad y textos de la app
paths:
  - "app/src/app/**/*.tsx"
  - "app/src/components/**"
---

# Interfaz

- Server Component por defecto; `"use client"` solo en la hoja interactiva.
- Solo clases de token (`bg-surface`, `text-fg-muted`, `border-border-strong`); cero hex o px sueltos para color.
- Controles de al menos 48 × 48 px; texto base 18 px; contraste ya resuelto por los tokens.
- Formularios con `Field` (label asociado, error con `role="alert"`, `aria-invalid`); grupos con `ChoiceGroup` (`fieldset` + `legend`).
- Estados de carga, vacío y error en toda lista y acción. Vacío con una frase cálida y la acción siguiente ("Todavía no hay recordatorios. Crea el primero.").
- Avisos de estado en regiones `aria-live="polite"`; nada se comunica solo con color.
- Nada de `dangerouslySetInnerHTML`; las notas se muestran como texto.
- Textos: español de Chile, tuteo cálido, frases cortas, sin jerga médica, sin culpa ni presión ("Vas 3 de 5 hoy", nunca "Fallaste").
- Nada fijo en pantalla puede tapar el elemento enfocado (WCAG 2.4.11).
