import { NextResponse } from "next/server";
import connectDB from "../../../../lib/mongodb";
import { requireAuth } from "../../../../lib/routeAuth";
import Vendor from "../../../../models/Vendor";
import SpaBooking from "../../../../models/SpaBooking";

export async function GET(req) {
  const auth = requireAuth(req, ["vendor"]);
  if (!auth.ok) return auth.response;

  await connectDB();
  const vendor = await Vendor.findOne({ userId: auth.user.userId, serviceType: "spa" }).lean();
  if (!vendor) return NextResponse.json({ success: false, message: "Spa vendor profile not found." }, { status: 404 });

  const bookings = await SpaBooking.find({ vendorId: vendor._id, orderStatus: "APPROVED_BY_ADMIN" })
    .sort({ createdAt: -1 })
    .populate("serviceId", "serviceName")
    .lean();
  return NextResponse.json({ success: true, data: bookings });
}
