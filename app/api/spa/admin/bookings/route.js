import { NextResponse } from "next/server";
import connectDB from "../../../../lib/mongodb";
import { requireAuth } from "../../../../lib/routeAuth";
import SpaBooking from "../../../../models/SpaBooking";

export async function GET(req) {
  const auth = requireAuth(req, ["admin"]);
  if (!auth.ok) return auth.response;
  await connectDB();
  const bookings = await SpaBooking.find({}).sort({ createdAt: -1 }).populate("serviceId", "serviceName").lean();
  return NextResponse.json({ success: true, data: bookings });
}
