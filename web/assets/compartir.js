/* Botón "Compartir" del sitio de Sole. Sin dependencias.
   Uso en la página:
     <button type="button" class="compartir" data-compartir>Compartir</button>
     <span class="compartir__estado" role="status" aria-live="polite" data-compartir-estado></span>
   Si el navegador sabe compartir, abre su panel; si no, copia el enlace. */
(function () {
  "use strict";

  var botones = document.querySelectorAll("[data-compartir]");
  if (!botones.length) return;

  var estado = document.querySelector("[data-compartir-estado]");
  var temporizador = null;

  function avisar(texto) {
    if (!estado) return;
    estado.textContent = texto;
    if (temporizador) window.clearTimeout(temporizador);
    temporizador = window.setTimeout(function () {
      estado.textContent = "";
    }, 4000);
  }

  function copiarConSeleccion(url) {
    var campo = document.createElement("textarea");
    campo.value = url;
    campo.setAttribute("readonly", "");
    campo.style.position = "fixed";
    campo.style.top = "0";
    campo.style.opacity = "0";
    document.body.appendChild(campo);
    campo.select();
    var copiado = false;
    try {
      copiado = document.execCommand("copy");
    } catch (error) {
      copiado = false;
    }
    document.body.removeChild(campo);
    return copiado;
  }

  function copiar(url) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(url).then(
        function () {
          avisar("Enlace copiado");
        },
        function () {
          avisar(copiarConSeleccion(url) ? "Enlace copiado" : "No se pudo copiar. Copia la dirección del navegador.");
        }
      );
    }
    avisar(copiarConSeleccion(url) ? "Enlace copiado" : "No se pudo copiar. Copia la dirección del navegador.");
    return Promise.resolve();
  }

  function compartir() {
    var url = window.location.href;
    var datos = { title: document.title, url: url };

    if (typeof navigator.share === "function") {
      return navigator.share(datos).catch(function (error) {
        // Si la persona canceló, no es un error: no se muestra nada.
        if (error && error.name === "AbortError") return;
        return copiar(url);
      });
    }
    return copiar(url);
  }

  for (var i = 0; i < botones.length; i += 1) {
    botones[i].addEventListener("click", function () {
      compartir();
    });
  }
})();
