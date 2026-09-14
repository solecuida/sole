# Correo del proyecto — Configuración de Zoho Mail para solecuida.com

> **ESTADO: OPERATIVO** — verificado el 14-09-2026 leyendo las cabeceras de un correo real.
>
> `hola@solecuida.com` recibe desde fuera y responde correctamente. La autenticación pasa
> los tres controles en Gmail:
>
> ```
> dkim=pass   header.i=@solecuida.com  header.s=zmail2   (RSA 2048)
> spf=pass    smtp.mailfrom=hola@solecuida.com
> dmarc=pass  header.from=solecuida.com  (p=NONE)
> ```
>
> Pendientes abiertos al cierre de este documento: ver §10.

**Punto de partida (10-09-2026):** el dominio resolvía a Vercel (`A` → 64.29.17.65 /
216.198.79.1), nameservers `ns1/ns2.vercel-dns.com`, y **sin ningún registro MX ni TXT** —
cualquier correo a `hola@solecuida.com` rebotaba. Todo lo que sigue se montó desde cero.

---

## 0. Decisiones tomadas

| Decisión | Elección | Motivo |
|---|---|---|
| Proveedor | Zoho Mail, plan **Forever Free** | 5 usuarios, 5 GB c/u, 1 dominio, 0 USD. Suficiente para una persona en fase de validación |
| Centro de datos | **EE.UU. (`zoho.com`)** | Chile se sirve desde el DC americano. **No usar `zoho.eu`** |
| Usuarios reales | **1** — `jose@solecuida.com` | Solo José por ahora |
| Dirección pública | **`hola@solecuida.com` como GRUPO**, no como alias | Ver §1 |
| Informes DMARC | `dmarc@solecuida.com` como **alias** de `jose@` | Solo recibe informes automáticos |
| IMAP/POP | **No disponible en el plan gratuito** | Se lee por webmail (`mail.zoho.com`) y la app móvil de Zoho Mail. Si algún día hace falta Outlook/Apple Mail → Mail Lite (~1 USD/usuario/mes) |
| Catch-all | **Desactivado** | Imán de spam |
| Correo transaccional de la app | **Fuera de Zoho**, en subdominio propio | Ver §6 |

### Direcciones que NO se crean todavía

`soporte@`, `prensa@`, `info@`, `contacto@`, `ventas@`. Una dirección publicada que nadie
atiende es una promesa rota. Se crean el día que exista la persona que responde; crearlas
después no cuesta nada ni requiere tocar el DNS.

---

## 1. Por qué `hola@` es un grupo y no un alias

Las dos opciones son gratuitas y ambas hacen que el correo llegue a la bandeja de José.
La diferencia está en el día después:

- **Alias:** `hola@` es literalmente otro nombre del buzón de José. Cuando entre una
  segunda persona al proyecto, hay que desmontarlo y migrar el histórico.
- **Grupo:** `hola@` es una entidad propia con miembros. Hoy tiene un miembro (José).
  Mañana se añade a alguien y **no hay que migrar nada** — pasa a ver el buzón compartido
  desde ese momento. Además el histórico del grupo queda asociado al proyecto, no a la
  cuenta personal de una persona que algún día podría irse.

Coste de elegir bien hoy: cero. Coste de corregirlo en un año: una migración de correo.

---

## 2. Crear la cuenta (Zoho)

1. Ir a `zoho.com/mail/zohomail-pricing.html` y bajar hasta el bloque **"Forever Free Plan"**.
   No está entre los planes destacados; hay que desplazarse. Pulsar **Sign Up Now**.
2. Elegir la opción **"Sign up with a domain I already own"** e introducir `solecuida.com`.
3. **Al crear la cuenta se elige la región del centro de datos. Seleccionar Estados Unidos.**
   No se puede cambiar después sin rehacer la cuenta entera, y los registros MX de cada
   región son distintos e incompatibles.
4. Crear el superadministrador como **`jose@solecuida.com`**. Este es el usuario real y el
   único que consume licencia.

---

## 3. Verificar el dominio

Zoho mostrará un registro de verificación (un TXT en la raíz del tipo `zoho-verification=...`,
o un CNAME `zb…`). El valor es único por cuenta: **copiarlo del panel, no de esta guía.**

Se añade en Vercel: *Dashboard → Domains → solecuida.com → DNS Records → Add*.

Propagación típica: minutos. Vercel usa TTL de 600 s.

---

## 4. Registros DNS en Vercel

Todos se añaden en *Vercel → Domains → solecuida.com → DNS Records*. El campo "Name" vacío
o `@` significa la raíz del dominio.

### 4.1 MX — recepción de correo

| Name | Type | Value | Priority |
|---|---|---|---|
| *(vacío)* | MX | `mx.zoho.com` | 10 |
| *(vacío)* | MX | `mx2.zoho.com` | 20 |
| *(vacío)* | MX | `mx3.zoho.com` | 50 |

> Estos son los valores del DC de EE.UU. **Contrastarlos siempre con los que muestre el
> panel de Zoho** en *Admin Console → Domains → solecuida.com → Email Configuration*.

No debe quedar ningún otro registro MX en la raíz.

### 4.2 SPF — quién puede enviar en nombre del dominio

| Name | Type | Value |
|---|---|---|
| *(vacío)* | TXT | `v=spf1 include:zohomail.com ~all` |

**Solo puede existir UN registro SPF en el dominio.** Si mañana se añade otro proveedor de
envío, no se crea un segundo TXT: se añade su `include:` dentro de este mismo.

### 4.3 DKIM — firma criptográfica de los envíos

Se genera en *Zoho Admin Console → Domains → solecuida.com → Email Configuration → DKIM →
Add*. Zoho pide un **selector** (Zoho usa `zmail` por defecto) y devuelve una clave pública larga.

| Name | Type | Value |
|---|---|---|
| `zmail._domainkey` | TXT | `v=DKIM1; k=rsa; p=…` *(la clave que genera Zoho)* |

Después de añadirlo en Vercel, volver al panel de Zoho y pulsar **Verify**. Hasta que Zoho
no lo marque como verificado, no está firmando.

### 4.4 DMARC — política y visibilidad

| Name | Type | Value |
|---|---|---|
| `_dmarc` | TXT | `v=DMARC1; p=none; rua=mailto:dmarc@solecuida.com; fo=1` |

**Escalado previsto** (no saltárselo: romper el correo propio es fácil):

1. `p=none` durante 2–3 semanas → llegan informes sin bloquear nada.
2. Si los informes salen limpios → `p=quarantine`.
3. Tras otras 2–3 semanas limpias → `p=reject`.

### Por qué SPF + DKIM + DMARC no son opcionales aquí

Un dominio recién creado que empieza a escribir en frío a corporaciones e instituciones de
salud (Corporación Alzheimer Chile, COPRAD, GAFA, municipios) sin autenticación aterriza en
spam con altísima probabilidad. El primer correo del proyecto es justo el que no puede
perderse.

---

## 5. Crear el grupo y el alias

### 5.1 Grupo `hola@solecuida.com`

*Admin Console → Grupos → Crear grupo nuevo* — grupo creado, **ID 939094580**.

- Nombre: `Sole` (este nombre es el que debería salir como remitente)
- Dirección: `hola@solecuida.com`
- Descripción: `Correo publico del proyecto Sole`
- Miembro: `jose@solecuida.com` (rol Miembro, Activo)
- Streams: deshabilitado

**Dos ajustes que Zoho deja mal por defecto y hay que cambiar a mano:**

1. **`Configuración avanzada → Permisos → ¿Quién puede enviar correos al grupo?`**
   Viene en *"Miembros de la organización"*. **Debe ser "Todos".** Si se deja como viene,
   cualquier persona que escriba desde fuera del dominio recibe un rebote `550 User does
   not exist` — las familias no pueden contactar y nadie se entera. Es el error más común
   de esta configuración.

2. **`Miembros → columna "Enviar utilizando dirección de correo electrónico de grupo"`**
   Viene en *"No permitido"*. **Debe ser "Permitido"**, por miembro. Sin esto José recibe
   en `hola@` pero responde firmando como `jose@`. Zoho pide confirmación al cambiarlo.

Comprobar después en *Zoho Mail → Configuración → Enviar correo como* que bajo
**"Dirección de grupo"** aparece `Sole / hola@solecuida.com` con el campo *Nombre para
mostrar* relleno.

### 5.2 Alias `dmarc@solecuida.com`

*Admin Console → Users → jose@solecuida.com → Mail → Email Address → Add Alias* → `dmarc`.

Recibe los informes agregados XML de los proveedores. No hace falta leerlos a mano: se
pueden pegar en cualquier analizador de DMARC gratuito cuando toque decidir el paso a
`quarantine`.

---

## 6. Correo de la aplicación — separado, y no es negociable

La Fase 2 y la historia **S1-01** contemplan **enlaces mágicos por email** para el registro
y la recuperación de acceso. Ese correo **no debe salir nunca por el SMTP de Zoho**:

- Los límites de envío del plan gratuito son bajos y una tanda de notificaciones los agota.
- Si un proveedor marca esos envíos como spam, **la reputación que se quema es la de
  `solecuida.com`** — y entonces tampoco llegan las cartas a las corporaciones.

**Diseño correcto:** proveedor transaccional (Resend, Amazon SES o Postmark) sobre un
**subdominio dedicado**, `notificaciones.solecuida.com`, con su propio SPF y su propio DKIM.
Las reputaciones quedan aisladas: si una se degrada, la otra sigue en pie.

Esto se monta cuando exista código, no ahora. Queda anotado aquí para que no se decida por
inercia el día que haya prisa.

---

## 7. Privacidad — específico de este proyecto

`hola@` va a recibir, sin pedirlo, **datos de salud de terceros identificados**: una hija
escribirá contando el diagnóstico de su madre con nombre y apellido. Bajo la **Ley 21.719**
(vigente 1-dic-2026) eso es dato sensible desde el primer mensaje.

Reglas prácticas, coherentes con las del `KIT-Validacion-Entrevistas-Chile.md`:

- **No reenviar** esos correos a WhatsApp ni a cuentas personales.
- **No pegar** su contenido con nombres reales en documentos del repositorio.
- Criterio de retención: borrar o anonimizar cuando el correo ya no cumple una función.
- Publicar en la web una línea sobre qué se hace con lo que la gente cuenta.
- Nota de cumplimiento: los datos residen en el DC de Zoho en EE.UU. — es una transferencia
  internacional. Habitual y defendible, pero debe quedar declarado cuando exista la política
  de privacidad formal.

---

## 8. Checklist de verificación — resultado (14-09-2026)

- [x] `nslookup -type=MX solecuida.com 8.8.8.8` → los tres `mx*.zoho.com` (10/20/50)
- [x] `nslookup -type=TXT solecuida.com 8.8.8.8` → SPF presente y **único**
- [x] `nslookup -type=TXT zmail2._domainkey.solecuida.com 8.8.8.8` → clave DKIM de 2048
      presente (410 caracteres, prefijo `p=MIIBIjAN…`)
- [x] `nslookup -type=TXT _dmarc.solecuida.com 8.8.8.8` → política presente
- [x] Zoho marca el dominio **Verificado** (10-09-26) y `zmail2` como **predeterminado**
- [x] Correo desde Gmail externo a `hola@solecuida.com` → **llega** a la bandeja de José
- [x] Respuesta enviada **desde `hola@solecuida.com`** → sale con ese remitente
- [x] Cabeceras del mensaje real recibido en Gmail:
      **`spf=pass` · `dkim=pass` (s=zmail2) · `dmarc=pass`**
- [ ] **El `From:` sale sin nombre para mostrar** — la cabecera dice
      `From: hola@solecuida.com` en vez de `From: Sole <hola@solecuida.com>`. Persiste tras
      cuatro envíos y tras guardar el ajuste. Ver §10.1.
- [ ] Prueba independiente en `mail-tester.com` (opcional)

### Cómo leer las cabeceras sin herramientas

En Gmail: abrir el mensaje → menú **⋮** (arriba a la derecha del mensaje) → **Mostrar
original**. Se abre una pestaña con un recuadro que lista `SPF`, `DKIM` y `DMARC` con su
resultado. Es la única fuente fiable: lo que muestra el panel del proveedor es su
intención, y esto es lo que realmente viajó.

---

## 9. Cuándo dejar de ser gratis

Señales concretas de que toca **Mail Lite (~1 USD/usuario/mes)**:

- Hace falta leer el correo desde Outlook, Apple Mail o Thunderbird → **IMAP/POP** solo
  existe en los planes de pago.
- Se acercan los 5 GB del buzón.
- Entra una segunda persona que necesita su propio buzón (`nombre@solecuida.com`), no solo
  ser miembro del grupo.
- Hacen falta más de 5 usuarios reales.

La migración de gratuito a Lite es un cambio de plan dentro de la misma cuenta: **no se
tocan los registros DNS ni se pierde correo.**

---

## 10. Pendientes

Las dos tareas con fecha tienen **recordatorio automático programado** (agentes en la nube,
una sola ejecución, 09:00 hora de Santiago). Se gestionan en
https://claude.ai/code/routines :

| Fecha | Tarea | Routine |
|---|---|---|
| 21-09-2026 | Eliminar el selector DKIM viejo `zmail` y su TXT (§10.2) | `trig_01KWV1EvY6MsZQKgVaU3fq3W` |
| 27-09-2026 | Revisar informes DMARC y subir a `p=quarantine` (§10.3) | `trig_01NgRZHuWyNSuTBijYuZkiod` |

### 10.1 El nombre del remitente no viaja — CERRADO: se convive con ello

> **Decisión de José (14-09-2026): no se persigue más.** Se asume que el remitente se lea
> como `hola@solecuida.com` a secas. Razón: `hola@` es sobre todo un buzón que *recibe y
> responde* —quien escribe ya sabe a quién escribió— y las cartas en frío a instituciones
> salen de `jose@` firmadas con nombre y apellido, que para abrir puertas funciona mejor
> que un buzón genérico. Si algún día molesta, abajo están las salidas.

El detalle técnico, por si se retoma:

La cabecera sale como `From: hola@solecuida.com`, sin `Sole` delante, así que quien recibe
ve la dirección pelada en vez de la marca. Comprobado en cuatro envíos reales.

Descartado ya:

- El campo *Nombre para mostrar* del grupo en *Enviar correo como* **sí contiene** `Sole`
  (leído directamente del valor del input, no de la pantalla).
- El grupo tiene *Nombre* = `Sole` en *Admin Console → Grupos → General*.
- No es propagación: persiste tras guardar y tras varios envíos separados en el tiempo.

Hay reportes en la comunidad de Zoho del mismo comportamiento **específico de direcciones
de grupo** (en algunos casos el nombre sale recortado, en otros ausente). Apunta a una
peculiaridad del producto, no a un error de esta configuración.

Caminos posibles, de menor a mayor coste:

1. **Probar a fijar `hola@` como remitente por defecto** en *Enviar correo como*. Barato.
2. **Ticket a soporte de Zoho** adjuntando el *Mostrar original* de un envío. Es justo lo
   que piden en los hilos de la comunidad. Gratis, conserva el grupo.
3. **Convertir `hola@` de grupo a alias de `jose@`.** Los alias **sí** arrastran el nombre
   para mostrar de forma fiable (el alias `dmarc@` lo hace). El precio es perder la
   propiedad que motivó elegir grupo (§1): sumar una segunda persona dejaría de ser
   inmediato. **Solo vale la pena si el nombre importa más que ese futuro.**
4. **Convivir con ello.** `hola@solecuida.com` se explica solo.

### 10.2 DKIM de 2048 bits — COMPLETADO (14-09-2026)

La clave original `zmail` era de **1024 bits** (deducible del largo del TXT: 234
caracteres; una de 2048 ronda los 410). El estándar recomienda 2048 y algunos proveedores
empiezan a desconfiar de las cortas.

**Se hizo con el método en paralelo — nunca reemplazar la clave activa in situ.** Si se
regenera el selector que está firmando, Zoho firma con la clave nueva al instante mientras
el DNS aún publica la vieja, y *todos* los envíos fallan DKIM hasta que propague.

Lo que se hizo:

1. Selector **`zmail2` creado con 2048 bits** (`Agregar nuevo selector DKIM` permite elegir
   longitud de clave). `zmail` siguió firmando mientras tanto.
2. TXT `zmail2._domainkey` publicado en Vercel y **Verificado** en Zoho.
3. `zmail2` marcado como **Registro predeterminado**.
4. Confirmado en cabeceras reales: `dkim=pass ... header.s=zmail2`.

**Pendiente único: eliminar el selector `zmail` y su TXT a partir del 21-09-2026.** Se deja
solapado una semana porque los correos ya enviados se validan contra la clave con la que se
firmaron; borrarla antes rompe la verificación de lo que aún esté en tránsito o archivado.

> **Trampa observada:** al copiar el valor del selector nuevo es fácil llevarse el del
> viejo, porque están uno encima del otro en la misma tabla. Se distinguen a simple vista:
> una clave de 1024 empieza por `p=MIGfMA0G…` (234 caracteres) y una de 2048 por
> `p=MIIBIjAN…` (~410). Si no empieza por `MIIBIjAN`, es la equivocada.

### 10.3 Por qué el DMARC sigue en `p=none`

`p=none` no protege: solo **observa e informa**. Lo tentador es saltar a `p=reject` hoy, y
es justo lo que no hay que hacer.

Motivo: `reject` le ordena al mundo **tirar a la basura** todo correo que diga venir de
`solecuida.com` y no pase la autenticación. Hoy existe un único dato — una prueba propia.
No hay evidencia todavía de qué otros sistemas envían legítimamente en nombre del dominio:
un formulario de la web, una futura newsletter, el proveedor transaccional de §6 cuando se
monte. Si alguno queda fuera del SPF, con `reject` sus correos **desaparecen sin rebote y
sin aviso**.

Los informes agregados que llegan a `dmarc@` son precisamente el censo de quién envía.
Dos o tres semanas de `p=none` bastan para tenerlo completo.

El riesgo es concreto: el plan de validación contempla escribir a Corporación Alzheimer
Chile, COPRAD, GAFA y municipios. Endurecer la política sin datos pone en juego
exactamente esos correos.

**Calendario:** revisar los informes hacia el **27-09-2026**; si solo aparece Zoho, subir a
`p=quarantine`. Dos o tres semanas limpias después, `p=reject`. Las fechas no son sagradas
— la condición real es "los informes salen limpios", no el día del calendario.

### 10.4 Sobre el logotipo / foto del remitente

Gmail **no** muestra el logotipo que se suba al grupo en Zoho. Los avatares de remitente en
Gmail vienen de un perfil de Google o de **BIMI**, y BIMI exige dos cosas: DMARC en
`quarantine` o `reject` (ver §10.3, aún no estamos ahí) y un certificado VMC de pago, del
orden de 1.000 USD/año. **Conclusión: no es alcanzable ni recomendable ahora.** Queda como
consecuencia natural del endurecimiento del DMARC, no como objetivo propio.

---

## 11. Nota operativa: Zoho exige reautenticación para borrar

Las acciones destructivas del Admin Console (eliminar un usuario, por ejemplo) pasan por
`DELETE /api/organization/<id>/accounts/reauth` y **requieren volver a introducir la
contraseña**. Si no se satisface ese paso, la petición devuelve **HTTP 400** y el botón se
queda girando indefinidamente **sin ningún mensaje de error**. No es un fallo: es el
comportamiento esperado. Crear y modificar no lo requiere; borrar sí.

---

## Referencias

- Precios y comparativa de planes: https://www.zoho.com/mail/zohomail-pricing.html
- Configuración de entrega y MX: https://www.zoho.com/mail/help/adminconsole/configure-email-delivery.html
- Creación de grupos: https://www.zoho.com/mail/help/adminconsole/creating-groups.html
- Ajustes avanzados de grupo (enviar como grupo): https://www.zoho.com/mail/help/adminconsole/advanced-group-settings.html
