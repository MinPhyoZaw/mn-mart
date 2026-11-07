import Item from "../models/Item";
import Order from "../models/Order";
import HotelBlock from "../models/HotelBlock";
import { hotelError } from "./hotelDates";

export function activeHotelOrders(roomIds) {
  return {
    serviceType: "hotel",
    "items.itemId": { $in: roomIds },
    orderStatus: { $ne: "rejected" },
    paymentStatus: { $ne: "rejected" },
    vendorStatus: { $ne: "rejected" },
  };
}

export async function roomAvailability(
  rooms,
  stay,
  session = null,
  excludeOrderId = null,
  ignoreUndated = false,
) {
  const ids = rooms.map((room) => room._id);
  if (!stay || !ids.length) {
    return rooms.map((room) => ({
      ...room,
      availability: room.isAvailable === false ? "unavailable" : "select_dates",
    }));
  }
  const orderFilter = {
    ...activeHotelOrders(ids),
    $or: [
      {
        "bookingDetails.checkIn": { $lt: stay.checkOut },
        "bookingDetails.checkOut": { $gt: stay.checkIn },
      },
      ...(!ignoreUndated
        ? [
            { "bookingDetails.checkIn": null },
            { "bookingDetails.checkOut": null },
            { "bookingDetails.checkIn": "" },
            { "bookingDetails.checkOut": "" },
          ]
        : []),
    ],
  };
  if (excludeOrderId) orderFilter._id = { $ne: excludeOrderId };
  // Transactions use sequential operations on their session.
  const orders = await Order.find(orderFilter).select("items.itemId").session(session).lean();
  const blocks = await HotelBlock.find({
    roomItemId: { $in: ids },
    checkIn: { $lt: stay.checkOut },
    checkOut: { $gt: stay.checkIn },
  })
    .select("roomItemId")
    .session(session)
    .lean();
  const occupied = new Set([
    ...orders.flatMap((order) => order.items.map((item) => String(item.itemId))),
    ...blocks.map((block) => String(block.roomItemId)),
  ]);
  return rooms.map((room) => ({
    ...room,
    availability:
      room.isAvailable === false || occupied.has(String(room._id)) ? "unavailable" : "available",
  }));
}

// Every writer of a room's calendar takes this write inside its transaction.
// MongoDB retries conflicting transactions, so only one overlapping request can commit.
export async function lockHotelRoom(roomItemId, shopId, session, { allowClosed = false } = {}) {
  const filter = { _id: roomItemId, shopId, type: "room" };
  if (!allowClosed) filter.isAvailable = { $ne: false };
  const room = await Item.findOneAndUpdate(
    filter,
    { $inc: { hotelCalendarVersion: 1 } },
    { returnDocument: "after", session },
  ).lean();
  if (!room) throw hotelError("Room is unavailable or no longer exists.", 409);
  return room;
}

export async function requireRoomAvailable(
  room,
  stay,
  session,
  excludeOrderId = null,
  ignoreUndated = false,
) {
  const [result] = await roomAvailability([room], stay, session, excludeOrderId, ignoreUndated);
  if (result.availability !== "available")
    throw hotelError("This room is unavailable for those dates.", 409);
}
