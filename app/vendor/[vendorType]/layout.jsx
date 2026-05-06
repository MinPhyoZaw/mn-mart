import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "../../lib/jwt";

const TYPE_MAP = {
  shopping: "shop",
  transport: "transport",
  transportation: "transport",
  hotel: "hotel",
  spa: "spa",
};

export default async function VendorTypeLayout({ children, params }) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) redirect("/login");

  try {
    const user = verifyToken(token);
    if (user?.role !== "vendor") redirect("/");

    const routeType = params.vendorType;
    const userType = TYPE_MAP[user.serviceType] || user.serviceType;

    if (!routeType || routeType !== userType) {
      redirect(`/vendor/${userType}/dashboard`);
    }
  } catch {
    redirect("/login");
  }

  return children;
}
