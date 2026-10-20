import bcrypt from "bcrypt";
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
    const limited = await checkRiderRateLimit(req, "login", 10, 60);
    if (limited) return limited;
    const body = await req.json();
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";
    if (!email || !password) return errorResponse(400, "VALIDATION_ERROR", "Email and password are required.");
    const user = await User.findOne({ email: { $regex: `^${email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" } });
    if (!user || !await bcrypt.compare(password, user.password || "")) return errorResponse(401, "INVALID_CREDENTIALS", "Email or password is incorrect.");
    const refreshToken = createRefreshToken();
    await RiderRefreshSession.create({ userId: user._id, tokenHash: riderTokenHash(refreshToken), expiresAt: new Date(Date.now() + REFRESH_TTL_MS) });
    const profile = await RiderProfile.findOne({ userId: user._id }).lean();
    return NextResponse.json({ success: true, data: { accessToken: signRiderAccessToken(user._id), tokenType: "Bearer", expiresIn: ACCESS_TTL_SECONDS, refreshToken, user: { id: String(user._id), name: user.name, email: user.email, role: user.role }, rider: minimalRiderStatus(profile) } });
  } catch (error) {
    console.error("POST /api/rider/login error:", error?.message);
    return errorResponse(500, "SERVER_ERROR", "Unable to sign in.");
  }
}
