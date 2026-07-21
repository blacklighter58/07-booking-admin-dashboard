import assert from "node:assert/strict";
import test from "node:test";
import { refreshBookingViews } from "../src/bookingRefresh.js";

test("dashboard reloads bookings, overview and clients after a booking mutation", async () => {
  const calls = [];
  const diagnostics = [];
  const result = await refreshBookingViews({
    bookingId: "new-booking",
    loadBookings: async () => { calls.push("bookings"); return [{ id: "old-booking" }, { id: "new-booking" }]; },
    loadOverview: async () => { calls.push("overview"); },
    loadClients: async () => { calls.push("clients"); },
    loadCalendar: async () => { calls.push("calendar"); },
    onDiagnostics: (entry) => diagnostics.push(entry),
  });

  assert.deepEqual(result.map((booking) => booking.id), ["old-booking", "new-booking"]);
  assert.equal(calls[0], "bookings");
  assert.deepEqual(new Set(calls.slice(1)), new Set(["overview", "clients", "calendar"]));
  assert.deepEqual(diagnostics, [{ bookingId: "new-booking", bookingsCount: 2, bookingPresent: true }]);
});
