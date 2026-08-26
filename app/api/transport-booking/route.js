import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "../../lib/mongodb";
import { requireAuth } from "../../lib/routeAuth";
import Order from "../../models/Order";
import Item from "../../models/Item";
import Shop from "../../models/Shop";
import TransportationRoute from "../../models/TransportationRoute";

const DEPOSIT_AMOUNT = 5000;
const isIdempotencyDuplicate = (error) =>
  error?.code === 11000 && error?.keyPattern?.idempotencyKey;

export async function POST(req) {
  let bookingKeyForError = null;

  try {
    const auth = requireAuth(req, ["customer", "admin", "vendor"]);
    if (!auth.ok) return auth.response;

    const body = await req.json();
    const { shopId, ticketId, customerName, customerPhone, receiptImage, paymentProvider = "kbzpay_1", bookingKey } = body;
    bookingKeyForError = bookingKey;

    if (!shopId || !ticketId || !customerName || !customerPhone || !receiptImage) {
      return NextResponse.json({ success: false, message: "Missing required booking fields." }, { status: 400 });
    }

    if (!mongoose.Types.ObjectId.isValid(shopId) || !mongoose.Types.ObjectId.isValid(ticketId)) {
      return NextResponse.json({ success: false, message: "Invalid booking reference." }, { status: 400 });
    }

    if (typeof bookingKey !== "string" || bookingKey.length < 16 || bookingKey.length > 200) {
      return NextResponse.json({ success: false, message: "A valid booking key is required." }, { status: 400 });
    }

    await connectDB();
    const [shop, ticketItem] = await Promise.all([
      Shop.findById(shopId).lean(),
      Item.findOne({ _id: ticketId, shopId, type: "transport" }).lean(),
    ]);

    if (!shop || shop.category !== "transportation" || !ticketItem || ticketItem.isAvailable === false) {
      return NextResponse.json({ success: false, message: "Ticket not found." }, { status: 404 });
    }

    const ticketPrice = Number(ticketItem.price || 0);
    const leftToPay = Math.max(ticketPrice - DEPOSIT_AMOUNT, 0);

    // Ensure ticketItem.extra contains route details (for older items that stored only routeId)
    let fromCity = ticketItem?.extra?.fromCity || null;
    let toCity = ticketItem?.extra?.toCity || null;
    if ((!fromCity || !toCity) && ticketItem?.extra?.routeId) {
      try {
        const route = await TransportationRoute.findById(ticketItem.extra.routeId).lean();
        if (route) {
          fromCity = route.fromCity;
          toCity = route.toCity;
        }
      } catch {
        // ignore lookup failure and fallback to ticketItem.extra values
      }
    }

    let order;
    try {
      order = await Order.create({
      orderId: `ORD-${Date.now()}`,
      idempotencyKey: bookingKey,
      vendorId: shop.vendorId,
      shopId,
      customerId: auth.user.userId,
      customerName,
      customerPhone,
      customerAddress: "Transportation ticket booking",
      serviceType: "transportation",
      items: [{ itemId: ticketItem._id, name: ticketItem.name, image: ticketItem.image || null, price: ticketPrice, quantity: 1, lineTotal: ticketPrice }],
      receiptImage,
      paymentProvider,
      paymentStatus: "paid",
      totalAmount: ticketPrice,
      commissionRate: 1.5,
      commissionAmount: 0,
      vendorEarning: ticketPrice,
      orderStatus: "confirmed",
      adminNotificationRead: true,
      bookingDetails: { note: `From ${fromCity || "-"} to ${toCity || "-"}` },
      transportationDetails: {
        fromCity: fromCity || "-",
        toCity: toCity || "-",
        departureDate: ticketItem?.extra?.departureDate || "",
        departureTime: ticketItem?.extra?.departureTime || "",
        depositAmount: DEPOSIT_AMOUNT,
        leftToPayAmount: leftToPay,
      },
      });
    } catch (error) {
      if (!isIdempotencyDuplicate(error)) throw error;
      order = await Order.findOne({ idempotencyKey: bookingKey }).lean();
      if (!order) throw error;
    }

    return NextResponse.json({ success: true, message: "Transportation booking submitted.", data: order }, { status: 201 });
  } catch (error) {
    if (isIdempotencyDuplicate(error) && bookingKeyForError) {
      const existingOrder = await Order.findOne({ idempotencyKey: bookingKeyForError }).lean();
      if (existingOrder) {
        return NextResponse.json({ success: true, message: "Transportation booking was already submitted.", data: existingOrder }, { status: 200 });
      }
    }
    console.error("POST /api/transport-booking error:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
