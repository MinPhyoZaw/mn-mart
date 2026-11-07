import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "../../../../../lib/mongodb";
import { requireVendorAuth } from "../../../../../lib/routeAuth";
import Item from "../../../../../models/Item";
import Shop from "../../../../../models/Shop";
import Order from "../../../../../models/Order";
import HotelBlock from "../../../../../models/HotelBlock";
import {
  activeHotelOrders,
  lockHotelRoom,
  requireRoomAvailable,
} from "../../../../../lib/hotelAvailability";
import { hotelError, hotelStay, hotelToday } from "../../../../../lib/hotelDates";

async function ownedRoom(req, params) {
  const auth = await requireVendorAuth(req);
  if (!auth.ok) return { response: auth.response };
  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) throw hotelError("Invalid room.");
  await connectDB();
  const room = await Item.findOne({ _id: id, type: "room" }).lean();
  if (!room) throw hotelError("Room not found.", 404);
  const filter = { _id: room.shopId, category: "hotel" };
  if (auth.user.role === "vendor") filter.vendorId = auth.vendor._id;
  const shop = await Shop.findOne(filter).lean();
  if (!shop) throw hotelError("Room not found.", 404);
  return { room };
}

function failure(error) {
  if (!error.status) console.error("Hotel calendar error:", error.message);
  return NextResponse.json(
    {
      success: false,
      message: error.status ? error.message : "Unable to update the room calendar.",
    },
    { status: error.status || 500 },
  );
}

export async function GET(req, { params }) {
  try {
    const { room, response } = await ownedRoom(req, params);
    if (response) return response;
    const page = Math.max(
      1,
      Number.parseInt(new URL(req.url).searchParams.get("page") || "1", 10) || 1,
    );
    const skip = (page - 1) * 50;
    const bookings = await Order.find({
      ...activeHotelOrders([room._id]),
      $or: [
        { "bookingDetails.checkOut": { $gt: hotelToday() } },
        { "bookingDetails.checkIn": null },
        { "bookingDetails.checkOut": null },
      ],
    })
      .select("orderId bookingDetails orderStatus vendorStatus")
      .sort({ "bookingDetails.checkIn": 1 })
      .skip(skip)
      .limit(51)
      .lean();
    const blocks = await HotelBlock.find({ roomItemId: room._id, checkOut: { $gt: hotelToday() } })
      .sort({ checkIn: 1 })
      .skip(skip)
      .limit(51)
      .lean();
    return NextResponse.json(
      {
        success: true,
        data: {
          bookings: bookings.slice(0, 50),
          blocks: blocks.slice(0, 50),
          page,
          hasMore: bookings.length > 50 || blocks.length > 50,
        },
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return failure(error);
  }
}

export async function POST(req, { params }) {
  try {
    const { room, response } = await ownedRoom(req, params);
    if (response) return response;
    const body = await req.json();
    const stay = hotelStay(body.checkIn, body.checkOut);
    if (
      !["external", "maintenance"].includes(body.kind) ||
      typeof body.reason !== "string" ||
      body.reason.length > 200
    )
      throw hotelError("Choose a block type and a note of at most 200 characters.");
    const session = await mongoose.startSession();
    let block;
    try {
      await session.withTransaction(async () => {
        const locked = await lockHotelRoom(room._id, room.shopId, session, { allowClosed: true });
        await requireRoomAvailable({ ...locked, isAvailable: true }, stay, session);
        [block] = await HotelBlock.create(
          [
            {
              roomItemId: room._id,
              shopId: room.shopId,
              ...stay,
              kind: body.kind,
              reason: body.reason,
            },
          ],
          { session },
        );
      });
    } finally {
      await session.endSession();
    }
    return NextResponse.json({ success: true, data: block }, { status: 201 });
  } catch (error) {
    return failure(error);
  }
}

export async function DELETE(req, { params }) {
  try {
    const { room, response } = await ownedRoom(req, params);
    if (response) return response;
    const { blockId } = await req.json();
    if (!mongoose.Types.ObjectId.isValid(blockId)) throw hotelError("Invalid block.");
    await HotelBlock.deleteOne({ _id: blockId, roomItemId: room._id });
    return NextResponse.json({ success: true });
  } catch (error) {
    return failure(error);
  }
}

// Existing undated orders must have their dates reviewed before this room can be sold again.
export async function PATCH(req, { params }) {
  try {
    const { room, response } = await ownedRoom(req, params);
    if (response) return response;
    const body = await req.json();
    if (!mongoose.Types.ObjectId.isValid(body.orderId)) throw hotelError("Invalid booking.");
    const stay = hotelStay(body.checkIn, body.checkOut, { allowPast: true });
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        const locked = await lockHotelRoom(room._id, room.shopId, session, { allowClosed: true });
        const order = await Order.findOne({
          ...activeHotelOrders([room._id]),
          _id: body.orderId,
          shopId: room.shopId,
        })
          .session(session)
          .lean();
        if (!order || (order.bookingDetails?.checkIn && order.bookingDetails?.checkOut))
          throw hotelError("Only an existing undated booking can be updated here.", 409);
        await requireRoomAvailable(
          { ...locked, isAvailable: true },
          stay,
          session,
          order._id,
          true,
        );
        await Order.updateOne(
          { _id: order._id },
          {
            $set: {
              "bookingDetails.checkIn": stay.checkIn,
              "bookingDetails.checkOut": stay.checkOut,
              "bookingDetails.nights": stay.nights,
            },
          },
          { session },
        );
      });
    } finally {
      await session.endSession();
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return failure(error);
  }
}
