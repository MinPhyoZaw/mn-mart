import crypto from "crypto";
import { NextResponse } from "next/server";
import RiderRateLimit from "../models/RiderRateLimit";
import { requireAuth } from "./routeAuth";
import User from "../models/User";
import connectDB from "./mongodb";

export function errorResponse(status, code, message, extra = {}) {
  return NextResponse.json({ success: false, error: { code, message, ...extra } }, { status });
}

export function requireSameOrigin(req) {
  const origin = req.headers.get("origin");
  if (!origin) return errorResponse(403, "ORIGIN_REQUIRED", "Origin header is required for this action.");
  try {
    if (new URL(origin).origin !== new URL(req.url).origin) throw new Error("origin mismatch");
  } catch {
    return errorResponse(403, "INVALID_ORIGIN", "Request origin is not allowed.");
  }
  return null;
}

export async function checkRiderRateLimit(req, route, limit = 10, windowSeconds = 60) {
  const ip = req.headers.get("x-real-ip") || (req.headers.get("x-forwarded-for") || "unknown").split(",").at(-1).trim();
  const bucket = Math.floor(Date.now() / (windowSeconds * 1000));
  const key = crypto.createHash("sha256").update(`${route}:${ip}:${bucket}`).digest("hex");
  const expiresAt = new Date((bucket + 1) * windowSeconds * 1000);
  try {
    const result = await RiderRateLimit.findOneAndUpdate(
      { key, expiresAt: { $gt: new Date() } },
      { $inc: { count: 1 }, $setOnInsert: { key, expiresAt } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();
    if (result.count > limit) return errorResponse(429, "RATE_LIMITED", "Too many requests. Try again shortly.", { retryAfterSeconds: windowSeconds });
    return null;
  } catch (error) {
    // An expired row with the same bucket key may race TTL cleanup; do not fail open on database errors.
    if (error?.code === 11000) {
      const result = await RiderRateLimit.findOneAndUpdate({ key }, { $inc: { count: 1 } }, { new: true }).lean();
      if (result && result.count <= limit) return null;
      return errorResponse(429, "RATE_LIMITED", "Too many requests. Try again shortly.", { retryAfterSeconds: windowSeconds });
    }
    throw error;
  }
}

export async function requireCurrentAdmin(req) {
  const auth = requireAuth(req, ["admin"]);
  if (!auth.ok) return auth;
  await connectDB();
  const user = await User.findById(auth.user.userId).select("_id role").lean();
  if (!user || user.role !== "admin") return { ok: false, response: errorResponse(403, "FORBIDDEN", "Administrator access required.") };
  return { ok: true, user };
}
