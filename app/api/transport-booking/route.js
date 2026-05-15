import { NextResponse } from "next/server";
import connectDB from "../../lib/mongodb";
import { requireAuth } from "../../lib/routeAuth";
import Order from "../../models/Order";
import Item from "../../models/Item";
import Shop from "../../models/Shop";
import TransportationRoute from "../../models/TransportationRoute";

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
      } catch (e) {
        // ignore lookup failure and fallback to ticketItem.extra values
      }
    }

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

    return NextResponse.json({ success: true, message: "Transportation booking submitted.", data: order }, { status: 201 });
  } catch (error) {
    console.error("POST /api/transport-booking error:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
