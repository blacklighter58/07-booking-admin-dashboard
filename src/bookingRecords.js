import { normalizeBookingStatus } from "./bookingStatuses.js";
import { normalizeBookingTime } from "./bookingTime.js";

function normalizeBookingDate(rawDate) {
  if (typeof rawDate !== "string") return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) return rawDate;
  const match = rawDate.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  return match ? `${match[3]}-${match[2]}-${match[1]}` : "";
}

export function normalizeBooking(rawBooking) {
  if (!rawBooking || typeof rawBooking !== "object") return { booking: null, reason: "Неверный формат записи" };

  const id = typeof rawBooking.id === "string" || typeof rawBooking.id === "number" ? String(rawBooking.id) : "";
  const clientName = typeof rawBooking.clientName === "string" ? rawBooking.clientName.trim() : "";
  const phone = typeof rawBooking.phone === "string" ? rawBooking.phone.trim() : "";
  const service = typeof rawBooking.service === "string" ? rawBooking.service.trim() : "";
  const date = normalizeBookingDate(rawBooking.date);
  const time = normalizeBookingTime(rawBooking.time);

  if (!id) return { booking: null, reason: "Отсутствует идентификатор" };
  if (!clientName) return { booking: null, reason: "Отсутствует имя клиента" };
  if (!phone) return { booking: null, reason: "Отсутствует телефон клиента" };
  if (service.length < 2) return { booking: null, reason: "Отсутствует услуга" };
  if (!date) return { booking: null, reason: "Некорректная дата" };
  if (!/^\d{2}:\d{2}$/.test(time)) return { booking: null, reason: "Некорректное время" };

  return {
    booking: {
      id,
      clientName,
      phone,
      service,
      serviceId: typeof rawBooking.serviceId === "string" ? rawBooking.serviceId : null,
      durationMinutes: Number.isInteger(rawBooking.durationMinutes) && rawBooking.durationMinutes > 0 ? rawBooking.durationMinutes : null,
      serviceColor: typeof rawBooking.serviceColor === "string" ? rawBooking.serviceColor : null,
      employeeId: typeof rawBooking.employeeId === "string" ? rawBooking.employeeId : null,
      employeeName: typeof rawBooking.employeeName === "string" && rawBooking.employeeName.trim() ? rawBooking.employeeName.trim() : null,
      telegramUserId: typeof rawBooking.telegramUserId === "string" ? rawBooking.telegramUserId : null,
      telegramUsername: typeof rawBooking.telegramUsername === "string" ? rawBooking.telegramUsername : null,
      source: typeof rawBooking.source === "string" ? rawBooking.source : null,
      cancelledAt: typeof rawBooking.cancelledAt === "string" ? rawBooking.cancelledAt : null,
      cancellationReason: typeof rawBooking.cancellationReason === "string" ? rawBooking.cancellationReason : null,
      date,
      time,
      status: normalizeBookingStatus(rawBooking.status),
      comment: typeof rawBooking.comment === "string" ? rawBooking.comment.slice(0, 300) : "",
      createdAt: typeof rawBooking.createdAt === "string" && !Number.isNaN(Date.parse(rawBooking.createdAt)) ? rawBooking.createdAt : null,
      updatedAt: typeof rawBooking.updatedAt === "string" ? rawBooking.updatedAt : null,
    },
    reason: null,
  };
}

export function normalizeBookings(rawBookings, { onInvalid } = {}) {
  if (!Array.isArray(rawBookings)) return [];
  return rawBookings.flatMap((rawBooking, index) => {
    const result = normalizeBooking(rawBooking);
    if (!result.booking) onInvalid?.({ index, reason: result.reason });
    return result.booking ? [result.booking] : [];
  });
}

function bookingDateTime(booking) {
  const timestamp = Date.parse(`${booking.date}T${booking.time}:00`);
  return Number.isNaN(timestamp) ? null : timestamp;
}

export function filterBookings(bookings, filters = {}, now = new Date()) {
  const query = String(filters.query || "").trim().toLocaleLowerCase("ru-RU");
  const queryDigits = query.replace(/\D/g, "");
  const nowTime = now instanceof Date ? now.getTime() : Date.now();
  const today = now instanceof Date && !Number.isNaN(now.getTime())
    ? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
    : "";

  return bookings.filter((booking) => {
    const searchableText = [booking.clientName, booking.phone, booking.service, booking.id]
      .filter(Boolean).join(" ").toLocaleLowerCase("ru-RU");
    const phoneDigits = String(booking.phone || "").replace(/\D/g, "");
    const matchesQuery = !query || searchableText.includes(query) || (queryDigits.length >= 3 && phoneDigits.includes(queryDigits));
    const matchesStatus = !filters.status || filters.status === "all" || booking.status === filters.status;
    const matchesEmployee = !filters.employeeId || filters.employeeId === "all" || booking.employeeId === filters.employeeId;
    const matchesService = !filters.serviceId || filters.serviceId === "all" || booking.serviceId === filters.serviceId || booking.service === filters.serviceId;
    const moment = bookingDateTime(booking);
    const matchesPeriod = !filters.period || filters.period === "all"
      || (filters.period === "today" && booking.date === today)
      || (filters.period === "upcoming" && moment !== null && moment >= nowTime)
      || (filters.period === "past" && moment !== null && moment < nowTime);
    return matchesQuery && matchesStatus && matchesEmployee && matchesService && matchesPeriod;
  });
}

export function sortBookings(bookings, sort = "created-desc") {
  return [...bookings].sort((firstBooking, secondBooking) => {
    if (sort === "date-asc") return `${firstBooking.date}T${firstBooking.time}`.localeCompare(`${secondBooking.date}T${secondBooking.time}`);
    if (sort === "date-desc") return `${secondBooking.date}T${secondBooking.time}`.localeCompare(`${firstBooking.date}T${firstBooking.time}`);
    if (sort === "name-asc") return firstBooking.clientName.localeCompare(secondBooking.clientName, "ru-RU");
    const firstCreated = firstBooking.createdAt ? Date.parse(firstBooking.createdAt) : 0;
    const secondCreated = secondBooking.createdAt ? Date.parse(secondBooking.createdAt) : 0;
    return secondCreated - firstCreated || String(secondBooking.id).localeCompare(String(firstBooking.id));
  });
}

export function hasActiveBookingFilters(filters = {}) {
  return Boolean(String(filters.query || "").trim())
    || [filters.status, filters.employeeId, filters.serviceId, filters.period].some((value) => value && value !== "all");
}

export function resetBookingFilters() {
  return { query: "", status: "all", employeeId: "all", serviceId: "all", period: "all" };
}
