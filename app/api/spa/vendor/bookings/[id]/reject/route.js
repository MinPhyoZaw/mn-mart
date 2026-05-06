import { NextResponse } from "next/server";
import connectDB from "../../../../../../lib/mongodb";
import { requireAuth } from "../../../../../../lib/routeAuth";
import SpaBooking from "../../../../../../models/SpaBooking";

export async function PATCH(req, { params }) {
  const auth = requireAuth(req, ["vendor"]);
  if (!auth.ok) return auth.response;
  await connectDB();
  const booking = await SpaBooking.findByIdAndUpdate(params.id, {
    orderStatus: "CANCELLED_BY_VENDOR",
    $push: { notifications: { message: "Vendor cancelled your spa booking." } },
  }, { new: true });
  return NextResponse.json({ success: true, data: booking });
}
