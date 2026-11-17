# Encargos · pasos 50 a 65

Cómo repartir lo que queda de las fases 5, 6 y 7 entre el modelo principal (el orquestador) y subagentes con un modelo más liviano. Escrito el 2026-11-16, con lo aprendido en los pasos 1 a 49.

Este documento no reemplaza al plano: cada paso se construye **exactamente** como lo describe su bloque en `epics/`. Aquí solo está quién lo hace, en qué orden y qué trampas ya conocemos.

## Cómo se trabaja

1. El orquestador lanza los subagentes de una tanda, cada uno con el **texto base** de abajo más las notas de su paso.
2. El subagente escribe sus archivos y corre solo sus propias pruebas unitarias o de base. No hace commits.
3. El orquestador revisa, corre `lint`, `typecheck`, `test`, el build y las pruebas de navegador, corrige lo que falle y hace **un commit por paso** con su etiqueta `step-NN`.
4. Al cerrar cada fase del brief: resumen al fundador, `DECISIONES.md` y `PENDIENTES.md` al día, y se detiene a esperar su visto bueno.

Dos subagentes nunca tocan el mismo archivo en la misma tanda. Cuando un paso edita un archivo compartido (`today.ts`, `rate-limit.ts`, `.env.example`, `web-site.test.ts`), lo hace el orquestador o va en tandas distintas.

## Texto base para todo subagente

> Trabajas en el repo `D:\proyectos\sole\.claude\worktrees\mejorar-pagina-web-9818ae` (app Next.js 16 en `app/`; sitio estático en `web/`). Sole es una app gratuita para personas que cuidan a un familiar en Chile. Todo texto para personas, comentario y nombre de prueba va en español de Chile.
>
> Lee `CLAUDE.md`, las reglas de `.claude/rules/` que apliquen a tu área y el bloque de tu tarea en `blueprints/sole-prototipo/epics/<archivo>.md`. Construye exactamente lo que pide ese bloque y cumple cada criterio de aceptación. Si algo del plano no calza con el código real, no improvises: descríbelo en tu informe.
>
> En Git Bash, antes de `pnpm`: `export PATH="$HOME/.local:$HOME/.local/bin:$PATH"`.
>
> **Prohibido:** commits, `git add`, tocar `tasks.json`, leer o imprimir `.env`, `.env.local` o `.env.test.local`, correr e2e, `pnpm build`, `db:reset`, `supabase db push`, `vercel`, enviar correos o mensajes a cualquier persona u organización, y modificar archivos fuera de tu lista.
>
> **Obligatorio antes de terminar:** `pnpm -C app exec biome check --write <tus archivos>` sin errores; tus pruebas de Vitest pasando; `pnpm -C app exec tsc --noEmit` sin errores en tus archivos.
>
> **Reglas que ya nos mordieron:**
> - El navegador nunca habla con Supabase. Las páginas son componentes de servidor que leen por `src/server/**` con el cliente de la sesión. `src/components/**` no importa `src/server/**`.
> - Una página de servidor no puede importar constantes desde un archivo `"use client"`: las constantes compartidas van en `src/lib/**`.
> - El cliente de servicio (`createSupabaseAdminClient`) solo se usa después de comprobar un secreto, un token o la pertenencia al círculo, y siempre filtrando por ese círculo.
> - `src/server/**` recibe `now` por parámetro (nunca `new Date()` adentro) y devuelve `Result` de `@/lib/result`.
> - Las consultas con muchas filas se leen por tandas (1.000 filas por página, listas `.in()` de 100 ids).
> - Las pruebas de `tests/db/` corren sobre una base local compartida: usa datos propios con marcas únicas y nunca fechas futuras que afecten a otras cuentas.
> - Sin `any`, sin `console.log`, sin `dangerouslySetInnerHTML`, sin variables `NEXT_PUBLIC_` nuevas.
> - Los botones y campos miden al menos 48 px; los enlaces dentro de un texto van subrayados; una zona con desplazamiento horizontal lleva `tabIndex={0}` y nombre accesible.
> - Nada de consejo médico ni interpretaciones de salud. La tía Sole está viva: nunca «en memoria».
> - Lo que dependa de una ley o de un proveedor y no puedas confirmar va marcado `[VERIFICAR]`.
>
> Termina con un informe corto: archivos, resultado de tus pruebas, decisiones que tomaste y qué **no** verificaste.

Si el subagente escribe pruebas de navegador (sin ejecutarlas), agrega:

> - Usa las fixtures de `app/tests/e2e/fixtures.ts` y copia selectores de specs que ya pasan.
> - Tras `login(...)`, la primera navegación va dentro de `expect(async () => { await page.goto(url).catch(() => undefined); await expect(page).toHaveURL(...) }).toPass({ timeout: 20_000 })`: en WebKit la redirección del ingreso interrumpe el `goto`.
> - Next agrega su propio `role="alert"`: usa `p[role="alert"]`. Para nombres parecidos («Guardar» y «Volver sin guardar»; «Hoy» también está en la barra inferior) usa `exact: true` o acota a una región.
> - `getByText` no distingue mayúsculas: busca frases completas.
> - Si una espera de URL puede coincidir con la actual, usa `expect.poll` sobre la base.
> - En WebKit, Tab no se detiene en enlaces y un campo de hora se escribe como texto (`08:00`).

## Fase 5 · Despliegue (pasos 50 a 53)

Epic `07-despliegue.md`. El paso 49 ya está hecho. Ninguno de estos pasos necesita claves: las claves van al final, en la lista de lanzamiento, y las pega el fundador en Vercel.

| Paso | Tarea | Quién | Notas |
|---|---|---|---|
| 50 | `E7-T2` Vercel y salud con base | Liviano | `/api/health` ya existe y lo usan `smoke.spec.ts` y el CI: mantener `data.status: "ok"`. El chequeo de base debe cortar a los 3 s. La portada `/` es la única página indexable. |
| 51 | `E7-T3` Respaldos, keep-alive, escaneos | Liviano | Mismas versiones mayores de acciones que `ci.yml`. Permisos mínimos por job (lección del `gitleaks`: un job que lee el pull request necesita `pull-requests: read`). Nunca subir un `.sql` sin cifrar. |
| 52 | `E7-T4` Manual del fundador y rotación de clave | **Principal** el script; liviano el manual | `rotate-field-key.ts` reescribe datos cifrados: debe ser repetible (si se corta a la mitad, se puede volver a correr), tener `--dry-run` y no perder un valor si falla el descifrado. El manual es para una persona que no programa: comandos copiables, uno por línea. |
| 53 | `E7-T5` Variables y lista de lanzamiento | Liviano | `docs/lanzamiento.md` debe recoger todo lo que hoy dice «Lista de lanzamiento:» en `docs/seguridad/` y lo pendiente de `PENDIENTES.md`. |

**Tanda A (en paralelo):** 50 y 51. **Tanda B:** 52 (script: principal; manual: liviano). **Tanda C:** 53, al final, porque lee lo que dejaron los demás.

Cierre de fase: el orquestador corre todo, y el fundador sigue `docs/lanzamiento.md` con sus cuentas. Desplegar (`vercel`, `supabase db push`) lo hace el fundador; el orquestador lo guía paso a paso.

## Fase 6 · Ampliación (pasos 54 a 59)

Epic `08-ampliacion.md`.

| Paso | Tarea | Quién | Notas |
|---|---|---|---|
| 54 | `E8-T1` Tareas sin fecha (F5) | Liviano; `today.ts` lo edita el **principal** | `getToday` es el corazón de «Hoy» y tiene muchas pruebas: el cambio es mínimo y lo hace el orquestador. |
| 55 | `E8-T2` Contactos y emergencia (F9) | Liviano | `notes_enc` se cifra con contexto `"contacts.notes"` (ya lo usa la exportación de datos). Sin campos de alergias, diagnósticos ni previsión. |
| 56 | `E8-T3` Vínculo de la persona cuidada (F12) | **Principal** | Acceso sin contraseña a datos de cuidado. Ver «Diseño del vínculo» abajo. |
| 57 | `E8-T4` Emergencias (F12) | **Principal** | Límite de frecuencia `emergency` por vínculo; el aviso nunca promete llegar; el número de respaldo 131 sigue `[VERIFICAR]`. |
| 58 | `E8-T5` Vista grande de la persona cuidada (F12) | Liviano la interfaz; **principal** revisa | Página pública sin sesión: `noindex`, nada del círculo que no sea visible para la persona cuidada, y la frase fija de que Sole no reemplaza a un servicio de emergencia. Debe pasar la CSP (sin scripts en línea). |
| 59 | `E8-T6` Informe para el médico (F14) | Liviano | Reutiliza las frases y la lista de palabras prohibidas de `summary.ts`. Sin datos de bienestar de la cuidadora. |

**Tanda A (en paralelo):** 54, 55 y 59. **Tanda B (principal, en orden):** 56 → 57. **Tanda C:** 58.

### Diseño del vínculo de la persona cuidada (pasos 56 a 58)

Lo que el orquestador debe garantizar y probar, más allá de lo que lista el plano:

- **El token no se guarda.** En la base queda solo su `sha256`; el enlace completo se muestra una sola vez. La búsqueda es por el hash exacto (sin comparar texto en la app).
- **Todo cuelga del círculo del token.** Cada función recibe el vínculo ya resuelto y filtra por su `circleId`; una ocurrencia de otro círculo, o de un recordatorio con `visible_to_cared = false`, responde 404 (igual que un token inválido: no se revela qué existe).
- **Lo mínimo a la vista.** La vista muestra título y hora; nunca el nombre ni la indicación de un medicamento, la bitácora, las tareas ni los contactos, salvo el teléfono de emergencia al pedir ayuda.
- **Revocar corta de inmediato**, y un vínculo vencido (90 días) responde igual que uno inexistente.
- **Límites de frecuencia** `cared_done` y `emergency` conectados (hoy están definidos y sin uso) y probados.
- **El token no se filtra.** `Referrer-Policy` ya es estricta; la página no enlaza a sitios externos; el filtro de Sentry debe borrar el token de las URLs `/v/<token>` y `/api/v/<token>/…` (agregar el caso a `scrub.ts` y a su prueba).
- **El proxy** debe dejar pasar `/v/` y `/api/v/` sin sesión (`route-rules.ts`), y nada más.
- Al terminar, actualizar el punto 9 de `docs/seguridad/checklist-6.2.md` y la fila del enlace en `asvs-checklist.md` y `modelo-amenazas.md`, que hoy dicen «Lista de lanzamiento» o «Pendiente».

## Fase 7 · Fuera de la app (pasos 60 a 65)

Epic `09-fuera-de-la-app.md`. El sitio `web/` es estático, sin build, con diseño de carta: leer `web/README.md` antes de tocar nada.

| Paso | Tarea | Quién | Notas |
|---|---|---|---|
| 60 | `E9-T1` Web: CTA fija, compartir, favicon, pruebas | Liviano | La CTA fija no puede tapar el elemento enfocado (misma lección que la barra inferior de la app). |
| 61 | `E9-T2` Privacidad, términos, cookies, `llms.txt` | Liviano; **el fundador lee** | Deben decir lo mismo que `docs/legal/registro-actividades.md`. Nada de plazos o artículos de ley de memoria: `[VERIFICAR]`. |
| 62 | `E9-T3` Relato de la web y «Cómo probar Sole» | Liviano; **principal revisa la voz** | Usar la dirección editorial del sitio (una carta firmada, no una landing). Sin logos ni nombres de organizaciones sin permiso escrito. |
| 63 | `E9-T4` Formulario de la web con Turnstile vía la app | **Principal** | Única ruta que acepta otro origen: lista explícita de orígenes, sin comodín; conectar el límite `web_contact`; escribe en otro proyecto de Supabase con su propia clave secreta, que nunca llega al navegador. |
| 64 | `E9-T5` Plantillas de correo para organizaciones | Liviano | Los correos los envía el fundador, nunca un agente. Sin promesas de salud ni cifras inventadas. |
| 65 | `E9-T6` Lista de organizaciones y kit de piloto | Liviano con búsqueda web | Solo datos públicos e institucionales, cada uno con su fuente y fecha; lo no comprobado va `[VERIFICAR]`. Nunca correos personales. No se contacta a nadie. |

**Tanda A:** 60. **Tanda B (en paralelo):** 61, 64. **Tanda C (en paralelo):** 62, 65. **Tanda D (principal):** 63.

`web-site.test.ts` lo crea el paso 60 y lo amplía el 62: por eso van en tandas distintas.

## Lo que hace solo el fundador

- Crear las cuentas (Supabase de producción, Vercel, Resend, Sentry, Cloudflare Turnstile) y pegar las claves en Vercel → Project → Settings → Environment Variables. Ninguna clave va al repositorio ni a una conversación.
- Asignarse el rol de administración con SQL y configurar su segundo paso.
- Verificar los recursos de Chile en `/admin/contenido`.
- Leer los textos legales y los de la web antes de publicarlos.
- Enviar cualquier correo a una organización.
- Unir cada pull request cuando sus pruebas estén en verde.
