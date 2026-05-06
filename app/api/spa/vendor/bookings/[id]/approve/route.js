import { NextResponse } from "next/server";
import connectDB from "../../../../../../lib/mongodb";
import { requireAuth } from "../../../../../../lib/routeAuth";
import Vendor from "../../../../../../models/Vendor";
import SpaBooking from "../../../../../../models/SpaBooking";

export async function PATCH(req, { params }) {
  const auth = requireAuth(req, ["vendor"]);
  if (!auth.ok) return auth.response;

  await connectDB();
  const vendor = await Vendor.findOne({ userId: auth.user.userId, serviceType: "spa" }).lean();
  if (!vendor) return NextResponse.json({ success: false, message: "Spa vendor profile not found." }, { status: 404 });

  const booking = await SpaBooking.findOneAndUpdate(
    { _id: params.id, vendorId: vendor._id, orderStatus: "APPROVED_BY_ADMIN" },
    { orderStatus: "CONFIRMED", $push: { notifications: { message: "Vendor confirmed your spa booking." } } },
    { new: true }
  );
  if (!booking) return NextResponse.json({ success: false, message: "Booking not found or not eligible." }, { status: 404 });

  return NextResponse.json({ success: true, data: booking });
}
