import crypto from "crypto";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server.js";
import User from "../models/User.js";
import RiderProfile from "../models/RiderProfile.js";
import { verifyToken } from "./jwt.js";
import connectDB from "./mongodb.js";
import { isApprovedRiderAccount } from "./delivery.js";


const MOBILE_AUDIENCE = "mn-mart-rider-mobile";
const ACCESS_TTL_SECONDS = 15 * 60;
const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const MOBILE_JWT_SECRET = crypto.createHmac("sha256", process.env.JWT_SECRET).update("mn-mart-rider-mobile-v1").digest();

export const riderTokenHash = (value) => crypto.createHash("sha256").update(value).digest("hex");
export const createRefreshToken = () => crypto.randomBytes(48).toString("base64url");

export function signRiderAccessToken(userId) {
  return jwt.sign({ userId: String(userId), purpose: "rider-mobile" }, MOBILE_JWT_SECRET, {
    audience: MOBILE_AUDIENCE,
    expiresIn: ACCESS_TTL_SECONDS,
  });
}

export function verifyRiderAccessToken(token) {
  const claims = jwt.verify(token, MOBILE_JWT_SECRET, { audience: MOBILE_AUDIENCE });
  if (claims.purpose !== "rider-mobile" || !claims.userId) throw new Error("Invalid rider access token");
  return claims;
}

function bearerToken(req) {
  const header = req.headers.get("authorization") || "";
  return header.startsWith("Bearer ") ? header.slice(7).trim() : "";
}

export async function authenticateRiderRequest(req, { allowWeb = true } = {}) {
  const bearer = bearerToken(req);
  if (bearer) {
    try { return { ok: true, user: verifyRiderAccessToken(bearer), authType: "mobile" }; }
    catch { return { ok: false, response: NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Invalid or expired access token." } }, { status: 401 }) }; }
  }
  if (!allowWeb) return { ok: false, response: NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Bearer access token required." } }, { status: 401 }) };
  const token = req.cookies.get("token")?.value;
  if (!token) return { ok: false, response: NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Authentication required." } }, { status: 401 }) };
  try {
    const claims = verifyToken(token);
    if (!claims.userId) throw new Error("Invalid token");
    return { ok: true, user: claims, authType: "web" };
  } catch {
    return { ok: false, response: NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Invalid or expired session." } }, { status: 401 }) };
  }
}

export async function requireApprovedRider(req) {
  const auth = await authenticateRiderRequest(req, { allowWeb: false });
  if (!auth.ok) return auth;
  await connectDB();
  const user = await User.findById(auth.user.userId).select("_id role").lean();
  const profile = user ? await RiderProfile.findOne({ userId: user._id }).select("status").lean() : null;
  if (!isApprovedRiderAccount(user, profile)) {
    return { ok: false, response: NextResponse.json({ success: false, error: { code: "RIDER_NOT_APPROVED", message: "An approved rider account is required." } }, { status: 403 }) };
  }
  return { ok: true, user, profile };
}

export function minimalRiderStatus(profile) {
  return profile ? { profileId: String(profile._id), status: profile.status, reason: profile.reason || null, appliedAt: profile.appliedAt, reviewedAt: profile.reviewedAt || null } : { profileId: null, status: "not_applied", reason: null, appliedAt: null, reviewedAt: null };
}

export { ACCESS_TTL_SECONDS, REFRESH_TTL_MS };
