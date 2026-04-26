import { NextResponse } from "next/server";
import connectDB from "../../../lib/mongodb";
import { requireAuth } from "../../../lib/routeAuth";
import Order from "../../../models/Order";

const toNotification = (order) => {
  if (order.orderStatus === "confirmed") {
    return {
      type: "confirmed",
      text: "Your payment has been verified. Your order is now confirmed and being prepared.",
    };
  }

  if (order.orderStatus === "rejected") {
    return {
      type: "rejected",
      text: "Your payment was rejected. Please contact support or submit a new receipt.",
    };
  }

  return {
    type: "pending",
    text: "Your order has been placed. Please wait for confirmation.",
  };
};

export async function GET(req) {
  try {
    const auth = requireAuth(req, ["customer", "admin", "vendor"]);
    if (!auth.ok) return auth.response;

    await connectDB();

    const orders = await Order.find({ customerId: auth.user.userId })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    const notifications = orders.map((order) => ({
      orderId: order.orderId,
      status: order.orderStatus,
      createdAt: order.createdAt,
      ...toNotification(order),
    }));

    return NextResponse.json({ success: true, data: notifications });
  } catch (error) {
    console.error("GET /api/orders/notifications error:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
