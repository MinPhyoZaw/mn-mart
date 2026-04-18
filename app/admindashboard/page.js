import Image from "next/image";
import connectDB from "../lib/mongodb";
import Shop from "../models/Shop";
import Vendor from "../models/Vendor";
import VendorRequest from "../models/VendorRequest";
import User from "../models/User";
import Order from "../models/Order";
import AdminVendorRequests from "../components/AdminVendorRequests";
import AdminUserRoles from "../components/AdminUserRoles";
import {
  ShoppingCartIcon,
  UserGroupIcon,
  BellIcon,
  CurrencyDollarIcon,
} from "@heroicons/react/24/outline";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "../lib/jwt";

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

  const [shops, vendors, vendorRequestsRaw, usersRaw, pendingRequestsCount, totalRequestsCount, todayOrders] =
    await Promise.all([
      Shop.find({}).lean(),
      Vendor.find({}).lean(),
      VendorRequest.find({}).sort({ createdAt: -1 }).limit(requestPageSize).lean(),
      User.find({}).select("-password").sort({ createdAt: -1 }).lean(),
      VendorRequest.countDocuments({ status: "pending" }),
      VendorRequest.countDocuments({}),
      Order.find({ createdAt: { $gte: start, $lte: end } })
        .populate("vendorId", "vendorName")
        .populate("shopId", "name")
        .sort({ createdAt: -1 })
        .lean(),
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
    <div className="min-h-screen bg-gray-50 p-8">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-3">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <div className="flex items-center space-x-2 cursor-pointer">
          <BellIcon className="w-6 h-6 text-gray-700" />
          <span className="text-gray-700 font-medium">{pendingRequestsCount} Pending Requests</span>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="flex items-center p-6 bg-white rounded-lg shadow">
          <ShoppingCartIcon className="w-10 h-10 text-red-500 mr-4" />
          <div>
            <p className="text-gray-500 text-sm">Shops</p>
            <p className="text-2xl font-bold">{shops.length}</p>
          </div>
        </div>
        <div className="flex items-center p-6 bg-white rounded-lg shadow">
          <UserGroupIcon className="w-10 h-10 text-blue-500 mr-4" />
          <div>
            <p className="text-gray-500 text-sm">Vendors</p>
            <p className="text-2xl font-bold">{vendors.length}</p>
          </div>
        </div>
        <div className="flex items-center p-6 bg-white rounded-lg shadow">
          <CurrencyDollarIcon className="w-10 h-10 text-green-500 mr-4" />
          <div>
            <p className="text-gray-500 text-sm">Today Profit</p>
            <p className="text-2xl font-bold">{totalTodayProfit.toLocaleString()} MMK</p>
          </div>
        </div>
        <div className="flex items-center p-6 bg-white rounded-lg shadow">
          <BellIcon className="w-10 h-10 text-yellow-500 mr-4" />
          <div>
            <p className="text-gray-500 text-sm">Today Checkout</p>
            <p className="text-2xl font-bold">{todayOrders.length}</p>
          </div>
        </div>
      </div>

      <section className="bg-white rounded-xl shadow p-5 mb-8">
        <h2 className="text-lg font-semibold">Today&apos;s Profit Notification</h2>
        <div className="mt-3 space-y-2 text-sm">
          {todayProfitByVendor.length === 0 ? (
            <p className="text-gray-500">No checkout profit yet for today.</p>
          ) : (
            todayProfitByVendor.map((row) => (
              <p key={row.vendorName}>
                Vendor Name: <span className="font-semibold">{row.vendorName}</span> — Amount {row.amount.toLocaleString()} MMK
              </p>
            ))
          )}
          <p className="font-bold pt-2 border-t">Total profit amount {totalTodayProfit.toLocaleString()} MMK</p>
        </div>
      </section>

      <section className="bg-white rounded-xl shadow p-5 mb-8">
        <h2 className="text-lg font-semibold">Today Checkout Details</h2>
        {todayOrders.length === 0 ? (
          <p className="text-sm text-gray-500 mt-3">No checkout record for today.</p>
        ) : (
          <div className="mt-4 grid grid-cols-1 xl:grid-cols-2 gap-4">
            {todayOrders.map((order) => (
              <div key={order._id} className="rounded-xl border border-gray-200 p-4">
                <p className="font-semibold text-sm">Shop: {order.shopId?.name || "Unknown Shop"}</p>
                <p className="text-sm text-gray-700">Vendor: {order.vendorId?.vendorName || "Unknown Vendor"}</p>
                <p className="text-sm text-gray-700">Customer: {order.customerName}</p>
                <p className="text-sm">Sale Amount: {Number(order.totalAmount || 0).toLocaleString()} MMK</p>
                <p className="text-sm text-orange-700">Admin 1.5%: {Number(order.commissionAmount || 0).toLocaleString()} MMK</p>
                <div className="mt-3 relative w-full h-44 rounded-lg overflow-hidden border bg-gray-50">
                  <Image src={order.receiptImage} alt="Payment receipt" fill className="object-contain" />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold mb-3">Vendor Requests</h2>
        <AdminVendorRequests
          initialRequests={vendorRequests}
          initialPageSize={requestPageSize}
          initialTotal={totalRequestsCount}
        />
      </section>

      <section className="mt-8">
        <AdminUserRoles initialUsers={users} />
      </section>
    </div>
  );
}
