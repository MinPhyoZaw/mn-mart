"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

export default function SpaServiceBookingDetailPage() {
  const { id } = useParams();
  const [service, setService] = useState(null);
  const [form, setForm] = useState({ customerName: "", phoneNumber: "", selectedDate: "", selectedTimeSlot: "", receiptImage: "" });
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!id) return;
    fetch(`/api/spa/services/${id}`)
      .then((r) => r.json())
      .then((d) => setService(d.data || null));
  }, [id]);

  const slots = useMemo(() => service?.availableSlots || [], [service]);

  const onFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm((f) => ({ ...f, receiptImage: reader.result }));
    reader.readAsDataURL(file);
  };

  const submit = async (e) => {
    e.preventDefault();
    const [start, end] = form.selectedTimeSlot.split("-");
    const payload = { ...form, selectedTimeSlot: { start, end }, serviceId: id };
    const res = await fetch("/api/spa/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setMessage(data.success ? "Booking submitted → pending admin." : data.message || "Failed");
  };

  if (!service) return <p>Loading SPA service...</p>;

  return (
    <div>
      <h2>Book SPA Service</h2>
      <p><strong>Service:</strong> {service.serviceName}</p>
      <p><strong>Description:</strong> {service.description || "-"}</p>
      <p><strong>Duration:</strong> {service.durationMinutes} minutes</p>
      <p><strong>Price:</strong> {service.priceMMK} MMK</p>

      <form onSubmit={submit}>
        <input placeholder="Customer Name" value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} />
        <input placeholder="Phone Number" value={form.phoneNumber} onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })} />
        <input type="date" value={form.selectedDate} onChange={(e) => setForm({ ...form, selectedDate: e.target.value })} />
        <select value={form.selectedTimeSlot} onChange={(e) => setForm({ ...form, selectedTimeSlot: e.target.value })}>
          <option value="">Select Time Slot</option>
          {slots.map((slot, idx) => <option key={idx} value={`${slot.start}-${slot.end}`}>{slot.start}-{slot.end}</option>)}
        </select>

        <p>You must pay 3000 MMK booking fee to confirm your spa appointment. This fee will be deducted from total service price.</p>
        <p>KBZ Pay QR code</p>
        <p>Wave Money QR code</p>
        <input type="file" accept="image/*" onChange={onFile} />

        <button type="submit">Submit Booking</button>
      </form>
      <p>{message}</p>
    </div>
  );
}
