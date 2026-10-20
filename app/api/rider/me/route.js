import { NextResponse } from "next/server";
import connectDB from "../../../lib/mongodb";
import User from "../../../models/User";
import RiderProfile from "../../../models/RiderProfile";
import { authenticateRiderRequest, minimalRiderStatus } from "../../../lib/riderAuth";
import { errorResponse } from "../../../lib/riderSecurity";

export async function GET(req) {
  try {
    const auth = await authenticateRiderRequest(req);
    if (!auth.ok) return auth.response;
    await connectDB();
    const user = await User.findById(auth.user.userId).select("_id name email role").lean();
    if (!user) return errorResponse(401, "UNAUTHORIZED", "Account no longer exists.");
    const profile = await RiderProfile.findOne({ userId: user._id }).lean();
    return NextResponse.json({ success: true, data: { user: { id: String(user._id), name: user.name, email: user.email, role: user.role }, rider: minimalRiderStatus(profile) } }, { headers: { "Cache-Control": "private, no-store, max-age=0" } });
  } catch (error) {
    console.error("GET /api/rider/me error:", error?.message);
    return errorResponse(500, "SERVER_ERROR", "Unable to load account status.");
  }
}
