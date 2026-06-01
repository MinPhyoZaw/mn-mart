"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "../context/CartContext";
import PaymentQrSelector from "../components/PaymentQrSelector";
import { DEFAULT_PAYMENT_PROVIDER } from "../lib/paymentAccounts";
import { RECEIPT_IMAGE_BUCKET, uploadImageToSupabaseStorage } from "../lib/supabase";

export default function CheckoutPage() {
  const router = useRouter();
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

  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();

        if (!data?.user) {
          router.push("/signup?next=/checkout");
          return;
        }
      } catch {
        router.push("/signup?next=/checkout");
        return;
      } finally {
        if (mounted) setAuthChecking(false);
      }
    };

    checkAuth();
    return () => {
      mounted = false;
    };
  }, [router]);

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
    <main className="min-h-screen bg-gray-50 py-6 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 items-start">
        <aside className="order-2 lg:order-2 bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100 h-fit">
          <h2 className="text-lg font-bold text-gray-900">Payment Receipt</h2>
          <p className="mt-1 text-xs text-gray-500">Please verify your order details before checkout.</p>
          <div className="mt-4 space-y-3">
            {byShopSummaries.map((entry, idx) => (
              <div key={`${entry.shopName}-${idx}`} className="rounded-xl border border-gray-200 p-3.5 bg-gray-50">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-sm text-gray-900">{entry.shopName}</p>
                    <p className="text-xs text-gray-500">Vendor: {entry.vendorName}</p>
                  </div>
                  <span className="text-xs font-medium bg-white border border-gray-200 px-2 py-1 rounded">
                    {entry.items.length} items
                  </span>
                </div>
                <div className="mt-3 space-y-1.5">
                  {entry.items.map((item, itemIdx) => (
                    <div key={`${item.name}-${itemIdx}`} className="flex items-center justify-between text-xs text-gray-700">
                      <span className="pr-3 break-words">
                        {item.name} × {item.quantity}
                        {item.selectedWholesaleTier ? (
                          <span className="mt-0.5 block text-[11px] text-green-700">
                            လက်ကားဈေး : {item.selectedWholesaleTier.minQty} - {Number(item.selectedWholesaleTier.price).toLocaleString()} MMK
                          </span>
                        ) : null}
                      </span>
                      <span className="font-medium">{(item.price * item.quantity).toLocaleString()} MMK</span>
                    </div>
                  ))}
                </div>
                <p className="text-sm mt-3 flex items-center justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <strong>{entry.total.toLocaleString()} MMK</strong>
                </p>
              </div>
            ))}
          </div>

          <div className="mt-5 border-t pt-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-700">Total payable now</span>
              <strong className="text-base text-green-700">{totalPrice.toLocaleString()} MMK</strong>
            </div>
          </div>
        </aside>

        <section className="order-1 lg:order-1 lg:col-span-2 w-full max-w-3xl lg:max-w-none mx-auto bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Checkout</h1>
          <p className="mt-1 text-sm text-gray-600">Upload payment receipt and confirm your order.</p>

          <form className="mt-4 sm:mt-6 space-y-4 sm:space-y-5" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Your Name"
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5"
              />
              <input
                required
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="Your Phone"
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5"
              />
            </div>
            <input
              required
              value={customerAddress}
              onChange={(e) => setCustomerAddress(e.target.value)}
              placeholder="Your Address"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5"
            />

            <PaymentQrSelector value={paymentProvider} onChange={setPaymentProvider} />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Upload payment receipt</label>
              <input
                type="file"
                accept="image/*"
                required
                onChange={onReceiptChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2"
              />
              {uploadingReceipt && <p className="mt-2 text-xs text-blue-700">Uploading receipt to Supabase...</p>}
              {receiptImage && <p className="mt-2 text-xs text-green-700">Receipt uploaded to Supabase ✅</p>}
            </div>

            {message && <p className="text-sm text-blue-700">{message}</p>}

            <button
              type="submit"
              disabled={submitting || uploadingReceipt || cartItems.length === 0}
              className="w-full sm:w-auto bg-green-600 text-white font-semibold px-6 py-2.5 rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {submitting ? "Submitting..." : uploadingReceipt ? "Uploading receipt..." : "Confirm Checkout"}
            </button>
          </form>
        </section>
      </div>

    </main>
  );
}
