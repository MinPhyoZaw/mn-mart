import { NextResponse } from "next/server";
import mongoose from "mongoose";

import connectDB from "../../../lib/mongodb";
import { requireVendorAuth } from "../../../lib/routeAuth";
import { resolveVendorShop } from "../../../lib/vendorShop";
import {
  MAX_SHOP_CATEGORIES,
  validateShopCategoryName,
} from "../../../lib/shopCategories";
import ShopCategory from "../../../models/ShopCategory";

const CATEGORY_FIELDS = "_id name slug sortOrder isActive createdAt updatedAt";

export async function GET(req) {
  try {
    const auth = await requireVendorAuth(req);
    if (!auth.ok) return auth.response;

    await connectDB();
    const { searchParams } = new URL(req.url);
    const requestedShopId = searchParams.get("shopId");
    if (auth.user.role === "admin" && (!requestedShopId || !mongoose.Types.ObjectId.isValid(requestedShopId))) {
      return NextResponse.json({ success: false, message: "A valid shopId is required" }, { status: 400 });
    }

    const shop = await resolveVendorShop(auth, requestedShopId);
    if (!shop) return NextResponse.json({ success: false, message: "Shop not found" }, { status: 404 });

    const categories = await ShopCategory.find({ shopId: shop._id })
      .select(CATEGORY_FIELDS)
      .sort({ sortOrder: 1, name: 1, _id: 1 })
      .limit(MAX_SHOP_CATEGORIES)
      .lean();

    return NextResponse.json({ success: true, data: categories });
  } catch (error) {
    console.error("GET /api/vendor/categories error:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const auth = await requireVendorAuth(req);
    if (!auth.ok) return auth.response;

    const body = await req.json();
    const validated = validateShopCategoryName(body.name);
    if (validated.error) {
      return NextResponse.json({ success: false, message: validated.error }, { status: 400 });
    }

    await connectDB();
    if (auth.user.role === "admin" && (!body.shopId || !mongoose.Types.ObjectId.isValid(body.shopId))) {
      return NextResponse.json({ success: false, message: "A valid shopId is required" }, { status: 400 });
    }
    const shop = await resolveVendorShop(auth, body.shopId);
    if (!shop) return NextResponse.json({ success: false, message: "Shop not found" }, { status: 404 });

    const categoryCount = await ShopCategory.countDocuments({ shopId: shop._id });
    if (categoryCount >= MAX_SHOP_CATEGORIES) {
      return NextResponse.json(
        { success: false, message: `A shop can have at most ${MAX_SHOP_CATEGORIES} categories` },
        { status: 409 }
      );
    }

    const parsedSortOrder = Number(body.sortOrder);
    const category = await ShopCategory.create({
      shopId: shop._id,
      name: validated.name,
      slug: validated.slug,
      sortOrder: Number.isFinite(parsedSortOrder) ? parsedSortOrder : categoryCount,
      isActive: body.isActive === undefined ? true : Boolean(body.isActive),
    });

    return NextResponse.json(
      { success: true, data: category.toObject() },
      { status: 201 }
    );
  } catch (error) {
    if (error?.code === 11000) {
      return NextResponse.json({ success: false, message: "That category already exists" }, { status: 409 });
    }
    console.error("POST /api/vendor/categories error:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
