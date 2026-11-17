---
name: run-step-gate
description: Ejecuta la compuerta de una tarea del plan de Sole (tasks.json), marca su estado y crea el commit y la etiqueta step-NN. Úsala al empezar o terminar una tarea, o al retomar después de un corte.
---

# Correr la compuerta de una tarea

## Cuándo usarla
- "Sigue con la próxima tarea", "retoma la construcción", "¿quedó lista esta tarea?".

## Pasos
1. Lee `blueprints/sole-prototipo/tasks.json` desde el disco. Si hay una tarea `in_progress`, corre su `verify` completo antes que nada.
2. Elige la primera tarea `pending` cuyas dependencias estén `done`, en el orden del arreglo. Márcala `in_progress` y guarda el archivo.
3. Abre su épica en `blueprints/sole-prototipo/epics/` y haz solo esa tarea.
4. Corre cada comando de `verify`, en orden, desde la raíz del repo. Si uno falla, arregla el código, nunca el comando.
5. Márcala `done`, guarda, y ejecuta el `Checkpoint` de la épica: `git add -A && git commit -m "<id>: <título>"` y `git tag <checkpoint>`.
6. Al cerrar una fase del brief (§9), detente y resume para el fundador: qué funciona, cómo probarlo, qué decidiste (`DECISIONES.md`) y qué necesitas. Mantén `PENDIENTES.md` al día.

## Verificar
```bash
git tag -l 'step-*'   # expect: una etiqueta por tarea terminada
```

## No hacer
- No saltarse una tarea bloqueada para "avanzar mientras tanto".
- No reordenar por prioridad: el orden del arreglo es el orden de construcción.
