export const BOOKING_STATUSES = Object.freeze([
  "new",
  "pending",
  "confirmed",
  "in_progress",
  "completed",
  "cancelled",
  "no_show",
]);

export const BOOKING_STATUS_LABELS = Object.freeze({
  new: "Новая",
  pending: "Ожидает подтверждения",
  confirmed: "Подтверждена",
  in_progress: "В работе",
  completed: "Завершена",
  cancelled: "Отменена",
  no_show: "Не пришёл",
  unknown: "Не указан",
});

export const VALID_BOOKING_STATUSES = new Set(BOOKING_STATUSES);

export function normalizeBookingStatus(status) {
  return VALID_BOOKING_STATUSES.has(status) ? status : "unknown";
}
