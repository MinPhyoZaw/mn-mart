import { NextResponse } from "next/server";
import connectDB from "../../lib/mongodb";
import { requireAuth } from "../../lib/routeAuth";
import Order from "../../models/Order";
import Item from "../../models/Item";
import Shop from "../../models/Shop";

const DEPOSIT_AMOUNT = 5000;

export async function POST(req) {
  try {
    const auth = requireAuth(req, ["customer", "admin", "vendor"]);
    if (!auth.ok) return auth.response;

    const { shopId, ticketId, customerName, customerPhone, receiptImage } = await req.json();

    if (!shopId || !ticketId || !customerName || !customerPhone || !receiptImage) {
      return NextResponse.json({ success: false, message: "Missing required booking fields." }, { status: 400 });
    }

    await connectDB();
    const [shop, ticketItem] = await Promise.all([
      Shop.findById(shopId).lean(),
      Item.findOne({ _id: ticketId, shopId, type: "transport" }).lean(),
    ]);

    if (!shop || !ticketItem) {
      return NextResponse.json({ success: false, message: "Ticket not found." }, { status: 404 });
    }

    const ticketPrice = Number(ticketItem.price || 0);
    const leftToPay = Math.max(ticketPrice - DEPOSIT_AMOUNT, 0);

    const order = await Order.create({
      orderId: `ORD-${Date.now()}`,
      vendorId: shop.vendorId,
      shopId,
      customerId: auth.user.userId,
      customerName,
      customerPhone,
      customerAddress: "Transportation ticket booking",
      serviceType: "transportation",
      items: [{ itemId: ticketItem._id, name: ticketItem.name, image: ticketItem.image || null, price: ticketPrice, quantity: 1, lineTotal: ticketPrice }],
      receiptImage,
      paymentProvider: "kbzpay",
      totalAmount: ticketPrice,
      commissionRate: 1.5,
      commissionAmount: 0,
      vendorEarning: ticketPrice,
      bookingDetails: { note: `From ${ticketItem?.extra?.fromCity || "-"} to ${ticketItem?.extra?.toCity || "-"}` },
      transportationDetails: {
        fromCity: ticketItem?.extra?.fromCity || "-",
        toCity: ticketItem?.extra?.toCity || "-",
        departureDate: ticketItem?.extra?.departureDate || "",
        departureTime: ticketItem?.extra?.departureTime || "",
        depositAmount: DEPOSIT_AMOUNT,
        leftToPayAmount: leftToPay,
      },
    });

    return NextResponse.json({ success: true, message: "Transportation booking submitted.", data: order }, { status: 201 });
  } catch (error) {
    console.error("POST /api/transport-booking error:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
