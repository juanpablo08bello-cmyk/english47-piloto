// Fechas locales por zona IANA. Las jornadas se manejan como texto YYYY-MM-DD,
// asi que la aritmetica de dias no se ve afectada por cambios de horario.

export function isValidTimeZone(tz) {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export function localDate(nowMs, timeZone) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date(nowMs));
  const get = (type) => parts.find((p) => p.type === type).value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}

export function localHour(nowMs, timeZone) {
  const hour = new Intl.DateTimeFormat('en-US', { timeZone, hour: 'numeric', hourCycle: 'h23' }).format(new Date(nowMs));
  return Number(hour);
}

const toUtc = (date) => {
  const [y, m, d] = date.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
};

export function addDays(date, n) {
  return new Date(toUtc(date) + n * 86400000).toISOString().slice(0, 10);
}

export function diffDays(a, b) {
  return Math.round((toUtc(a) - toUtc(b)) / 86400000);
}

/** Lunes de la semana que contiene la fecha. */
export function weekStart(date) {
  const dow = new Date(toUtc(date)).getUTCDay();
  return addDays(date, -((dow + 6) % 7));
}
