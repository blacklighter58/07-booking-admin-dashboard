import assert from "node:assert/strict";
import test from "node:test";
import { BOOKING_STATUS_LABELS, normalizeBookingStatus } from "../src/bookingStatuses.js";

test("dashboard recognizes every status accepted by Booking API", () => {
  for (const status of ["new", "pending", "confirmed", "in_progress", "completed", "cancelled", "no_show"]) {
    assert.equal(normalizeBookingStatus(status), status);
    assert.equal(typeof BOOKING_STATUS_LABELS[status], "string");
  }
  assert.equal(normalizeBookingStatus("legacy-unknown"), "unknown");
});
