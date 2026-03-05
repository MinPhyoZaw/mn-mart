import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import connectDB from "../../lib/mongodb";
import User from "../../models/User";

export async function GET() {
  try {
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
    await connectDB();
    const { name, email, password, role } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ success: false, message: "Missing fields" }, { status: 400 });
    }

    const existing = await User.findOne({ email });
    if (existing) return NextResponse.json({ success: false, message: "Email exists" }, { status: 400 });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed, role: role || "customer" });
    const userObj = user.toObject ? user.toObject() : user;
    delete userObj.password;
    return NextResponse.json({ success: true, data: userObj }, { status: 201 });
  } catch (error) {
    console.error("POST /api/users error:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
