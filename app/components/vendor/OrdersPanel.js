"use client";

import Image from "next/image";

export default function OrdersPanel({ orders = [], onAction, messageSetter }) {
  return (
    <div className="bg-white rounded-xl shadow p-5 mb-6 max-w-3xl mx-auto">
      <h2 className="text-lg font-semibold">Orders</h2>
      {orders.length === 0 ? (
        <p className="text-sm text-gray-500 mt-3">No orders yet.</p>
      ) : (
        <div className="mt-4 space-y-4">
          {orders.map((order) => (
            <div key={order._id} className="rounded-xl border border-gray-200 p-4">
              <p className="text-sm font-semibold">Order ID: {order.orderId}</p>
              {order.orderStatus === "pending" && (
                <p className="mt-1 text-sm font-medium text-amber-700">Order pending state: wait for admin confirmation for payment.</p>
              )}
              {order.orderStatus === "confirmed" && (
                <p className="mt-1 text-sm font-medium text-emerald-700">Admin approved the order.</p>
              )}
              {order.orderStatus === "rejected" && (
                <p className="mt-1 text-sm font-medium text-rose-700">Order rejected by admin.</p>
              )}
              <p className="text-sm">Customer: {order.customerName}</p>
              <p className="text-sm">Phone: {order.customerPhone}</p>
              <p className="text-sm">Delivery info: {order.customerAddress}</p>
              <div className="mt-2 text-sm">
                <p className="font-medium">Items</p>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {order.items?.map((item, index) => (
                    <div key={`${item.itemId}-${index}`} className="rounded-lg border border-gray-200 bg-gray-50 p-2">
                      <div className="flex items-center gap-2">
                        <div className="relative h-14 w-14 overflow-hidden rounded-md border border-gray-200 bg-white">
                          {item.image ? (
                            <Image src={item.image} alt={item.name} fill className="object-cover" unoptimized />
                          ) : (
                            <div className="flex h-full items-center justify-center text-[10px] text-gray-400">No image</div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{item.name}</p>
                          <p className="text-xs text-gray-600">{item.quantity} × {Number(item.price || 0).toLocaleString()} MMK</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {order.orderStatus === "confirmed" && order.vendorStatus === "new" && (
                <div className="mt-3 flex gap-2">
                  <button type="button" onClick={() => onAction(order._id, "accepted")} className="px-3 py-2 rounded bg-green-600 text-white text-sm">Accept order</button>
                  <button type="button" onClick={() => onAction(order._id, "rejected")} className="px-3 py-2 rounded bg-rose-600 text-white text-sm">Reject order</button>
                </div>
              )}

              {order.orderStatus === "confirmed" && order.vendorStatus === "accepted" && (
                <p className="mt-3 text-sm font-medium text-emerald-700">Order approved.</p>
              )}
              {order.orderStatus === "confirmed" && order.vendorStatus === "rejected" && (
                <p className="mt-3 text-sm font-medium text-rose-700">Order rejected.</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
