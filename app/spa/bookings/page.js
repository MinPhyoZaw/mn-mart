"use client";
import { useEffect, useState } from "react";

export default function SpaBookingPage() {
  const [services, setServices] = useState([]);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ customerName: "", phoneNumber: "", selectedDate: "", selectedTimeSlot: "", receiptImage: "" });
  const [message, setMessage] = useState("");

  useEffect(() => { fetch("/api/spa/services").then((r)=>r.json()).then((d)=>setServices(d.data||[])); }, []);

  const onFile = (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader(); reader.onload = () => setForm((f) => ({ ...f, receiptImage: reader.result })); reader.readAsDataURL(file);
  };

  const submit = async (e) => {
    e.preventDefault();
    const [start, end] = form.selectedTimeSlot.split("-");
    const payload = { serviceId: selected._id, customerName: form.customerName, phoneNumber: form.phoneNumber, selectedDate: form.selectedDate, selectedTimeSlot: { start, end }, receiptImage: form.receiptImage };
    const res = await fetch("/api/spa/bookings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const data = await res.json(); setMessage(data.success ? "Booking submitted → pending admin." : data.message || "Failed");
  };

  return <div><h2>SPA Booking</h2>{!selected ? services.map((s)=><button key={s._id} onClick={()=>setSelected(s)}>Book Now: {s.serviceName}</button>) : <form onSubmit={submit}><p>Service: {selected.serviceName} / {selected.priceMMK} MMK</p><p>You must pay 3000 MMK booking fee to confirm your spa appointment. This fee will be deducted from total service price.</p><p>KBZ Pay QR code</p><p>Wave Money QR code</p><input placeholder="Customer Name" value={form.customerName} onChange={(e)=>setForm({...form, customerName:e.target.value})}/><input placeholder="Phone Number" value={form.phoneNumber} onChange={(e)=>setForm({...form, phoneNumber:e.target.value})}/><input type="date" value={form.selectedDate} onChange={(e)=>setForm({...form, selectedDate:e.target.value})}/><select value={form.selectedTimeSlot} onChange={(e)=>setForm({...form, selectedTimeSlot:e.target.value})}><option value="">Select Slot</option>{selected.availableSlots.map((slot,idx)=><option key={idx} value={`${slot.start}-${slot.end}`}>{slot.start}-{slot.end}</option>)}</select><input type="file" accept="image/*" onChange={onFile}/><button type="submit">Submit Booking</button><p>{message}</p></form>}</div>;
}
