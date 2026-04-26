"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

export default function AdminOrderManager() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [activeReceipt, setActiveReceipt] = useState(null);

  const loadOrders = async () => {
    try {
      const res = await fetch("/api/admin/orders", { cache: "no-store" });
      const data = await res.json();
      if (data.success) {
        setOrders(data.data || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const onAction = async (id, action) => {
    setMessage("");
    const res = await fetch(`/api/admin/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const data = await res.json();
    if (!data.success) {
      setMessage(data.message || "Unable to update order.");
      return;
    }
    setMessage(`Order ${action === "approve" ? "approved" : "rejected"} successfully.`);
    await loadOrders();
  };

  if (loading) return <p className="text-sm text-gray-500 mt-3">Loading orders...</p>;

  return (
    <section className="bg-white rounded-xl shadow p-5 mb-8">
      <h2 className="text-lg font-semibold">Order List</h2>
      {message && <p className="mt-2 text-sm text-blue-700">{message}</p>}
      {orders.length === 0 ? (
        <p className="text-sm text-gray-500 mt-3">No orders yet.</p>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
          {orders.map((order) => (
            <div key={order._id} className="border rounded-xl p-4 flex flex-col">
              <p className="text-sm font-semibold">Order: {order.orderId}</p>
              <p className="text-sm">Vendor name: {order.vendorId?.vendorName || "Unknown"}</p>
              <p className="text-sm">Shop name: {order.shopId?.name || "Unknown"}</p>
              <p className="text-sm">Customer: {order.customerName}</p>
              <p className="text-sm">Phone: {order.customerPhone}</p>
              <p className="text-sm">Address: {order.customerAddress}</p>
              <p className="text-sm">Total amount: {Number(order.totalAmount || 0).toLocaleString()} MMK</p>
              <p className="text-sm">Status: {order.orderStatus?.toUpperCase() || "PENDING"}</p>
              <div className="mt-3 relative h-24 w-full overflow-hidden rounded border bg-gray-50">
                <button
                  type="button"
                  onClick={() => setActiveReceipt(order.receiptImage)}
                  className="h-full w-full cursor-zoom-in"
                  aria-label={`Open receipt for order ${order.orderId}`}
                >
                  <Image src={order.receiptImage} alt="Receipt" fill className="object-contain" unoptimized />
                </button>
              </div>

              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => onAction(order._id, "approve")}
                  className="flex-1 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                >
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => onAction(order._id, "reject")}
                  className="flex-1 px-3 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold"
                >
                  Reject
                </button>
              </div>

              {order.orderStatus === "confirmed" && (
                <label className="mt-3 p-2 text-xs border border-emerald-200 bg-emerald-50 rounded-lg flex items-start gap-2">
                  <input type="checkbox" checked readOnly className="mt-0.5 h-4 w-4 accent-emerald-600" />
                  <span>
                    Order no <strong>{order.orderId}</strong> is approved and sent to vendor{" "}
                    <strong>{order.vendorId?.vendorName || "-"}</strong> ({order.shopId?.name || "-"}).
                  </span>
                </label>
              )}
            </div>
          ))}
        </div>
      )}
      {activeReceipt && (
        <div className="fixed inset-0 z-[80] bg-black/70 p-4 flex items-center justify-center">
          <button
            type="button"
            onClick={() => setActiveReceipt(null)}
            className="absolute inset-0"
            aria-label="Close receipt preview"
          />
          <div className="relative z-10 h-[85vh] w-full max-w-3xl overflow-hidden rounded-xl bg-white p-3">
            <div className="relative h-full w-full">
              <Image src={activeReceipt} alt="Receipt preview" fill className="object-contain" unoptimized />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
