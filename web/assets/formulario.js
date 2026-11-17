/* ==========================================================================
   Formulario de contacto, sin dependencias.

   Envía a la app (contactEndpoint), que comprueba con Cloudflare Turnstile que
   quien escribe es una persona. Mientras contactEndpoint esté vacío (antes del
   lanzamiento), envía directo a Supabase como siempre. Ver assets/config.js.

   Si no hay ninguna configuración, el formulario no finge funcionar: lo dice y
   ofrece las vías directas.
   ========================================================================== */

(function () {
  "use strict";

  var form = document.getElementById("formulario-contacto");
  if (!form) return;

  var caja = document.getElementById("mensaje-formulario");
  var boton = document.getElementById("boton-enviar");
  var widget = document.getElementById("turnstile-widget");
  var cfg = window.SOLE_CONFIG || {};
  var abierto = Date.now();
  var turnstileId = null;

  var porLaApp = typeof cfg.contactEndpoint === "string" &&
    cfg.contactEndpoint.indexOf("https://") === 0;
  var directo = !porLaApp && Boolean(
    cfg.supabaseUrl &&
    cfg.supabaseKey &&
    cfg.supabaseUrl.indexOf("http") === 0
  );
  var configurado = porLaApp || directo;

  function avisar(tipo, titulo, texto) {
    caja.textContent = "";
    var div = document.createElement("div");
    div.className = "aviso" + (tipo ? " aviso--" + tipo : "");
    var p1 = document.createElement("p");
    var b = document.createElement("b");
    b.textContent = titulo;
    p1.appendChild(b);
    div.appendChild(p1);
    if (texto) {
      var p2 = document.createElement("p");
      p2.textContent = texto;
      div.appendChild(p2);
    }
    caja.appendChild(div);
  }

  function pareceContacto(valor) {
    var v = valor.trim();
    if (v.indexOf("@") > 0 && v.indexOf(".") > 0) return true;      // correo
    return v.replace(/[^0-9]/g, "").length >= 8;                     // teléfono
  }

  // Turnstile se dibuja solo si la app está activa y hay clave del sitio.
  // El script de Cloudflare llama a esta función cuando termina de cargar.
  window.soleTurnstileListo = function () {
    if (!porLaApp || !cfg.turnstileSiteKey || !widget || !window.turnstile) return;
    widget.hidden = false;
    turnstileId = window.turnstile.render(widget, {
      sitekey: cfg.turnstileSiteKey,
      language: "es"
    });
  };
  if (window.turnstile) window.soleTurnstileListo();

  if (!configurado) {
    avisar(
      "error",
      "El formulario todavía no está conectado.",
      "Mientras tanto escríbeme directo a " + (cfg.correo || "el correo del pie de página") +
      " y coordinamos igual."
    );
    boton.disabled = true;
  }

  function datos() {
    return {
      nombre: form.elements["nombre"].value.trim(),
      contacto: form.elements["contacto"].value.trim(),
      relacion: form.elements["relacion"].value,
      comuna: form.elements["comuna"].value.trim() || null,
      mensaje: form.elements["mensaje"].value.trim() || null,
      consentimiento: true,
      origen: document.referrer || "directo"
    };
  }

  function enviarPorLaApp(cuerpo) {
    var token = "";
    if (turnstileId !== null && window.turnstile) {
      token = window.turnstile.getResponse(turnstileId) || "";
    }
    cuerpo.trampa = form.elements["sitio-web"].value;
    cuerpo.llenadoMs = Date.now() - abierto;
    if (token) cuerpo.turnstileToken = token;
    return fetch(cfg.contactEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cuerpo)
    }).then(function (respuesta) {
      if (respuesta.status === 400) throw new Error("captcha");
      if (respuesta.status === 429) throw new Error("limite");
      if (!respuesta.ok) throw new Error("HTTP " + respuesta.status);
    });
  }

  function enviarDirecto(cuerpo) {
    var url = cfg.supabaseUrl.replace(/\/+$/, "") + "/rest/v1/" + (cfg.tabla || "contactos");
    return fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": cfg.supabaseKey,
        "Authorization": "Bearer " + cfg.supabaseKey,
        "Prefer": "return=minimal"
      },
      body: JSON.stringify(cuerpo)
    }).then(function (respuesta) {
      if (!respuesta.ok) throw new Error("HTTP " + respuesta.status);
    });
  }

  form.addEventListener("submit", function (evento) {
    evento.preventDefault();
    if (!configurado) return;

    // Trampa para robots: campo oculto relleno o envío en menos de 3 segundos.
    if (form.elements["sitio-web"].value !== "" || Date.now() - abierto < 3000) {
      avisar("logrado", "Gracias, recibido.", "Te escribo pronto.");
      return;
    }

    var cuerpo = datos();

    if (!cuerpo.nombre) {
      avisar("error", "Falta tu nombre.", "Con el nombre de pila basta.");
      form.elements["nombre"].focus();
      return;
    }
    if (!pareceContacto(cuerpo.contacto)) {
      avisar("error", "Revisa cómo te contacto.", "Necesito un correo o un número de WhatsApp para poder responderte.");
      form.elements["contacto"].focus();
      return;
    }
    if (!cuerpo.relacion) {
      avisar("error", "Falta una opción.", "Cuéntame cuál es tu relación con el cuidado.");
      form.elements["relacion"].focus();
      return;
    }
    if (!form.elements["consentimiento"].checked) {
      avisar("error", "Falta tu autorización.", "Sin ella no puedo guardar tus datos, y prefiero no hacerlo.");
      form.elements["consentimiento"].focus();
      return;
    }

    boton.disabled = true;
    var textoOriginal = boton.textContent;
    boton.textContent = "Enviando…";
    avisar("", "Enviando…", "");

    (porLaApp ? enviarPorLaApp(cuerpo) : enviarDirecto(cuerpo))
      .then(function () {
        form.reset();
        avisar(
          "logrado",
          "Listo, me llegó.",
          "Te respondo en dos o tres días para coordinar. Gracias por el tiempo — de verdad."
        );
        boton.textContent = "Enviado";
      })
      .catch(function (error) {
        boton.disabled = false;
        boton.textContent = textoOriginal;
        if (turnstileId !== null && window.turnstile) window.turnstile.reset(turnstileId);
        var motivo = error && error.message;
        if (motivo === "captcha") {
          avisar("error", "No pude comprobar el envío.", "Marca la casilla de verificación y vuelve a enviarlo.");
          return;
        }
        if (motivo === "limite") {
          avisar("error", "Llegaron varios envíos seguidos.", "Espera un rato y vuelve a intentarlo, o escríbeme directo a " + (cfg.correo || "el correo del pie de página") + ".");
          return;
        }
        avisar(
          "error",
          "No pude enviarlo.",
          "Puede ser la conexión. Inténtalo de nuevo o escríbeme directo a " +
          (cfg.correo || "el correo del pie de página") + "."
        );
      });
  });
})();
