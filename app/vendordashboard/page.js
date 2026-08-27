import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { verifyToken } from "../lib/jwt";
import connectDB from "../lib/mongodb";
import User from "../models/User";
import VendorDashboardClient from "./VendorDashboardClient";

export const dynamic = "force-dynamic";

export default async function VendorDashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    redirect("/login");
  }

  let decoded;

  try {
    decoded = verifyToken(token);
  } catch {
    redirect("/login");
  }

  await connectDB();

  const currentUser = decoded?.userId
    ? await User.findById(decoded.userId).select("_id role").lean()
    : null;

  if (!currentUser) {
    redirect("/login");
  }

  if (currentUser.role !== "vendor") {
    redirect("/");
  }

  return <VendorDashboardClient />;
}
