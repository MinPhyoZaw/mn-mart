import { NextResponse } from "next/server";
import connectDB from "../../../lib/mongodb";
import { requireAuth } from "../../../lib/routeAuth";
import Order from "../../../models/Order";
import Vendor from "../../../models/Vendor";

const toNotification = (order) => {
  if (order.role === "admin") {
    return {
      type: "new-order",
      text: `New order ${order.orderId} from ${order.customerName || "customer"} is waiting for admin review.`,
    };
  }

  if (order.role === "vendor") {
    return {
      type: "new-order",
      text: `New order ${order.orderId} is ready for vendor action.`,
    };
  }

  if (order.orderStatus === "confirmed" && order.vendorStatus === "accepted" && order.serviceType === "hotel") {
    return {
      type: "confirmed",
      text: "Your room booking is confirm ,thank you for using mn-mart",
    };
  }

  if (order.orderStatus === "confirmed" && order.serviceType === "transportation" && order.vendorStatus === "accepted") {
    return {
      type: "confirmed",
      text: "Your transportation ticket is accepted by vendor.",
      thankYouMessage: "Download your ticket and show it to vendor on ride day.",
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

    let orders = [];

    if (auth.user.role === "customer") {
      orders = await Order.find({ customerId: auth.user.userId, customerNotificationRead: { $ne: true } })
        .sort({ createdAt: -1 })
        .limit(20)
        .lean();
    }

    if (auth.user.role === "admin") {
      orders = await Order.find({ orderStatus: "pending", adminNotificationRead: { $ne: true } })
        .sort({ createdAt: -1 })
        .limit(20)
        .lean();
      orders = orders.map((order) => ({ ...order, role: "admin" }));
    }

    if (auth.user.role === "vendor") {
      const vendor = await Vendor.findOne({ userId: auth.user.userId }).lean();
      if (!vendor) return NextResponse.json({ success: true, data: [] });
      orders = await Order.find({ vendorId: vendor._id, orderStatus: "pending", vendorNotificationRead: { $ne: true } })
        .sort({ createdAt: -1 })
        .limit(20)
        .lean();
      orders = orders.map((order) => ({ ...order, role: "vendor" }));
    }

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
    const auth = requireAuth(req, ["customer", "admin", "vendor"]);
    if (!auth.ok) return auth.response;

    const { orderId } = await req.json();
    if (!orderId) {
      return NextResponse.json({ success: false, message: "orderId is required." }, { status: 400 });
    }

    await connectDB();

    let query = {};
    let update = {};

    if (auth.user.role === "customer") {
      query = { _id: orderId, customerId: auth.user.userId };
      update = { customerNotificationRead: true };
    } else if (auth.user.role === "admin") {
      query = { _id: orderId };
      update = { adminNotificationRead: true };
    } else if (auth.user.role === "vendor") {
      const vendor = await Vendor.findOne({ userId: auth.user.userId }).lean();
      if (!vendor) {
        return NextResponse.json({ success: false, message: "Vendor profile not found." }, { status: 404 });
      }
      query = { _id: orderId, vendorId: vendor._id };
      update = { vendorNotificationRead: true };
    }

    const updatedOrder = await Order.findOneAndUpdate(query, update, { new: true }).lean();

    if (!updatedOrder) {
      return NextResponse.json({ success: false, message: "Notification not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PATCH /api/orders/notifications error:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
