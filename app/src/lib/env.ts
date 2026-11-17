// Única puerta a las variables de entorno. Nada se exige al importar este módulo:
// cada función pide su variable cuando la usa, así un paso no rompe a otro anterior.
// Fuera de este archivo nadie lee `process.env`, salvo las NEXT_PUBLIC_* escritas
// literales en componentes de cliente (Next solo las incrusta así).

export class MissingEnvError extends Error {
  constructor(name: string) {
    super(`Falta la variable de entorno ${name}`);
    this.name = "MissingEnvError";
  }
}

export function readEnv(name: string): string | undefined {
  const value = process.env[name];
  return value === undefined || value === "" ? undefined : value;
}

export function requireEnv(name: string): string {
  const value = readEnv(name);
  if (value === undefined) {
    throw new MissingEnvError(name);
  }
  return value;
}

export function appUrl(): string {
  return readEnv("APP_URL") ?? "http://localhost:3000";
}
