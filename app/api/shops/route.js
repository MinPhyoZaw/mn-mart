import { NextResponse } from "next/server";
import connectDB from "../../lib/mongodb";
import Shop from "../../models/Shop";

const CATEGORY_ALIASES = {
  shop: "shopping",
  shops: "shopping",
  shopping: "shopping",
  transport: "transportation",
  transportation: "transportation",
  car: "transportation",
  "car-ticket": "transportation",
  "car-tickets": "transportation",
  hotel: "hotel",
  hotels: "hotel",
  spa: "spa",
};

function normalizeCategory(category) {
  if (!category || typeof category !== "string") return null;
  const normalized = category.trim().toLowerCase();
  return CATEGORY_ALIASES[normalized] || normalized;
}

export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const category = normalizeCategory(searchParams.get("category"));

    const query = category ? { category } : {};
    const shops = await Shop.find(query).lean();

    return NextResponse.json({ success: true, data: shops }, { status: 200 });
  } catch (error) {
    console.error("GET /api/shops error:", error);
    return NextResponse.json({ success: false, message: "Failed to fetch shops" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();

    const normalizedCategory = normalizeCategory(body.category);
    const payload = {
      ...body,
      category: normalizedCategory,
    };

    const { name, category, vendorId } = payload;
    if (!name || !category || !vendorId) {
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 });
    }

    const shop = await Shop.create(payload);
    return NextResponse.json({ success: true, data: shop }, { status: 201 });
  } catch (error) {
    console.error("POST /api/shops error:", error);
    return NextResponse.json({ success: false, message: "Failed to create shop" }, { status: 500 });
  }
}
