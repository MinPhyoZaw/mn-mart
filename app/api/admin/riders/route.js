import { NextResponse } from "next/server";
import RiderProfile from "../../../models/RiderProfile";
import { requireCurrentAdmin } from "../../../lib/riderSecurity";
import { errorResponse } from "../../../lib/riderSecurity";

export async function GET(req) {
  try {
    const auth = await requireCurrentAdmin(req);
    if (!auth.ok) return auth.response;
    const params = new URL(req.url).searchParams;
    const pageValue = Number.parseInt(params.get("page") || "1", 10);
    const limitValue = Number.parseInt(params.get("limit") || "20", 10);
    const page = Number.isFinite(pageValue) && pageValue > 0 ? pageValue : 1;
    const limit = Number.isFinite(limitValue) && limitValue > 0 ? Math.min(limitValue, 50) : 20;
    const status = params.get("status");
    if (status && status !== "all" && !["pending", "approved", "rejected", "suspended"].includes(status)) return errorResponse(400, "VALIDATION_ERROR", "Invalid rider status filter.");
    const filter = status && status !== "all" ? { status } : {};
    const [items, total] = await Promise.all([
      RiderProfile.find(filter).select("_id userId name phone status appliedAt reviewerId reviewedAt reason").populate("userId", "name email role").sort({ appliedAt: -1, _id: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      RiderProfile.countDocuments(filter),
    ]);
    const data = items.map((item) => ({ profileId: String(item._id), userId: item.userId?._id ? String(item.userId._id) : null, name: item.name, email: item.userId?.email || "", phone: item.phone, currentRole: item.userId?.role || null, status: item.status, appliedAt: item.appliedAt, reviewerId: item.reviewerId ? String(item.reviewerId) : null, reviewedAt: item.reviewedAt || null, reason: item.reason || "" }));
    return NextResponse.json({ success: true, data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit), hasNextPage: page * limit < total } });
  } catch (error) {
    console.error("GET /api/admin/riders error:", error?.message);
    return errorResponse(500, "SERVER_ERROR", "Unable to load rider applications.");
  }
}
