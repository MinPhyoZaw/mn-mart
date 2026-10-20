import mongoose from "mongoose";
import { NextResponse } from "next/server";
import connectDB from "../../../lib/mongodb";
import User from "../../../models/User";
import RiderProfile from "../../../models/RiderProfile";
import RiderRefreshSession from "../../../models/RiderRefreshSession";
import { createRefreshToken, riderTokenHash, signRiderAccessToken, minimalRiderStatus, ACCESS_TTL_SECONDS, REFRESH_TTL_MS } from "../../../lib/riderAuth";
import { errorResponse, checkRiderRateLimit } from "../../../lib/riderSecurity";

export async function POST(req) {
  try {
    await connectDB();
    const limited = await checkRiderRateLimit(req, "refresh", 20, 60);
    if (limited) return limited;
    const body = await req.json();
    if (typeof body.refreshToken !== "string" || !body.refreshToken) return errorResponse(400, "VALIDATION_ERROR", "Refresh token is required.");
    const oldHash = riderTokenHash(body.refreshToken);
    const nextToken = createRefreshToken();
    const nextHash = riderTokenHash(nextToken);
    const now = new Date();
    const session = await mongoose.startSession();
    let sessionUserId;
    try {
      await session.withTransaction(async () => {
        const oldSession = await RiderRefreshSession.findOneAndUpdate({ tokenHash: oldHash, revokedAt: null, expiresAt: { $gt: now } }, { $set: { revokedAt: now, replacedByHash: nextHash } }, { new: true, session });
        if (!oldSession) return;
        sessionUserId = oldSession.userId;
        await RiderRefreshSession.create([{ userId: sessionUserId, tokenHash: nextHash, expiresAt: new Date(Date.now() + REFRESH_TTL_MS) }], { session });
      });
    } finally { await session.endSession(); }
    if (!sessionUserId) return errorResponse(401, "INVALID_REFRESH_TOKEN", "Refresh token is invalid, expired, or already used.");
    const user = await User.findById(sessionUserId).select("_id name email role").lean();
    if (!user) return errorResponse(401, "UNAUTHORIZED", "Account no longer exists.");
    const profile = await RiderProfile.findOne({ userId: user._id }).lean();
    return NextResponse.json({ success: true, data: { accessToken: signRiderAccessToken(user._id), tokenType: "Bearer", expiresIn: ACCESS_TTL_SECONDS, refreshToken: nextToken, user: { id: String(user._id), name: user.name, email: user.email, role: user.role }, rider: minimalRiderStatus(profile) } });
  } catch (error) {
    console.error("POST /api/rider/refresh error:", error?.message);
    return errorResponse(500, "SERVER_ERROR", "Unable to refresh session.");
  }
}
