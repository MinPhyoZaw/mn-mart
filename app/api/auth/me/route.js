import { NextResponse } from "next/server";

import User from "../../../models/User";
import connectDB from "../../../lib/mongodb";
import { verifyToken } from "../../../lib/jwt";

const NO_STORE_HEADERS = {
  "Cache-Control":
    "private, no-store, must-revalidate",
};

export async function GET(req) {
  const token =
    req.cookies.get("token")?.value;

  /*
   * No cookie = genuinely unauthenticated.
   */
  if (!token) {
    return NextResponse.json(
      {
        user: null,
      },
      {
        status: 401,
        headers: NO_STORE_HEADERS,
      }
    );
  }

  let decoded;

  try {
    decoded = verifyToken(token);
  } catch {
    /*
     * Invalid/expired JWT.
     */
    return NextResponse.json(
      {
        user: null,
      },
      {
        status: 401,
        headers: NO_STORE_HEADERS,
      }
    );
  }

  try {
    await connectDB();

    const user = await User.findById(
      decoded.userId
    )
      .select("-password")
      .lean();

    if (!user) {
      return NextResponse.json(
        {
          user: null,
        },
        {
          status: 401,
          headers: NO_STORE_HEADERS,
        }
      );
    }

    return NextResponse.json(
      {
        user,
      },
      {
        status: 200,
        headers: NO_STORE_HEADERS,
      }
    );
  } catch (error) {
    console.error(
      "GET /api/auth/me error:",
      error
    );

    /*
     * MongoDB/network problem is NOT logout.
     */
    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to verify session.",
      },
      {
        status: 503,
        headers: NO_STORE_HEADERS,
      }
    );
  }
}