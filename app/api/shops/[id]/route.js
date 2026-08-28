import { NextResponse } from "next/server";
import mongoose from "mongoose";

import connectDB from "../../../lib/mongodb";
import Shop from "../../../models/Shop";
import Item from "../../../models/Item";
import Vendor from "../../../models/Vendor";
import { requireAuth } from "../../../lib/routeAuth";

const DEFAULT_ITEM_LIMIT = 20;
const MAX_ITEM_LIMIT = 50;

/*
 * ==================================================
 * GET /api/shops/[id]
 * Public shop details
 * ==================================================
 */
export async function GET(req, { params }) {
  try {
    const { id } = await params;

    /*
     * Validate before querying MongoDB.
     */
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid shop id",
        },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(req.url);

    const rawPage = Number.parseInt(
      searchParams.get("page") || "1",
      10
    );

    const rawLimit = Number.parseInt(
      searchParams.get("limit") ||
        String(DEFAULT_ITEM_LIMIT),
      10
    );

    const page =
      Number.isFinite(rawPage) && rawPage > 0
        ? rawPage
        : 1;

    const limit =
      Number.isFinite(rawLimit) && rawLimit > 0
        ? Math.min(rawLimit, MAX_ITEM_LIMIT)
        : DEFAULT_ITEM_LIMIT;

    const skip = (page - 1) * limit;

    await connectDB();

    /*
     * Load shop first.
     *
     * We don't need to query items/count if the
     * shop doesn't exist.
     */
    const shop = await Shop.findById(id)
  .select(
    [
      "_id",
      "name",
      "category",
      "phone",
      "address",
      "description",
      "image",
      "vendorId",
      "rating",
      "isActive",
      "createdAt",
      "updatedAt",
    ].join(" ")
  )
  .lean();

    if (!shop) {
      return NextResponse.json(
        {
          success: false,
          message: "Not found",
        },
        { status: 404 }
      );
    }

    /*
     * Load vendor + bounded shop items.
     */
    const [vendor, items, totalItems] =
      await Promise.all([
        Vendor.findById(shop.vendorId)
          .select("_id vendorName")
          .lean(),

        Item.find({
  shopId: id,
})
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
  .sort({
    createdAt: -1,
  })
  .skip(skip)
  .limit(limit)
  .lean(),

        Item.countDocuments({
          shopId: id,
        }),
      ]);

    const totalPages =
      totalItems === 0
        ? 0
        : Math.ceil(totalItems / limit);

    return NextResponse.json(
      {
        success: true,

        data: {
          shop: {
            ...shop,

            vendorName:
              vendor?.vendorName ||
              "Unknown Vendor",

            vendorId:
              vendor?._id || null,
          },

          /*
           * Keep items in the same location so
           * existing callers using data.items
           * continue working.
           */
          items,

          pagination: {
            page,
            limit,
            totalItems,
            totalPages,

            hasNextPage:
              page < totalPages,

            hasPreviousPage:
              page > 1,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "GET /api/shops/[id] error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Server error",
      },
      { status: 500 }
    );
  }
}

/*
 * ==================================================
 * PUT /api/shops/[id]
 * Admin only
 * ==================================================
 */
export async function PUT(req, { params }) {
  try {
    const auth = await requireAuth(
      req,
      ["admin"]
    );

    if (!auth.ok) {
      return auth.response;
    }

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid shop id",
        },
        { status: 400 }
      );
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
        .filter(
          (field) =>
            body[field] !== undefined
        )
        .map((field) => [
          field,
          body[field],
        ])
    );

    if (
      Object.keys(updates).length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "No editable fields provided",
        },
        { status: 400 }
      );
    }

    const updated =
      await Shop.findByIdAndUpdate(
        id,
        updates,
        {
          new: true,
        }
      ).lean();

    if (!updated) {
      return NextResponse.json(
        {
          success: false,
          message: "Not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: updated,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "PUT /api/shops/[id] error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Server error",
      },
      { status: 500 }
    );
  }
}

/*
 * ==================================================
 * DELETE /api/shops/[id]
 * Admin only
 * ==================================================
 */
export async function DELETE(req, { params }) {
  try {
    const auth = await requireAuth(
      req,
      ["admin"]
    );

    if (!auth.ok) {
      return auth.response;
    }

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid shop id",
        },
        { status: 400 }
      );
    }

    await connectDB();

    const deleted =
      await Shop.findByIdAndDelete(
        id
      ).lean();

    if (!deleted) {
      return NextResponse.json(
        {
          success: false,
          message: "Not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Deleted",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "DELETE /api/shops/[id] error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Server error",
      },
      { status: 500 }
    );
  }
}