import { NextResponse } from "next/server";
import { verifyToken } from "./jwt";

export function requireAuth(req, allowedRoles = []) {
  try {
    const token = req.cookies.get("token")?.value;
    if (!token) {
      return {
        ok: false,
        response: NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 }),
      };
    }

    const decoded = verifyToken(token);

    if (allowedRoles.length > 0 && !allowedRoles.includes(decoded.role)) {
      return {
        ok: false,
        response: NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 }),
      };
    }

    return { ok: true, user: decoded };
  } catch {
    return {
      ok: false,
      response: NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 }),
    };
  }
}
