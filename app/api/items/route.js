import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "../../lib/mongodb";
import Item from "../../models/Item";
import Shop from "../../models/Shop";
import Vendor from "../../models/Vendor";
import { requireVendorAuth } from "../../lib/routeAuth";

const REQUIRED_FIELDS = ["shopId", "name", "price", "type"];

const TAG_NAME_ALIASES = {
  newarrival: "NewArrival",
  bestsellers: "BestSellers",
  toppicks: "TopPicks",
  recomendedforyou: "RecomendedForYou",
  recommendedforyou: "RecomendedForYou",
  recommended: "RecomendedForYou",
};

function normalizeTagName(tagName) {
  if (typeof tagName !== "string") return undefined;
  const normalized = tagName.trim().toLowerCase().replace(/\s+/g, "");
  return TAG_NAME_ALIASES[normalized] || tagName.trim();
}

function getTierQuantity(tier) {
  return tier?.minQty ?? tier?.qty ?? tier?.quantity ?? tier?.minQuantity ?? tier?.minimumQuantity;
}

function normalizeWholesaleTiers(tiers = []) {
  return (Array.isArray(tiers) ? tiers : [])
    .map((tier) => ({ minQty: Number(getTierQuantity(tier)), price: Number(tier?.price) }))
    .filter((tier) => Number.isFinite(tier.minQty) && Number.isFinite(tier.price) && tier.minQty > 1 && tier.price >= 0)
    .sort((a, b) => a.minQty - b.minQty);
}

const SHOPPING_CATEGORIES = [
  "electronics",
  "fashion",
  "food & beverage",
  "DIY",
  "hardware",
  "furniture",
  "Media",
  "Beauty & personal care",
  "Tobacco products",
  "Toy and hobbies",
];

export async function POST(req) {
  try {
    const auth = await requireVendorAuth(req);
    if (!auth.ok) return auth.response;

    const body = await req.json();
    const normalizedCategory = typeof body.category === "string" ? body.category.trim() : "";
    const normalizedTagName = normalizeTagName(body.tagName);

    const missingFields = REQUIRED_FIELDS.filter((field) => {
      const value = body?.[field];
      return value === undefined || value === null || value === "";
    });

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: `Missing required field(s): ${missingFields.join(", ")}`,
        },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(body.shopId)) {
      return NextResponse.json(
        { success: false, message: "Invalid shopId format" },
        { status: 400 }
      );
    }

    if (body.type === "product" && !normalizedCategory) {
      return NextResponse.json(
        { success: false, message: "Category is required for shopping products" },
        { status: 400 }
      );
    }

    if (body.type === "product" && !SHOPPING_CATEGORIES.includes(normalizedCategory)) {
      return NextResponse.json(
        { success: false, message: "Invalid category for shopping product" },
        { status: 400 }
      );
    }

    await connectDB();

    if (auth.user.role === "vendor") {
      const vendor = await Vendor.findOne({ userId: auth.user.userId }).lean();
      if (!vendor) {
        return NextResponse.json({ success: false, message: "Vendor profile not found" }, { status: 404 });
      }

      const ownShop = await Shop.findOne({ _id: body.shopId, vendorId: vendor._id }).lean();
      if (!ownShop) {
        return NextResponse.json({ success: false, message: "You can only create services for your own shop" }, { status: 403 });
      }
    }

    const retailPrice = body.type === "product" ? Number(body.retailPrice ?? body.price) : undefined;
    const wholesaleTiers = body.type === "product" ? normalizeWholesaleTiers(body.wholesaleTiers ?? body?.extra?.wholesaleTiers ?? []) : [];

    const createdItem = await Item.create({
      shopId: body.shopId,
      name: body.name,
      price: body.price,
      description: body.description,
      retailPrice: body.type === "product" ? retailPrice : undefined,
      wholesaleTiers: body.type === "product" ? wholesaleTiers : [],
      image: body.image,
      type: body.type,
      category: body.type === "product" ? normalizedCategory : undefined,
      tagName: normalizedTagName,
      extra: body.extra,
      isAvailable: body.isAvailable,
    });

    return NextResponse.json(
      { success: true, data: createdItem },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/items error:", error);

    if (error?.name === "ValidationError") {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}

export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const shopId = searchParams.get("shopId");
    const tagName = searchParams.get("tagName");
    const shopCategory = searchParams.get("shopCategory");

    const filter = {};

    if (shopId) {
      if (!mongoose.Types.ObjectId.isValid(shopId)) {
        return NextResponse.json(
          { success: false, message: "Invalid shopId format" },
          { status: 400 }
        );
      }

      filter.shopId = shopId;
    }

    if (tagName) {
      filter.tagName = normalizeTagName(tagName);
    }

    if (shopCategory) {
      const shoppingShops = await Shop.find({ category: shopCategory }).select("_id").lean();
      filter.shopId = { $in: shoppingShops.map((shop) => shop._id) };
    }

    const items = await Item.find(filter)
      .populate({ path: "shopId", select: "name category vendorId" })
      .sort({ createdAt: -1 })
      .lean();

    const normalizedItems = items.map((item) => ({
      ...item,
      shop: item.shopId
        ? {
            _id: item.shopId._id,
            name: item.shopId.name,
            category: item.shopId.category,
            vendorId: item.shopId.vendorId,
          }
        : null,
    }));

    return NextResponse.json({ success: true, data: normalizedItems }, { status: 200 });
  } catch (error) {
    console.error("GET /api/items error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
