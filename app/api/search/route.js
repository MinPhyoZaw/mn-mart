import { NextResponse } from "next/server";
import connectDB from "../../lib/mongodb";
import Shop from "../../models/Shop";
import Item from "../../models/Item";

function escapeRegExp(string = "") {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim();

    if (!q) {
      return NextResponse.json({ success: true, data: { shops: [], products: [] } }, { status: 200 });
    }

    const regex = new RegExp(escapeRegExp(q), "i");

    const shopsPromise = Shop.find({ name: { $regex: regex } })
      .limit(10)
      .lean();

    const productsPromise = Item.find({ type: "product", isAvailable: true, name: { $regex: regex } })
      .limit(10)
      .populate("shopId", "name")
      .lean();

    const [shops, products] = await Promise.all([shopsPromise, productsPromise]);

    return NextResponse.json({ success: true, data: { shops, products } }, { status: 200 });
  } catch (error) {
    console.error("GET /api/search error:", error);
    return NextResponse.json({ success: false, message: "Search failed" }, { status: 500 });
  }
}
