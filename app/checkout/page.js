"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import PaymentQrSelector from "../components/PaymentQrSelector";
import { DEFAULT_PAYMENT_PROVIDER } from "../lib/paymentAccounts";
import { RECEIPT_IMAGE_BUCKET, uploadImageToSupabaseStorage } from "../lib/supabase";

export default function CheckoutPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { cartItems, totalPrice, clearCart } = useCart();

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [paymentProvider, setPaymentProvider] = useState(DEFAULT_PAYMENT_PROVIDER);
  const [receiptImage, setReceiptImage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [message, setMessage] = useState("");
  const [authChecking, setAuthChecking] = useState(true);
  const [checkoutKey] = useState(() => crypto.randomUUID());

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push("/signup?next=/checkout");
      return;
    }

    setAuthChecking(false);
  }, [authLoading, user, router]);

  const byShopSummaries = useMemo(() => {
    const map = new Map();
    for (const item of cartItems) {
      const key = item.shopId || item._id;
      const prev = map.get(key) || {
        shopName: item.shopName || "Unknown Shop",
        vendorName: item.vendorName || "Unknown Vendor",
        total: 0,
        items: [],
      };
      const price = Number(item.price) || 0;
      const qty = Number(item.quantity) || 1;
      prev.total += price * qty;
      prev.items.push({
        name: item.name || "Unnamed Item",
        quantity: qty,
        price,
        selectedWholesaleTier: item.selectedWholesaleTier || null,
      });
      map.set(key, prev);
    }
    return [...map.values()];
  }, [cartItems]);

  const onReceiptChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setMessage("Receipt must be an image file.");
      return;
    }

    setUploadingReceipt(true);
    setReceiptImage("");
    setMessage("Uploading receipt image...");

    try {
      const receiptImageUrl = await uploadImageToSupabaseStorage(file, {
        bucket: RECEIPT_IMAGE_BUCKET,
        folder: "receipts/checkout",
      });
      setReceiptImage(receiptImageUrl);
      setMessage("Receipt image uploaded successfully.");
    } catch (error) {
      setMessage(error.message || "Unable to upload receipt image.");
      e.target.value = "";
    } finally {
      setUploadingReceipt(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cartItems.length === 0) {
      setMessage("Your cart is empty.");
      return;
    }

    if (uploadingReceipt) {
      setMessage("Please wait for the receipt upload to finish.");
      return;
    }

    if (!receiptImage) {
      setMessage("Please upload your payment receipt.");
      return;
    }

    setSubmitting(true);
    setMessage("");

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cartItems,
          customerName,
          customerPhone,
          customerAddress,
          paymentProvider,
          receiptImage,
          checkoutKey,
        }),
      });
      const data = await res.json();

      if (!data.success) {
        setMessage(data.message || "Checkout failed");
        return;
      }

      clearCart();
      setMessage("Your order has been placed. Please wait for confirmation");
      setTimeout(() => router.push("/"), 1200);
    } catch {
      setMessage("Server error while submitting checkout.");
    } finally {
      setSubmitting(false);
    }
  };

  if (authChecking) {
    return (
      <main className="min-h-screen grid place-items-center bg-gray-50 px-4">
        <p className="text-gray-600">Checking account...</p>
      </main>
    );
  }

  return (
  <main className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-white px-4 py-6 sm:px-6 lg:px-8">
    <div className="mx-auto max-w-6xl">
      {/* Top heading */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">
            MN-Mart Checkout
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            Complete Your Order
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Review your order, add delivery details and upload your payment receipt.
          </p>
        </div>

        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Close checkout"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-xl text-gray-500 shadow-sm transition hover:bg-gray-100 hover:text-gray-900"
        >
          ×
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* ================= LEFT ================= */}
        <section className="space-y-5">
          <form id="checkout-form" onSubmit={handleSubmit} className="space-y-5">
            {/* Customer information */}
            <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                  1
                </div>

                <div>
                  <h2 className="font-semibold text-gray-900">
                    Delivery Information
                  </h2>
                  <p className="text-xs text-gray-500">
                    Tell us where the order should be delivered.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Full Name
                  </label>

                  <input
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-sm outline-none transition placeholder:text-gray-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Phone Number
                  </label>

                  <input
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="09xxxxxxxxx"
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-sm outline-none transition placeholder:text-gray-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Delivery Address
                  </label>

                  <textarea
                    required
                    rows={3}
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    placeholder="Street, ward, township, nearby landmark..."
                    className="w-full resize-none rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-sm outline-none transition placeholder:text-gray-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                  />
                </div>
              </div>
            </div>

            {/* Payment */}
            <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                  2
                </div>

                <div>
                  <h2 className="font-semibold text-gray-900">
                    Payment
                  </h2>

                  <p className="text-xs text-gray-500">
                    Choose a payment method and complete your payment.
                  </p>
                </div>
              </div>

              <PaymentQrSelector
                value={paymentProvider}
                onChange={setPaymentProvider}
              />
            </div>

            {/* Receipt upload */}
            <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                  3
                </div>

                <div>
                  <h2 className="font-semibold text-gray-900">
                    Payment Receipt
                  </h2>

                  <p className="text-xs text-gray-500">
                    Upload your payment confirmation screenshot.
                  </p>
                </div>
              </div>

              <label className="group flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-gray-200 bg-gray-50 px-5 py-9 text-center transition hover:border-emerald-400 hover:bg-emerald-50/50">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="h-6 w-6 text-emerald-600"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 16V4m0 0L8 8m4-4 4 4M4 15v4a1 1 0 001 1h14a1 1 0 001-1v-4"
                    />
                  </svg>
                </div>

                <p className="mt-4 text-sm font-semibold text-gray-800">
                  Upload payment receipt
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  JPG, PNG or screenshot
                </p>

                <input
                  type="file"
                  accept="image/*"
                  required
                  onChange={onReceiptChange}
                  className="hidden"
                />
              </label>

              {uploadingReceipt && (
                <div className="mt-4 rounded-2xl bg-blue-50 px-4 py-3 text-sm text-blue-700">
                  Uploading your receipt...
                </div>
              )}

              {receiptImage && (
                <div className="mt-4 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-sm text-white">
                    ✓
                  </div>

                  <div>
                    <p className="text-sm font-medium text-emerald-800">
                      Receipt uploaded
                    </p>
                    <p className="text-xs text-emerald-600">
                      Your payment proof is ready.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Message */}
            {message && (
              <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                {message}
              </div>
            )}

            {/* Mobile submit */}
            <div className="lg:hidden">
              <button
                type="submit"
                disabled={
                  submitting ||
                  uploadingReceipt ||
                  cartItems.length === 0
                }
                className="w-full rounded-2xl bg-emerald-600 px-6 py-4 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting
                  ? "Submitting Order..."
                  : uploadingReceipt
                  ? "Uploading Receipt..."
                  : `Confirm Order • ${totalPrice.toLocaleString()} MMK`}
              </button>
            </div>
          </form>
        </section>

        {/* ================= RIGHT ================= */}
        <aside className="order-first lg:order-none">
          <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm lg:sticky lg:top-6 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Order Summary
                </h2>

                <p className="mt-1 text-xs text-gray-500">
                  {cartItems.length} item
                  {cartItems.length !== 1 ? "s" : ""} in your order
                </p>
              </div>

              <div className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                Checkout
              </div>
            </div>

            {/* Shops */}
            <div className="mt-6 space-y-4">
              {byShopSummaries.map((entry, idx) => (
                <div
                  key={`${entry.shopName}-${idx}`}
                  className="overflow-hidden rounded-2xl border border-gray-200 bg-gray-50"
                >
                  {/* Shop */}
                  <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {entry.shopName}
                      </p>

                      <p className="mt-0.5 text-xs text-gray-500">
                        {entry.items.length}{" "}
                        {entry.items.length === 1 ? "item" : "items"}
                      </p>
                    </div>

                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-sm font-bold text-emerald-700">
                      {entry.shopName?.charAt(0)?.toUpperCase()}
                    </div>
                  </div>

                  {/* Products */}
                  <div className="space-y-3 p-4">
                    {entry.items.map((item, itemIdx) => (
                      <div
                        key={`${item.name}-${itemIdx}`}
                        className="flex items-start justify-between gap-4"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-gray-800">
                            {item.name}
                          </p>

                          <p className="mt-0.5 text-xs text-gray-500">
                            Qty: {item.quantity}
                          </p>

                          {item.selectedWholesaleTier && (
                            <span className="mt-1 inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                              လက်ကားဈေး •{" "}
                              {item.selectedWholesaleTier.minQty}+
                            </span>
                          )}
                        </div>

                        <p className="shrink-0 text-sm font-semibold text-gray-900">
                          {(item.price * item.quantity).toLocaleString()} MMK
                        </p>
                      </div>
                    ))}

                    <div className="border-t border-gray-200 pt-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          Shop subtotal
                        </span>

                        <span className="text-sm font-semibold text-gray-900">
                          {entry.total.toLocaleString()} MMK
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="mt-5 rounded-2xl bg-gray-950 p-5 text-white">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">
                  Total payable
                </span>

                <span className="text-xl font-bold">
                  {totalPrice.toLocaleString()}
                </span>
              </div>

              <p className="mt-1 text-right text-xs text-gray-400">
                MMK
              </p>

              <div className="mt-4 border-t border-white/10 pt-4">
                <div className="flex items-center gap-2 text-xs text-gray-300">
                  <span className="text-emerald-400">✓</span>
                  Secure MN-Mart checkout
                </div>
              </div>
            </div>

            {/* Desktop submit */}
            <button
              type="submit"
              form="checkout-form"
              disabled={
                submitting ||
                uploadingReceipt ||
                cartItems.length === 0
              }
              className="mt-4 hidden w-full rounded-2xl bg-emerald-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 lg:block"
            >
              {submitting
                ? "Submitting Order..."
                : uploadingReceipt
                ? "Uploading Receipt..."
                : "Confirm Checkout"}
            </button>

            <p className="mt-3 text-center text-[11px] leading-5 text-gray-400">
              By confirming, you agree that your order information and payment
              receipt will be sent for verification.
            </p>
          </div>
        </aside>
      </div>
    </div>
  </main>
);
}
