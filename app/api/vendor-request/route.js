import { NextResponse } from "next/server";
import connectDB from "../../lib/mongodb";
import VendorRequest from "../../models/VendorRequest";

export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();
    const saved = await VendorRequest.create(body);
    return NextResponse.json(
      { success: true, message: "Vendor request received", data: saved },
      { status: 201 }
    );
  } catch (error) {
    console.error("vendor-request error:", error);
    return NextResponse.json({ success: false, message: "Invalid request" }, { status: 400 });
  }
}
