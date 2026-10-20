import connectDB from "../../../lib/mongodb";
import RiderRefreshSession from "../../../models/RiderRefreshSession";
import { riderTokenHash } from "../../../lib/riderAuth";
import { errorResponse, checkRiderRateLimit } from "../../../lib/riderSecurity";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    await connectDB();
    const limited = await checkRiderRateLimit(req, "logout", 20, 60);
    if (limited) return limited;
    const body = await req.json();
    if (typeof body.refreshToken !== "string" || !body.refreshToken) return errorResponse(400, "VALIDATION_ERROR", "Refresh token is required.");
    await RiderRefreshSession.updateOne({ tokenHash: riderTokenHash(body.refreshToken), revokedAt: null }, { $set: { revokedAt: new Date() } });
    return NextResponse.json({ success: true, data: { loggedOut: true } });
  } catch (error) {
    console.error("POST /api/rider/logout error:", error?.message);
    return errorResponse(500, "SERVER_ERROR", "Unable to sign out.");
  }
}
