/* ==========================================================================
   Configuración del sitio.
   Este es el ÚNICO archivo que hay que tocar para el formulario.

   Dos caminos para el formulario «Conversemos»:

   1. A través de la app (el definitivo). El formulario envía a
      `contactEndpoint`; la app comprueba que quien escribe es una persona
      (Cloudflare Turnstile), cuenta los envíos y guarda el contacto con una
      clave que nunca llega al navegador. Se activa el día del lanzamiento,
      cuando app.solecuida.com ya responde (docs/lanzamiento.md):
        - contactEndpoint: "https://app.solecuida.com/api/web/contact"
        - turnstileSiteKey: la «site key» de Turnstile (es pública)
        - y se borran supabaseUrl y supabaseKey de aquí abajo.

   2. Directo a Supabase (el de hoy). Se usa solo mientras contactEndpoint
      esté vacío, para que el formulario no se caiga antes del lanzamiento.
      La clave publishable está pensada para vivir en el navegador: no da
      acceso a nada por sí sola. Lo que protege la tabla es la política RLS
      de solo-inserción (ver web/README.md). Nunca pongas acá la service_role key.
   ========================================================================== */

window.SOLE_CONFIG = {
  // Camino 1: vacío hasta el lanzamiento.
  contactEndpoint: "",
  turnstileSiteKey: "",

  // Camino 2 (transitorio): proyecto Supabase "sole-web" (región sa-east-1)
  supabaseUrl: "https://pmqcaajimehihxlxgqbx.supabase.co",
  supabaseKey: "sb_publishable_Oo7SSKAiVWp0q3lEon3mEw_Y4my-m8s",
  tabla: "contactos",

  // Vía alternativa que se muestra si el formulario falla
  correo: "hola@solecuida.com"
};
