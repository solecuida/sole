# Evaluación de impacto en privacidad (simplificada)

Evaluación hecha por el fundador, responsable de los datos (`hola@solecuida.com`), antes del piloto. Es simplificada: ordena los riesgos para las personas, no para la empresa, y dice qué medida los reduce. Si la Ley 21.719 exige un formato o un umbral para este tipo de evaluación, eso es `[VERIFICAR]` en https://www.bcn.cl/leychile y se completa antes del lanzamiento.

## Qué se trata y por qué importa

- **Quiénes.** Personas que cuidan a un familiar en Chile y, en menor medida, la persona cuidada y sus familiares dentro del círculo.
- **Qué datos.** Rutina de cuidado, notas de la bitácora, nombre e indicación de medicamentos, ánimo y sueño. Son datos de salud y de una persona que depende de otra: sensibles. Sole no pide diagnósticos, dosis, escalas ni alergias, y no da consejo médico.
- **Por qué hay riesgo.** Quien cuida suele estar cansada y vulnerable; la persona cuidada no siempre puede opinar sobre sus propios datos; una filtración o un mal uso afectaría a ambas.
- **Qué la hace más segura.** Pocos datos, cifrado de los campos más sensibles, nada que el navegador pueda pedir directo a la base, consentimiento por capas, y una investigación opcional con seudónimo.

El inventario completo está en `docs/legal/registro-actividades.md`; las amenazas técnicas, en `docs/seguridad/modelo-amenazas.md`.

## Riesgos y medidas

Probabilidad e impacto en tres niveles: baja, media, alta. Es el criterio del fundador, no un cálculo; se revisa con cada fase.

| Riesgo | Probabilidad | Impacto | Medida |
|---|---|---|---|
| Otra cuidadora o un familiar ve datos de un círculo al que no pertenece | Baja | Alta | RLS en todas las tablas y pruebas de aislamiento por rol (`app/tests/db/rls-circles.test.ts`, `app/supabase/tests/database.test.sql`) |
| Fuga de la base de datos con las notas y los medicamentos | Baja | Alta | Cifrado AES-256-GCM de esos campos, con la clave solo en el servidor (`app/src/lib/crypto/field.ts`, `app/tests/unit/field-crypto.test.ts`); sin diagnósticos ni dosis |
| Un secreto llega al navegador, a Git o a un log | Baja | Alta | Revisión del build, gitleaks en CI y en pre-commit, sin variables públicas salvo tres (`app/scripts/check-bundle-secrets.ts`, `.gitleaks.toml`) |
| Datos personales llegan a Sentry o a los eventos de investigación | Media | Media | Filtro antes de Sentry y catálogo cerrado de eventos, sin texto libre (`app/src/lib/observability/scrub.ts`, `app/src/server/events/catalog.ts`) |
| Reidentificar a una persona por sus eventos con seudónimo | Baja | Media | Solo con consentimiento de la capa 3, revocable; seudónimo independiente del id; la persona no puede ver ni alterar eventos de otra (`app/src/server/events/track.ts`, `app/tests/db/events.test.ts`) |
| Un aviso en la pantalla bloqueada revela un medicamento | Media | Alta | El aviso no lleva nombre ni indicación (`app/tests/db/dispatch.test.ts`) |
| Se comparte un informe fuera de Sole sin pensarlo | Media | Media | Se avisa en el momento de compartir, que sale bajo responsabilidad de quien lo comparte (F7 del brief); pendiente confirmar el texto del aviso con una lectura legal |
| La cuidadora carga datos de otra persona sin autorización | Media | Media | Declaración de autorización o de actuar en su interés, en lenguaje simple, en la pantalla de consentimientos (`app/src/app/(onboarding)/bienvenida/consentimientos/page.tsx`); pendiente lectura legal |
| La persona no puede borrar o llevarse sus datos con facilidad | Baja | Alta | Borrado desde "Mi cuenta" con 7 días de gracia y exportación de todos sus datos (`app/src/server/account/lifecycle.ts`, `app/src/server/account/export.ts`); pendiente el trabajo diario que ejecuta la purga |
| Los datos quedan guardados más tiempo del prometido | Media | Media | Regla de 12 meses de inactividad con aviso previo; hoy no hay trabajo que la ejecute, y se anota como pendiente (`docs/legal/registro-actividades.md`) |
| Menores: la persona cuidada es menor y alguien más decide por ella | Baja | Alta | Los datos los ingresa madre, padre o tutor, y así se declara en la pantalla de consentimientos (`app/src/app/(onboarding)/bienvenida/consentimientos/page.tsx`); las usuarias deben ser mayores de 18 años (brief 6.4), y ese texto aún no se comprobó |
| El administrador lee datos de cuidado | Baja | Alta | El panel no puede leer círculos, bitácoras ni bienestar; segundo factor obligatorio; auditoría de cada acceso (`app/tests/db/admin-access.test.ts`, `app/src/server/admin/guard.ts`) |
| Un proveedor extranjero accede a los datos o los pierde | Media | Media | Pocos proveedores, con planes revisados y los campos sensibles cifrados antes de llegar a la base; los países y las garantías son `[VERIFICAR]` (`docs/legal/registro-actividades.md`) |
| Pérdida de datos sin respaldo propio | Media | Alta | Lista de lanzamiento: respaldo nocturno cifrado y simulacro de restauración (punto 28 de `docs/seguridad/checklist-6.2.md`) |
| Mensajes o avisos que presionan o culpan a quien cuida | Media | Media | Sin patrones oscuros: ningún consentimiento marcado por defecto, avisos sin culpa, puertas falsas honestas (brief 6.4, punto 7) |
| Respuesta tardía o confusa ante un incidente | Media | Alta | Plan de respuesta con un responsable único (`docs/seguridad/plan-incidentes.md`); falta un simulacro |
| Un robot o un abuso agota el servicio gratuito | Media | Baja | Límites de frecuencia y límites de los planes vigilados en el panel (`app/src/server/security/rate-limit.ts`, `docs/limites.md`) |

## Conclusión

El riesgo residual es aceptable para un piloto cerrado con pocas personas, **siempre que antes del lanzamiento queden cerrados**: el trabajo diario de borrado e inactividad, el respaldo cifrado, los países y las garantías de los proveedores, la lectura legal de los consentimientos y el simulacro del plan de incidentes. Mientras alguno siga abierto, el piloto no se abre a personas fuera del círculo del fundador.

Se revisa esta evaluación al construir el enlace de la persona cuidada y el botón de emergencia, y ante cualquier incidente.
