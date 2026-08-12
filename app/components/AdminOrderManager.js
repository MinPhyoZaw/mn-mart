"use client";

import Image from "next/image";
import { useEffect, useState } from "react";


function InfoBox({ label, value }) {
  return (
    <div className="rounded-xl bg-gray-50 p-3">
      <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-medium text-gray-700">
        {value || "-"}
      </p>
    </div>
  );
}
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

  const getServiceTag = (serviceType) => {
    const label = serviceType || "shopping";
    const colorMap = {
      shopping: "bg-blue-100 text-blue-700",
      hotel: "bg-purple-100 text-purple-700",
      spa: "bg-amber-100 text-amber-700",
      transportation: "bg-emerald-100 text-emerald-700",
    };
    return { label, color: colorMap[label] || "bg-gray-100 text-gray-700" };
  };

  const getTransportLocation = (order, type) => {
    const detailsValue =
      type === "from" ? order?.transportationDetails?.fromCity : order?.transportationDetails?.toCity;
    if (detailsValue) return detailsValue;

    const note = order?.bookingDetails?.note || "";
    const match = note.match(/From\s+(.+?)\s+to\s+(.+)/i);
    if (!match) return "-";
    return type === "from" ? match[1]?.trim() || "-" : match[2]?.trim() || "-";
  };

  if (loading) return <p className="text-sm text-gray-500 mt-3">Loading orders...</p>;

  return (
  <section className="mb-8 space-y-5">
    {/* Header */}
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Order List
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Review customer orders, receipts, booking information and approval status.
          </p>
        </div>

        <div className="rounded-xl bg-gray-100 px-3 py-2 text-xs font-medium text-gray-600">
          {orders.length} orders
        </div>
      </div>

      {message && (
        <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          {message}
        </div>
      )}
    </div>

    {/* Empty State */}
    {orders.length === 0 ? (
      <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-16 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
          <svg
            className="h-6 w-6 text-gray-400"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 7h18M5 7l1 13h12l1-13M9 11v5m6-5v5M8 7l1-3h6l1 3"
            />
          </svg>
        </div>

        <h3 className="text-base font-semibold text-gray-800">
          No orders yet
        </h3>

        <p className="mt-1 text-sm text-gray-500">
          New customer orders will appear here.
        </p>
      </div>
    ) : (
      <div className="space-y-5">
        {orders.map((order) => {
          const serviceTag = getServiceTag(order.serviceType);

          const isPending = order.orderStatus === "pending";
          const isConfirmed = order.orderStatus === "confirmed";
          const isRejected = order.orderStatus === "rejected";

          return (
            <article
              key={order._id}
              className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition duration-200 hover:shadow-md"
            >
              {/* Top Bar */}
              <div className="flex flex-col gap-3 border-b border-gray-100 bg-gray-50/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400">
                    Order ID
                  </p>

                  <h3 className="mt-1 text-base font-semibold text-gray-900">
                    {order.orderId}
                  </h3>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Service Badge */}
                  <span
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${serviceTag.color}`}
                  >
                    {serviceTag.label}
                  </span>

                  {/* Status Badge */}
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
                      isPending
                        ? "bg-amber-50 text-amber-700"
                        : isConfirmed
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-rose-50 text-rose-700"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        isPending
                          ? "bg-amber-500"
                          : isConfirmed
                          ? "bg-emerald-500"
                          : "bg-rose-500"
                      }`}
                    />

                    {order.orderStatus?.toUpperCase() || "PENDING"}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="grid gap-6 p-5 lg:grid-cols-12">
                {/* Left Content */}
                <div className="space-y-5 lg:col-span-8">
                  {/* Customer / Vendor */}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <InfoBox
                      label="Customer"
                      value={order.customerName || "Unknown"}
                    />

                    <InfoBox
                      label="Phone"
                      value={order.customerPhone || "-"}
                    />

                    <InfoBox
                      label="Vendor"
                      value={order.vendorId?.vendorName || "Unknown"}
                    />

                    <InfoBox
                      label="Shop"
                      value={order.shopId?.name || "Unknown"}
                    />
                  </div>

                  {/* Address */}
                  {["shopping", "hotel"].includes(order.serviceType) &&
                    order.customerAddress && (
                      <div className="rounded-xl bg-gray-50 p-4">
                        <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400">
                          Customer Address
                        </p>

                        <p className="mt-1 text-sm leading-relaxed text-gray-700">
                          {order.customerAddress}
                        </p>
                      </div>
                    )}

                  {/* SPA */}
                  {order.serviceType === "spa" && (
                    <div className="rounded-xl border border-violet-100 bg-violet-50/60 p-4">
                      <div className="mb-3 flex items-center gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-violet-600 shadow-sm">
                          ✦
                        </span>

                        <div>
                          <p className="text-sm font-semibold text-gray-800">
                            Spa Booking
                          </p>

                          <p className="text-xs text-gray-500">
                            Customer appointment information
                          </p>
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <InfoBox
                          label="Service"
                          value={order.items?.[0]?.name || "-"}
                        />

                        <InfoBox
                          label="Requested Time"
                          value={
                            order.bookingDetails?.note?.replace(
                              "Requested order time: ",
                              ""
                            ) || "-"
                          }
                        />
                      </div>
                    </div>
                  )}

                  {/* Transportation */}
                  {order.serviceType === "transportation" && (
                    <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4">
                      <div className="mb-4">
                        <p className="text-sm font-semibold text-emerald-800">
                          Ticket Information
                        </p>

                        <p className="mt-1 text-xs text-emerald-700/70">
                          Transportation booking details
                        </p>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <InfoBox
                          label="From"
                          value={getTransportLocation(order, "from")}
                        />

                        <InfoBox
                          label="To"
                          value={getTransportLocation(order, "to")}
                        />

                        <InfoBox
                          label="Departure Date"
                          value={
                            order.transportationDetails?.departureDate || "-"
                          }
                        />

                        <InfoBox
                          label="Departure Time"
                          value={
                            order.transportationDetails?.departureTime || "-"
                          }
                        />
                      </div>
                    </div>
                  )}

                  {/* Payment */}
                  <div className="rounded-xl border border-gray-100 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400">
                          Total Amount
                        </p>

                        <p className="mt-1 text-xl font-bold text-gray-900">
                          {Number(order.totalAmount || 0).toLocaleString()}{" "}
                          <span className="text-sm font-medium text-gray-500">
                            MMK
                          </span>
                        </p>
                      </div>

                      {order.serviceType === "spa" && (
                        <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
                          <p className="text-xs font-medium text-amber-600">
                            Remaining Payment
                          </p>

                          <p className="mt-1 font-semibold">
                            {Math.max(
                              Number(order.totalAmount || 0) - 3000,
                              0
                            ).toLocaleString()}{" "}
                            MMK
                          </p>

                          <p className="mt-1 text-xs text-amber-700/70">
                            3,000 MMK deposit already paid
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Side */}
                <div className="lg:col-span-4">
                  <div className="sticky top-4 space-y-4">
                    {/* Receipt */}
                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <p className="text-sm font-semibold text-gray-800">
                          Payment Receipt
                        </p>

                        <span className="text-xs text-gray-400">
                          Click to preview
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setActiveReceipt(order.receiptImage)}
                        className="group relative h-44 w-full overflow-hidden rounded-xl border border-gray-200 bg-gray-50"
                        aria-label={`Open receipt for order ${order.orderId}`}
                      >
                        <Image
                          src={order.receiptImage}
                          alt="Receipt"
                          fill
                          className="object-contain p-2 transition duration-300 group-hover:scale-[1.03]"
                          unoptimized
                        />

                        <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/10">
                          <span className="translate-y-2 rounded-full bg-white/95 px-3 py-1.5 text-xs font-medium text-gray-700 opacity-0 shadow transition group-hover:translate-y-0 group-hover:opacity-100">
                            View Receipt
                          </span>
                        </div>
                      </button>
                    </div>

                    {/* Actions */}
                    {isPending ? (
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => onAction(order._id, "reject")}
                          className="rounded-xl border border-rose-200 px-4 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
                        >
                          Reject
                        </button>

                        <button
                          type="button"
                          onClick={() => onAction(order._id, "approve")}
                          className="rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-black"
                        >
                          Approve
                        </button>
                      </div>
                    ) : (
                      <div
                        className={`rounded-xl border px-4 py-3 ${
                          isConfirmed
                            ? "border-emerald-100 bg-emerald-50"
                            : "border-rose-100 bg-rose-50"
                        }`}
                      >
                        <p
                          className={`text-sm font-semibold ${
                            isConfirmed
                              ? "text-emerald-700"
                              : "text-rose-700"
                          }`}
                        >
                          {isConfirmed
                            ? "✓ Order approved"
                            : "✕ Order rejected"}
                        </p>

                        <p
                          className={`mt-1 text-xs ${
                            isConfirmed
                              ? "text-emerald-600"
                              : "text-rose-600"
                          }`}
                        >
                          {isConfirmed
                            ? "This order has been forwarded to the vendor."
                            : "This order will not be processed."}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Approved Notice */}
              {isConfirmed && (
                <div className="border-t border-emerald-100 bg-emerald-50/60 px-5 py-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs text-white">
                      ✓
                    </div>

                    <p className="text-sm leading-relaxed text-emerald-800">
                      Order <strong>{order.orderId}</strong> has been approved
                      and sent to vendor{" "}
                      <strong>
                        {order.vendorId?.vendorName || "-"}
                      </strong>{" "}
                      ({order.shopId?.name || "-"}).
                    </p>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>
    )}

    {/* Receipt Modal */}
    {activeReceipt && (
      <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
        <button
          type="button"
          onClick={() => setActiveReceipt(null)}
          className="absolute inset-0"
          aria-label="Close receipt preview"
        />

        <div className="relative z-10 flex h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <div>
              <h3 className="font-semibold text-gray-900">
                Payment Receipt
              </h3>

              <p className="text-xs text-gray-500">
                Customer payment proof
              </p>
            </div>

            <button
              type="button"
              onClick={() => setActiveReceipt(null)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-lg text-gray-600 transition hover:bg-gray-200"
            >
              ×
            </button>
          </div>

          <div className="relative flex-1 bg-gray-50 p-4">
            <Image
              src={activeReceipt}
              alt="Receipt preview"
              fill
              className="object-contain p-4"
              unoptimized
            />
          </div>
        </div>
      </div>
    )}
  </section>
);
}
