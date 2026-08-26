import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "../../lib/mongodb";
import Shop from "../../models/Shop";
import Vendor from "../../models/Vendor";
import { requireAuth } from "../../lib/routeAuth";

export const revalidate = 60;

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

function toNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const category = normalizeCategory(searchParams.get("category"));

    const page = Math.max(1, toNumber(searchParams.get("page"), 1));
    const limit = Math.min(50, Math.max(1, toNumber(searchParams.get("limit"), 20)));
    const skip = (page - 1) * limit;

    const query = category
      ? {
          $or: [
            { category },
            { category: { $regex: `^${category}$`, $options: "i" } },
          ],
        }
      : {};
    const projection = "name description image category";

    const [shops, total] = await Promise.all([
      Shop.find(query).select(projection).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Shop.countDocuments(query),
    ]);

    return NextResponse.json(
      {
        success: true,
        data: shops,
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      },
    );
  } catch (error) {
    console.error("GET /api/shops error:", error);
    return NextResponse.json({ success: false, message: "Failed to fetch shops" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const auth = requireAuth(req, ["admin"]);
    if (!auth.ok) return auth.response;

    await connectDB();
    const body = await req.json();

    const normalizedCategory = normalizeCategory(body.category);
    const { name, vendorId } = body;
    const category = normalizedCategory;
    if (!name || !category || !vendorId) {
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 });
    }

    if (!mongoose.Types.ObjectId.isValid(vendorId)) {
      return NextResponse.json({ success: false, message: "Invalid vendorId format" }, { status: 400 });
    }

    const vendor = await Vendor.findById(vendorId).select("_id").lean();
    if (!vendor) {
      return NextResponse.json({ success: false, message: "Vendor not found" }, { status: 404 });
    }

    const payload = {
      vendorId,
      name,
      category,
      phone: body.phone,
      address: body.address,
      description: body.description,
      image: body.image,
      kbzPayNumber: body.kbzPayNumber,
      wavePayNumber: body.wavePayNumber,
      isActive: body.isActive,
    };

    const shop = await Shop.create(payload);
    return NextResponse.json({ success: true, data: shop }, { status: 201 });
  } catch (error) {
    console.error("POST /api/shops error:", error);
    return NextResponse.json({ success: false, message: "Failed to create shop" }, { status: 500 });
  }
}
