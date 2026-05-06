"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export default function RoomsList({ shop, refreshToken = 0 }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [showAvailable, setShowAvailable] = useState(true);
  const [showNotAvailable, setShowNotAvailable] = useState(false);

  useEffect(() => {
    if (!shop || !shop._id) return;

    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/items?shopId=${shop._id}`, { cache: "no-store" });
        const data = await res.json();
        if (data.success) setItems((data.data || []).filter((i) => i.type === "room"));
      } catch (err) {
        setMessage("Failed to load rooms");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [shop, refreshToken]);

  const filteredItems = items.filter((item) => {
    if (item.isAvailable) return showAvailable;
    return showNotAvailable;
  });

  const toggleAvailability = async (itemId, current) => {
    try {
      const res = await fetch(`/api/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAvailable: !current }),
      });
      const data = await res.json();
      if (!data.success) return setMessage(data.message || "Failed to update");
      setItems((prev) => prev.map((it) => (it._id === itemId ? { ...it, isAvailable: data.data.isAvailable } : it)));
    } catch (err) {
      setMessage("Server error");
    }
  };

  if (loading) return <div className="p-4">Loading rooms...</div>;

  return (
    <div className="mb-6">
      <h2 className="text-xl font-semibold mb-3">Your Rooms</h2>
      {message && <p className="text-sm text-red-500 mb-2">{message}</p>}

      <div className="mb-4 flex flex-wrap gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={showAvailable} onChange={(e) => setShowAvailable(e.target.checked)} />
          <span>Available</span>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={showNotAvailable} onChange={(e) => setShowNotAvailable(e.target.checked)} />
          <span>Not Available</span>
        </label>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-gray-500">No rooms created yet.</p>
      ) : filteredItems.length === 0 ? (
        <p className="text-sm text-gray-500">No rooms match selected availability filter.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <div key={item._id} className="border rounded-lg bg-white p-3 shadow-sm">
              <div className="relative h-40 bg-gray-100 rounded-md overflow-hidden">
                {item.image ? (
                  <Image src={item.image} alt={item.name} fill className="object-cover" />
                ) : null}
              </div>

              <div className="mt-3">
                <h3 className="font-semibold text-lg">{item.name}</h3>
                <p className="text-sm text-gray-600">{Number(item.price || 0).toLocaleString()} MMK</p>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={Boolean(item.isAvailable)}
                    onChange={() => toggleAvailability(item._id, item.isAvailable)}
                  />
                  <span className="text-sm">Available</span>
                </label>

                <span className="text-sm text-gray-500">{new Date(item.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
