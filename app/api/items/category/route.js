import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "../../../lib/mongodb";
import Item from "../../../models/Item";
import Shop from "../../../models/Shop";
import { isValidShoppingCategory } from "../../../lib/shoppingCategories";

function normalizeCategory(category) {
  if (typeof category !== "string") return "";
  const trimmed = category.trim();
  return trimmed;
}

export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const category = normalizeCategory(searchParams.get("category"));
    const limitParam = searchParams.get("limit");
    const rawLimit = Number(limitParam);
    const DEFAULT_LIMIT = 18;
const MAX_LIMIT = 50;

const limit =
  Number.isFinite(rawLimit) && rawLimit > 0
    ? Math.min(rawLimit, MAX_LIMIT)
    : DEFAULT_LIMIT;

    const filter = { type: "product" };

    if (category && category !== "guess-you-like") {
      if (!isValidShoppingCategory(category)) {
        return NextResponse.json(
          { success: false, message: "Invalid shopping category" },
          { status: 400 }
        );
      }
      filter.category = category;
    }

    let query = Item.find(filter)
      .populate({ path: "shopId", select: "name category vendorId" })
      .sort({ createdAt: -1 })
      .lean();

    if (limit > 0) {
      query = query.limit(limit);
    }

    const items = await query;

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
      shopName: item.shopId?.name || "",
      vendorId: item.shopId?.vendorId ? String(item.shopId.vendorId) : "",
    }));

    return NextResponse.json({ success: true, data: normalizedItems }, { status: 200 });
  } catch (error) {
    console.error("GET /api/items/category error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
