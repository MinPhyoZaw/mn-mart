import { NextResponse } from "next/server";
import connectDB from "../../lib/mongodb";
import { requireAuth } from "../../lib/routeAuth";
import Vendor from "../../models/Vendor";
import Shop from "../../models/Shop";
import Item from "../../models/Item";
import Order from "../../models/Order";

const COMMISSION_RATE = 1.5;
const makeOrderId = () => `ORD-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

export async function POST(req) {
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
    } = body;

    if (!roomItemId || !shopId || !customerName || !customerPhone || !receiptImage) {
      return NextResponse.json({ success: false, message: "Missing required booking fields." }, { status: 400 });
    }

    await connectDB();

    const [shop, room] = await Promise.all([
      Shop.findById(shopId).lean(),
      Item.findById(roomItemId).lean(),
    ]);

    if (!shop || shop.category !== "hotel") {
      return NextResponse.json({ success: false, message: "Hotel shop not found." }, { status: 404 });
    }

    if (!room || String(room.shopId) !== String(shopId)) {
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

    const order = await Order.create({
      orderId: makeOrderId(),
      vendorId: vendor._id,
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
      paymentProvider: "kbzpay",
      totalAmount,
      commissionRate: COMMISSION_RATE,
      commissionAmount,
      vendorEarning,
    });

    return NextResponse.json({ success: true, message: "Hotel booking submitted.", data: order }, { status: 201 });
  } catch (error) {
    console.error("POST /api/hotel-booking error:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
