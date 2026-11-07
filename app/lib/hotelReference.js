import HotelReferenceCounter from "../models/HotelReferenceCounter";

export async function nextHotelReference() {
  // Allocate independently of booking transactions. Failed requests can leave gaps,
  // while retries and simultaneous bookings can never share a reference.
  const filter = { _id: "hotel-bookings" };
  let counter;
  try {
    counter = await HotelReferenceCounter.findOneAndUpdate(
      filter,
      { $inc: { value: 1 } },
      { upsert: true, returnDocument: "after" },
    ).lean();
  } catch (error) {
    if (error.code !== 11000) throw error;
    counter = await HotelReferenceCounter.findOneAndUpdate(
      filter,
      { $inc: { value: 1 } },
      { returnDocument: "after" },
    ).lean();
  }
  return `MH-${String(counter.value).padStart(4, "0")}`;
}
