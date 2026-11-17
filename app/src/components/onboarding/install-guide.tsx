/**
 * Cómo dejar Sole en la pantalla de inicio. No pide permiso de avisos:
 * eso se hace en «Avisos», cuando la persona lo decide.
 */
export function InstallGuide() {
  return (
    <section
      aria-labelledby="instalar-titulo"
      className="flex flex-col gap-4 rounded-card border border-border bg-surface p-4"
    >
      <h2 id="instalar-titulo" className="text-xl font-bold">
        Deja Sole a mano en tu teléfono
      </h2>
      <p>
        Así la abres con un toque, como cualquier aplicación, sin buscarla en el
        navegador.
      </p>

      <div>
        <h3 className="text-lg font-bold">Android con Chrome</h3>
        <ol className="mt-1 list-decimal pl-6">
          <li>Toca los tres puntos, arriba a la derecha.</li>
          <li>
            Elige «Agregar a la pantalla principal» o «Instalar aplicación».
          </li>
          <li>Confirma con «Agregar».</li>
        </ol>
      </div>

      <div>
        <h3 className="text-lg font-bold">iPhone con Safari</h3>
        <ol className="mt-1 list-decimal pl-6">
          <li>Toca el botón Compartir (el cuadrado con una flecha).</li>
          <li>Baja y elige «Agregar a inicio».</li>
          <li>Confirma con «Agregar».</li>
        </ol>
        <p className="mt-2 text-base text-fg-muted">
          En iPhone, los avisos funcionan solo con Sole instalada así, y con iOS
          16.4 o superior.
        </p>
      </div>
    </section>
  );
}
