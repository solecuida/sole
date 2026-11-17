# Planes de Sole

Documento de trabajo del rol de Monetización. Sole es gratis para quien cuida. Aquí se anota qué se está midiendo para saber si algún día alguien pagaría, sin prometer nada.

Este documento **no implementa cobros**, no fija fechas de lanzamiento y no promete funciones. Todo precio es solo para medir interés.

## Planes

- **Hoy: gratis para todas las personas del piloto.** Nada de la app se cobra.
- **Funciones "Premium · gratis durante el piloto":** se construyen de verdad y se marcan con esa etiqueta para medir su uso real. Hoy hay una: el **informe para el médico** (`/informes/medico`), un resumen mensual para llevar a un control, que se imprime o se guarda como PDF desde el teléfono. Sole no lo guarda ni lo envía.
- **Puertas falsas:** las pantallas `/pronto/...` miden interés en ideas que todavía no existen (ver `docs/eventos.md`). No son una promesa de que existirán.
- Qué sería "Premium" y a qué precio no está decidido. Esa decisión depende de lo que muestren las hipótesis de más abajo.

## Precios de prueba

Son los que muestra la puerta falsa del plan familiar (`app/src/server/fake-doors/doors.ts`), en pesos chilenos al mes. Se muestran solo para medir cuánto interés genera cada nivel; nadie paga nada.

| Precio de prueba | Qué mide |
|---|---|
| $2.990 al mes | cuántas personas lo eligen frente a los otros dos |
| $4.990 al mes | ídem |
| $7.990 al mes | ídem |

No hay pasarela de pago, ni cobro, ni suscripción. Elegir un precio solo guarda una respuesta agregada.

## Qué incluiría la versión con IA

Es una idea para medir, no un compromiso. La puerta "Sole con IA" pregunta si a la persona le serviría:

- Hablarle a Sole y que ordene la bitácora y los recordatorios.
- Ideas de comidas o actividades según la rutina de cuidado.

Lo que **no** incluiría, venga o no con IA: diagnósticos, interpretaciones de salud ni consejos médicos. Cualquier función con IA tendría que revisarse antes contra `docs/legal/eipd.md` y el registro de actividades. `[VERIFICAR]` qué proveedor y qué datos saldrían de Sole: hoy no está decidido.

## Cómo leer los datos de H4

H4 es la hipótesis de **disposición a pagar**. Los eventos que la alimentan son `fake_door.viewed`, `fake_door.interest` y `premium.used` (catálogo en `docs/eventos.md`). Solo existen para personas que dieron su consentimiento de investigación.

- `fake_door.viewed`: cuántas personas vieron cada puerta. Es el denominador.
- `fake_door.interest`: cuántas dijeron "Sí, avísame" o eligieron un precio. Interés dividido por vistas da una tasa; con pocas personas es una pista, no una conclusión.
- `premium.used` con `feature = "informe_medico"`: cuántas veces se abrió el informe. Se cuenta al abrir la página, así que una misma persona puede sumar varias veces; mira personas distintas, no solo el total.
- Pedir una opción no es pagarla: el interés declarado casi siempre es mayor que lo que alguien pagaría.
- Los números son del piloto (pocas organizaciones y personas): no se proyectan al país. Cualquier cifra que se cite debe decir cuántas personas hay detrás.
