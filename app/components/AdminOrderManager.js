"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

export default function AdminOrderManager() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

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
        <div className="mt-4 space-y-4">
          {orders.map((order) => (
            <div key={order._id} className="border rounded-xl p-4">
              <p className="text-sm font-semibold">Order: {order.orderId}</p>
              <p className="text-sm">Vendor name: {order.vendorId?.vendorName || "Unknown"}</p>
              <p className="text-sm">Customer: {order.customerName}</p>
              <p className="text-sm">Phone: {order.customerPhone}</p>
              <p className="text-sm">Address: {order.customerAddress}</p>
              <p className="text-sm">Total amount: {Number(order.totalAmount || 0).toLocaleString()} MMK</p>
              <p className="text-sm">Status: {order.orderStatus?.toUpperCase() || "PENDING"}</p>
              <div className="mt-3 relative h-40 w-full max-w-md overflow-hidden rounded border bg-gray-50">
                <Image src={order.receiptImage} alt="Receipt" fill className="object-contain" unoptimized />
              </div>

              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => onAction(order._id, "approve")}
                  className="px-3 py-2 rounded bg-green-600 text-white text-sm"
                >
                  ✅ Approve payment
                </button>
                <button
                  type="button"
                  onClick={() => onAction(order._id, "reject")}
                  className="px-3 py-2 rounded bg-red-600 text-white text-sm"
                >
                  ❌ Reject payment
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
