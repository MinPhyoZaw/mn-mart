"use client";

import { useEffect, useState } from "react";
import { Edit3, Trash2 } from "lucide-react";
import { compressItemImageBlob } from "./ImageUtils";
import { uploadImageToSupabaseStorage } from "../../lib/supabase";

export default function ManageProducts({ shop, serviceType, setMessage, onUpdated }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const loadItems = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/items?shopId=${shop._id}`, { cache: "no-store" });
      const data = await res.json();
      if (data.success) setItems(data.data || []);
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!shop) return;
    loadItems();
  }, [shop]);

  const handleDelete = async (id) => {
    if (!confirm("Delete this item? This action cannot be undone.")) return;
    try {
      const res = await fetch(`/api/items/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.success) return setMessage?.(data.message || "Failed to delete");
      setItems((p) => p.filter((it) => String(it._id) !== String(id)));
      setMessage?.("Deleted successfully.");
      onUpdated?.();
    } catch (e) {
      setMessage?.("Server error while deleting item");
    }
  };

  const openEdit = (item) => {
    setEditing({ ...item });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !editing) return;
    setSaving(true);
    setMessage?.("Uploading image...");
    try {
      const compressed = await compressItemImageBlob(file);
      const url = await uploadImageToSupabaseStorage(compressed, { folder: `items/${shop?._id || "general"}` });
      setEditing((p) => ({ ...p, image: url }));
      setMessage?.("Image uploaded.");
    } catch (err) {
      setMessage?.(err?.message || "Image upload failed");
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    try {
      const payload = {
        name: editing.name,
        price: Number(editing.price || 0),
        image: editing.image,
        category: editing.category,
        tagName: editing.tagName,
        isAvailable: !!editing.isAvailable,
        retailPrice: editing.retailPrice,
        extra: editing.extra,
      };

      const res = await fetch(`/api/items/${editing._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.success) return setMessage?.(data.message || "Failed to update");
      setItems((p) => p.map((it) => (String(it._id) === String(data.data._id) ? data.data : it)));
      setMessage?.("Updated successfully.");
      setEditing(null);
      onUpdated?.();
    } catch (err) {
      setMessage?.("Server error while updating item");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h3 className="text-lg font-semibold mb-3">Manage Products</h3>
      {loading ? (
        <div>Loading products...</div>
      ) : items.length === 0 ? (
        <div className="text-sm text-gray-500">No products yet.</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {items.map((item) => (
            <div key={item._id} className="border rounded-lg p-3 bg-white shadow-sm flex flex-col">
              <div className="h-32 w-full mb-2 bg-gray-100 rounded overflow-hidden flex items-center justify-center">
                {item.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.image} alt={item.name} className="object-cover h-full w-full" />
                ) : (
                  <div className="text-gray-400">No image</div>
                )}
              </div>
              <div className="flex-1">
                <div className="font-medium text-sm">{item.name}</div>
                <div className="text-xs text-gray-500">{item.category || item.type}</div>
                <div className="mt-2 font-semibold">{item.price ? `${item.price}` : "-"} ks</div>
              </div>
              <div className="mt-3 flex gap-2">
                <button onClick={() => openEdit(item)} className="flex-1 rounded-md border px-3 py-2 flex items-center justify-center gap-2">
                  <Edit3 className="h-4 w-4" /> Edit
                </button>
                <button onClick={() => handleDelete(item._id)} className="rounded-md border px-3 py-2 text-red-600">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing ? (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <form onSubmit={handleSave} className="bg-white rounded-lg p-5 w-11/12 max-w-lg">
            <h4 className="font-semibold mb-3">Edit Product</h4>
            <input value={editing.name || ""} onChange={(e) => setEditing((p) => ({ ...p, name: e.target.value }))} className="w-full border rounded px-3 py-2 mb-2" />
            <input value={editing.price || ""} onChange={(e) => setEditing((p) => ({ ...p, price: e.target.value }))} type="number" className="w-full border rounded px-3 py-2 mb-2" />
            {serviceType === "shopping" ? (
              <>
                <input value={editing.category || ""} onChange={(e) => setEditing((p) => ({ ...p, category: e.target.value }))} className="w-full border rounded px-3 py-2 mb-2" />
                <input value={editing.tagName || ""} onChange={(e) => setEditing((p) => ({ ...p, tagName: e.target.value }))} className="w-full border rounded px-3 py-2 mb-2" />
              </>
            ) : null}
            <label className="block text-sm mb-1">Replace Image</label>
            <input type="file" accept="image/*" onChange={handleImageUpload} className="mb-3" />
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setEditing(null)} className="px-3 py-2 rounded border">Cancel</button>
              <button type="submit" disabled={saving} className="px-3 py-2 rounded bg-green-600 text-white">{saving ? "Saving..." : "Save"}</button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
