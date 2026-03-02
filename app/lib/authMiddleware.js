// lib/authMiddleware.js
import { NextResponse } from "next/server";
import { verifyToken } from "./jwt";

export const authMiddleware = (handler, allowedRoles = []) => async (req) => {
  try {
    const token = req.cookies.get("token")?.value;

    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const decoded = verifyToken(token);

    if (allowedRoles.length && !allowedRoles.includes(decoded.role)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    req.user = decoded; // Attach user info to request
    return handler(req);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
};