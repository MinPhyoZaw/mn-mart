import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "../../lib/mongodb";
import TransportationRoute from "../../models/TransportationRoute";
import Vendor from "../../models/Vendor";
import { requireVendorAuth } from "../../lib/routeAuth";

const parseList = (value) =>
  String(value || "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);

export async function POST(req) {
  try {
    const auth = await requireVendorAuth(req);
    if (!auth.ok) return auth.response;

    const body = await req.json();
    const required = ["companyName", "fromCity", "toCity", "duration"];
    const missing = required.filter((key) => !String(body?.[key] || "").trim());

    if (missing.length) {
      return NextResponse.json({ success: false, message: `Missing required field(s): ${missing.join(", ")}` }, { status: 400 });
    }

    await connectDB();

    let companyId = body.companyId;
    if (auth.user.role === "vendor") {
      const vendor = await Vendor.findOne({ userId: auth.user.userId }).select("_id").lean();
      if (!vendor) return NextResponse.json({ success: false, message: "Vendor profile not found" }, { status: 404 });
      companyId = vendor._id;
    }

    if (!mongoose.Types.ObjectId.isValid(companyId)) {
      return NextResponse.json({ success: false, message: "Invalid companyId format" }, { status: 400 });
    }

    const route = await TransportationRoute.create({
      companyId,
      companyName: body.companyName.trim(),
      fromCity: body.fromCity.trim(),
      toCity: body.toCity.trim(),
      boardingPoints: Array.isArray(body.boardingPoints) ? body.boardingPoints : parseList(body.boardingPoints),
      droppingPoints: Array.isArray(body.droppingPoints) ? body.droppingPoints : parseList(body.droppingPoints),
      duration: body.duration.trim(),
    });

    return NextResponse.json({ success: true, data: route }, { status: 201 });
  } catch (error) {
    console.error("POST /api/transport-routes error:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    const auth = await requireVendorAuth(req);
    if (!auth.ok) return auth.response;

    await connectDB();

    const { searchParams } = new URL(req.url);
    let companyId = searchParams.get("companyId");

    if (auth.user.role === "vendor") {
      const vendor = await Vendor.findOne({ userId: auth.user.userId }).select("_id").lean();
      if (!vendor) return NextResponse.json({ success: false, message: "Vendor profile not found" }, { status: 404 });
      companyId = String(vendor._id);
    }

    const filter = {};
    if (companyId) {
      if (!mongoose.Types.ObjectId.isValid(companyId)) {
        return NextResponse.json({ success: false, message: "Invalid companyId format" }, { status: 400 });
      }
      filter.companyId = companyId;
    }

    const routes = await TransportationRoute.find(filter).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ success: true, data: routes }, { status: 200 });
  } catch (error) {
    console.error("GET /api/transport-routes error:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
