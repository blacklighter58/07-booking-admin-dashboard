import { requestApi } from "./authApi.js";

export async function getBookings(filters = {}) {
  const params = new URLSearchParams();
  ["dateFrom", "dateTo", "employeeId", "status", "search", "limit"].forEach((key) => {
    if (filters[key]) params.set(key, filters[key]);
  });
  const payload = await requestApi(`/api/bookings${params.size ? `?${params}` : ""}`);
  if (!Array.isArray(payload?.bookings)) throw new Error("Booking API вернул некорректный список заявок.");
  return payload.bookings;
}

export async function getBooking(bookingId) {
  const payload = await requestApi(`/api/bookings/${encodeURIComponent(bookingId)}`);
  if (!payload?.booking) throw new Error("Booking API не вернул заявку.");
  return payload.booking;
}

export async function createBooking(data) {
  const payload = await requestApi("/api/bookings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
  if (!payload?.booking) throw new Error("Booking API не вернул созданную запись.");
  return payload.booking;
}

export async function updateBooking(bookingId, data) {
  const payload = await requestApi(`/api/bookings/${encodeURIComponent(bookingId)}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
  if (!payload?.booking) throw new Error("Booking API не вернул обновлённую запись.");
  return payload.booking;
}

export function updateBookingStatus(bookingId, status) { return updateBooking(bookingId, { status }); }
export async function cancelBooking(bookingId, reason = "") { return (await requestApi(`/api/bookings/${encodeURIComponent(bookingId)}/cancel`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reason }) })).booking; }
export async function restoreBooking(bookingId) { return (await requestApi(`/api/bookings/${encodeURIComponent(bookingId)}/restore`, { method: "POST" })).booking; }
export async function deleteBookingFromApi(bookingId) { await requestApi(`/api/bookings/${encodeURIComponent(bookingId)}?test=true`, { method: "DELETE", headers: { "x-test-delete": "true" } }); }
