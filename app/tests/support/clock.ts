// Hora de Chile para las pruebas de navegador.
//
// "Hoy" solo prepara ítems cuya hora pasó hace menos de 6 horas. Una prueba que
// siembra un ítem "a las 00:00 de hoy" pasa de madrugada y falla por la tarde:
// por eso se siembra a una hora que acaba de pasar.

const TZ = "America/Santiago";

function localNow(): { date: string; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const get = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "00";
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    minutes: Number(get("hour")) * 60 + Number(get("minute")),
  };
}

/** El día de hoy en Chile y una hora que pasó hace 2 minutos (o 00:00 recién pasada la medianoche). */
export function recentChileTime(): { date: string; time: string } {
  const { date, minutes } = localNow();
  const at = Math.max(minutes - 2, 0);
  const pad = (value: number) => String(value).padStart(2, "0");
  return { date, time: `${pad(Math.floor(at / 60))}:${pad(at % 60)}` };
}
