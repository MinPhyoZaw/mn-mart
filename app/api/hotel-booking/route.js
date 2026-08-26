import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "../../lib/mongodb";
import { requireAuth } from "../../lib/routeAuth";
import Vendor from "../../models/Vendor";
import Shop from "../../models/Shop";
import Item from "../../models/Item";
import Order from "../../models/Order";

const COMMISSION_RATE = 1.5;
const makeOrderId = () => `ORD-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
const isIdempotencyDuplicate = (error) =>
  error?.code === 11000 && error?.keyPattern?.idempotencyKey;

export async function POST(req) {
  let bookingKeyForError = null;

  try {
    const auth = requireAuth(req, ["customer", "vendor", "admin"]);
    if (!auth.ok) return auth.response;

    const body = await req.json();
    const {
      roomItemId,
      shopId,
      customerName,
      customerPhone,
      guestCount,
      extraBedAmount,
      note,
      receiptImage,
      paymentProvider = "kbzpay_1",
      bookingKey,
    } = body;
    bookingKeyForError = bookingKey;

    if (!roomItemId || !shopId || !customerName || !customerPhone || !receiptImage) {
      return NextResponse.json({ success: false, message: "Missing required booking fields." }, { status: 400 });
    }

    if (!mongoose.Types.ObjectId.isValid(roomItemId) || !mongoose.Types.ObjectId.isValid(shopId)) {
      return NextResponse.json({ success: false, message: "Invalid booking reference." }, { status: 400 });
    }

    if (typeof bookingKey !== "string" || bookingKey.length < 16 || bookingKey.length > 200) {
      return NextResponse.json({ success: false, message: "A valid booking key is required." }, { status: 400 });
    }

    await connectDB();

    const [shop, room] = await Promise.all([
      Shop.findById(shopId).lean(),
      Item.findById(roomItemId).lean(),
    ]);

    if (!shop || shop.category !== "hotel") {
      return NextResponse.json({ success: false, message: "Hotel shop not found." }, { status: 404 });
    }

    if (!room || String(room.shopId) !== String(shopId) || room.type !== "room" || room.isAvailable === false) {
      return NextResponse.json({ success: false, message: "Room not found." }, { status: 404 });
    }

    const vendor = await Vendor.findById(shop.vendorId).lean();
    if (!vendor) {
      return NextResponse.json({ success: false, message: "Vendor not found." }, { status: 404 });
    }

    const price = Number(room.price) || 0;
    const totalAmount = price;
    const commissionAmount = Number(((totalAmount * COMMISSION_RATE) / 100).toFixed(2));
    const vendorEarning = Number((totalAmount - commissionAmount).toFixed(2));

    let order;
    try {
      order = await Order.create({
      orderId: makeOrderId(),
      idempotencyKey: bookingKey,
      vendorId: shop.vendorId,
      shopId: shop._id,
      customerId: auth.user.userId,
      customerName,
      customerPhone,
      customerAddress: "Hotel booking",
      serviceType: "hotel",
      items: [{
        itemId: room._id,
        name: room.name,
        image: room.image || null,
        price,
        quantity: 1,
        lineTotal: totalAmount,
      }],
      bookingDetails: {
        guestCount: Number(guestCount) || 1,
        extraBedAmount: Number(extraBedAmount) || 0,
        note: note || "",
      },
      receiptImage,
      paymentProvider,
      totalAmount,
      commissionRate: COMMISSION_RATE,
      commissionAmount,
      vendorEarning,
      });
    } catch (error) {
      if (!isIdempotencyDuplicate(error)) throw error;
      order = await Order.findOne({ idempotencyKey: bookingKey }).lean();
      if (!order) throw error;
    }

    return NextResponse.json({ success: true, message: "Hotel booking submitted.", data: order }, { status: 201 });
  } catch (error) {
    if (isIdempotencyDuplicate(error) && bookingKeyForError) {
      const existingOrder = await Order.findOne({ idempotencyKey: bookingKeyForError }).lean();
      if (existingOrder) {
        return NextResponse.json({ success: true, message: "Hotel booking was already submitted.", data: existingOrder }, { status: 200 });
      }
    }
    console.error("POST /api/hotel-booking error:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
