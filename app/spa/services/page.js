"use client";
import { useState } from "react";

export default function SpaServiceCreatePage() {
  const [form, setForm] = useState({ serviceName: "", description: "", durationMinutes: 60, priceMMK: 0, maxCustomersPerSlot: 1, slotsText: "10:00-10:30\n10:30-11:00" });
  const [message, setMessage] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    const availableSlots = form.slotsText.split("\n").map((line) => line.trim()).filter(Boolean).map((line) => {
      const [start, end] = line.split("-");
      return { start, end };
    });

    const res = await fetch("/api/spa/services", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, availableSlots }) });
    const data = await res.json();
    setMessage(data.success ? "Spa service created." : data.message || "Failed");
  };

  return <form onSubmit={submit}><h2>Create SPA Service</h2><input placeholder="Service Name" value={form.serviceName} onChange={(e)=>setForm({...form, serviceName:e.target.value})}/><textarea placeholder="Description" value={form.description} onChange={(e)=>setForm({...form, description:e.target.value})}/><input type="number" value={form.durationMinutes} onChange={(e)=>setForm({...form, durationMinutes:+e.target.value})}/><input type="number" value={form.priceMMK} onChange={(e)=>setForm({...form, priceMMK:+e.target.value})}/><textarea value={form.slotsText} onChange={(e)=>setForm({...form, slotsText:e.target.value})}/><input type="number" value={form.maxCustomersPerSlot} onChange={(e)=>setForm({...form, maxCustomersPerSlot:+e.target.value})}/><button type="submit">Create</button><p>{message}</p></form>;
}
