import { NextResponse } from "next/server";
import connectDB from "../../../lib/mongodb";
import { requireAuth } from "../../../lib/routeAuth";
import Order from "../../../models/Order";

export async function GET(req) {
  try {
    const auth = requireAuth(req, ["admin"]);
    if (!auth.ok) return auth.response;

    await connectDB();

    const orders = await Order.find({ serviceType: { $ne: "transportation" } })
      .populate("vendorId", "vendorName")
      .populate("shopId", "name")
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return NextResponse.json({ success: true, data: orders });
  } catch (error) {
    console.error("GET /api/admin/orders error:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
