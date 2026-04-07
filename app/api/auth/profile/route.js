import { NextResponse } from "next/server";
import User from "../../../models/User";
import connectDB from "../../../lib/mongodb";
import { verifyToken } from "../../../lib/jwt";

export async function PATCH(req) {
  try {
    await connectDB();

    const token = req.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    const { profileImage } = await req.json();

    if (typeof profileImage !== "string" || !profileImage.startsWith("data:image/")) {
      return NextResponse.json({ error: "Invalid profile image." }, { status: 400 });
    }

    const user = await User.findByIdAndUpdate(
      decoded.userId,
      { profileImage },
      { new: true }
    ).select("-password");

    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ error: "Unable to update profile." }, { status: 500 });
  }
}
