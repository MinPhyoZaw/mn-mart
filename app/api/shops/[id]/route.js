import { NextResponse } from "next/server";
import connectDB from "../../../lib/mongodb";
import Shop from "../../../models/Shop";

export async function GET(req, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const shop = await Shop.findById(id).lean();
    if (!shop) return NextResponse.json({ success: false, message: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true, data: shop }, { status: 200 });
  } catch (error) {
    console.error("GET /api/shops/[id] error:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const updates = await req.json();
    const updated = await Shop.findByIdAndUpdate(id, updates, { new: true }).lean();
    if (!updated) return NextResponse.json({ success: false, message: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true, data: updated }, { status: 200 });
  } catch (error) {
    console.error("PUT /api/shops/[id] error:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const deleted = await Shop.findByIdAndDelete(id).lean();
    if (!deleted) return NextResponse.json({ success: false, message: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true, message: "Deleted" }, { status: 200 });
  } catch (error) {
    console.error("DELETE /api/shops/[id] error:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
