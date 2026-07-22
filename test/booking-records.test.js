import assert from "node:assert/strict";
import test from "node:test";
import { filterBookings, hasActiveBookingFilters, normalizeBooking, normalizeBookings, resetBookingFilters, sortBookings } from "../src/bookingRecords.js";

const booking = Object.freeze({
  id: "booking-1",
  clientName: "Анна Иванова",
  phone: "+7 900 123-45-67",
  service: "Стрижка",
  serviceId: "service-1",
  employeeId: "employee-1",
  employeeName: "Мария",
  date: "2026-07-23",
  time: "10:00:00",
  status: "new",
  createdAt: "2026-07-20T10:00:00.000Z",
});

function records() {
  return normalizeBookings([
    booking,
    { ...booking, id: "booking-2", clientName: "Борис", phone: "+7 901 555-44-33", service: "Маникюр", serviceId: "service-2", employeeId: "employee-2", status: "confirmed", date: "2026-07-24", time: "11:00", createdAt: "2026-07-22T10:00:00.000Z" },
    { ...booking, id: "booking-3", clientName: "Вера", phone: "+7 902 444-33-22", status: "completed", date: "2026-07-22", time: "09:00", createdAt: "2026-07-21T10:00:00.000Z" },
  ]);
}

test("normalizes a valid Booking API record", () => {
  const result = normalizeBooking(booking);
  assert.equal(result.reason, null);
  assert.equal(result.booking.time, "10:00");
  assert.equal(result.booking.status, "new");
});

test("reports invalid booking records instead of silently accepting them", () => {
  const invalid = normalizeBooking({ ...booking, phone: "" });
  const reported = [];
  const normalized = normalizeBookings([booking, { ...booking, id: "bad", date: "wrong" }], { onInvalid: (entry) => reported.push(entry) });
  assert.equal(invalid.booking, null);
  assert.equal(invalid.reason, "Отсутствует телефон клиента");
  assert.equal(normalized.length, 1);
  assert.deepEqual(reported, [{ index: 1, reason: "Некорректная дата" }]);
});

test("filters bookings by search, status, employee and service", () => {
  const list = records();
  assert.deepEqual(filterBookings(list, { query: "иван" }).map((item) => item.id), ["booking-1"]);
  assert.deepEqual(filterBookings(list, { query: "1234567" }).map((item) => item.id), ["booking-1"]);
  assert.deepEqual(filterBookings(list, { status: "confirmed" }).map((item) => item.id), ["booking-2"]);
  assert.deepEqual(filterBookings(list, { employeeId: "employee-2" }).map((item) => item.id), ["booking-2"]);
  assert.deepEqual(filterBookings(list, { serviceId: "service-1" }).map((item) => item.id), ["booking-1", "booking-3"]);
});

test("filters bookings by today, upcoming and past using date and time", () => {
  const list = records();
  const now = new Date("2026-07-23T10:30:00");
  assert.deepEqual(filterBookings(list, { period: "today" }, now).map((item) => item.id), ["booking-1"]);
  assert.deepEqual(filterBookings(list, { period: "upcoming" }, now).map((item) => item.id), ["booking-2"]);
  assert.deepEqual(filterBookings(list, { period: "past" }, now).map((item) => item.id), ["booking-1", "booking-3"]);
});

test("sorts bookings and identifies active filters", () => {
  const list = records();
  assert.deepEqual(sortBookings(list, "name-asc").map((item) => item.clientName), ["Анна Иванова", "Борис", "Вера"]);
  assert.deepEqual(sortBookings(list, "date-desc").map((item) => item.id), ["booking-2", "booking-1", "booking-3"]);
  assert.equal(hasActiveBookingFilters({ status: "all", period: "all" }), false);
  assert.equal(hasActiveBookingFilters({ period: "upcoming" }), true);
  assert.deepEqual(resetBookingFilters(), { query: "", status: "all", employeeId: "all", serviceId: "all", period: "all" });
});

test("keeps unknown statuses explicit for the interface", () => {
  const result = normalizeBooking({ ...booking, status: "legacy-status" });
  assert.equal(result.booking.status, "unknown");
});
