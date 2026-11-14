/** Resultado tipado de toda la lógica de servidor: éxito con datos o error con código. */
export type Result<T = undefined, C extends string = string> =
  | { ok: true; data: T }
  | { ok: false; error: { code: C; message: string } };

export function ok(): Result<undefined, never>;
export function ok<T>(data: T): Result<T, never>;
export function ok<T>(data?: T): Result<T | undefined, never> {
  return { ok: true, data };
}

/** `message` es para la persona usuaria: en español y sin detalles internos. */
export function fail<C extends string>(
  code: C,
  message: string,
): Result<never, C> {
  return { ok: false, error: { code, message } };
}
