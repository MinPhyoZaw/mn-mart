import { NextResponse } from "next/server";
import connectDB from "../../../../lib/mongodb";
import { requireAuth } from "../../../../lib/routeAuth";
import Order from "../../../../models/Order";

export async function PATCH(req, { params }) {
  try {
    const auth = requireAuth(req, ["admin"]);
    if (!auth.ok) return auth.response;

    const { id } = params;
    const { action } = await req.json();

    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json({ success: false, message: "Invalid action" }, { status: 400 });
    }

    await connectDB();

    const update =
      action === "approve"
        ? { paymentStatus: "paid", orderStatus: "confirmed" }
        : { paymentStatus: "rejected", orderStatus: "rejected" };

    const order = await Order.findByIdAndUpdate(id, update, { new: true }).lean();
    if (!order) {
      return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: order });
  } catch (error) {
    console.error("PATCH /api/admin/orders/[id] error:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
