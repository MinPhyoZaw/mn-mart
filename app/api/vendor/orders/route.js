import { NextResponse } from "next/server";
import connectDB from "../../../lib/mongodb";
import { requireVendorAuth } from "../../../lib/routeAuth";
import Vendor from "../../../models/Vendor";
import Order from "../../../models/Order";

export async function GET(req) {
  try {
    const auth = await requireVendorAuth(req);
    if (!auth.ok) return auth.response;

    await connectDB();

    const vendor = await Vendor.findOne({ userId: auth.user.userId }).lean();
    if (!vendor) {
      return NextResponse.json({ success: false, message: "Vendor profile not found" }, { status: 404 });
    }

    const orders = await Order.find({ vendorId: vendor._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return NextResponse.json({ success: true, data: orders });
  } catch (error) {
    console.error("GET /api/vendor/orders error:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
