import { NextResponse } from "next/server";
import connectDB from "../../../../lib/mongodb";
import SpaService from "../../../../models/SpaService";

export async function GET(_, { params }) {
  await connectDB();
  const service = await SpaService.findById(params.id).lean();
  if (!service) return NextResponse.json({ success: false, message: "Spa service not found." }, { status: 404 });
  return NextResponse.json({ success: true, data: service });
}
