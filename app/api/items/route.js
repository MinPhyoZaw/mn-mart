import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "../../lib/mongodb";
import Item from "../../models/Item";
import Shop from "../../models/Shop";
import Vendor from "../../models/Vendor";
import { requireVendorAuth } from "../../lib/routeAuth";
import { isValidShoppingCategory } from "../../lib/shoppingCategories";
import { normalizeDescription, normalizeRetailPrice } from "../../lib/productDisplay";

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

    if (body.type === "product" && !isValidShoppingCategory(normalizedCategory)) {
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

    const retailPrice = body.type === "product" ? normalizeRetailPrice(body.retailPrice) : undefined;
    const description = body.type === "product" ? normalizeDescription(body.description) : body.description;
    const wholesaleTiers = body.type === "product" ? normalizeWholesaleTiers(body.wholesaleTiers ?? body?.extra?.wholesaleTiers ?? []) : [];

    const createdItem = await Item.create({
      shopId: body.shopId,
      name: body.name,
      price: body.price,
      description,
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
    const type = searchParams.get("type");
    const category = searchParams.get("category");

    /*
     * --------------------------------------------------
     * Pagination
     * --------------------------------------------------
     *
     * Never allow an unbounded item query.
     */

    const parsedPage = Number.parseInt(
      searchParams.get("page") || "1",
      10
    );

    const parsedLimit = Number.parseInt(
      searchParams.get("limit") || "24",
      10
    );

    const page =
      Number.isFinite(parsedPage) && parsedPage > 0
        ? parsedPage
        : 1;

    const DEFAULT_LIMIT = 24;
    const MAX_LIMIT = 50;

    const limit =
      Number.isFinite(parsedLimit) && parsedLimit > 0
        ? Math.min(parsedLimit, MAX_LIMIT)
        : DEFAULT_LIMIT;

    const skip = (page - 1) * limit;

    /*
     * --------------------------------------------------
     * Filters
     * --------------------------------------------------
     */

    const filter = {};

    if (shopId) {
      if (!mongoose.Types.ObjectId.isValid(shopId)) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid shopId format",
          },
          {
            status: 400,
          }
        );
      }

      filter.shopId = shopId;
    }

    if (tagName) {
      filter.tagName = normalizeTagName(tagName);
    }

    if (type) {
      filter.type = type;
    }

    if (category) {
      filter.category = category;
    }

    /*
     * --------------------------------------------------
     * Filter by Shop category
     * --------------------------------------------------
     */

    if (shopCategory) {
      const matchingShops = await Shop.find({
        category: shopCategory,
      })
        .select("_id")
        .lean();

      const matchingShopIds = matchingShops.map(
        (shop) => shop._id
      );

      /*
       * Preserve an existing shopId filter if one
       * was explicitly provided.
       */
      if (shopId) {
        const belongsToCategory = matchingShopIds.some(
          (id) => String(id) === String(shopId)
        );

        if (!belongsToCategory) {
          return NextResponse.json(
            {
              success: true,
              data: [],
              pagination: {
                page,
                limit,
                total: 0,
                totalPages: 0,
                hasNextPage: false,
                hasPreviousPage: false,
              },
            },
            {
              status: 200,
            }
          );
        }
      } else {
        filter.shopId = {
          $in: matchingShopIds,
        };
      }
    }

    /*
     * --------------------------------------------------
     * Fetch only one bounded page
     * --------------------------------------------------
     *
     * Explicit projection prevents unrelated fields
     * from being accidentally returned later.
     */

    const [items, total] = await Promise.all([
      Item.find(filter)
        .select(
          [
            "_id",
            "shopId",
            "name",
            "price",
            "retailPrice",
            "wholesaleTiers",
            "description",
            "image",
            "type",
            "category",
            "tagName",
            "extra",
            "isAvailable",
            "createdAt",
            "updatedAt",
          ].join(" ")
        )
        .populate({
          path: "shopId",
          select: "_id name category vendorId",
        })
        .sort({
          createdAt: -1,
        })
        .skip(skip)
        .limit(limit)
        .lean(),

      Item.countDocuments(filter),
    ]);

    /*
     * --------------------------------------------------
     * Normalize response
     * --------------------------------------------------
     */

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

      shopName:
        item.shopId?.name || "",

      vendorId:
        item.shopId?.vendorId
          ? String(item.shopId.vendorId)
          : "",
    }));

    const totalPages =
      total === 0
        ? 0
        : Math.ceil(total / limit);

    return NextResponse.json(
      {
        success: true,

        /*
         * Existing callers can continue using:
         *
         * data.data
         *
         * so the existing response shape remains
         * backward compatible.
         */
        data: normalizedItems,

        pagination: {
          page,
          limit,
          total,
          totalPages,

          hasNextPage:
            page < totalPages,

          hasPreviousPage:
            page > 1,
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "GET /api/items error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Server error",
      },
      {
        status: 500,
      }
    );
  }
}
