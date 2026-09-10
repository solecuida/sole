# Web de Sole

Sitio estático, sin build ni dependencias. Se despliega tal cual (Vercel con la
raíz apuntando a `web/`). Cuatro páginas:

| Archivo | Para quién | Qué hace |
|---|---|---|
| `index.html` | Cualquiera que llegue por el nombre "Sole" | La carta: quién está detrás, qué se está haciendo y por qué. Termina en dos caminos y en recursos públicos que sí existen hoy |
| `organizaciones.html` | Corporaciones, centros, municipios, profesionales | Qué se pide, qué no se pide nunca, qué se entrega de vuelta |
| `privacidad.html` | Quien duda antes de escribir | Datos, conservación, borrado, Ley 21.719 y los límites de lo que Sole promete |
| `contacto.html` | Cuidadores y organizaciones | Formulario + vías directas |

Además: `404.html`, `robots.txt`, `sitemap.xml` y `assets/portada-social.png`
(la imagen 1200×630 que se ve al compartir el link en WhatsApp o Facebook; se
regenera con el script del scratchpad si cambia el texto de portada).

Diseño: carta editorial. Fraunces (títulos), Newsreader (texto), Courier Prime
(notas de campo y metadatos), Caveat (firma). Todo el sistema visual vive en
`assets/estilo.css`.

**Regla de accesibilidad:** el público son cuidadoras de 45 a 65 años, cansadas,
en celulares de gama media. `--tinta-tenue` (notas, etiquetas, pie) debe mantener
al menos 4.5:1 sobre `--papel` y sobre `--papel-hueco` en ambos temas. Hoy está
en 5.25:1 y 4.86:1. Si alguna vez se aclara ese color, se rompe el mínimo.

---

## 1. Pendientes antes de publicar

Ya resueltos: firma (José Carrillo García), comuna (Renca), fecha (10 de septiembre
de 2026) y el formulario, que está conectado y probado. WhatsApp se quitó del sitio
a propósito.

**Los dos correos y dónde va cada uno:** `hola@solecuida.com` es el general — pie de
página, contacto, borrado de datos, configuración del formulario. `jose@solecuida.com`
va solo en la firma de la carta, donde el tono es personal. Ambos tienen que existir
antes de publicar.

**Cuidado con el texto:** la tía Sole está viva. Nada en el sitio puede sugerir
lo contrario — por eso el sitio dice «en reconocimiento a quien cuida» y no «en
memoria». Quien falleció fue la mamá, Dinora García, «la Nonó».

Queda:

- **Foto**: dejar el retrato en `assets/retrato.jpg` (cuadrado, mínimo 400×400).
  Si el archivo no existe, la imagen simplemente desaparece y la firma se ve bien igual.
- **Bitácora** (`index.html`): los números `[00]`, `[0]`, `[0]` se actualizan a mano
  a medida que avanzan las conversaciones. Es la parte que más credibilidad da: no la dejes congelada.
- **Aviso por correo** de cada contacto nuevo (ver §2), o revisar la tabla a mano.
- **Fecha** de `privacidad.html` y de la bitácora: actualizarlas cuando el contenido cambie.

---

## 2. El formulario (Supabase) — ya conectado

- Proyecto: **sole-web**, ref `pmqcaajimehihxlxgqbx`, región `sa-east-1` (São Paulo), plan gratuito.
- Tabla: `public.contactos`, con RLS activo y una sola política: `anon` puede
  **insertar** y solo si `consentimiento = true`. No hay política de select,
  update ni delete, así que desde el navegador los contactos no se pueden leer,
  editar ni borrar. Los lees desde el panel de Supabase (Table Editor).
- Claves en `assets/config.js`: URL del proyecto y **publishable key**. Esa clave
  está pensada para vivir en el navegador y no da acceso a nada por sí sola — lo
  que protege la tabla es la RLS. **Nunca** pongas ahí la `service_role` key.

Comprobado el 10 de septiembre de 2026: un envío real desde la web se guarda; leer
la tabla con la publishable key devuelve `[]`; insertar sin consentimiento devuelve
401; un DELETE no borra nada. Los advisors de seguridad de Supabase salen limpios.

Campos útiles al revisar la tabla: `atendido` (booleano, para marcar los ya
contactados) y `notas` (texto libre).

### Aviso por correo (pendiente)

Sin esto hay que revisar la tabla a mano. Para que llegue un correo por cada
contacto: Database → Webhooks → nuevo webhook sobre `insert` en `contactos`
apuntando a una Edge Function que envíe el correo (Resend o similar).

### Borrado a petición

La página de privacidad promete borrar los datos de quien lo pida. Se hace con:

```sql
delete from public.contactos where contacto = 'el-correo-o-numero';
```

---

## 3. Analítica

**Vercel Web Analytics**, sin cookies. El script está al final de las 5 páginas:

```html
<script defer src="/_vercel/insights/script.js"></script>
```

Ese archivo **solo existe cuando el sitio corre en Vercel** — en local da 404 y no
pasa nada. Hay que activarlo una vez en el panel del proyecto (Analytics → Enable);
mientras no se active, el script no reporta nada.

Por qué esta y no otra: Vercel ya aloja el sitio y por lo tanto ya recibe cada
visita, así que activar su analítica no suma ningún procesador de datos nuevo que
declarar. Plausible y Fathom son igual de limpias pero son de pago y sí agregan un
tercero. Google Analytics queda descartado: usa cookies y obligaría a poner banner.

**Regla:** mientras el sitio no escriba ninguna cookie, no se pone aviso de cookies
—no hay nada que consentir— y la página de privacidad debe seguir diciéndolo.

### Pendiente para cuando exista producto

Cuando haya sesión de usuario, la cosa cambia y hay que hacer, en este orden:

1. Cookie técnica de sesión (estrictamente necesaria: no requiere consentimiento,
   pero sí declararse).
2. Aviso de cookies **antes** de escribir la primera cookie no esencial, con opción
   real de rechazar (la Ley 21.719 exige consentimiento libre, informado y revocable).
3. Ampliar la página de privacidad: categorías de cookies, duración, y cómo revocar.
4. Revisar si la analítica sigue siendo suficiente o hace falta medición de producto
   — y si es lo segundo, mantenerla separada de los datos de salud.

## 4. Reglas de contenido que no se rompen

Vienen de FASE-1 §1.3 y del kit de validación, y protegen legal y éticamente al proyecto:

- Nunca escribir que Sole **detecta, diagnostica, predice, monitorea clínicamente
  o evalúa** nada. El vocabulario permitido es bienestar, organización,
  acompañamiento y coordinación. Cruzar esa línea en la web de marketing es lo
  que convierte un sitio en software sanitario a los ojos del ISP.
- No usar el nombre de ninguna organización como respaldo mientras no exista
  autorización escrita. La lista de `organizaciones.html` dice explícitamente
  que no hay vínculo.
- No prometer producto, fechas ni lista de espera durante la etapa de escucha.
- El usuario y cliente es **el cuidador**, nunca el paciente.
