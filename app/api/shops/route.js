import { NextResponse } from "next/server";
import connectDB from "../../lib/mongodb";
import Shop from "../../models/Shop";

export async function GET(req) {
  try {
    await connectDB();
    const shops = await Shop.find({}).lean();
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

    const { name, category, vendorId } = body;
    if (!name || !category || !vendorId) {
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 });
    }

    const shop = await Shop.create(body);
    return NextResponse.json({ success: true, data: shop }, { status: 201 });
  } catch (error) {
    console.error("POST /api/shops error:", error);
    return NextResponse.json({ success: false, message: "Failed to create shop" }, { status: 500 });
  }
}
