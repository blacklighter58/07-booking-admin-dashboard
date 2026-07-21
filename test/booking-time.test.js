import assert from "node:assert/strict";
import test from "node:test";
import { normalizeBookingTime } from "../src/bookingTime.js";

test("dashboard accepts PostgreSQL TIME values with seconds", () => {
  assert.equal(normalizeBookingTime("10:00:00"), "10:00");
  assert.equal(normalizeBookingTime("10:00:00.123"), "10:00");
  assert.equal(normalizeBookingTime("10:00"), "10:00");
  assert.equal(normalizeBookingTime("10:00:99"), "10:00");
  assert.equal(normalizeBookingTime("invalid"), "");
});
