"use client";

import { useState } from "react";
import PaymentQrSelector from "../PaymentQrSelector";
import { DEFAULT_PAYMENT_PROVIDER } from "../../lib/paymentAccounts";
import {
  RECEIPT_IMAGE_BUCKET,
  uploadImageToSupabaseStorage,
} from "../../lib/supabase";

const DEPOSIT_NOTICE =
  "ကားလက်မှတ် ၀ယ်ရန်အတွက် ကျသင့်ငွေမှ 5000MMK (၅ထောင်ကျပ်)အား စရံငွေအနေဖြင့် အောက်တွင်ဖော်ပြထားသော အကောင့်ထဲသို ထည့်ပေးပါခင်ဗျာ။";

export default function TransportationTicketCard({
  shopId,
  ticket,
  rightSide,
}) {
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [receiptUploading, setReceiptUploading] = useState(false);

  const [form, setForm] = useState({
    customerName: "",
    customerPhone: "",
    route: `${ticket.from} - ${ticket.to}`,
    departureDate: ticket.date || "",
    departureTime: ticket.time || "",
    receiptImage: "",
    paymentProvider: DEFAULT_PAYMENT_PROVIDER,
  });

  const onReceiptFileChange = async (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMessage("Please upload an image file.");
      return;
    }

    setReceiptUploading(true);
    setMessage("Uploading receipt image...");

    setForm((prev) => ({
      ...prev,
      receiptImage: "",
    }));

    try {
      const receiptImage = await uploadImageToSupabaseStorage(file, {
        bucket: RECEIPT_IMAGE_BUCKET,
        folder: `receipts/transportation/${shopId || "shops"}`,
      });

      setForm((prev) => ({
        ...prev,
        receiptImage,
      }));

      setMessage("Receipt image uploaded successfully.");
    } catch (error) {
      setMessage(error.message || "Unable to upload receipt image.");
      e.target.value = "";
    } finally {
      setReceiptUploading(false);
    }
  };

  const onSubmit = async () => {
    if (receiptUploading) {
      setMessage("Please wait for the receipt upload to finish.");
      return;
    }

    if (
      !form.customerName ||
      !form.customerPhone ||
      !form.receiptImage
    ) {
      setMessage("Please fill all fields.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/transport-booking", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          shopId,
          ticketId: ticket.id,
          ...form,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Submit failed");
      }

      setMessage(
        "Order submitted. Paid 5000MMK as Deposit."
      );

      setTimeout(() => {
        setShowForm(false);
      }, 1500);

    } catch (error) {
      setMessage(error.message || "Error submitting booking");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {rightSide}

      {/* Buy Button */}
      <button
        type="button"
        onClick={() => setShowForm(true)}
        className="inline-flex items-center justify-center rounded-lg border border-green-700 px-4 py-2 text-sm font-semibold text-green-700 hover:bg-green-50 transition"
      >
        Buy Ticket Online
      </button>

      {/* Modal */}
      {showForm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

          {/* Modal Box */}
          <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto">

            {/* Header */}
            <div className="sticky top-0 flex items-center justify-between border-b bg-white px-4 py-3 rounded-t-2xl">
              <h2 className="text-sm md:text-base font-semibold text-gray-800">
                Buy Ticket Online
              </h2>

              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100"
              >
                ✕
              </button>
            </div>

            {/* Form Content */}
            <div className="p-4 text-sm text-gray-700">

              {/* Customer Name */}
              <label className="block text-xs font-semibold">
                Your Name
              </label>

              <input
                className="mt-1 mb-2 w-full rounded border px-3 py-2 outline-none focus:border-green-600"
                value={form.customerName}
                onChange={(e) =>
                  setForm({
                    ...form,
                    customerName: e.target.value,
                  })
                }
              />

              {/* Phone */}
              <label className="block text-xs font-semibold">
                Phone Number
              </label>

              <input
                className="mt-1 mb-2 w-full rounded border px-3 py-2 outline-none focus:border-green-600"
                value={form.customerPhone}
                onChange={(e) =>
                  setForm({
                    ...form,
                    customerPhone: e.target.value,
                  })
                }
              />

              {/* Notice */}
              <p className="mb-3 rounded-lg bg-yellow-50 border border-yellow-200 p-2 text-xs text-yellow-800">
                {DEPOSIT_NOTICE}
              </p>

              {/* QR Selector */}
              <PaymentQrSelector
                value={form.paymentProvider}
                onChange={(paymentProvider) =>
                  setForm({
                    ...form,
                    paymentProvider,
                  })
                }
              />

              {/* Route Info */}
              <div className="mt-3 grid grid-cols-1 gap-2 rounded-lg border border-green-200 bg-white p-3">

                <label className="text-xs font-semibold">
                  Route
                </label>

                <input
                  className="rounded border px-2 py-2 text-xs bg-gray-100 text-gray-600"
                  value={form.route}
                  readOnly
                />

                <div className="grid grid-cols-2 gap-2">

                  <div>
                    <label className="text-xs font-semibold">
                      Date
                    </label>

                    <input
                      className="mt-1 w-full rounded border px-2 py-2 text-xs"
                      value={form.departureDate}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          departureDate: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold">
                      Time
                    </label>

                    <input
                      className="mt-1 w-full rounded border px-2 py-2 text-xs bg-gray-100 text-gray-600"
                      value={form.departureTime}
                      readOnly
                    />
                  </div>

                </div>
              </div>

              {/* Upload */}
              <label className="mt-3 block text-xs font-semibold">
                Upload Receipt Image
              </label>

              <input
                type="file"
                accept="image/*"
                className="mt-1 w-full rounded border px-2 py-2"
                onChange={onReceiptFileChange}
              />

              {/* Upload States */}
              {receiptUploading ? (
                <p className="mt-2 text-xs text-blue-700">
                  Uploading the  receipt ...
                </p>
              ) : null}

              {form.receiptImage ? (
                <p className="mt-2 text-xs text-green-700">
                  Receipt uploaded successfully... ✅
                </p>
              ) : null}

              {/* Submit */}
              <button
                type="button"
                onClick={onSubmit}
                disabled={loading || receiptUploading}
                className="mt-4 w-full rounded-lg bg-green-700 px-3 py-3 text-sm font-medium text-white hover:bg-green-800 transition disabled:opacity-60"
              >
                {loading
                  ? "Submitting..."
                  : receiptUploading
                  ? "Uploading receipt..."
                  : "Confirm Buy"}
              </button>

              {/* Message */}
              {message ? (
                <p className="mt-3 text-xs font-medium text-green-700">
                  {message}
                </p>
              ) : null}

            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}