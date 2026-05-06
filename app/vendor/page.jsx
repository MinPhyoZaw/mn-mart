import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "../lib/jwt";

const TYPE_MAP = {
  shopping: "shop",
  transportation: "transport",
  transport: "transport",
  hotel: "hotel",
  spa: "spa",
};

export default async function VendorRootPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) redirect("/login");

  try {
    const user = verifyToken(token);
    const vendorType = TYPE_MAP[user?.serviceType] || user?.serviceType;
    if (user?.role !== "vendor" || !vendorType) redirect("/");
    redirect(`/vendor/${vendorType}/dashboard`);
  } catch {
    redirect("/login");
  }
}
