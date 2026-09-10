/* ==========================================================================
   Configuración del sitio.
   Este es el ÚNICO archivo que hay que tocar para el formulario.

   La clave publishable está pensada para vivir en el navegador: no da acceso
   a nada por sí sola. Lo que protege la tabla es la política RLS de
   solo-inserción (ver web/README.md). Nunca pongas acá la service_role key.
   ========================================================================== */

window.SOLE_CONFIG = {
  // Proyecto Supabase "sole-web" (región sa-east-1)
  supabaseUrl: "https://pmqcaajimehihxlxgqbx.supabase.co",
  supabaseKey: "sb_publishable_Oo7SSKAiVWp0q3lEon3mEw_Y4my-m8s",

  // Tabla donde se guardan los contactos
  tabla: "contactos",

  // Vía alternativa que se muestra si el formulario falla
  correo: "hola@solecuida.com"
};
