import { NextResponse } from "next/server";
import connectDB from "../../../lib/mongodb";
import { requireAuth } from "../../../lib/routeAuth";
import CommissionSetting from "../../../models/CommissionSetting";
import { DEFAULT_SHOPPING_COMMISSION_RATE } from "../../../lib/shoppingCommission";

const parseRate = (rate) => {
  const value = Number(rate);
  if (!Number.isFinite(value) || value < 0 || value > 100) return null;
  return Number(value.toFixed(2));
};

const serializeSetting = (setting) => ({
  _id: setting?._id ? String(setting._id) : null,
  serviceType: "shopping",
  rate: setting?.rate ?? DEFAULT_SHOPPING_COMMISSION_RATE,
  isDefault: !setting,
  updatedAt: setting?.updatedAt ? setting.updatedAt.toISOString() : null,
});

export async function GET(req) {
  try {
    const auth = requireAuth(req, ["admin"]);
    if (!auth.ok) return auth.response;

    await connectDB();
    const setting = await CommissionSetting.findOne({ serviceType: "shopping" }).lean();

    return NextResponse.json({ success: true, data: serializeSetting(setting) });
  } catch (error) {
    console.error("GET /api/admin/shopping-commission error:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const auth = requireAuth(req, ["admin"]);
    if (!auth.ok) return auth.response;

    const { rate } = await req.json();
    const parsedRate = parseRate(rate);
    if (parsedRate === null) {
      return NextResponse.json({ success: false, message: "Enter a percentage from 0 to 100." }, { status: 400 });
    }

    await connectDB();
    const setting = await CommissionSetting.findOneAndUpdate(
      { serviceType: "shopping" },
      { serviceType: "shopping", rate: parsedRate, updatedBy: auth.user.userId || null },
      { new: true, upsert: true, runValidators: true }
    ).lean();

    return NextResponse.json({ success: true, message: "Shopping commission percentage saved.", data: serializeSetting(setting) });
  } catch (error) {
    console.error("POST /api/admin/shopping-commission error:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}

export async function PATCH(req) {
  return POST(req);
}

export async function DELETE(req) {
  try {
    const auth = requireAuth(req, ["admin"]);
    if (!auth.ok) return auth.response;

    await connectDB();
    await CommissionSetting.deleteOne({ serviceType: "shopping" });

    return NextResponse.json({
      success: true,
      message: "Shopping commission percentage reset to default 1.5%.",
      data: serializeSetting(null),
    });
  } catch (error) {
    console.error("DELETE /api/admin/shopping-commission error:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
