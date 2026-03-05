import { NextResponse } from "next/server";
import connectDB from "../../lib/mongodb";
import Vendor from "../../models/Vendor";

export async function GET() {
  try {
    await connectDB();
    const vendors = await Vendor.find({}).lean();
    return NextResponse.json({ success: true, data: vendors }, { status: 200 });
  } catch (error) {
    console.error("GET /api/vendors error:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();

    const { vendorName, serviceType, contactPerson, phone, email, address } = body;
    if (!vendorName || !serviceType || !contactPerson || !phone || !email || !address) {
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 });
    }

    const exists = await Vendor.findOne({ email });
    if (exists) return NextResponse.json({ success: false, message: "Vendor exists" }, { status: 400 });

    const vendor = await Vendor.create(body);
    return NextResponse.json({ success: true, data: vendor }, { status: 201 });
  } catch (error) {
    console.error("POST /api/vendors error:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
