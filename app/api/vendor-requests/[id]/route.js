import { NextResponse } from "next/server";
import connectDB from "../../../lib/mongodb";
import VendorRequest from "../../../models/VendorRequest";
import Vendor from "../../../models/Vendor";
export async function PATCH(req, context) {
  try {
    await connectDB();
    const { params } = context;
    const { id } = await params;
    const body = await req.json();
    const action = body.action;

    const vr = await VendorRequest.findById(id);
    if (!vr) return NextResponse.json({ success: false, message: "Not found" }, { status: 404 });

    if (action === "approve") {
      if (vr.status === "approved") {
        return NextResponse.json({ success: false, message: "Already approved" }, { status: 400 });
      }

      // create Vendor using request data; fill missing required fields with placeholders
      const vendorName = vr.businessName || "Unnamed Vendor";
      const serviceType = vr.vendorType || "shopping";
      const contactPerson = vr.businessName || "Owner";
      const phone = vr.phone || "N/A";
      const address = vr.address || "N/A";
      const email = `${vendorName.toLowerCase().replace(/[^a-z0-9]+/g, "")}-${Date.now()}@example.com`;

      const newVendor = await Vendor.create({
        vendorName,
        serviceType,
        contactPerson,
        phone,
        email,
        address,
      });

      // create corresponding Shop
      const Shop = (await import("../../../models/Shop")).default;
      const newShop = await Shop.create({
        vendorId: newVendor._id,
        name: vendorName,
        category: serviceType,
        phone,
        address,
        description: vr.description || "",
      });

      vr.status = "approved";
      await vr.save();

      return NextResponse.json({ success: true, message: "Approved", vendor: newVendor, shop: newShop, request: vr }, { status: 200 });
    }

    if (action === "reject") {
      if (vr.status === "rejected") {
        return NextResponse.json({ success: false, message: "Already rejected" }, { status: 400 });
      }
      vr.status = "rejected";
      await vr.save();
      return NextResponse.json({ success: true, message: "Rejected", request: vr }, { status: 200 });
    }

    return NextResponse.json({ success: false, message: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("vendor-requests PATCH error:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
