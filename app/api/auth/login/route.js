// app/api/auth/login/route.js
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import User from "../../../models/User";
import connectDB from "../../../lib/mongodb";
import { signToken } from "../../../lib/jwt";

export async function POST(req) {
  try {
    await connectDB();
    const { email, password } = await req.json();

    if (!email || !password)
      return NextResponse.json(
        { success: false, message: "Email and password required" },
        { status: 400 }
      );

    const user = await User.findOne({ email });
    if (!user)
      return NextResponse.json(
        { success: false, message: "Invalid credentials" },
        { status: 401 }
      );

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return NextResponse.json(
        { success: false, message: "Invalid credentials" },
        { status: 401 }
      );

    // ✅ Sign JWT
    const token = signToken({ userId: user._id, role: user.role, serviceType: user.serviceType });

    // ✅ Set HttpOnly cookie
    const response = NextResponse.json({
      success: true,
      message: "Logged in",
      user: { id: user._id, name: user.name, email: user.email, role: user.role, serviceType: user.serviceType },
    });

    response.cookies.set({
      name: "token",
      value: token,
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}