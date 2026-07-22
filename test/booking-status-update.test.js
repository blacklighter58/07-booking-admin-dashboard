import assert from "node:assert/strict";
import test from "node:test";
import { updateBookingStatusSafely } from "../src/bookingStatusUpdate.js";

test("updates status only after the API confirms the booking and then refreshes views", async () => {
  const calls = [];
  const booking = await updateBookingStatusSafely({
    bookingId: "booking-1",
    status: "confirmed",
    updateStatus: async (id, status) => { calls.push(["update", id, status]); return { id }; },
    cancel: async () => { throw new Error("not used"); },
    restore: async () => { throw new Error("not used"); },
    refresh: async (id) => calls.push(["refresh", id]),
  });
  assert.deepEqual(booking, { id: "booking-1" });
  assert.deepEqual(calls, [["update", "booking-1", "confirmed"], ["refresh", "booking-1"]]);
});

test("keeps the current interface state when status update fails", async () => {
  let refreshed = false;
  await assert.rejects(
    updateBookingStatusSafely({
      bookingId: "booking-1",
      status: "confirmed",
      updateStatus: async () => { throw new Error("Сеть недоступна"); },
      cancel: async () => null,
      restore: async () => null,
      refresh: async () => { refreshed = true; },
    }),
    /Сеть недоступна/
  );
  assert.equal(refreshed, false);
});
