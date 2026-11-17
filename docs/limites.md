# Límites de los planes gratuitos

Sole funciona con costo recurrente cero. Esta tabla dice qué límite tiene cada servicio gratuito, qué pasa al alcanzarlo y cómo se vigila.

**Estado de verificación:** las cifras marcadas `[VERIFICAR]` vienen del brief o del plano y todavía no se confirman en la fuente oficial. Cada fila enlaza la página donde se revisa. El panel `/admin/limites` (paso 42) mostrará el uso real frente a estos límites.

| Servicio | Límite del plan gratuito | Qué pasa al alcanzarlo | Cómo se vigila |
|---|---|---|---|
| Supabase | Dos proyectos gratuitos por organización: `sole-web` (el formulario del sitio) ya usa uno, y la app usa el otro. El proyecto se pausa tras 7 días sin actividad. Tamaño de la base de datos, usuarias activas al mes e invocaciones: `[VERIFICAR]` en https://supabase.com/pricing | Proyecto pausado: la app deja de responder hasta reactivarlo a mano en el panel. Base llena: deja de aceptar escrituras | `keepalive.yml` consulta `/api/health` todos los días (paso 51) y evita la pausa; `/admin/limites` muestra el tamaño de la base y las usuarias activas |
| Vercel | Plan Hobby: solo para uso personal y no comercial. Invocaciones de funciones y ancho de banda: `[VERIFICAR]` en https://vercel.com/docs/plans/hobby | Si el piloto pasa a cobrar o a tener fines comerciales, hay que pasar a Pro. Al exceder el uso, Vercel puede pausar el proyecto hasta el mes siguiente | Panel de uso de Vercel; el despachador de avisos hace 1.440 llamadas al día, sin importar cuántas usuarias haya |
| Resend | 3.000 correos al mes y 100 al día, según el brief `[VERIFICAR]` en https://resend.com/pricing | Los correos que pasen del límite no salen: una persona nueva no recibe su enlace para entrar ese día | Panel de Resend; un día con más de 100 altas es la señal de alerta |
| Sentry | Cuota mensual de errores del plan Developer `[VERIFICAR]` en https://sentry.io/pricing/ | Los errores que pasen de la cuota no se registran hasta el mes siguiente; la app sigue funcionando | Correo de aviso de cuota de Sentry; revisión semanal del fundador |
| Cloudflare Turnstile | Gratuito, sin tope de verificaciones para este volumen `[VERIFICAR]` en https://developers.cloudflare.com/turnstile/plans/ | No se espera alcanzarlo | Panel de Turnstile en Cloudflare |
| GitHub Actions | Minutos gratuitos al mes en repositorios privados `[VERIFICAR]` en https://docs.github.com/es/billing/concepts/product-billing/github-actions ; sin límite en repositorios públicos | Los flujos dejan de correr hasta el mes siguiente: sin CI, sin respaldo nocturno y sin keep-alive | GitHub → Settings → Billing and plans; las pruebas e2e en cada push son el mayor consumo |

## Qué mirar primero

1. **La pausa de Supabase.** Es el único límite que puede botar la app sin que nadie haga nada. El keep-alive diario la evita, y un fallo suyo llega por correo de GitHub.
2. **El uso no comercial de Vercel Hobby.** No es un límite técnico, es una condición de uso: mientras el piloto sea gratuito y sin publicidad, se cumple.
3. **Los correos diarios de Resend.** Un día con muchas altas (por ejemplo, después de que una organización difunda su enlace) puede toparse con el límite diario.

## Lo que compara el panel `/admin/limites`

El panel mide el uso real y avisa cuando una fila llega al 80 %. Las cifras viven en `app/src/server/admin/limits.ts`; si una cambia, se cambia en los dos lugares.

| Qué se mide | Cifra de comparación | De dónde sale |
|---|---|---|
| Tamaño de la base de datos | 500 MB | Plan gratuito de Supabase `[VERIFICAR]` en https://supabase.com/pricing |
| Usuarias activas en los últimos 30 días | 50.000 | Plan gratuito de Supabase `[VERIFICAR]` en https://supabase.com/pricing |
| Teléfonos y navegadores con avisos activos | 5.000 | Referencia propia: cada turno del despachador recorre estas filas. No es un tope del proveedor |
| Eventos de investigación en los últimos 30 días | 500.000 | Referencia propia: los eventos son lo que más hace crecer la base. No es un tope del proveedor |
