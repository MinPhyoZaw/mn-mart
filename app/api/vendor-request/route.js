import { NextResponse } from "next/server";
import connectDB from "../../lib/mongodb";
import VendorRequest from "../../models/VendorRequest";
import User from "../../models/User";
import { requireAuth } from "../../lib/routeAuth";

export async function POST(req) {
  try {
    const auth = requireAuth(req, ["customer"]);
    if (!auth.ok) return auth.response;

    await connectDB();
    const body = await req.json();
    const { businessName, vendorType, phone, address, description } = body;
    const requestUser = await User.findById(auth.user.userId).lean();
    const vendorName = requestUser?.name?.trim();

    if (!businessName || !vendorType || !vendorName) {
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 });
    }

    const existingPending = await VendorRequest.findOne({
      userId: auth.user.userId,
      status: "pending",
    });
    if (existingPending) {
      return NextResponse.json(
        { success: false, message: "You already have a pending request" },
        { status: 400 }
      );
    }

    const saved = await VendorRequest.create({
      vendorName,
      businessName,
      vendorType,
      phone: phone || "",
      address: address || "",
      description: description || "",
      userId: auth.user.userId,
      status: "pending",
    });
    return NextResponse.json(
      { success: true, message: "Vendor request received", data: saved },
      { status: 201 }
    );
  } catch (error) {
    console.error("vendor-request error:", error);
    return NextResponse.json({ success: false, message: "Invalid request" }, { status: 400 });
  }
}
