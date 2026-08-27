import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "../../../../lib/mongodb";
import { requireAuth } from "../../../../lib/routeAuth";
import Order from "../../../../models/Order";

export async function PATCH(req, { params }) {
  try {
    const auth = requireAuth(req, ["admin"]);
    if (!auth.ok) return auth.response;

    const { id } = params;
    const { action } = await req.json();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: "Invalid order ID" }, { status: 400 });
    }

    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json({ success: false, message: "Invalid action" }, { status: 400 });
    }

    await connectDB();

    const update =
      action === "approve"
        ? {
            paymentStatus: "paid",
            orderStatus: "confirmed",
            settlementStatus: "unsettled",
            customerNotificationRead: false,
          }
        : {
            paymentStatus: "rejected",
            orderStatus: "rejected",
            settlementStatus: "unsettled",
            customerNotificationRead: false,
          };

    const order = await Order.findOneAndUpdate(
      { _id: id, orderStatus: "pending" },
      { $set: update },
      { new: true }
    ).lean();

    if (!order) {
      const orderExists = await Order.exists({ _id: id });

      if (!orderExists) {
        return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 });
      }

      return NextResponse.json(
        { success: false, message: "Order has already been processed" },
        { status: 409 }
      );
    }

    return NextResponse.json({ success: true, data: order });
  } catch (error) {
    console.error("PATCH /api/admin/orders/[id] error:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
