const DAY_MS = 24 * 60 * 60 * 1000;

export function parseLocalDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? date : null;
}

export function toIsoDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function todayIsoDate(timezone) {
  if (!timezone) return toIsoDate(new Date());
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const values = Object.fromEntries(parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function addCalendarDays(dateValue, amount) {
  const date = parseLocalDate(dateValue);
  date.setDate(date.getDate() + amount);
  return toIsoDate(date);
}

export function startOfWeek(dateValue) {
  const date = parseLocalDate(dateValue);
  const offset = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - offset);
  return toIsoDate(date);
}

export function getWeekDates(dateValue) {
  const firstDate = startOfWeek(dateValue);
  return Array.from({ length: 7 }, (_, index) => addCalendarDays(firstDate, index));
}

export function getCalendarRange(dateValue, view) {
  if (view === "week") {
    const dateFrom = startOfWeek(dateValue);
    return { dateFrom, dateTo: addCalendarDays(dateFrom, 6) };
  }
  return { dateFrom: dateValue, dateTo: dateValue };
}

export function formatCalendarDate(dateValue, options) {
  const date = parseLocalDate(dateValue);
  return new Intl.DateTimeFormat("ru-RU", options).format(date);
}

export function formatCalendarTitle(dateValue, view) {
  if (view === "day") return formatCalendarDate(dateValue, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const { dateFrom, dateTo } = getCalendarRange(dateValue, view);
  const from = formatCalendarDate(dateFrom, { day: "numeric", month: "short" });
  const to = formatCalendarDate(dateTo, { day: "numeric", month: "short", year: "numeric" });
  return `${from} — ${to}`;
}

export function timeToMinutes(value) {
  if (typeof value !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) return null;
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

export function minutesToTime(value) {
  return `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;
}

export const CALENDAR_START_MINUTES = 8 * 60 + 30;
export const CALENDAR_END_MINUTES = 22 * 60;
export const GRID_STEP_MINUTES = 30;
// Увеличенный масштаб: час занимает 90 px, поэтому записи и время легко читать.
export const GRID_MINUTE_HEIGHT = 1.5;
export const GRID_HEIGHT = (CALENDAR_END_MINUTES - CALENDAR_START_MINUTES) * GRID_MINUTE_HEIGHT;
export const DAY_DURATION_MS = DAY_MS;
