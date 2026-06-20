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


export async function requireVendorAuth(req) {
  const auth = requireAuth(req, ["vendor", "admin", "customer"]);
  if (!auth.ok) return auth;

  if (auth.user.role === "admin") {
    return auth;
  }

  const connectDB = (await import("./mongodb")).default;
  const Vendor = (await import("../models/Vendor")).default;

  await connectDB();
  const vendor = await Vendor.findOne({ userId: auth.user.userId }).lean();
  if (!vendor) {
    return {
      ok: false,
      response: NextResponse.json({ success: false, message: "Vendor profile not found" }, { status: 404 }),
    };
  }

  return { ok: true, user: { ...auth.user, role: "vendor" }, vendor };
}
