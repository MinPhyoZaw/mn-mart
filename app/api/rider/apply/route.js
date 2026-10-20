import { NextResponse } from "next/server";
import connectDB from "../../../lib/mongodb";
import User from "../../../models/User";
import RiderProfile from "../../../models/RiderProfile";
import { authenticateRiderRequest, minimalRiderStatus } from "../../../lib/riderAuth";
import { errorResponse, requireSameOrigin, checkRiderRateLimit } from "../../../lib/riderSecurity";
import { buildExistingAccountRiderApplication } from "../../../lib/riderInput";

export async function POST(req) {
  try {
    const auth = await authenticateRiderRequest(req);
    if (!auth.ok) return auth.response;
    if (auth.authType === "web") {
      const originError = requireSameOrigin(req);
      if (originError) return originError;
    }
    await connectDB();
    const limited = await checkRiderRateLimit(req, "apply", 10, 60);
    if (limited) return limited;
    const user = await User.findById(auth.user.userId).select("_id name phone role").lean();
    if (!user) return errorResponse(401, "UNAUTHORIZED", "Account no longer exists.");
    if (!["customer", "vendor"].includes(user.role)) return errorResponse(403, "ACCOUNT_NOT_ELIGIBLE", "Only customer or vendor accounts can apply as riders.");
    const existing = await RiderProfile.findOne({ userId: user._id });
    if (existing) {
      const status = minimalRiderStatus(existing);
      const message = { pending: "Application is already pending.", approved: "Rider account is already approved.", rejected: "Application was rejected; contact support for next steps.", suspended: "Rider account is suspended." }[existing.status];
      return NextResponse.json({ success: true, data: { rider: status }, message }, { status: 200 });
    }
    const body = await req.json().catch(() => ({}));
    const name = typeof body.name === "string" ? body.name.trim() : user.name;
    const phone = typeof body.phone === "string" ? body.phone.trim() : user.phone;
    if (!name || name.length > 100 || !phone || phone.length < 5 || phone.length > 32) return errorResponse(400, "VALIDATION_ERROR", "A valid application name and phone number are required.");
    try {
      const profile = await RiderProfile.create(buildExistingAccountRiderApplication({ userId: user._id, name, phone }));
      return NextResponse.json({ success: true, data: { rider: minimalRiderStatus(profile) } }, { status: 201 });
    } catch (error) {
      if (error?.code !== 11000) throw error;
      const profile = await RiderProfile.findOne({ userId: user._id });
      return NextResponse.json({ success: true, data: { rider: minimalRiderStatus(profile) }, message: "A rider application already exists." }, { status: 200 });
    }
  } catch (error) {
    console.error("POST /api/rider/apply error:", error?.message);
    return errorResponse(500, "SERVER_ERROR", "Unable to submit rider application.");
  }
}
