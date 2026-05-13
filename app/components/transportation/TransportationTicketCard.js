"use client";

import { useState } from "react";

const DEPOSIT_NOTICE = "ကားလက်မှတ် ၀ယ်ရန်အတွက် ကျသင့်ငွေမှ 5000MMK (၅ထောင်ကျပ်)အား စရံငွေအနေဖြင့် အောက်တွင်ဖော်ပြထားသော အကောင့်ထဲသို ထည့်ပေးပါခင်ဗျာ။";

export default function TransportationTicketCard({ shopId, shopPhone, shopKbzPayNumber, shopWavePayNumber, ticket, rightSide }) {
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ customerName: "", customerPhone: "", route: `${ticket.from} - ${ticket.to}`, departureDate: ticket.date || "", departureTime: ticket.time || "", receiptImage: "" });

  const onReceiptFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setMessage("Please upload an image file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setForm((prev) => ({ ...prev, receiptImage: reader.result }));
    reader.readAsDataURL(file);
  };

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
          <label className="block text-xs font-semibold">Your Name</label>
          <input className="mt-1 mb-2 w-full rounded border px-2 py-2" value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} />
          <label className="block text-xs font-semibold">Phone Number</label>
          <input className="mt-1 mb-2 w-full rounded border px-2 py-2" value={form.customerPhone} onChange={(e) => setForm({ ...form, customerPhone: e.target.value })} />
          <p className="mb-2 text-xs">{DEPOSIT_NOTICE}</p>
          <div className="mb-2 rounded border border-green-200 bg-white p-2 text-xs text-gray-700">
            <p><span className="font-semibold">KBZ Pay</span> - {shopKbzPayNumber || ""}</p>
            <p><span className="font-semibold">Wave Pay</span> - {shopWavePayNumber || ""}</p>
            {!shopKbzPayNumber && !shopWavePayNumber ? <p className="text-[11px] text-gray-500">Vendor online banking numbers are not provided yet{shopPhone ? ` (contact: ${shopPhone})` : ""}.</p> : null}
          </div>
          <div className="mt-2 grid grid-cols-1 gap-2 rounded border border-green-200 bg-white p-2">
            <label className="text-xs font-semibold">Route</label>
            <input className="rounded border px-2 py-2 text-xs" value={form.route} onChange={(e) => setForm({ ...form, route: e.target.value })} />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-semibold">Date</label>
                <input className="mt-1 w-full rounded border px-2 py-2 text-xs" value={form.departureDate} onChange={(e) => setForm({ ...form, departureDate: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-semibold">Time</label>
                <input className="mt-1 w-full rounded border px-2 py-2 text-xs" value={form.departureTime} onChange={(e) => setForm({ ...form, departureTime: e.target.value })} />
              </div>
            </div>
          </div>
          <label className="mt-2 block text-xs font-semibold">Upload Receipt Image</label>
          <input type="file" accept="image/*" className="mt-1 w-full rounded border px-2 py-2" onChange={onReceiptFileChange} />
          <button type="button" onClick={onSubmit} disabled={loading} className="mt-3 w-full rounded bg-green-700 px-3 py-2 text-white">{loading ? "Submitting..." : "Confirm Buy"}</button>
          {message ? <p className="mt-2 text-xs font-medium text-green-700">{message}</p> : null}
        </div>
      ) : null}
    </>
  );
}
