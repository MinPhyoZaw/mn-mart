import { NextResponse } from "next/server";
import connectDB from "../../../../lib/mongodb";
import { requireVendorAuth } from "../../../../lib/routeAuth";
import Vendor from "../../../../models/Vendor";
import Order from "../../../../models/Order";
import Shop from "../../../../models/Shop";

export async function PATCH(req, { params }) {
  try {
    const auth = await requireVendorAuth(req);
    if (!auth.ok) return auth.response;

    const { id } = params;
    const { action } = await req.json();

    if (!["accepted", "rejected"].includes(action)) {
      return NextResponse.json({ success: false, message: "Invalid action" }, { status: 400 });
    }

    await connectDB();

    const vendor = await Vendor.findOne({ userId: auth.user.userId }).lean();
    if (!vendor) {
      return NextResponse.json({ success: false, message: "Vendor profile not found" }, { status: 404 });
    }

    const existingOrder = await Order.findOne({ _id: id, vendorId: vendor._id }).lean();
    if (!existingOrder) {
      return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 });
    }

    if (existingOrder.orderStatus !== "confirmed") {
      return NextResponse.json(
        { success: false, message: "You can only respond after admin approval." },
        { status: 400 }
      );
    }

    const order = await Order.findOneAndUpdate(
      { _id: id, vendorId: vendor._id },
      { vendorStatus: action },
      { new: true }
    ).lean();

    if (!order) {
      return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 });
    }

    if (
      action === "accepted" &&
      order.orderStatus === "confirmed" &&
      existingOrder.settlementStatus !== "settled"
    ) {
      const approvedQty = (order.items || []).reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);

      await Promise.all([
        Shop.findByIdAndUpdate(order.shopId, {
          $inc: {
            approvedOrderQty: approvedQty,
            approvedIncome: Number(order.vendorEarning) || 0,
          },
        }),
        Order.findByIdAndUpdate(order._id, { settlementStatus: "settled" }),
      ]);

      order.settlementStatus = "settled";
    }

    return NextResponse.json({ success: true, data: order });
  } catch (error) {
    console.error("PATCH /api/vendor/orders/[id] error:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
