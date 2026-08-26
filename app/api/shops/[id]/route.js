import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "../../../lib/mongodb";
import Shop from "../../../models/Shop";
import Item from "../../../models/Item";
import Vendor from "../../../models/Vendor";
import { requireAuth } from "../../../lib/routeAuth";

export async function GET(req, { params }) {
  try {
    await connectDB();
    const { id } = await params;

    const [shop, items] = await Promise.all([
      Shop.findById(id).lean(),
      Item.find({ shopId: id }).sort({ createdAt: -1 }).lean(),
    ]);

    if (!shop) {
      return NextResponse.json(
        { success: false, message: "Not found" },
        { status: 404 }
      );
    }

    const vendor = await Vendor.findById(shop.vendorId).lean();

    return NextResponse.json(
      {
        success: true,
        data: {
          shop: {
            ...shop,
            vendorName: vendor?.vendorName || "Unknown Vendor",
            vendorId: vendor?._id || null,
          },
          items,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/shops/[id] error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}

export async function PUT(req, { params }) {
  try {
    const auth = requireAuth(req, ["admin"]);
    if (!auth.ok) return auth.response;

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: "Invalid shop id" }, { status: 400 });
    }

    await connectDB();
    const body = await req.json();
    const editableFields = [
      "name",
      "category",
      "phone",
      "address",
      "description",
      "image",
      "kbzPayNumber",
      "wavePayNumber",
      "isActive",
    ];
    const updates = Object.fromEntries(
      editableFields
        .filter((field) => body[field] !== undefined)
        .map((field) => [field, body[field]])
    );

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ success: false, message: "No editable fields provided" }, { status: 400 });
    }

    const updated = await Shop.findByIdAndUpdate(id, updates, { new: true }).lean();
    if (!updated) return NextResponse.json({ success: false, message: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true, data: updated }, { status: 200 });
  } catch (error) {
    console.error("PUT /api/shops/[id] error:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const auth = requireAuth(req, ["admin"]);
    if (!auth.ok) return auth.response;

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: "Invalid shop id" }, { status: 400 });
    }

    await connectDB();
    const deleted = await Shop.findByIdAndDelete(id).lean();
    if (!deleted) return NextResponse.json({ success: false, message: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true, message: "Deleted" }, { status: 200 });
  } catch (error) {
    console.error("DELETE /api/shops/[id] error:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
