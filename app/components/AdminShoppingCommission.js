"use client";

import { useState } from "react";

export default function AdminShoppingCommission({ initialSetting }) {
  const [setting, setSetting] = useState(initialSetting || { rate: 1.5, isDefault: true });
  const [rate, setRate] = useState(String(initialSetting?.rate ?? 1.5));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const saveRate = async (method) => {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/shopping-commission", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rate }),
      });
      const data = await res.json();
      if (!data.success) {
        setMessage(data.message || "Unable to save commission percentage.");
        return;
      }
      setSetting(data.data);
      setRate(String(data.data.rate));
      setMessage(data.message || "Shopping commission percentage saved.");
    } catch {
      setMessage("Server error while saving commission percentage.");
    } finally {
      setSaving(false);
    }
  };

  const deleteRate = async () => {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/shopping-commission", { method: "DELETE" });
      const data = await res.json();
      if (!data.success) {
        setMessage(data.message || "Unable to delete commission percentage.");
        return;
      }
      setSetting(data.data);
      setRate(String(data.data.rate));
      setMessage(data.message || "Shopping commission percentage deleted.");
    } catch {
      setMessage("Server error while deleting commission percentage.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Shopping Admin Percentage</h2>
      <p className="mt-1 text-sm text-slate-500">
        Set the admin percentage for shopping checkout orders. Transportation keeps its monthly payment flow.
      </p>

      <div className="mt-5 grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Shopping checkout percentage</span>
          <div className="mt-1 flex rounded-lg border border-slate-300 bg-white focus-within:ring-2 focus-within:ring-slate-900">
            <input
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              className="w-full rounded-l-lg px-4 py-2.5 outline-none"
              placeholder="1.5"
            />
            <span className="grid place-items-center rounded-r-lg border-l border-slate-200 px-3 text-sm font-semibold text-slate-600">
              %
            </span>
          </div>
        </label>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={saving}
            onClick={() => saveRate(setting?.isDefault ? "POST" : "PATCH")}
            className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {setting?.isDefault ? "Set" : "Update"}
          </button>
          {!setting?.isDefault && (
            <button
              type="button"
              disabled={saving}
              onClick={deleteRate}
              className="rounded-lg border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 disabled:opacity-50"
            >
              Delete
            </button>
          )}
        </div>
      </div>

      <div className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
        Current shopping checkout rate: <span className="font-semibold">{Number(setting?.rate || 0).toLocaleString()}%</span>
        {setting?.isDefault ? <span className="text-slate-500"> (default)</span> : null}
      </div>

      {message && <p className="mt-3 text-sm text-blue-700">{message}</p>}
    </section>
  );
}
