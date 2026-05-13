import { NextResponse } from "next/server";
import connectDB from "../../lib/mongodb";
import { requireAuth } from "../../lib/routeAuth";
import Vendor from "../../models/Vendor";
import Shop from "../../models/Shop";
import Item from "../../models/Item";
import Order from "../../models/Order";

const SPA_FIXED_ADMIN_FEE = 3000;
const makeOrderId = () => `ORD-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

export async function POST(req) {
  try {
    const auth = requireAuth(req, ["customer", "vendor", "admin"]);
    if (!auth.ok) return auth.response;

    const body = await req.json();
    const { serviceItemId, shopId, customerName, customerPhone, orderTime, receiptImage } = body;
    if (!serviceItemId || !shopId || !customerName || !customerPhone || !orderTime || !receiptImage) {
      return NextResponse.json({ success: false, message: "Missing required booking fields." }, { status: 400 });
    }

    await connectDB();
    const [shop, service] = await Promise.all([Shop.findById(shopId).lean(), Item.findById(serviceItemId).lean()]);
    if (!shop || shop.category !== "spa") return NextResponse.json({ success: false, message: "Spa shop not found." }, { status: 404 });
    if (!service || String(service.shopId) !== String(shopId)) return NextResponse.json({ success: false, message: "Service not found." }, { status: 404 });

    const vendor = await Vendor.findById(shop.vendorId).lean();
    if (!vendor) return NextResponse.json({ success: false, message: "Vendor not found." }, { status: 404 });

    const totalAmount = Number(service.price) || 0;
    const commissionAmount = SPA_FIXED_ADMIN_FEE;
    const vendorEarning = Number(Math.max(totalAmount - commissionAmount, 0));

    const order = await Order.create({
      orderId: makeOrderId(),
      vendorId: vendor._id,
      shopId: shop._id,
      customerId: auth.user.userId,
      customerName,
      customerPhone,
      customerAddress: "-",
      serviceType: "spa",
      items: [{ itemId: service._id, name: service.name, image: service.image || null, price: totalAmount, quantity: 1, lineTotal: totalAmount }],
      bookingDetails: { note: `Requested order time: ${orderTime}` },
      receiptImage,
      paymentProvider: "kbzpay",
      totalAmount,
      commissionRate: 0,
      commissionAmount,
      vendorEarning,
    });

    return NextResponse.json({ success: true, message: "Spa booking submitted.", data: order }, { status: 201 });
  } catch (error) {
    console.error("POST /api/spa-booking error:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
