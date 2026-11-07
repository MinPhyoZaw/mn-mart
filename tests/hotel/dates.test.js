import test from "node:test";
import assert from "node:assert/strict";
import { hotelStay, hotelToday, hotelRoomFields } from "../../app/lib/hotelDates.js";

const now = new Date("2030-01-01T18:00:00Z");
test("stay dates use Myanmar local date and count nights excluding checkout", () => {
  assert.equal(hotelToday(now), "2030-01-02");
  assert.deepEqual(hotelStay("2030-01-02", "2030-01-04", { now }), {
    checkIn: "2030-01-02",
    checkOut: "2030-01-04",
    nights: 2,
  });
});
test("invalid, reversed, same-day, past and excessive stays are rejected", () => {
  for (const [checkIn, checkOut] of [
    ["2030-02-30", "2030-03-03"],
    ["2030-1-02", "2030-01-03"],
    ["2030-01-02", "2030-01-02"],
    ["2030-01-03", "2030-01-02"],
    ["2030-01-01", "2030-01-03"],
    ["2030-01-02", "2032-01-02"],
  ]) {
    assert.throws(
      () => hotelStay(checkIn, checkOut, { now }),
      (error) => error.status === 400,
    );
  }
});
test("owners can resolve historical dates and must enter physical room details", () => {
  assert.equal(hotelStay("2020-01-01", "2020-01-03", { allowPast: true }).nights, 2);
  assert.deepEqual(hotelRoomFields({ roomNumber: " 101 ", roomType: " Double ", maxGuests: "2" }), {
    roomNumber: "101",
    roomType: "Double",
    maxGuests: 2,
  });
  assert.throws(() => hotelRoomFields({ roomNumber: "", roomType: "Double", maxGuests: 2 }));
  assert.throws(() => hotelRoomFields({ roomNumber: "101", roomType: "Double", maxGuests: 0 }));
});
