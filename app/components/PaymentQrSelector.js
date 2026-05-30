"use client";

import Image from "next/image";
import { useState } from "react";
import { ADMIN_PAYMENT_ACCOUNTS } from "../lib/paymentAccounts";

const PAYMENT_CARD_STYLES = {
  yellow: "border-yellow-300 bg-yellow-50 text-yellow-700",
  emerald: "border-emerald-300 bg-emerald-50 text-emerald-700",
};

const PAYMENT_QR_BORDER_STYLES = {
  yellow: "border-yellow-200",
  emerald: "border-emerald-200",
};

export default function PaymentQrSelector({ value, onChange, className = "" }) {
  const [selectedQr, setSelectedQr] = useState(null);

  return (
    <>
      <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 ${className}`}>
        {ADMIN_PAYMENT_ACCOUNTS.map((account) => (
          <label key={account.id} className={`rounded-xl border p-4 ${PAYMENT_CARD_STYLES[account.theme]}`}>
            <div className="flex items-center justify-between gap-3">
              <p className="font-semibold">{account.label}</p>
              <input
                type="radio"
                name="paymentProvider"
                checked={value === account.id}
                onChange={() => onChange?.(account.id)}
              />
            </div>
            <p className="text-sm mt-2">Number: {account.number}</p>
            <div
              role="button"
              tabIndex={0}
              onClick={() => setSelectedQr(account.qr)}
              onKeyDown={(e) => e.key === "Enter" && setSelectedQr(account.qr)}
              className={`mt-3 relative w-24 h-24 rounded overflow-hidden cursor-zoom-in border bg-white ${PAYMENT_QR_BORDER_STYLES[account.theme]}`}
              aria-label={`Open ${account.label} QR code`}
            >
              <Image src={account.qr} alt={`${account.label} QR`} fill className="object-contain p-1" />
            </div>
          </label>
        ))}
      </div>

      {selectedQr && (
        <div className="fixed inset-0 z-[60] bg-black/70 flex flex-col items-center justify-center gap-5 p-4">
          <div className="relative w-[80vw] max-w-md aspect-square rounded-2xl overflow-hidden border-2 border-white shadow-2xl bg-white">
            <Image src={selectedQr} alt="Payment QR enlarged" fill className="object-contain p-2" />
          </div>
          <button
            type="button"
            onClick={() => setSelectedQr(null)}
            className="bg-white text-gray-900 px-6 py-2.5 rounded-full font-semibold shadow"
          >
            X
          </button>
        </div>
      )}
    </>
  );
}
