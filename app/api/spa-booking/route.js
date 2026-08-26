import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "../../lib/mongodb";
import { requireAuth } from "../../lib/routeAuth";
import Vendor from "../../models/Vendor";
import Shop from "../../models/Shop";
import Item from "../../models/Item";
import Order from "../../models/Order";

const SPA_FIXED_ADMIN_FEE = 3000;
const makeOrderId = () => `ORD-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
const isIdempotencyDuplicate = (error) =>
  error?.code === 11000 && error?.keyPattern?.idempotencyKey;

export async function POST(req) {
  let bookingKeyForError = null;

  try {
    const auth = requireAuth(req, ["customer", "vendor", "admin"]);
    if (!auth.ok) return auth.response;

    const body = await req.json();
    const { serviceItemId, shopId, customerName, customerPhone, orderTime, receiptImage, paymentProvider = "kbzpay_1", bookingKey } = body;
    bookingKeyForError = bookingKey;
    if (!serviceItemId || !shopId || !customerName || !customerPhone || !orderTime || !receiptImage) {
      return NextResponse.json({ success: false, message: "Missing required booking fields." }, { status: 400 });
    }

    if (!mongoose.Types.ObjectId.isValid(serviceItemId) || !mongoose.Types.ObjectId.isValid(shopId)) {
      return NextResponse.json({ success: false, message: "Invalid booking reference." }, { status: 400 });
    }

    if (typeof bookingKey !== "string" || bookingKey.length < 16 || bookingKey.length > 200) {
      return NextResponse.json({ success: false, message: "A valid booking key is required." }, { status: 400 });
    }

    await connectDB();
    const [shop, service] = await Promise.all([Shop.findById(shopId).lean(), Item.findById(serviceItemId).lean()]);
    if (!shop || shop.category !== "spa") return NextResponse.json({ success: false, message: "Spa shop not found." }, { status: 404 });
    if (!service || String(service.shopId) !== String(shopId) || service.type !== "service" || service.isAvailable === false) return NextResponse.json({ success: false, message: "Service not found." }, { status: 404 });

    const vendor = await Vendor.findById(shop.vendorId).lean();
    if (!vendor) return NextResponse.json({ success: false, message: "Vendor not found." }, { status: 404 });

    const totalAmount = Number(service.price) || 0;
    const commissionAmount = SPA_FIXED_ADMIN_FEE;
    const vendorEarning = Number(Math.max(totalAmount - commissionAmount, 0));

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
      customerAddress: "-",
      serviceType: "spa",
      items: [{ itemId: service._id, name: service.name, image: service.image || null, price: totalAmount, quantity: 1, lineTotal: totalAmount }],
      bookingDetails: { note: `Requested order time: ${orderTime}` },
      receiptImage,
      paymentProvider,
      totalAmount,
      commissionRate: 0,
      commissionAmount,
      vendorEarning,
      });
    } catch (error) {
      if (!isIdempotencyDuplicate(error)) throw error;
      order = await Order.findOne({ idempotencyKey: bookingKey }).lean();
      if (!order) throw error;
    }

    return NextResponse.json({ success: true, message: "Spa booking submitted.", data: order }, { status: 201 });
  } catch (error) {
    if (isIdempotencyDuplicate(error) && bookingKeyForError) {
      const existingOrder = await Order.findOne({ idempotencyKey: bookingKeyForError }).lean();
      if (existingOrder) {
        return NextResponse.json({ success: true, message: "Spa booking was already submitted.", data: existingOrder }, { status: 200 });
      }
    }
    console.error("POST /api/spa-booking error:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
