import bcrypt from "bcrypt";
import mongoose from "mongoose";
import { NextResponse } from "next/server";
import connectDB from "../../../lib/mongodb";
import User from "../../../models/User";
import RiderProfile from "../../../models/RiderProfile";
import { errorResponse, checkRiderRateLimit } from "../../../lib/riderSecurity";
import { validateRiderRegistration, buildRiderAccountDocuments } from "../../../lib/riderInput";

export async function POST(req) {
  try {
    await connectDB();
    const limited = await checkRiderRateLimit(req, "register", 5, 300);
    if (limited) return limited;
    const parsed = validateRiderRegistration(await req.json().catch(() => null));
    if (parsed.error) return errorResponse(400, "VALIDATION_ERROR", parsed.error);
    const { name, email, phone, password } = parsed.value;
    const existing = await User.findOne({ email: { $regex: `^${email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" } }).select("_id").lean();
    if (existing) return errorResponse(409, "ACCOUNT_EXISTS", "An account already uses this email. Sign in and apply from that account.");
    const passwordHash = await bcrypt.hash(password, 10);
    const documents = buildRiderAccountDocuments({ name, email, phone, passwordHash });
    const session = await mongoose.startSession();
    let createdUser;
    let createdProfile;
    try {
      await session.withTransaction(async () => {
        [createdUser] = await User.create([documents.user], { session });
        [createdProfile] = await RiderProfile.create([{ ...documents.rider, userId: createdUser._id }], { session });
      });
    } finally { await session.endSession(); }
    return NextResponse.json({ success: true, data: { user: { id: String(createdUser._id), name: createdUser.name, email: createdUser.email, role: createdUser.role }, rider: { profileId: String(createdProfile._id), status: createdProfile.status, appliedAt: createdProfile.appliedAt } } }, { status: 201 });
  } catch (error) {
    if (error?.code === 11000) return errorResponse(409, "ACCOUNT_EXISTS", "An account or rider application already exists. Sign in and check rider status.");
    console.error("POST /api/rider/register error:", error?.message);
    return errorResponse(500, "SERVER_ERROR", "Unable to create rider application.");
  }
}
