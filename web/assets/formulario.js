/* ==========================================================================
   Formulario de contacto → Supabase (REST directo, sin dependencias).
   Si no hay configuración, el formulario no finge funcionar: lo dice y
   ofrece las vías directas.
   ========================================================================== */

(function () {
  "use strict";

  var form = document.getElementById("formulario-contacto");
  if (!form) return;

  var caja = document.getElementById("mensaje-formulario");
  var boton = document.getElementById("boton-enviar");
  var cfg = window.SOLE_CONFIG || {};
  var abierto = Date.now();

  var configurado = Boolean(
    cfg.supabaseUrl &&
    cfg.supabaseKey &&
    cfg.supabaseUrl.indexOf("http") === 0
  );

  function avisar(tipo, titulo, texto) {
    caja.innerHTML = "";
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

  if (!configurado) {
    avisar(
      "error",
      "El formulario todavía no está conectado.",
      "Mientras tanto escríbeme directo a " + (cfg.correo || "el correo del pie de página") +
      " y coordinamos igual."
    );
    boton.disabled = true;
  }

  form.addEventListener("submit", function (evento) {
    evento.preventDefault();
    if (!configurado) return;

    // Trampa para robots: campo oculto relleno o envío en menos de 3 segundos.
    if (form.elements["sitio-web"].value !== "" || Date.now() - abierto < 3000) {
      avisar("logrado", "Gracias, recibido.", "Te escribo pronto.");
      return;
    }

    var nombre = form.elements["nombre"].value.trim();
    var contacto = form.elements["contacto"].value.trim();
    var relacion = form.elements["relacion"].value;

    if (!nombre) {
      avisar("error", "Falta tu nombre.", "Con el nombre de pila basta.");
      form.elements["nombre"].focus();
      return;
    }
    if (!pareceContacto(contacto)) {
      avisar("error", "Revisa cómo te contacto.", "Necesito un correo o un número de WhatsApp para poder responderte.");
      form.elements["contacto"].focus();
      return;
    }
    if (!relacion) {
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

    var url = cfg.supabaseUrl.replace(/\/+$/, "") + "/rest/v1/" + (cfg.tabla || "contactos");

    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": cfg.supabaseKey,
        "Authorization": "Bearer " + cfg.supabaseKey,
        "Prefer": "return=minimal"
      },
      body: JSON.stringify({
        nombre: nombre,
        contacto: contacto,
        relacion: relacion,
        comuna: form.elements["comuna"].value.trim() || null,
        mensaje: form.elements["mensaje"].value.trim() || null,
        consentimiento: true,
        origen: document.referrer || "directo"
      })
    })
      .then(function (respuesta) {
        if (!respuesta.ok) throw new Error("HTTP " + respuesta.status);
        form.reset();
        avisar(
          "logrado",
          "Listo, me llegó.",
          "Te respondo en dos o tres días para coordinar. Gracias por el tiempo — de verdad."
        );
        boton.textContent = "Enviado";
      })
      .catch(function () {
        boton.disabled = false;
        boton.textContent = textoOriginal;
        avisar(
          "error",
          "No pude enviarlo.",
          "Puede ser la conexión. Inténtalo de nuevo o escríbeme directo a " +
          (cfg.correo || "el correo del pie de página") + "."
        );
      });
  });
})();
