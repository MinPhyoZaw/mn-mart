import mongoose from "mongoose";
import { NextResponse } from "next/server";
import RiderProfile from "../../../../models/RiderProfile";
import { requireCurrentAdmin, requireSameOrigin, errorResponse } from "../../../../lib/riderSecurity";
import { reviewTransition } from "../../../../lib/riderReview";

export async function PATCH(req, { params }) {
  try {
    const auth = await requireCurrentAdmin(req);
    if (!auth.ok) return auth.response;
    const originError = requireSameOrigin(req);
    if (originError) return originError;
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) return errorResponse(400, "INVALID_PROFILE_ID", "Rider profile ID is invalid.");
    const body = await req.json();
    const action = body.action;
    if (!["approve", "reject", "suspend"].includes(action)) return errorResponse(400, "INVALID_ACTION", "Action must be approve, reject, or suspend.");
    const reason = typeof body.reason === "string" ? body.reason.trim() : "";
    if (reason.length > 500) return errorResponse(400, "VALIDATION_ERROR", "Reason must be 500 characters or fewer.");
    if (action === "reject" && !reason) return errorResponse(400, "VALIDATION_ERROR", "A rejection reason is required.");
    const current = await RiderProfile.findById(id).select("status").lean();
    if (!current) return errorResponse(404, "NOT_FOUND", "Rider profile not found.");
    const transition = reviewTransition(current.status, action);
    if (!transition) return errorResponse(409, "INVALID_TRANSITION", `Cannot ${action} a ${current.status} rider application.`);
    const updated = await RiderProfile.findOneAndUpdate(
      { _id: id, status: current.status },
      { $set: { status: transition.status, reviewerId: auth.user._id, reviewedAt: new Date(), reason: action === "approve" ? "" : reason } },
      { new: true }
    ).populate("userId", "name email role").lean();
    if (!updated) return errorResponse(409, "ALREADY_REVIEWED", "The rider application changed while it was being reviewed. Reload and try again.");
    return NextResponse.json({ success: true, data: { profileId: String(updated._id), userId: String(updated.userId?._id || updated.userId), name: updated.name, email: updated.userId?.email || "", phone: updated.phone, currentRole: updated.userId?.role || null, status: updated.status, appliedAt: updated.appliedAt, reviewerId: String(updated.reviewerId), reviewedAt: updated.reviewedAt, reason: updated.reason || "" } });
  } catch (error) {
    console.error("PATCH /api/admin/riders/[id] error:", error?.message);
    return errorResponse(500, "SERVER_ERROR", "Unable to review rider application.");
  }
}
