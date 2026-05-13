"use client";

import { useState } from "react";

const DEPOSIT_NOTICE = "ကားလက်မှတ် ၀ယ်ရန်အတွက် ကျသင့်ငွေမှ 5000MMK (၅ထောင်ကျပ်)အား စရံငွေအနေဖြင့် အောက်တွင်ဖော်ပြထားသော အကောင့်ထဲသို ထည့်ပေးပါခင်ဗျာ။";

export default function TransportationTicketCard({ shopId, shopPhone, ticket, rightSide }) {
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ customerName: "", customerPhone: "", receiptImage: "" });

  const onSubmit = async () => {
    if (!form.customerName || !form.customerPhone || !form.receiptImage) {
      setMessage("Please fill all fields.");
      return;
    }

    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/transport-booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopId, ticketId: ticket.id, ...form }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Submit failed");
      setMessage("Order submitted. Paid 5000MMK as Deposit.");
    } catch (error) {
      setMessage(error.message || "Error submitting booking");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {rightSide}
      <button type="button" onClick={() => setShowForm((v) => !v)} className="inline-flex items-center justify-center rounded-lg border border-green-700 px-4 py-2 text-sm font-semibold text-green-700 hover:bg-green-50">
        Buy Ticket Online
      </button>
      {showForm ? (
        <div className="mt-3 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-gray-700">
          <label className="block text-xs font-semibold">User Name</label>
          <input className="mt-1 mb-2 w-full rounded border px-2 py-2" value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} />
          <label className="block text-xs font-semibold">Phone Number</label>
          <input className="mt-1 mb-2 w-full rounded border px-2 py-2" value={form.customerPhone} onChange={(e) => setForm({ ...form, customerPhone: e.target.value })} />
          <p className="mb-2 text-xs">{DEPOSIT_NOTICE}</p>
          <img src={ticket.image} alt="Vendor online banking QR" className="mb-2 h-24 w-24 rounded border bg-white object-cover" />
          <p className="text-xs">Vendor Online Banking Phone: {shopPhone || "Not provided"}</p>
          <p className="mt-2 text-xs">Route: {ticket.from} - {ticket.to}</p>
          <p className="text-xs">Date & Time: {ticket.date} {ticket.time}</p>
          <label className="mt-2 block text-xs font-semibold">Receipt Image URL</label>
          <input className="mt-1 w-full rounded border px-2 py-2" value={form.receiptImage} onChange={(e) => setForm({ ...form, receiptImage: e.target.value })} placeholder="https://..." />
          <button type="button" onClick={onSubmit} disabled={loading} className="mt-3 w-full rounded bg-green-700 px-3 py-2 text-white">{loading ? "Submitting..." : "Confirm Buy"}</button>
          {message ? <p className="mt-2 text-xs font-medium text-green-700">{message}</p> : null}
        </div>
      ) : null}
    </>
  );
}
