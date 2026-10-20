"use client";

import { useCallback, useEffect, useState } from "react";

const FILTERS = ["all", "pending", "approved", "rejected", "suspended"];

export default function AdminRiderApplications() {
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState("pending");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, limit: 20 });
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");
  const [reasons, setReasons] = useState({});

  const load = useCallback(async (nextPage = page, nextStatus = status) => {
    setLoading(true);
    setError("");
    try {
      const query = new URLSearchParams({ page: String(nextPage), limit: String(pagination.limit), status: nextStatus });
      const response = await fetch(`/api/admin/riders?${query}`, { cache: "no-store", credentials: "include" });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error?.message || "Could not load rider applications.");
      setRows(result.data || []);
      setPagination((old) => ({ ...old, ...result.pagination }));
    } catch (err) {
      setError(err.message || "Could not load rider applications.");
    } finally { setLoading(false); }
  }, [page, status, pagination.limit]);

  useEffect(() => { void load(); }, [load]);

  const changeFilter = (value) => { setStatus(value); setPage(1); };

  const review = async (row, action) => {
    if (busyId) return;
    const reason = reasons[row.profileId] || "";
    if (action === "reject" && !reason.trim()) {
      setError("Enter a reason before rejecting an application.");
      return;
    }
    setBusyId(row.profileId);
    setError("");
    try {
      const response = await fetch(`/api/admin/riders/${row.profileId}`, {
        method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error?.message || "Could not update rider application.");
      await load(page, status);
    } catch (err) {
      setError(err.message || "Could not update rider application.");
    } finally { setBusyId(null); }
  };

  return <section className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4">
      <div><h2 className="text-lg font-semibold text-slate-900">Rider Applications</h2><p className="text-sm text-slate-500">Review applications and manage approved rider access.</p></div>
      <div className="flex items-center gap-3"><select value={status} disabled={loading} onChange={(event) => changeFilter(event.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">{FILTERS.map((item) => <option key={item} value={item}>{item === "all" ? "All statuses" : item[0].toUpperCase() + item.slice(1)}</option>)}</select><span className="text-sm text-slate-500">{pagination.total} total</span></div>
    </div>
    {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}<button type="button" className="ml-3 underline" onClick={() => load(page, status)}>Retry</button></div>}
    {loading && <div role="status" className="rounded-xl bg-white p-8 text-center text-slate-500">Loading rider applications…</div>}
    {!loading && !error && rows.length === 0 && <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">No rider applications match this filter.</div>}
    {!loading && rows.length > 0 && <div className="grid gap-4 lg:grid-cols-2">{rows.map((row) => {
      const busy = busyId === row.profileId;
      return <article key={row.profileId} className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold text-slate-900">{row.name}</h3><p className="text-sm text-slate-600">{row.email}</p><p className="text-sm text-slate-600">{row.phone}</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium capitalize text-slate-700">{row.status}</span></div>
        <p className="text-xs text-slate-500">Applied {row.appliedAt ? new Date(row.appliedAt).toLocaleString() : "—"} · Existing role: {row.currentRole || "account unavailable"}</p>
        {row.reason && <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">Reason: {row.reason}</p>}
        {(row.status === "pending" || row.status === "approved") && <div className="space-y-3">
          <textarea aria-label={`Reason for ${row.name}`} maxLength={500} value={reasons[row.profileId] || ""} onChange={(event) => setReasons((old) => ({ ...old, [row.profileId]: event.target.value }))} placeholder={row.status === "pending" ? "Reason (required for rejection)" : "Suspension reason (optional)"} className="min-h-20 w-full rounded-lg border border-slate-300 p-3 text-sm" />
          <div className="flex flex-wrap justify-end gap-2">{row.status === "pending" ? <><button type="button" disabled={busy || !reasons[row.profileId]?.trim()} onClick={() => review(row, "reject")} className="rounded-lg border border-red-200 px-4 py-2 text-sm text-red-700 disabled:opacity-50">{busy ? "Saving…" : "Reject"}</button><button type="button" disabled={busy} onClick={() => review(row, "approve")} className="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-50">{busy ? "Saving…" : "Approve"}</button></> : <button type="button" disabled={busy} onClick={() => review(row, "suspend")} className="rounded-lg border border-amber-300 px-4 py-2 text-sm text-amber-800 disabled:opacity-50">{busy ? "Saving…" : "Suspend rider"}</button>}</div>
        </div>}
      </article>;
    })}</div>}
    <div className="flex items-center justify-between rounded-xl bg-white p-3"><button type="button" disabled={page <= 1 || loading} onClick={() => setPage((current) => Math.max(1, current - 1))} className="rounded-lg border px-3 py-2 text-sm disabled:opacity-40">Previous</button><span className="text-sm text-slate-600">Page {page} of {Math.max(1, pagination.totalPages)}</span><button type="button" disabled={page >= pagination.totalPages || loading} onClick={() => setPage((current) => current + 1)} className="rounded-lg border px-3 py-2 text-sm disabled:opacity-40">Next</button></div>
  </section>;
}
