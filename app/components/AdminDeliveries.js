"use client";

import { useCallback, useEffect, useState } from "react";

const filters = [["all", "All"], ["awaiting", "Awaiting assignment"], ["active", "Active"], ["completed", "Completed"]];

export default function AdminDeliveries() {
  const [rows, setRows] = useState([]);
  const [riders, setRiders] = useState([]);
  const [filter, setFilter] = useState("awaiting");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [selections, setSelections] = useState({});

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const response = await fetch(`/api/admin/deliveries?status=${filter}`, { cache: "no-store" });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error?.message || "Unable to load deliveries.");
      setRows(result.data || []); setRiders(result.riders || []);
    } catch (err) { setError(err.message || "Unable to load deliveries."); }
    finally { setLoading(false); }
  }, [filter]);
  useEffect(() => { load(); }, [load]);

  async function assign(row) {
    const riderUserId = selections[row.deliveryId];
    if (!riderUserId) return;
    setBusy(row.deliveryId); setError("");
    try {
      const response = await fetch("/api/admin/deliveries", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ deliveryId: row.deliveryId, riderUserId, version: row.version }) });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error?.message || "Assignment failed. Reload and retry.");
      await load();
    } catch (err) { setError(err.message || "Assignment failed."); await load(); }
    finally { setBusy(""); }
  }

  return <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-semibold text-slate-900">Deliveries</h2><p className="text-sm text-slate-500">Shopping orders are ready after payment and vendor acceptance.</p></div><button onClick={load} className="rounded-lg border px-3 py-2 text-sm">Refresh</button></div>
    <div className="my-4 flex flex-wrap gap-2">{filters.map(([value, label]) => <button key={value} onClick={() => setFilter(value)} className={`rounded-full px-3 py-1.5 text-sm ${filter === value ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"}`}>{label}</button>)}</div>
    {error && <p role="alert" className="mb-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
    {loading ? <p className="py-8 text-center text-sm text-slate-500">Loading deliveries…</p> : rows.length === 0 ? <p className="py-8 text-center text-sm text-slate-500">No deliveries in this view.</p> : <div className="space-y-3">{rows.map((row) => <article key={row.deliveryId} className="rounded-xl border border-slate-200 p-4">
      <div className="flex flex-wrap justify-between gap-2"><div><h3 className="font-semibold text-slate-900">{row.orderNumber} · {row.shop?.name || "Shop"}</h3><p className="text-sm text-slate-600">{row.customer.name} · {row.customer.phone}</p></div><span className="h-fit rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">{row.status.replaceAll("_", " ")}</span></div>
      <p className="mt-2 text-sm text-slate-700">{row.address}{row.ward ? `, ${row.ward}` : ""}</p><p className={`mt-1 text-xs ${row.locationAvailable ? "text-emerald-700" : "text-amber-700"}`}>{row.locationAvailable ? "Confirmed pin available" : "No confirmed pin; use address and phone"}</p>{row.landmarkInstructions && <p className="mt-1 text-sm text-slate-600">Instructions: {row.landmarkInstructions}</p>}
      <p className="mt-1 text-xs text-slate-500">Pickup: {row.shop?.address || "Shop address not provided"}</p>
      <p className="mt-1 text-xs text-slate-500">{row.items.map((item) => `${item.name} × ${item.quantity}`).join(", ")}</p>
      <p className="mt-2 text-xs text-slate-500">Current rider: {row.currentRider?.name || "Unassigned"} · Assigned: {row.assignments?.at(-1)?.assignedAt ? new Date(row.assignments.at(-1).assignedAt).toLocaleString() : "—"} · Updated: {row.updatedAt ? new Date(row.updatedAt).toLocaleString() : "—"}{row.events?.find((event) => event.status === "delivered")?.at ? ` · Delivered: ${new Date(row.events.find((event) => event.status === "delivered").at).toLocaleString()}` : ""}</p>
      {row.status !== "delivered" && row.status !== "picked_up" && row.status !== "out_for_delivery" && <div className="mt-3 flex flex-wrap items-center gap-2"><select aria-label={`Rider for ${row.orderNumber}`} className="rounded-lg border p-2 text-sm" value={selections[row.deliveryId] || row.currentRider?.userId || ""} onChange={(event) => setSelections({ ...selections, [row.deliveryId]: event.target.value })}><option value="">Select approved rider</option>{riders.map((rider) => <option key={rider.userId} value={rider.userId}>{rider.name} · {rider.phone}</option>)}</select><button disabled={!selections[row.deliveryId] || busy === row.deliveryId} onClick={() => assign(row)} className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50">{busy === row.deliveryId ? "Saving…" : row.status === "assigned" ? "Reassign" : "Assign"}</button></div>}
    </article>)}</div>}
  </section>;
}
