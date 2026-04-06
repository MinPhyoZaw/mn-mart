import { NextResponse } from "next/server";
import connectDB from "../../../../lib/mongodb";
import User from "../../../../models/User";
import { requireAuth } from "../../../../lib/routeAuth";

const ALLOWED_ROLES = ["customer", "vendor", "admin"];

export async function PATCH(req, context) {
  try {
    const auth = requireAuth(req, ["admin"]);
    if (!auth.ok) return auth.response;

    await connectDB();
    const { id } = await context.params;
    const { role } = await req.json();

    if (!ALLOWED_ROLES.includes(role)) {
      return NextResponse.json({ success: false, message: "Invalid role" }, { status: 400 });
    }

    const targetUser = await User.findById(id);
    if (!targetUser) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    if (targetUser.role === "admin" && role !== "admin") {
      const adminCount = await User.countDocuments({ role: "admin" });
      if (adminCount <= 1) {
        return NextResponse.json(
          { success: false, message: "Cannot remove role from last admin" },
          { status: 400 }
        );
      }
    }

    targetUser.role = role;
    await targetUser.save();

    const safeUser = targetUser.toObject();
    delete safeUser.password;

    return NextResponse.json({ success: true, data: safeUser }, { status: 200 });
  } catch (error) {
    console.error("PATCH /api/users/[id]/role error:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
