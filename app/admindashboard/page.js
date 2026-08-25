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

  if (!token) {
    redirect("/login");
  }

  let decoded = null;

  try {
    decoded = verifyToken(token);
  } catch {
    redirect("/login");
  }

  await connectDB();

  const currentUser = decoded?.userId
    ? await User.findById(decoded.userId)
        .select("_id role")
        .lean()
    : null;

  if (!currentUser || currentUser.role !== "admin") {
    redirect("/");
  }

  const requestPageSize = 20;
  const userPageSize = 20;

  const { start, end } = getTodayRange();

  const [
    shopsCount,
    vendorsCount,
    vendorRequestsRaw,
    usersRaw,
    pendingRequestsCount,
    totalRequestsCount,
    totalUsersCount,
    todayOrders,
    shoppingCommissionRaw,
  ] = await Promise.all([
    // Count only — don't load every shop document
    Shop.countDocuments({}),

    // Count only — don't load every vendor document
    Vendor.countDocuments({}),

    // Load only first page of vendor requests
    VendorRequest.find({})
      .select(
        "_id userId shopName phone status createdAt updatedAt reviewedAt decidedBy"
      )
      .sort({ createdAt: -1 })
      .limit(requestPageSize)
      .lean(),

    // Load only first page of users
    User.find({})
      .select("_id name email role createdAt updatedAt")
      .sort({ createdAt: -1 })
      .limit(userPageSize)
      .lean(),

    // Pending vendor request count
    VendorRequest.countDocuments({
      status: "pending",
    }),

    // Total vendor request count
    VendorRequest.countDocuments({}),

    // Total user count
    User.countDocuments({}),

    // Load only fields needed for today's commission/profit
    Order.find({
      createdAt: {
        $gte: start,
        $lte: end,
      },
      orderStatus: "confirmed",
      vendorStatus: "accepted",
    })
      .select("vendorId commissionAmount createdAt")
      .populate("vendorId", "vendorName")
      .sort({ createdAt: -1 })
      .lean(),

    CommissionSetting.findOne({
      serviceType: "shopping",
    })
      .select("_id serviceType rate updatedAt")
      .lean(),
  ]);

  // Calculate today's profit by vendor
  const vendorProfitMap = new Map();

  for (const order of todayOrders) {
    const vendorName =
      order.vendorId?.vendorName || "Unknown Vendor";

    const commissionAmount =
      Number(order.commissionAmount) || 0;

    vendorProfitMap.set(
      vendorName,
      (vendorProfitMap.get(vendorName) || 0) +
        commissionAmount
    );
  }

  const todayProfitByVendor = [
    ...vendorProfitMap.entries(),
  ].map(([vendorName, amount]) => ({
    vendorName,
    amount,
  }));

  const totalTodayProfit =
    todayProfitByVendor.reduce(
      (sum, row) => sum + row.amount,
      0
    );

  const shoppingCommissionSetting = {
    _id: shoppingCommissionRaw?._id
      ? String(shoppingCommissionRaw._id)
      : null,

    serviceType: "shopping",

    rate:
      shoppingCommissionRaw?.rate ??
      DEFAULT_SHOPPING_COMMISSION_RATE,

    isDefault: !shoppingCommissionRaw,

    updatedAt: shoppingCommissionRaw?.updatedAt
      ? shoppingCommissionRaw.updatedAt.toISOString()
      : null,
  };

  const vendorRequests = vendorRequestsRaw.map(
    (request) => ({
      ...request,

      _id: String(request._id),

      userId: request.userId
        ? String(request.userId)
        : null,

      decidedBy: request.decidedBy
        ? String(request.decidedBy)
        : null,

      createdAt: request.createdAt
        ? request.createdAt.toISOString()
        : null,

      updatedAt: request.updatedAt
        ? request.updatedAt.toISOString()
        : null,

      reviewedAt: request.reviewedAt
        ? new Date(
            request.reviewedAt
          ).toISOString()
        : null,
    })
  );

  const users = usersRaw.map((user) => ({
    ...user,

    _id: String(user._id),

    createdAt: user.createdAt
      ? user.createdAt.toISOString()
      : null,

    updatedAt: user.updatedAt
      ? user.updatedAt.toISOString()
      : null,
  }));

  return (
    <AdminDashboardClient
      shopsCount={shopsCount}
      vendorsCount={vendorsCount}
      pendingRequestsCount={pendingRequestsCount}
      todayOrdersCount={todayOrders.length}
      todayProfitByVendor={todayProfitByVendor}
      totalTodayProfit={totalTodayProfit}
      vendorRequests={vendorRequests}
      requestPageSize={requestPageSize}
      totalRequestsCount={totalRequestsCount}
      users={users}
      userPageSize={userPageSize}
      totalUsersCount={totalUsersCount}
      shoppingCommissionSetting={
        shoppingCommissionSetting
      }
    />
  );
}