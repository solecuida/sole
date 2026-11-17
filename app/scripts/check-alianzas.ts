import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

// Revisa los materiales para organizaciones en `alianzas/` (se corre desde app/).
//   plantillas: las cuatro plantillas de correo del paso 64.
//   todo:       además los archivos del kit del paso 65.
// Imprime cada problema con su archivo. Sale con 0 si no hay ninguno; con 1 si
// encuentra alguno; con 2 si el modo es inválido.

const ROOT = join("..", "alianzas");
const MARCADOR = "ENLACE_CON_CODIGO";

const PLANTILLAS = [
  "fundacion.md",
  "municipio.md",
  "centro-salud.md",
  "agrupacion-cuidadoras.md",
] as const;

const SECCIONES = [
  "## Versión breve",
  "## Versión completa",
  "## Seguimiento",
] as const;

const PROHIBIDAS = ["mejora la salud", "reduce el estrés", "previene"] as const;

const CORREOS_PERSONALES = ["gmail", "hotmail", "yahoo", "outlook"] as const;
const TIPOS = [
  "fundacion",
  "municipio",
  "centro_salud",
  "agrupacion",
  "asociacion_pacientes",
  "otro",
] as const;
const ENCABEZADO_ORGANIZACIONES =
  "nombre,tipo,poblacion,comuna_o_region,web,contacto_institucional,fuente,fecha_consulta,codigo_org";
const ENCABEZADO_SEGUIMIENTO =
  "codigo_org,fecha_envio,version_plantilla,respuesta,fecha_respuesta,notas";
const SECCIONES_KIT = [
  "## Qué le pedimos a la organización",
  "## Qué recibe a cambio",
  "## Acuerdo de piloto",
] as const;

function leer(ruta: string, problemas: string[]): string | null {
  if (!existsSync(ruta)) {
    problemas.push(`${ruta}: no existe`);
    return null;
  }
  return readFileSync(ruta, "utf8").replace(/^﻿/, "");
}

// Parte el texto en las tres secciones y devuelve el cuerpo de cada una.
function cuerpoDe(texto: string, seccion: string): string | null {
  const lineas = texto.split(/\r?\n/);
  const inicio = lineas.findIndex((linea) => linea.trim() === seccion);
  if (inicio === -1) {
    return null;
  }
  const resto = lineas.slice(inicio + 1);
  const fin = resto.findIndex((linea) => /^## /.test(linea));
  return (fin === -1 ? resto : resto.slice(0, fin)).join("\n");
}

function revisarPlantilla(ruta: string, problemas: string[]): void {
  const texto = leer(ruta, problemas);
  if (texto === null) {
    return;
  }
  for (const seccion of SECCIONES) {
    const cuerpo = cuerpoDe(texto, seccion);
    if (cuerpo === null) {
      problemas.push(`${ruta}: falta la sección «${seccion}»`);
      continue;
    }
    if (!/^Asunto:\s*\S/m.test(cuerpo)) {
      problemas.push(`${ruta}: «${seccion}» no tiene línea «Asunto:»`);
    }
    if (!cuerpo.includes(MARCADOR)) {
      problemas.push(`${ruta}: «${seccion}» no tiene el marcador ${MARCADOR}`);
    }
  }
  const minusculas = texto.toLowerCase();
  for (const frase of PROHIBIDAS) {
    if (minusculas.includes(frase)) {
      problemas.push(`${ruta}: contiene la frase prohibida «${frase}»`);
    }
  }
}

// Separa una línea CSV respetando comillas dobles.
function campos(linea: string): string[] {
  const salida: string[] = [];
  let actual = "";
  let entreComillas = false;
  for (let i = 0; i < linea.length; i += 1) {
    const c = linea[i];
    if (c === '"') {
      if (entreComillas && linea[i + 1] === '"') {
        actual += '"';
        i += 1;
      } else {
        entreComillas = !entreComillas;
      }
    } else if (c === "," && !entreComillas) {
      salida.push(actual);
      actual = "";
    } else {
      actual += c;
    }
  }
  salida.push(actual);
  return salida;
}

function revisarCsv(
  ruta: string,
  encabezado: string,
  problemas: string[],
): string[] | null {
  const texto = leer(ruta, problemas);
  if (texto === null) {
    return null;
  }
  const lineas = texto.split(/\r?\n/).filter((linea) => linea.trim() !== "");
  if (lineas[0]?.trim() !== encabezado) {
    problemas.push(`${ruta}: el encabezado no es exactamente «${encabezado}»`);
    return null;
  }
  return lineas.slice(1);
}

function revisarOrganizaciones(problemas: string[]): void {
  const ruta = join(ROOT, "organizaciones.csv");
  const filas = revisarCsv(ruta, ENCABEZADO_ORGANIZACIONES, problemas);
  if (filas === null) {
    return;
  }
  if (filas.length < 20) {
    problemas.push(
      `${ruta}: hay ${filas.length} organizaciones y se piden al menos 20`,
    );
  }
  filas.forEach((fila, indice) => {
    const donde = `${ruta} fila ${indice + 2}`;
    const c = campos(fila);
    if (c.length !== 9) {
      problemas.push(`${donde}: tiene ${c.length} columnas y deben ser 9`);
      return;
    }
    const [nombre, tipo, , , , contacto, fuente, fecha, codigo] = c as [
      string,
      string,
      string,
      string,
      string,
      string,
      string,
      string,
      string,
    ];
    const quien = `${donde} (${nombre})`;
    if (!(TIPOS as readonly string[]).includes(tipo)) {
      problemas.push(`${quien}: tipo «${tipo}» no está en la lista permitida`);
    }
    if (!fuente.startsWith("https://")) {
      problemas.push(`${quien}: la fuente debe empezar con https://`);
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      problemas.push(`${quien}: fecha_consulta «${fecha}» no es YYYY-MM-DD`);
    }
    if (!/^[A-Z0-9-]{3,32}$/.test(codigo)) {
      problemas.push(`${quien}: codigo_org «${codigo}» es inválido`);
    }
    if (contacto !== "[VERIFICAR]") {
      const esCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contacto);
      if (!esCorreo && !contacto.startsWith("https://")) {
        problemas.push(
          `${quien}: el contacto debe ser un formulario https:// o un correo institucional`,
        );
      }
      const dominio = contacto.toLowerCase();
      for (const personal of CORREOS_PERSONALES) {
        if (esCorreo && dominio.split("@")[1]?.startsWith(`${personal}.`)) {
          problemas.push(
            `${quien}: contacto en ${personal} (debe ser institucional)`,
          );
        }
      }
    }
  });
}

function revisarSeguimiento(problemas: string[]): void {
  revisarCsv(join(ROOT, "seguimiento.csv"), ENCABEZADO_SEGUIMIENTO, problemas);
}

function revisarKit(problemas: string[]): void {
  const ruta = join(ROOT, "kit-piloto.md");
  const texto = leer(ruta, problemas);
  if (texto === null) {
    return;
  }
  for (const seccion of SECCIONES_KIT) {
    if (cuerpoDe(texto, seccion) === null) {
      problemas.push(`${ruta}: falta la sección «${seccion}»`);
    }
  }
  const minusculas = texto.toLowerCase();
  for (const frase of PROHIBIDAS) {
    if (minusculas.includes(frase)) {
      problemas.push(`${ruta}: contiene la frase prohibida «${frase}»`);
    }
  }
}

function revisarPauta(problemas: string[]): void {
  const ruta = join(ROOT, "pauta-entrevistas.md");
  const texto = leer(ruta, problemas);
  if (texto !== null && !texto.includes("seguimiento-entrevistas.csv")) {
    problemas.push(`${ruta}: no menciona seguimiento-entrevistas.csv`);
  }
}

function main(): number {
  const modo = process.argv[2];
  if (modo !== "plantillas" && modo !== "todo") {
    console.error("Uso: tsx scripts/check-alianzas.ts plantillas|todo");
    return 2;
  }

  const problemas: string[] = [];
  for (const nombre of PLANTILLAS) {
    revisarPlantilla(join(ROOT, "plantillas", nombre), problemas);
  }

  if (modo === "todo") {
    revisarPlantilla(
      join(ROOT, "plantillas", "asociacion-pacientes.md"),
      problemas,
    );
    revisarOrganizaciones(problemas);
    revisarSeguimiento(problemas);
    revisarKit(problemas);
    revisarPauta(problemas);
  }

  if (problemas.length > 0) {
    for (const problema of problemas) {
      console.error(`PROBLEMA: ${problema}`);
    }
    console.error(`${problemas.length} problema(s) en modo ${modo}.`);
    return 1;
  }
  console.log(
    modo === "plantillas"
      ? `Plantillas en orden: ${PLANTILLAS.length} archivos revisados.`
      : "Todo en orden: plantillas, listas y kit de piloto revisados.",
  );
  return 0;
}

process.exit(main());
