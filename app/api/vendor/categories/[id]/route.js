import { NextResponse } from "next/server";
import mongoose from "mongoose";

import connectDB from "../../../../lib/mongodb";
import { requireVendorAuth } from "../../../../lib/routeAuth";
import { resolveVendorShop } from "../../../../lib/vendorShop";
import { validateShopCategoryName } from "../../../../lib/shopCategories";
import ShopCategory from "../../../../models/ShopCategory";

async function getContext(req, params, body = {}) {
  const auth = await requireVendorAuth(req);
  if (!auth.ok) return { response: auth.response };
  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return { response: NextResponse.json({ success: false, message: "Invalid category id" }, { status: 400 }) };
  }
  await connectDB();
  const requestedShopId = body.shopId || new URL(req.url).searchParams.get("shopId");
  if (auth.user.role === "admin" && (!requestedShopId || !mongoose.Types.ObjectId.isValid(requestedShopId))) {
    return { response: NextResponse.json({ success: false, message: "A valid shopId is required" }, { status: 400 }) };
  }
  const shop = await resolveVendorShop(auth, requestedShopId);
  if (!shop) return { response: NextResponse.json({ success: false, message: "Shop not found" }, { status: 404 }) };
  return { auth, id, shop };
}

export async function PATCH(req, { params }) {
  try {
    const body = await req.json();
    const context = await getContext(req, params, body);
    if (context.response) return context.response;

    const update = {};
    if (body.name !== undefined) {
      const validated = validateShopCategoryName(body.name);
      if (validated.error) return NextResponse.json({ success: false, message: validated.error }, { status: 400 });
      update.name = validated.name;
      update.slug = validated.slug;
    }
    if (body.sortOrder !== undefined) {
      const sortOrder = Number(body.sortOrder);
      if (!Number.isFinite(sortOrder)) return NextResponse.json({ success: false, message: "sortOrder must be a number" }, { status: 400 });
      update.sortOrder = sortOrder;
    }
    if (body.isActive !== undefined) update.isActive = Boolean(body.isActive);
    if (Object.keys(update).length === 0) {
      return NextResponse.json({ success: false, message: "No editable fields provided" }, { status: 400 });
    }

    const category = await ShopCategory.findOneAndUpdate(
      { _id: context.id, shopId: context.shop._id },
      { $set: update },
      { new: true, runValidators: true }
    ).select("_id name slug sortOrder isActive createdAt updatedAt").lean();
    if (!category) return NextResponse.json({ success: false, message: "Category not found" }, { status: 404 });
    return NextResponse.json({ success: true, data: category });
  } catch (error) {
    if (error?.code === 11000) return NextResponse.json({ success: false, message: "That category already exists" }, { status: 409 });
    console.error("PATCH /api/vendor/categories/[id] error:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const context = await getContext(req, params);
    if (context.response) return context.response;
    const category = await ShopCategory.findOneAndUpdate(
      { _id: context.id, shopId: context.shop._id },
      { $set: { isActive: false } },
      { new: true }
    ).select("_id name slug sortOrder isActive createdAt updatedAt").lean();
    if (!category) return NextResponse.json({ success: false, message: "Category not found" }, { status: 404 });
    return NextResponse.json({ success: true, data: category, message: "Category disabled" });
  } catch (error) {
    console.error("DELETE /api/vendor/categories/[id] error:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
