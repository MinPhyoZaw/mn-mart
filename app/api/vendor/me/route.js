import { NextResponse } from "next/server";
import connectDB from "../../../lib/mongodb";
import Vendor from "../../../models/Vendor";
import Shop from "../../../models/Shop";
import { requireAuth } from "../../../lib/routeAuth";

export async function GET(req) {
  try {
    const auth = requireAuth(req, ["vendor", "admin"]);
    if (!auth.ok) return auth.response;

    await connectDB();

    const vendor = await Vendor.findOne({ userId: auth.user.userId }).lean();
    if (!vendor) {
      return NextResponse.json({ success: false, message: "Vendor profile not found" }, { status: 404 });
    }

    const shop = await Shop.findOne({ vendorId: vendor._id }).lean();
    if (!shop) {
      return NextResponse.json({ success: false, message: "Vendor shop not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: { vendor, shop } }, { status: 200 });
  } catch (error) {
    console.error("GET /api/vendor/me error:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
