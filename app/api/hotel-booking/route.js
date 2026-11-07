import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "../../lib/mongodb";
import { requireAuth } from "../../lib/routeAuth";
import Shop from "../../models/Shop";
import Vendor from "../../models/Vendor";
import Order from "../../models/Order";
import { hotelError, hotelStay } from "../../lib/hotelDates";
import { lockHotelRoom, requireRoomAvailable } from "../../lib/hotelAvailability";

function matchingRetry(order, userId, roomItemId, shopId, stay) {
  if (
    String(order.customerId) !== String(userId) ||
    order.serviceType !== "hotel" ||
    String(order.shopId) !== String(shopId) ||
    String(order.items?.[0]?.itemId) !== String(roomItemId) ||
    order.bookingDetails?.checkIn !== stay.checkIn ||
    order.bookingDetails?.checkOut !== stay.checkOut
  ) {
    throw hotelError("This booking key has already been used. Start a new booking.", 409);
  }
  return order;
}

export async function POST(req) {
  let retry = null;
  try {
    const auth = requireAuth(req, ["customer", "vendor", "admin"]);
    if (!auth.ok) return auth.response;
    const body = await req.json();
    const { roomItemId, shopId, customerName, customerPhone, receiptImage, bookingKey } = body;
    const stay = hotelStay(body.checkIn, body.checkOut, { allowPast: true });
    const guestCount = Number(body.guestCount ?? 1);
    const extraBedAmount = Number(body.extraBedAmount ?? 0);
    const paymentProvider = body.paymentProvider || "kbzpay_2";
    if (![roomItemId, shopId].every((id) => mongoose.Types.ObjectId.isValid(id)))
      throw hotelError("Invalid room or hotel.");
    if (
      typeof customerName !== "string" ||
      !customerName.trim() ||
      customerName.length > 100 ||
      typeof customerPhone !== "string" ||
      !customerPhone.trim() ||
      customerPhone.length > 30 ||
      typeof receiptImage !== "string" ||
      !receiptImage.startsWith("https://") ||
      !Number.isInteger(guestCount) ||
      guestCount < 1 ||
      guestCount > 30 ||
      !Number.isInteger(extraBedAmount) ||
      extraBedAmount < 0 ||
      extraBedAmount > 10 ||
      (body.note !== undefined && (typeof body.note !== "string" || body.note.length > 1000)) ||
      !["kbzpay", "wave", "kbzpay_1", "kbzpay_2", "mmqr_1", "mmqr_2"].includes(paymentProvider)
    ) {
      throw hotelError("Enter valid guest details and a payment receipt.");
    }
    if (typeof bookingKey !== "string" || bookingKey.length < 16 || bookingKey.length > 200)
      throw hotelError("A valid booking key is required.");
    await connectDB();
    retry = { bookingKey, userId: auth.user.userId, roomItemId, shopId, stay };
    const session = await mongoose.startSession();
    let order;
    try {
      await session.withTransaction(async () => {
        const existing = await Order.findOne({ idempotencyKey: bookingKey })
          .session(session)
          .lean();
        if (existing) {
          order = matchingRetry(existing, auth.user.userId, roomItemId, shopId, stay);
          return;
        }
        hotelStay(stay.checkIn, stay.checkOut);
        const shop = await Shop.findOne({
          _id: shopId,
          category: "hotel",
          isActive: { $ne: false },
        })
          .session(session)
          .lean();
        if (!shop) throw hotelError("Hotel is unavailable.", 404);
        if (!await Vendor.exists({ _id: shop.vendorId }).session(session)) {
          throw hotelError("Hotel vendor is unavailable.", 404);
        }
        const room = await lockHotelRoom(roomItemId, shopId, session);
        if (room.maxGuests && guestCount > room.maxGuests)
          throw hotelError(`This room accommodates at most ${room.maxGuests} guests.`);
        if (extraBedAmount && !room.extra?.amenities?.extraBed)
          throw hotelError("Extra beds are not available for this room.");
        await requireRoomAvailable(room, stay, session);
        const price = Number(room.price);
        if (!Number.isFinite(price) || price < 0)
          throw hotelError("Room price is unavailable.", 409);
        const totalAmount = Number((price * stay.nights).toFixed(2));
        const commissionAmount = Number((totalAmount * 0.015).toFixed(2));
        [order] = await Order.create(
          [
            {
              orderId: `ORD-${randomUUID()}`,
              idempotencyKey: bookingKey,
              vendorId: shop.vendorId,
              shopId,
              customerId: auth.user.userId,
              customerName: customerName.trim(),
              customerPhone: customerPhone.trim(),
              customerAddress: "Hotel booking",
              serviceType: "hotel",
              items: [
                {
                  itemId: room._id,
                  name: room.name,
                  image: room.image || null,
                  price,
                  quantity: stay.nights,
                  lineTotal: totalAmount,
                },
              ],
              bookingDetails: { ...stay, guestCount, extraBedAmount, note: body.note || "" },
              receiptImage,
              paymentProvider,
              totalAmount,
              commissionRate: 1.5,
              commissionAmount,
              vendorEarning: Number((totalAmount - commissionAmount).toFixed(2)),
            },
          ],
          { session },
        );
      });
    } finally {
      await session.endSession();
    }
    return NextResponse.json(
      {
        success: true,
        message: "Hotel booking submitted. Dates reserved pending review.",
        data: order,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error?.code === 11000 && retry) {
      try {
        const existing = await Order.findOne({ idempotencyKey: retry.bookingKey }).lean();
        if (existing) {
          const order = matchingRetry(
            existing,
            retry.userId,
            retry.roomItemId,
            retry.shopId,
            retry.stay,
          );
          return NextResponse.json({ success: true, data: order });
        }
      } catch (retryError) {
        return NextResponse.json(
          {
            success: false,
            message: retryError.status
              ? retryError.message
              : "Unable to verify booking. Retry the same request.",
          },
          { status: retryError.status || 500 },
        );
      }
    }
    if (error?.status)
      return NextResponse.json(
        { success: false, message: error.message },
        { status: error.status },
      );
    console.error("POST /api/hotel-booking error:", error?.message);
    return NextResponse.json(
      { success: false, message: "Unable to submit booking. Retry the same request." },
      { status: 500 },
    );
  }
}
