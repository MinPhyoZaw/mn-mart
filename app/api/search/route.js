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
    const scope = searchParams.get("scope");

    if (!q) {
      return NextResponse.json({ success: true, data: { shops: [], products: [] } }, { status: 200 });
    }

    const regex = new RegExp(escapeRegExp(q), "i");

    const searchShops = scope !== "products";
    const searchProducts = scope !== "shops";

    const shopsPromise = searchShops
      ? Shop.find({ name: { $regex: regex } }).select("_id name").limit(10).lean()
      : Promise.resolve([]);

    const productsPromise = searchProducts
      ? Item.find({ type: "product", isAvailable: true, name: { $regex: regex } })
          .select("_id shopId name description price image category wholesaleTiers")
          .limit(10)
          .populate("shopId", "_id name vendorId")
          .lean()
      : Promise.resolve([]);

    const [shops, products] = await Promise.all([shopsPromise, productsPromise]);

    return NextResponse.json({ success: true, data: { shops, products } }, { status: 200 });
  } catch (error) {
    console.error("GET /api/search error:", error);
    return NextResponse.json({ success: false, message: "Search failed" }, { status: 500 });
  }
}
