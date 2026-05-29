import connectDB from "../lib/mongodb";
import Shop from "../models/Shop";
import Vendor from "../models/Vendor";
import VendorRequest from "../models/VendorRequest";
import User from "../models/User";
import Order from "../models/Order";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "../lib/jwt";
import AdminDashboardClient from "../components/AdminDashboardClient";
import CommissionSetting from "../models/CommissionSetting";
import { DEFAULT_SHOPPING_COMMISSION_RATE } from "../lib/shoppingCommission";

const getTodayRange = () => {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

export default async function AdminDashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) redirect("/login");

  let decoded = null;
  try {
    decoded = verifyToken(token);
  } catch {
    redirect("/login");
  }

  await connectDB();
  const currentUser = decoded?.userId ? await User.findById(decoded.userId).lean() : null;
  if (!currentUser || currentUser.role !== "admin") {
    redirect("/");
  }

  const requestPageSize = 20;
  const { start, end } = getTodayRange();

  const [
    shops,
    vendors,
    vendorRequestsRaw,
    usersRaw,
    pendingRequestsCount,
    totalRequestsCount,
    todayOrders,
    shoppingCommissionRaw,
  ] = await Promise.all([
    Shop.find({}).lean(),
    Vendor.find({}).lean(),
    VendorRequest.find({}).sort({ createdAt: -1 }).limit(requestPageSize).lean(),
    User.find({}).select("-password").sort({ createdAt: -1 }).lean(),
    VendorRequest.countDocuments({ status: "pending" }),
    VendorRequest.countDocuments({}),
    Order.find({
      createdAt: { $gte: start, $lte: end },
      orderStatus: "confirmed",
      vendorStatus: "accepted",
    })
      .populate("vendorId", "vendorName")
      .sort({ createdAt: -1 })
      .lean(),
    CommissionSetting.findOne({ serviceType: "shopping" }).lean(),
  ]);

  const vendorProfitMap = new Map();
  for (const order of todayOrders) {
    const vendorName = order.vendorId?.vendorName || "Unknown Vendor";
    vendorProfitMap.set(vendorName, (vendorProfitMap.get(vendorName) || 0) + (order.commissionAmount || 0));
  }

  const todayProfitByVendor = [...vendorProfitMap.entries()].map(([vendorName, amount]) => ({
    vendorName,
    amount,
  }));

  const totalTodayProfit = todayProfitByVendor.reduce((sum, row) => sum + row.amount, 0);

  const shoppingCommissionSetting = {
    _id: shoppingCommissionRaw?._id ? String(shoppingCommissionRaw._id) : null,
    serviceType: "shopping",
    rate: shoppingCommissionRaw?.rate ?? DEFAULT_SHOPPING_COMMISSION_RATE,
    isDefault: !shoppingCommissionRaw,
    updatedAt: shoppingCommissionRaw?.updatedAt ? shoppingCommissionRaw.updatedAt.toISOString() : null,
  };

  const vendorRequests = vendorRequestsRaw.map((r) => ({
    ...r,
    _id: String(r._id),
    userId: r.userId ? String(r.userId) : null,
    decidedBy: r.decidedBy ? String(r.decidedBy) : null,
    createdAt: r.createdAt ? r.createdAt.toISOString() : null,
    updatedAt: r.updatedAt ? r.updatedAt.toISOString() : null,
    reviewedAt: r.reviewedAt ? new Date(r.reviewedAt).toISOString() : null,
  }));
  const users = usersRaw.map((u) => ({
    ...u,
    _id: String(u._id),
    createdAt: u.createdAt ? u.createdAt.toISOString() : null,
    updatedAt: u.updatedAt ? u.updatedAt.toISOString() : null,
  }));

  return (
    <AdminDashboardClient
      shopsCount={shops.length}
      vendorsCount={vendors.length}
      pendingRequestsCount={pendingRequestsCount}
      todayOrdersCount={todayOrders.length}
      todayProfitByVendor={todayProfitByVendor}
      totalTodayProfit={totalTodayProfit}
      vendorRequests={vendorRequests}
      requestPageSize={requestPageSize}
      totalRequestsCount={totalRequestsCount}
      users={users}
      shoppingCommissionSetting={shoppingCommissionSetting}
    />
  );
}
