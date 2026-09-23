import { NextResponse } from "next/server";
import connectDB from "../../../lib/mongodb";
import Item from "../../../models/Item";
import Shop from "../../../models/Shop";
import Vendor from "../../../models/Vendor";
import ShopCategory from "../../../models/ShopCategory";
// import Vendor from "../../../../models/Vendor";
import { requireVendorAuth } from "../../../lib/routeAuth";
import mongoose from "mongoose";

export async function PATCH(req, { params }) {
  try {
    const auth = await requireVendorAuth(req);
    if (!auth.ok) return auth.response;

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: "Invalid item id" }, { status: 400 });
    }

    const body = await req.json();
    const { isAvailable } = body;
    if (typeof isAvailable !== "boolean") {
      return NextResponse.json({ success: false, message: "isAvailable boolean required" }, { status: 400 });
    }

    await connectDB();

    const item = await Item.findById(id).lean();
    if (!item) return NextResponse.json({ success: false, message: "Item not found" }, { status: 404 });

    const shop = await Shop.findById(item.shopId).lean();
    if (!shop) return NextResponse.json({ success: false, message: "Shop not found" }, { status: 404 });

    if (auth.user.role === "vendor") {
      const vendor = await Vendor.findOne({ userId: auth.user.userId }).lean();
      if (!vendor) return NextResponse.json({ success: false, message: "Vendor profile not found" }, { status: 404 });
      if (String(shop.vendorId) !== String(vendor._id)) {
        return NextResponse.json({ success: false, message: "Not authorized to update this item" }, { status: 403 });
      }
    }

    await Item.updateOne({ _id: id }, { $set: { isAvailable } });
    const updated = await Item.findById(id).lean();

    return NextResponse.json({ success: true, data: updated }, { status: 200 });
  } catch (error) {
    console.error("PATCH /api/items/[id] error:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const auth = await requireVendorAuth(req);
    if (!auth.ok) return auth.response;

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: "Invalid item id" }, { status: 400 });
    }

    const body = await req.json();

    await connectDB();

    const item = await Item.findById(id).lean();
    if (!item) return NextResponse.json({ success: false, message: "Item not found" }, { status: 404 });

    const shop = await Shop.findById(item.shopId).lean();
    if (!shop) return NextResponse.json({ success: false, message: "Shop not found" }, { status: 404 });

    if (auth.user.role === "vendor") {
      if (String(shop.vendorId) !== String(auth.vendor._id)) {
        return NextResponse.json({ success: false, message: "Not authorized to update this item" }, { status: 403 });
      }
    }

    const allowed = [
      "name",
      "price",
      "description",
      "image",
      "category",
      "tagName",
      "wholesaleTiers",
      "extra",
      "isAvailable",
    ];

    const update = {};
    for (const key of allowed) {
      if (body[key] !== undefined) update[key] = body[key];
    }

    if (body.shopCategoryId !== undefined) {
      if (item.type !== "product" && body.shopCategoryId) {
        return NextResponse.json({ success: false, message: "Shop categories only apply to products" }, { status: 400 });
      }
      if (body.shopCategoryId === null || body.shopCategoryId === "") {
        update.shopCategoryId = null;
      } else {
        if (!mongoose.Types.ObjectId.isValid(body.shopCategoryId)) {
          return NextResponse.json({ success: false, message: "Invalid shop category" }, { status: 400 });
        }
        const categoryFilter = {
          _id: body.shopCategoryId,
          shopId: item.shopId,
        };
        if (String(item.shopCategoryId || "") !== String(body.shopCategoryId)) {
          categoryFilter.isActive = true;
        }
        const category = await ShopCategory.findOne(categoryFilter).select("_id").lean();
        if (!category) {
          return NextResponse.json({ success: false, message: "Active shop category not found" }, { status: 400 });
        }
        update.shopCategoryId = category._id;
      }
    }

    await Item.updateOne({ _id: id }, { $set: update });
    const updated = await Item.findById(id).lean();

    return NextResponse.json({ success: true, data: updated }, { status: 200 });
  } catch (error) {
    console.error("PUT /api/items/[id] error:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const auth = await requireVendorAuth(req);
    if (!auth.ok) return auth.response;

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: "Invalid item id" }, { status: 400 });
    }

    await connectDB();

    const item = await Item.findById(id).lean();
    if (!item) return NextResponse.json({ success: false, message: "Item not found" }, { status: 404 });

    const shop = await Shop.findById(item.shopId).lean();
    if (!shop) return NextResponse.json({ success: false, message: "Shop not found" }, { status: 404 });

    if (auth.user.role === "vendor") {
      const vendor = await Vendor.findOne({ userId: auth.user.userId }).lean();
      if (!vendor) return NextResponse.json({ success: false, message: "Vendor profile not found" }, { status: 404 });
      if (String(shop.vendorId) !== String(vendor._id)) {
        return NextResponse.json({ success: false, message: "Not authorized to delete this item" }, { status: 403 });
      }
    }

    await Item.deleteOne({ _id: id });

    return NextResponse.json({ success: true, data: { _id: id } }, { status: 200 });
  } catch (error) {
    console.error("DELETE /api/items/[id] error:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
