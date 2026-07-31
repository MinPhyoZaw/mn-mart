import { NextResponse } from "next/server";
import User from "../../../models/User";
import connectDB from "../../../lib/mongodb";
import { verifyToken } from "../../../lib/jwt";

const NO_STORE_HEADERS = {
  "Cache-Control": "private, no-store, must-revalidate",
};

export async function GET(req) {
  try {
    const token = req.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ user: null }, { headers: NO_STORE_HEADERS });
    }

    const decoded = verifyToken(token);

    await connectDB();
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return NextResponse.json({ user: null }, { headers: NO_STORE_HEADERS });
    }

    return NextResponse.json({ user }, { headers: NO_STORE_HEADERS });
  } catch {
    return NextResponse.json({ user: null }, { headers: NO_STORE_HEADERS });
  }
}