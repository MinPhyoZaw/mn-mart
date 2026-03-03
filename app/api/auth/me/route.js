import { NextResponse } from "next/server";
import User from "../../../models/User";
import connectDB from "../../../lib/mongodb";
import { verifyToken } from "../../../lib/jwt";

export async function GET(req) {
  try {
    await connectDB();

    const token = req.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ user: null });
    }

    const decoded = verifyToken(token);

    const user = await User.findById(decoded.userId).select("-password");

    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ user: null });
  }
}
