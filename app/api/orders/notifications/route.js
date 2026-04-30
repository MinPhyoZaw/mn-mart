import { NextResponse } from "next/server";
import connectDB from "../../../lib/mongodb";
import { requireAuth } from "../../../lib/routeAuth";
import Order from "../../../models/Order";

const toNotification = (order) => {
  if (order.orderStatus === "confirmed" && order.vendorStatus === "accepted" && order.serviceType === "hotel") {
    return {
      type: "confirmed",
      text: "Your room booking is confirm ,thank you for using mn-mart",
    };
  }

  if (order.orderStatus === "confirmed") {
    return {
      type: "confirmed",
      text: "Your order is confirmed.",
      thankYouMessage: "Thank you for using MN Mart.",
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

    const orders = await Order.find({ customerId: auth.user.userId, customerNotificationRead: false })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    const notifications = orders.map((order) => ({
      _id: order._id,
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

export async function PATCH(req) {
  try {
    const auth = requireAuth(req, ["customer"]);
    if (!auth.ok) return auth.response;

    const { orderId } = await req.json();
    if (!orderId) {
      return NextResponse.json({ success: false, message: "orderId is required." }, { status: 400 });
    }

    await connectDB();

    const updatedOrder = await Order.findOneAndUpdate(
      { _id: orderId, customerId: auth.user.userId },
      { customerNotificationRead: true },
      { new: true }
    ).lean();

    if (!updatedOrder) {
      return NextResponse.json({ success: false, message: "Notification not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PATCH /api/orders/notifications error:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
