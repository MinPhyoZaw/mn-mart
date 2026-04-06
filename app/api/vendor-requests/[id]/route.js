import { NextResponse } from "next/server";
import connectDB from "../../../lib/mongodb";
import VendorRequest from "../../../models/VendorRequest";
import Vendor from "../../../models/Vendor";
import User from "../../../models/User";
import { requireAuth } from "../../../lib/routeAuth";

export async function PATCH(req, context) {
  try {
    const auth = requireAuth(req, ["admin"]);
    if (!auth.ok) return auth.response;

    await connectDB();
    const { id } = await context.params;
    const { action } = await req.json();

    const vr = await VendorRequest.findById(id);
    if (!vr) return NextResponse.json({ success: false, message: "Not found" }, { status: 404 });

    if (action === "approve") {
      if (vr.status === "approved") {
        return NextResponse.json({ success: false, message: "Already approved" }, { status: 400 });
      }

      const requestUser = vr.userId ? await User.findById(vr.userId) : null;
      const vendorName = vr.businessName || "Unnamed Vendor";
      const serviceType = vr.vendorType || "shopping";
      const contactPerson = vr.vendorName || requestUser?.name || vr.businessName || "Owner";
      const phone = vr.phone || "N/A";
      const address = vr.address || "N/A";
      const email =
        requestUser?.email ||
        `${vendorName.toLowerCase().replace(/[^a-z0-9]+/g, "")}-${Date.now()}@example.com`;

      const filter = vr.userId ? { userId: vr.userId } : { email };
      const newVendor = await Vendor.findOneAndUpdate(
        filter,
        {
          vendorName,
          serviceType,
          contactPerson,
          phone,
          email,
          address,
          userId: vr.userId || undefined,
          isActive: true,
        },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );

      if (requestUser && requestUser.role !== "vendor") {
        requestUser.role = "vendor";
        await requestUser.save();
      }

      const Shop = (await import("../../../models/Shop")).default;
      const existingShop = await Shop.findOne({ vendorId: newVendor._id });
      const shopPayload = {
        vendorId: newVendor._id,
        name: vendorName,
        category: serviceType,
        phone,
        address,
        description: vr.description || "",
      };

      const shop = existingShop
        ? await Shop.findByIdAndUpdate(existingShop._id, shopPayload, { new: true })
        : await Shop.create(shopPayload);

      vr.status = "approved";
      vr.decidedBy = auth.user.userId;
      vr.reviewedAt = new Date();
      await vr.save();

      return NextResponse.json(
        { success: true, message: "Approved", vendor: newVendor, shop, request: vr },
        { status: 200 }
      );
    }

    if (action === "reject") {
      if (vr.status === "rejected") {
        return NextResponse.json({ success: false, message: "Already rejected" }, { status: 400 });
      }
      vr.status = "rejected";
      vr.decidedBy = auth.user.userId;
      vr.reviewedAt = new Date();
      await vr.save();
      return NextResponse.json({ success: true, message: "Rejected", request: vr }, { status: 200 });
    }

    return NextResponse.json({ success: false, message: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("vendor-requests PATCH error:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
