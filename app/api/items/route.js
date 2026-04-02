import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "../../lib/mongodb";
import Item from "../../models/Item";

const REQUIRED_FIELDS = ["shopId", "name", "price", "type"];

export async function POST(req) {
  try {
    const body = await req.json();

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

    await connectDB();

    const createdItem = await Item.create({
      shopId: body.shopId,
      name: body.name,
      price: body.price,
      description: body.description,
      image: body.image,
      type: body.type,
      category: body.category,
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

    const items = await Item.find(filter).sort({ createdAt: -1 }).lean();

    return NextResponse.json({ success: true, data: items }, { status: 200 });
  } catch (error) {
    console.error("GET /api/items error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
