import { NextResponse } from "next/server";
import connectDB from "../../../lib/mongodb";
import { requireAuth } from "../../../lib/routeAuth";
import Vendor from "../../../models/Vendor";
import Order from "../../../models/Order";

const getDayRange = () => {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

export async function GET(req) {
  try {
    const auth = requireAuth(req, ["vendor", "admin"]);
    if (!auth.ok) return auth.response;

    await connectDB();

    const vendor = await Vendor.findOne({ userId: auth.user.userId }).lean();
    if (!vendor) {
      return NextResponse.json({ success: false, message: "Vendor profile not found" }, { status: 404 });
    }

    const { start, end } = getDayRange();

    const todayOrders = await Order.find({
      vendorId: vendor._id,
      orderStatus: "confirmed",
      vendorStatus: "accepted",
      createdAt: { $gte: start, $lte: end },
    }).lean();

    const salesAmount = todayOrders.reduce((sum, order) => sum + (order.vendorEarning || 0), 0);
    const commissionAmount = todayOrders.reduce((sum, order) => sum + (order.commissionAmount || 0), 0);

    return NextResponse.json({
      success: true,
      data: {
        vendorName: vendor.vendorName,
        todaySalesAmount: salesAmount,
        todayAmountToAdmin: commissionAmount,
        todayOrderCount: todayOrders.length,
      },
    });
  } catch (error) {
    console.error("GET /api/vendor/checkout-summary error", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
