export function normalizeBookingTime(value) {
  const match = typeof value === "string" && value.trim().match(/^(\d{2}:\d{2})(?::\d{2}(?:\.\d+)?)?$/);
  return match ? match[1] : "";
}
