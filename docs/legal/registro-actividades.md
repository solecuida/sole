# Registro de actividades de tratamiento

Qué datos trata Sole, para qué, con qué base, quién los recibe y por cuánto tiempo. Es un documento de trabajo para el fundador; no reemplaza la lectura de alguien con formación legal antes del lanzamiento.

**Responsable de los datos:** el fundador (persona natural), contacto `hola@solecuida.com`. Sin delegado de protección de datos.

**Base normativa.** La Ley 19.628 rige hoy; la Ley 21.719 la reemplaza y su entrada en vigencia, sus plazos y los nombres exactos de las bases de licitud son `[VERIFICAR]` en https://www.bcn.cl/leychile. El brief pide diseñar como si la Ley 21.719 ya rigiera. En este registro, "base de licitud" nombra la razón en palabras simples; su encaje con los términos de la ley está por confirmar.

**Estado.** Lo que ya está construido se describe con su ruta de código. Lo que todavía no existe va marcado como "Pendiente" y no debe leerse como un tratamiento vigente.

## Tratamientos

| Tratamiento | Finalidad | Base de licitud | Categorías de datos | Destinatarios | Transferencia internacional | Plazo de conservación |
|---|---|---|---|---|---|---|
| Cuenta e ingreso | Crear la cuenta y dejar entrar a la persona | Consentimiento de la capa 1 (términos y uso básico) `[VERIFICAR base]` | Correo, contraseña (solo su hash en Supabase Auth), zona horaria, nombre para mostrar, fecha de última actividad | Supabase, Vercel, Resend (envío del enlace de ingreso), Cloudflare (captcha) | Sí: país de cada proveedor `[VERIFICAR]` | Hasta pedir el borrado, con 7 días de gracia; 12 meses de inactividad con aviso previo (Pendiente) |
| Círculo de cuidado, recordatorios, tareas y calendario ("Hoy") | Organizar el cuidado diario | Consentimiento de la capa 1 | Nombre y relación de la persona cuidada, tipo de cuidado, recordatorios, tareas, cumplimiento | Supabase, Vercel | Sí `[VERIFICAR]` | Igual que la cuenta; si el círculo se cierra, se conserva para leer y descargar hasta el borrado |
| Bitácora y medicamentos | Registrar cómo fue el día y recordar medicamentos | Consentimiento de la capa 2 (datos sensibles de rutina, ánimo y medicamentos) | Notas de la bitácora (cifradas), ánimo, sueño, alimentación, nombre e indicación de medicamentos (cifrados). Datos de salud: sensibles. | Supabase, Vercel | Sí `[VERIFICAR]` | Igual que la cuenta |
| Contactos importantes | Tener a mano a quién llamar | Consentimiento de la capa 2 | Nombre, tipo, teléfono, notas (cifradas), si es de emergencia | Supabase, Vercel | Sí `[VERIFICAR]` | Igual que la cuenta. Pendiente: la pantalla que los guarda. |
| Cuidado de quien cuida | Que la cuidadora registre cómo está | Consentimiento de la capa 2 | Respuestas de bienestar de la cuidadora; solo ella las ve | Supabase, Vercel | Sí `[VERIFICAR]` | Igual que la cuenta |
| Avisos al teléfono (push) | Enviar recordatorios | Consentimiento: la persona activa los avisos | Dirección técnica de entrega del navegador y claves de la suscripción | Supabase, Vercel y el servicio de avisos del navegador de cada persona (no se eligen) | Sí `[VERIFICAR]` | Hasta que la persona los desactive o el navegador la dé de baja; hasta borrar la cuenta |
| Consentimientos | Dejar constancia de qué se aceptó y cuándo | Obligación de demostrar el consentimiento `[VERIFICAR base]` | Capa, si se concedió, versión del texto, fecha | Supabase, Vercel | Sí `[VERIFICAR]` | Se agregan filas, nunca se editan; se borran con la cuenta |
| Investigación con seudónimo | Medir si el piloto funciona (eventos de uso) | Consentimiento de la capa 3, opcional y revocable | Eventos de un catálogo cerrado, seudónimo y código de organización; sin texto libre, sin id ni correo | Supabase, Vercel | Sí `[VERIFICAR]` | Hasta que la persona pida el borrado (se eliminan por su seudónimo). Plazo propio de la investigación: Pendiente. |
| Comentarios, encuestas y puertas falsas | Escuchar a las usuarias | Consentimiento de la capa 1 | Texto del comentario, respuestas, interés en funciones | Supabase, Vercel | Sí `[VERIFICAR]` | Hasta borrar la cuenta; plazo propio: Pendiente |
| Seguridad y límites de frecuencia | Frenar abusos | Interés legítimo de proteger el servicio `[VERIFICAR base]` | Huella (HMAC) del correo o de la IP; nunca el valor en claro | Supabase, Vercel | Sí `[VERIFICAR]` | Contadores temporales; la función `cleanup_rate_limits` existe, pero quien la ejecuta es el trabajo diario, que todavía no existe (Pendiente) |
| Errores técnicos | Detectar y arreglar fallas | Interés legítimo `[VERIFICAR base]` | Trazas de error con datos personales filtrados; seudónimo si existe | Sentry, Vercel | Sí `[VERIFICAR]` | Retención del plan de Sentry `[VERIFICAR]` |
| Panel de administración y auditoría | Administrar contenido, medir el piloto y dejar constancia de los accesos del fundador | Interés legítimo y obligación de seguridad `[VERIFICAR base]` | Métricas agregadas, eventos con seudónimo, registro de accesos del administrador (acción y ruta, sin datos de usuarias) | Supabase, Vercel | Sí `[VERIFICAR]` | Registro de auditoría: plazo por definir (Pendiente) |
| Correo `hola@solecuida.com` | Atender mensajes de personas y organizaciones | Consentimiento de quien escribe | Dirección y contenido de los correos | Zoho (solo este correo; nunca recibe datos de la app) | Sí `[VERIFICAR]` | Mientras dure la conversación; borrado a pedido |
| Formulario de contacto del sitio web | Coordinar conversaciones con personas interesadas | Consentimiento de quien escribe | Nombre, correo, mensaje; ver `web/privacidad.html` | Supabase (proyecto aparte del sitio), Cloudflare (captcha) | Sí `[VERIFICAR]` | La política del sitio dice mientras dure la etapa y hasta un año después; Pendiente: confirmar contra este registro |
| Respaldos | Poder recuperar la base | Interés legítimo de continuidad `[VERIFICAR base]` | Copia cifrada de la base | Por definir (almacenamiento del flujo de respaldo) | Por definir `[VERIFICAR]` | Retención corta. Pendiente: aún no existe el respaldo propio. |

## Destinatarios y encargados

Quién recibe datos, qué recibe y qué falta confirmar. El país de alojamiento de cada proveedor, y por tanto la transferencia internacional, `[VERIFICAR]` en la fuente oficial de cada uno antes de publicar la política de privacidad (brief 6.4, punto 5).

| Proveedor | Qué recibe | Transferencia internacional |
|---|---|---|
| Supabase | La base de datos completa de la app (los campos sensibles ya van cifrados) y la autenticación | Sí; región del proyecto de producción `[VERIFICAR]` |
| Vercel | Todo lo que pasa por el servidor de la app, en tránsito | Sí; región de las funciones `[VERIFICAR]` |
| Sentry | Errores técnicos con datos personales filtrados | Sí; región del plan `[VERIFICAR]` |
| Resend | Correo del destinatario y contenido del mensaje de ingreso o aviso | Sí `[VERIFICAR]` |
| Cloudflare | Señales del navegador para el captcha (Turnstile) | Sí `[VERIFICAR]` |
| Zoho | Solo el correo `hola@solecuida.com` | Sí `[VERIFICAR]` |

## Plazos de conservación

- **Borrado a pedido:** la persona lo pide desde "Mi cuenta"; la cuenta se desactiva al instante y los datos se eliminan a los 7 días, junto con los círculos que creó y los eventos de su seudónimo (`app/src/server/account/lifecycle.ts`, función `purge_user` en `app/supabase/migrations/20261114000200_cuidado.sql`, pruebas en `app/tests/db/account-lifecycle.test.ts`).
- **Inactividad:** 12 meses sin entrar, con aviso previo. Se registra la última actividad (`app/src/server/auth/session.ts`) y existe la columna del aviso; el trabajo diario que borra y avisa **todavía no existe**, así que hoy no se ejecuta (Pendiente, paso 49 del plano).
- **Exportación:** la persona puede descargar todos sus datos en cualquier momento (`app/src/server/account/export.ts`, `app/tests/db/account-export.test.ts`).
- **Respaldos:** una vez que existan, no deben conservar por más tiempo los datos de quien pidió borrarse; el plazo se fija antes del lanzamiento.

## Pendiente antes del lanzamiento

1. Confirmar con fuente oficial los países y las garantías de cada proveedor y completar la columna de transferencia.
2. Confirmar el encaje de cada base de licitud con la Ley 21.719.
3. Fijar los plazos de conservación que hoy dicen "Pendiente" (investigación, comentarios, auditoría, respaldos).
4. Que `web/privacidad.html` y la política de la app digan lo mismo que este registro.
5. Lectura por alguien con formación legal.
