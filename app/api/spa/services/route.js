import { NextResponse } from "next/server";
import connectDB from "../../../lib/mongodb";
import { requireAuth } from "../../../lib/routeAuth";
import Vendor from "../../../models/Vendor";
import SpaService from "../../../models/SpaService";

export async function GET() {
  await connectDB();
  const services = await SpaService.find({ isActive: true }).sort({ createdAt: -1 }).lean();
  return NextResponse.json({ success: true, data: services });
}

export async function POST(req) {
  const auth = requireAuth(req, ["vendor"]);
  if (!auth.ok) return auth.response;

  await connectDB();
  const vendor = await Vendor.findOne({ userId: auth.user.userId, serviceType: "spa" }).lean();
  if (!vendor) return NextResponse.json({ success: false, message: "Spa vendor profile not found." }, { status: 404 });

  const body = await req.json();
  const { serviceName, description, durationMinutes, priceMMK, availableSlots, maxCustomersPerSlot } = body;
  if (!serviceName || !durationMinutes || !priceMMK || !Array.isArray(availableSlots) || availableSlots.length === 0) {
    return NextResponse.json({ success: false, message: "Missing required fields." }, { status: 400 });
  }

  const service = await SpaService.create({
    vendorId: vendor._id,
    serviceName,
    description: description || "",
    durationMinutes: Number(durationMinutes),
    priceMMK: Number(priceMMK),
    availableSlots,
    maxCustomersPerSlot: Number(maxCustomersPerSlot) || 1,
  });

  return NextResponse.json({ success: true, data: service }, { status: 201 });
}
