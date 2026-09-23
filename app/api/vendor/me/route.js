import { NextResponse } from "next/server";
import connectDB from "../../../lib/mongodb";
import Vendor from "../../../models/Vendor";
import Shop from "../../../models/Shop";
import { requireVendorAuth } from "../../../lib/routeAuth";

const MAX_SHOP_NAME_LENGTH = 100;

export async function GET(req) {
  try {
    const auth = await requireVendorAuth(req);
    if (!auth.ok) return auth.response;

    await connectDB();

    const vendor = await Vendor.findOne({ userId: auth.user.userId }).lean();
    if (!vendor) {
      return NextResponse.json({ success: false, message: "Vendor profile not found" }, { status: 404 });
    }

    const shop = await Shop.findOne({ vendorId: vendor._id }).lean();
    if (!shop) {
      return NextResponse.json({ success: false, message: "Vendor shop not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: { vendor, shop } }, { status: 200 });
  } catch (error) {
    console.error("GET /api/vendor/me error:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const auth = await requireVendorAuth(req);
    if (!auth.ok) return auth.response;

    // Admins can use the admin shop API, but do not have a vendor-owned shop here.
    if (auth.user.role !== "vendor") {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ success: false, message: "Invalid request body" }, { status: 400 });
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ success: false, message: "Invalid request body" }, { status: 400 });
    }

    const fields = Object.keys(body);
    if (fields.length !== 1 || fields[0] !== "name") {
      return NextResponse.json(
        { success: false, message: "Only the shop name can be updated" },
        { status: 400 },
      );
    }

    if (typeof body.name !== "string") {
      return NextResponse.json({ success: false, message: "Shop name must be a string" }, { status: 400 });
    }

    const name = body.name.trim();
    if (!name) {
      return NextResponse.json({ success: false, message: "Shop name cannot be empty" }, { status: 400 });
    }
    if (name.length > MAX_SHOP_NAME_LENGTH) {
      return NextResponse.json(
        { success: false, message: `Shop name must be ${MAX_SHOP_NAME_LENGTH} characters or fewer` },
        { status: 400 },
      );
    }

    await connectDB();
    const currentShop = await Shop.findOne({ vendorId: auth.vendor._id }).lean();
    if (!currentShop) {
      return NextResponse.json({ success: false, message: "Vendor shop not found" }, { status: 404 });
    }

    if (currentShop.name.trim() === name) {
      return NextResponse.json({ success: true, data: { shop: currentShop }, unchanged: true });
    }

    const shop = await Shop.findOneAndUpdate(
      { _id: currentShop._id, vendorId: auth.vendor._id },
      { $set: { name } },
      { new: true, runValidators: true },
    ).lean();

    if (!shop) {
      return NextResponse.json({ success: false, message: "Vendor shop not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: { shop } });
  } catch (error) {
    console.error("PATCH /api/vendor/me error:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
