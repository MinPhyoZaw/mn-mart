"use client";

import { useMemo, useState } from "react";
import {
  BellIcon,
  ChartBarSquareIcon,
  ClipboardDocumentListIcon,
  CurrencyDollarIcon,
  ShieldCheckIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import AdminOrderManager from "./AdminOrderManager";
import AdminVendorRequests from "./AdminVendorRequests";
import AdminUserRoles from "./AdminUserRoles";
import AdminShoppingCommission from "./AdminShoppingCommission";

export default function AdminDashboardClient({
  shopsCount,
  vendorsCount,
  pendingRequestsCount,
  todayOrdersCount,
  todayProfitByVendor,
  totalTodayProfit,
  vendorRequests,
  requestPageSize,
  totalRequestsCount,
  users,
  shoppingCommissionSetting,
}) {
  const [activeScreen, setActiveScreen] = useState("orders");

  const menuItems = useMemo(
    () => [
      { id: "orders", label: "Order List", icon: ClipboardDocumentListIcon },
      { id: "requests", label: "Vendor Request", icon: UserGroupIcon },
      { id: "profit", label: "Profit Notification", icon: CurrencyDollarIcon },
      { id: "commission", label: "Shopping Percentage", icon: ChartBarSquareIcon },
      { id: "roles", label: "User Role Management", icon: ShieldCheckIcon },
    ],
    []
  );

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8">
      <div className="mx-auto flex flex-col md:flex-row w-full max-w-7xl gap-6">
        <aside className="w-full md:w-72 md:shrink-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h1 className="text-xl font-bold text-slate-900">Admin Dashboard</h1>

          <nav className="mt-6 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = activeScreen === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveScreen(item.id)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium transition ${
                    active
                      ? "bg-slate-900 text-white shadow"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1 space-y-6 mt-4 md:mt-0">
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs uppercase text-slate-500">Shops</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{shopsCount}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs uppercase text-slate-500">Vendors</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{vendorsCount}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs uppercase text-slate-500">Completed Profit</p>
              <p className="mt-1 text-2xl font-bold text-emerald-700">{Number(totalTodayProfit || 0).toLocaleString()} MMK</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <BellIcon className="h-4 w-4 text-amber-600" />
                <p className="text-xs uppercase text-slate-500">Pending Requests</p>
              </div>
              <p className="mt-1 text-2xl font-bold text-slate-900">{pendingRequestsCount}</p>
              <p className="text-xs text-slate-500">Today orders: {todayOrdersCount}</p>
            </div>
          </section>

          {activeScreen === "orders" && <AdminOrderManager />}

          {activeScreen === "requests" && (
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Vendor Requests</h2>
              <p className="mb-4 text-sm text-slate-500">Review and approve vendor applications.</p>
              <AdminVendorRequests
                initialRequests={vendorRequests}
                initialPageSize={requestPageSize}
                initialTotal={totalRequestsCount}
              />
            </section>
          )}

          {activeScreen === "profit" && (
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <ChartBarSquareIcon className="h-5 w-5 text-emerald-600" />
                <h2 className="text-lg font-semibold text-slate-900">Profit Notification</h2>
              </div>
              <p className="text-sm text-slate-500">Shows profit from orders approved by both admin and vendor.</p>
              <div className="mt-4 space-y-2 text-sm text-slate-700">
                {todayProfitByVendor.length === 0 ? (
                  <p className="text-slate-500">No completed profit entries for today.</p>
                ) : (
                  todayProfitByVendor.map((row) => (
                    <p key={row.vendorName} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                      Vendor: <span className="font-semibold">{row.vendorName}</span> — Admin Profit{" "}
                      <span className="font-semibold text-emerald-700">{Number(row.amount).toLocaleString()} MMK</span>
                    </p>
                  ))
                )}
                <p className="pt-2 text-base font-bold text-slate-900">Total Profit: {Number(totalTodayProfit || 0).toLocaleString()} MMK</p>
              </div>
            </section>
          )}

          {activeScreen === "commission" && <AdminShoppingCommission initialSetting={shoppingCommissionSetting} />}

          {activeScreen === "roles" && <AdminUserRoles initialUsers={users} />}
        </main>
      </div>
    </div>
  );
}
