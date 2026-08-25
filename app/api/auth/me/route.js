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
      return NextResponse.json(
        { user: null },
        {
          status: 401,
          headers: NO_STORE_HEADERS,
        }
      );
    }

    let decoded;

    try {
      decoded = verifyToken(token);
    } catch (error) {
      console.error("Invalid token:", error);

      return NextResponse.json(
        { user: null },
        {
          status: 401,
          headers: NO_STORE_HEADERS,
        }
      );
    }

    await connectDB();

    const user = await User.findById(decoded.userId)
      .select("-password")
      .lean();

    if (!user) {
      return NextResponse.json(
        { user: null },
        {
          status: 404,
          headers: NO_STORE_HEADERS,
        }
      );
    }

    return NextResponse.json(
      { user },
      {
        status: 200,
        headers: NO_STORE_HEADERS,
      }
    );
  } catch (error) {
    console.error("/api/auth/me error:", error);

    return NextResponse.json(
      {
        user: null,
        error: "Unable to verify user",
      },
      {
        status: 500,
        headers: NO_STORE_HEADERS,
      }
    );
  }
}