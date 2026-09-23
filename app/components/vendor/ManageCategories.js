"use client";

import { useCallback, useEffect, useState } from "react";
import { Edit3, FolderPlus, Power } from "lucide-react";

export default function ManageCategories({ shop, setMessage }) {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [busy, setBusy] = useState(false);

  const loadCategories = useCallback(async () => {
    if (!shop?._id) return;
    const res = await fetch("/api/vendor/categories", { cache: "no-store" });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data?.message || "Unable to load categories");
    setCategories(data.data || []);
  }, [shop?._id]);

  useEffect(() => {
    loadCategories().catch((error) => setMessage?.(error.message));
  }, [loadCategories, setMessage]);

  const submitCategory = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      const res = await fetch(
        editingId ? `/api/vendor/categories/${editingId}` : "/api/vendor/categories",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name }),
        }
      );
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data?.message || "Unable to save category");
      setName("");
      setEditingId(null);
      setMessage?.(editingId ? "Category updated." : "Category created.");
      await loadCategories();
    } catch (error) {
      setMessage?.(error.message);
    } finally {
      setBusy(false);
    }
  };

  const setActive = async (category, isActive) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/vendor/categories/${category._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data?.message || "Unable to update category");
      setMessage?.(`Category ${isActive ? "enabled" : "disabled"}.`);
      await loadCategories();
    } catch (error) {
      setMessage?.(error.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-5">
        <h2 className="text-xl font-semibold text-gray-900">Manage Categories</h2>
        <p className="mt-1 text-sm text-gray-500">Create up to 30 optional categories for this shop.</p>
      </div>

      <form onSubmit={submitCategory} className="mb-6 flex flex-col gap-2 sm:flex-row">
        <label htmlFor="category-name" className="sr-only">Category name</label>
        <input
          id="category-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={60}
          placeholder="Category name"
          className="min-w-0 flex-1 rounded-lg border border-gray-300 px-4 py-2"
          required
        />
        <button disabled={busy} className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white disabled:opacity-50">
          <FolderPlus className="h-4 w-4" aria-hidden="true" />
          {editingId ? "Save" : "Add Category"}
        </button>
        {editingId ? (
          <button type="button" onClick={() => { setEditingId(null); setName(""); }} className="rounded-lg border px-4 py-2">Cancel</button>
        ) : null}
      </form>

      {categories.length === 0 ? (
        <p className="text-sm text-gray-500">No custom categories yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead><tr className="border-b text-gray-500"><th className="pb-2 font-medium">Category</th><th className="pb-2 font-medium">Status</th><th className="pb-2 text-right font-medium">Actions</th></tr></thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category._id} className="border-b last:border-0">
                  <td className="py-3 font-medium text-gray-900">{category.name}</td>
                  <td className="py-3"><span className={category.isActive ? "text-emerald-700" : "text-gray-500"}>{category.isActive ? "Active" : "Disabled"}</span></td>
                  <td className="py-3"><div className="flex justify-end gap-2">
                    <button type="button" disabled={busy} onClick={() => { setEditingId(category._id); setName(category.name); }} className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5"><Edit3 className="h-4 w-4" /> Edit</button>
                    <button type="button" disabled={busy} onClick={() => setActive(category, !category.isActive)} className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5"><Power className="h-4 w-4" /> {category.isActive ? "Disable" : "Enable"}</button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
