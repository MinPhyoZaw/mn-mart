const DAY = 86400000;

export function hotelToday(now = new Date()) {
  return new Date(now.getTime() + 6.5 * 3600000).toISOString().slice(0, 10);
}

export function hotelError(message, status = 400) {
  return Object.assign(new Error(message), { status });
}

export function hotelStay(checkIn, checkOut, { allowPast = false, now = new Date() } = {}) {
  for (const date of [checkIn, checkOut]) {
    if (
      typeof date !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      !Number.isFinite(Date.parse(date)) ||
      new Date(date).toISOString().slice(0, 10) !== date
    ) {
      throw hotelError("Choose valid check-in and check-out dates.");
    }
  }
  const nights = (Date.parse(checkOut) - Date.parse(checkIn)) / DAY;
  if (nights < 1 || nights > 365) throw hotelError("A stay must be between 1 and 365 nights.");
  if (!allowPast && checkIn < hotelToday(now)) throw hotelError("Check-in cannot be in the past.");
  return { checkIn, checkOut, nights };
}

export function hotelRoomFields(body) {
  const roomNumber = typeof body.roomNumber === "string" ? body.roomNumber.trim() : "";
  const roomType = typeof body.roomType === "string" ? body.roomType.trim() : "";
  const maxGuests = Number(body.maxGuests);
  if (
    !roomNumber ||
    roomNumber.length > 40 ||
    !roomType ||
    roomType.length > 80 ||
    !Number.isInteger(maxGuests) ||
    maxGuests < 1 ||
    maxGuests > 30
  ) {
    throw hotelError("Enter a room number/name, room type, and capacity of 1–30 guests.");
  }
  return { roomNumber, roomType, maxGuests };
}
