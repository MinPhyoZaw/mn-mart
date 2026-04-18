"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "../context/CartContext";

const OWNER_KBZPAY_NUMBER = "09-880000001";
const OWNER_WAVE_NUMBER = "09-770000001";
const OWNER_KBZPAY_QR = "/images/logo.png";
const OWNER_WAVE_QR = "/images/logo.png";

export default function CheckoutPage() {
  const router = useRouter();
  const { cartItems, totalPrice, clearCart } = useCart();

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentProvider, setPaymentProvider] = useState("kbzpay");
  const [receiptImage, setReceiptImage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

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
      });
      map.set(key, prev);
    }
    return [...map.values()];
  }, [cartItems]);

  const readFile = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error("Unable to read receipt image."));
      reader.readAsDataURL(file);
    });

  const onReceiptChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setMessage("Receipt must be an image file.");
      return;
    }

    try {
      const imageData = await readFile(file);
      setReceiptImage(imageData);
      setMessage("");
    } catch (error) {
      setMessage(error.message || "Unable to read image");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cartItems.length === 0) {
      setMessage("Your cart is empty.");
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
      setMessage("Checkout submitted successfully. Admin and vendors can now view the report.");
      setTimeout(() => router.push("/"), 1200);
    } catch {
      setMessage("Server error while submitting checkout.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 py-6 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 bg-white rounded-2xl p-5 sm:p-7 shadow-sm border border-gray-100">
          <h1 className="text-2xl font-bold text-gray-900">Checkout</h1>
          <p className="mt-1 text-sm text-gray-600">Upload payment receipt and confirm your order.</p>

          <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="rounded-xl border border-yellow-300 p-4 bg-yellow-50">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-yellow-700">KBZPay</p>
                  <input
                    type="radio"
                    name="paymentProvider"
                    checked={paymentProvider === "kbzpay"}
                    onChange={() => setPaymentProvider("kbzpay")}
                  />
                </div>
                <p className="text-sm mt-2">Number: {OWNER_KBZPAY_NUMBER}</p>
                <div className="mt-3 relative w-24 h-24 rounded overflow-hidden">
                  <Image src={OWNER_KBZPAY_QR} alt="KBZPay QR" fill className="object-cover" />
                </div>
              </label>

              <label className="rounded-xl border border-cyan-300 p-4 bg-cyan-50">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-cyan-700">Wave</p>
                  <input
                    type="radio"
                    name="paymentProvider"
                    checked={paymentProvider === "wave"}
                    onChange={() => setPaymentProvider("wave")}
                  />
                </div>
                <p className="text-sm mt-2">Number: {OWNER_WAVE_NUMBER}</p>
                <div className="mt-3 relative w-24 h-24 rounded overflow-hidden">
                  <Image src={OWNER_WAVE_QR} alt="Wave QR" fill className="object-cover" />
                </div>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Upload payment receipt</label>
              <input
                type="file"
                accept="image/*"
                required
                onChange={onReceiptChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2"
              />
              {receiptImage && <p className="mt-2 text-xs text-green-700">Receipt image ready ✅</p>}
            </div>

            {message && <p className="text-sm text-blue-700">{message}</p>}

            <button
              type="submit"
              disabled={submitting || cartItems.length === 0}
              className="w-full sm:w-auto bg-green-600 text-white font-semibold px-6 py-2.5 rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Confirm Checkout"}
            </button>
          </form>
        </section>

        <aside className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-100 h-fit">
          <h2 className="text-lg font-bold">Order Summary</h2>
          <div className="mt-4 space-y-3">
            {byShopSummaries.map((entry, idx) => (
              <div key={`${entry.shopName}-${idx}`} className="rounded-lg border border-gray-100 p-3">
                <p className="font-semibold text-sm">{entry.shopName}</p>
                <p className="text-xs text-gray-600">Vendor: {entry.vendorName}</p>
                <div className="mt-2 space-y-1">
                  {entry.items.map((item, itemIdx) => (
                    <div key={`${item.name}-${itemIdx}`} className="flex items-center justify-between text-xs text-gray-700">
                      <span className="pr-3 break-words">
                        {item.name} × {item.quantity}
                      </span>
                      <span>{(item.price * item.quantity).toLocaleString()} MMK</span>
                    </div>
                  ))}
                </div>
                <p className="text-sm mt-2">Subtotal: {entry.total.toLocaleString()} MMK</p>
              </div>
            ))}
          </div>

          <div className="mt-5 border-t pt-4">
            <div className="flex justify-between text-sm">
              <span>Total payable now</span>
              <strong>{totalPrice.toLocaleString()} MMK</strong>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
