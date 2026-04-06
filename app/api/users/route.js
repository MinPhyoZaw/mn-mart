import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import connectDB from "../../lib/mongodb";
import User from "../../models/User";
import { requireAuth } from "../../lib/routeAuth";

const ALLOWED_ROLES = ["customer", "vendor", "admin"];

export async function GET(req) {
  try {
    const auth = requireAuth(req, ["admin"]);
    if (!auth.ok) return auth.response;

    await connectDB();
    const users = await User.find({}).select("-password").lean();
    return NextResponse.json({ success: true, data: users }, { status: 200 });
  } catch (error) {
    console.error("GET /api/users error:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const auth = requireAuth(req, ["admin"]);
    if (!auth.ok) return auth.response;

    await connectDB();
    const { name, email, password, phone, role } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ success: false, message: "Missing fields" }, { status: 400 });
    }

    const existing = await User.findOne({ email });
    if (existing) return NextResponse.json({ success: false, message: "Email exists" }, { status: 400 });

    const hashed = await bcrypt.hash(password, 10);
    const safeRole = ALLOWED_ROLES.includes(role) ? role : "customer";
    const user = await User.create({ name, email, phone: phone || "", password: hashed, role: safeRole });
    const userObj = user.toObject ? user.toObject() : user;
    delete userObj.password;
    return NextResponse.json({ success: true, data: userObj }, { status: 201 });
  } catch (error) {
    console.error("POST /api/users error:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
