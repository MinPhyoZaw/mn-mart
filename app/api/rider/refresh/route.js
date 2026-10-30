import mongoose from "mongoose";
import { NextResponse } from "next/server";
import connectDB from "../../../lib/mongodb";
import User from "../../../models/User";
import RiderProfile from "../../../models/RiderProfile";
import RiderRefreshSession from "../../../models/RiderRefreshSession";
import { createRefreshToken, riderTokenHash, signRiderAccessToken, minimalRiderStatus, ACCESS_TTL_SECONDS, REFRESH_TTL_MS } from "../../../lib/riderAuth";
import { errorResponse, checkRiderRateLimit } from "../../../lib/riderSecurity";

export async function POST(req) {
  const startedAt = performance.now();
  const timings = {};
  let outcome = "unknown";
  const finish = (response) => {
    outcome = response.status;
    return response;
  };
  const addTiming = (phase, durationMs) => {
    timings[phase] = (timings[phase] || 0) + durationMs;
  };

  try {
    const connectionStartedAt = performance.now();
    try {
      await connectDB();
    } finally {
      timings.connectionMs = performance.now() - connectionStartedAt;
    }
    const limited = await checkRiderRateLimit(req, "refresh", 20, 60);
    if (limited) return finish(limited);
    const body = await req.json();
    if (typeof body.refreshToken !== "string" || !body.refreshToken) return finish(errorResponse(400, "VALIDATION_ERROR", "Refresh token is required."));
    const oldHash = riderTokenHash(body.refreshToken);
    const nextToken = createRefreshToken();
    const nextHash = riderTokenHash(nextToken);
    const now = new Date();
    let sessionUserId;
    const rotationStartedAt = performance.now();
    let session;
    try {
      session = await mongoose.startSession();
      await session.withTransaction(async () => {
        const sessionLookupStartedAt = performance.now();
        let oldSession;
        try {
          oldSession = await RiderRefreshSession.findOneAndUpdate({ tokenHash: oldHash, revokedAt: null, expiresAt: { $gt: now } }, { $set: { revokedAt: now, replacedByHash: nextHash } }, { returnDocument: "after", session });
        } finally {
          addTiming("sessionLookupMs", performance.now() - sessionLookupStartedAt);
        }
        if (!oldSession) return;
        sessionUserId = oldSession.userId;
        await RiderRefreshSession.create([{ userId: sessionUserId, tokenHash: nextHash, expiresAt: new Date(Date.now() + REFRESH_TTL_MS) }], { session });
      });
    } finally {
      try {
        if (session) await session.endSession();
      } finally {
        timings.transactionRotationMs = performance.now() - rotationStartedAt;
      }
    }
    if (!sessionUserId) return finish(errorResponse(401, "INVALID_REFRESH_TOKEN", "Refresh token is invalid, expired, or already used."));
    const userProfileStartedAt = performance.now();
    let user;
    let profile;
    try {
      [user, profile] = await Promise.all([
        User.findById(sessionUserId).select("_id name email role").lean(),
        RiderProfile.findOne({ userId: sessionUserId }).lean(),
      ]);
    } finally {
      timings.userProfileLoadingMs = performance.now() - userProfileStartedAt;
    }
    if (!user) return finish(errorResponse(401, "UNAUTHORIZED", "Account no longer exists."));
    return finish(NextResponse.json({ success: true, data: { accessToken: signRiderAccessToken(user._id), tokenType: "Bearer", expiresIn: ACCESS_TTL_SECONDS, refreshToken: nextToken, user: { id: String(user._id), name: user.name, email: user.email, role: user.role }, rider: minimalRiderStatus(profile) } }));
  } catch (error) {
    console.error("POST /api/rider/refresh error:", { name: error?.name, code: error?.code });
    return finish(errorResponse(500, "SERVER_ERROR", "Unable to refresh session."));
  } finally {
    timings.totalMs = performance.now() - startedAt;
    const safeTimings = Object.fromEntries(
      Object.entries(timings).map(([name, durationMs]) => [name, Number(durationMs.toFixed(2))])
    );
    console.info("POST /api/rider/refresh timing", JSON.stringify({ outcome, ...safeTimings }));
  }
}
