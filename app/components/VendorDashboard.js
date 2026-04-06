"use client";

import { useEffect, useMemo, useState } from "react";

const TYPE_MAP = {
  shopping: "product",
  spa: "service",
  hotel: "room",
  transportation: "transport",
};

export default function VendorDashboard() {
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [vendor, setVendor] = useState(null);
  const [shop, setShop] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    price: "",
    description: "",
    image: "",
    category: "",
    roomType: "",
    seats: "",
    routeFrom: "",
    routeTo: "",
    duration: "",
  });

  useEffect(() => {
    const fetchVendor = async () => {
      try {
        const res = await fetch("/api/vendor/me", { cache: "no-store" });
        const data = await res.json();
        if (data.success) {
          setVendor(data.data.vendor);
          setShop(data.data.shop);
        } else {
          setMessage(data.message || "Unable to load vendor dashboard");
        }
      } catch {
        setMessage("Unable to load vendor dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchVendor();
  }, []);

  const serviceType = shop?.category || vendor?.serviceType || "";

  const dynamicFields = useMemo(() => {
    if (serviceType === "hotel") {
      return (
        <>
          <input
            name="roomType"
            placeholder="Room Type (e.g. Deluxe Twin)"
            value={form.roomType}
            onChange={(e) => setForm((prev) => ({ ...prev, roomType: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-4 py-2"
            required
          />
          <input
            name="seats"
            type="number"
            min="1"
            placeholder="Max Guests"
            value={form.seats}
            onChange={(e) => setForm((prev) => ({ ...prev, seats: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-4 py-2"
            required
          />
        </>
      );
    }

    if (serviceType === "transportation") {
      return (
        <>
          <input
            name="routeFrom"
            placeholder="Route From"
            value={form.routeFrom}
            onChange={(e) => setForm((prev) => ({ ...prev, routeFrom: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-4 py-2"
            required
          />
          <input
            name="routeTo"
            placeholder="Route To"
            value={form.routeTo}
            onChange={(e) => setForm((prev) => ({ ...prev, routeTo: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-4 py-2"
            required
          />
          <input
            name="duration"
            placeholder="Estimated Duration (e.g. 3h 20m)"
            value={form.duration}
            onChange={(e) => setForm((prev) => ({ ...prev, duration: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-4 py-2"
          />
        </>
      );
    }

    return (
      <input
        name="category"
        placeholder="Category (optional)"
        value={form.category}
        onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
        className="w-full border border-gray-300 rounded-lg px-4 py-2"
      />
    );
  }, [form, serviceType]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!shop?._id) return;

    setSubmitting(true);
    setMessage("");

    const extra = {};
    if (serviceType === "hotel") {
      extra.roomType = form.roomType;
      extra.maxGuests = Number(form.seats);
    }
    if (serviceType === "transportation") {
      extra.routeFrom = form.routeFrom;
      extra.routeTo = form.routeTo;
      extra.duration = form.duration;
    }

    try {
      const res = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopId: shop._id,
          name: form.name,
          price: Number(form.price),
          description: form.description,
          image: form.image,
          type: TYPE_MAP[serviceType] || "service",
          category: form.category || serviceType,
          extra,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        setMessage(data.message || "Failed to create service");
      } else {
        setMessage("Service created successfully.");
        setForm({
          name: "",
          price: "",
          description: "",
          image: "",
          category: "",
          roomType: "",
          seats: "",
          routeFrom: "",
          routeTo: "",
          duration: "",
        });
      }
    } catch {
      setMessage("Server error while creating service");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-8">Loading vendor dashboard...</div>;

  if (!shop || !vendor) {
    return (
      <div className="p-8">
        <p className="text-red-500">{message || "Vendor access required."}</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">Vendor Dashboard</h1>
      <p className="text-gray-600 mb-6">
        {vendor.vendorName} • {serviceType}
      </p>

      <div className="bg-white rounded-xl shadow p-5">
        <h2 className="text-lg font-semibold mb-3">Create a new service/item</h2>
        <p className="text-sm text-gray-500 mb-4">
          You only see fields for your assigned service type to keep the form simple and avoid wrong data.
        </p>

        {message && <p className="mb-3 text-sm text-blue-600">{message}</p>}

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            name="name"
            placeholder="Service Name"
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-4 py-2"
            required
          />
          <input
            name="price"
            type="number"
            min="0"
            step="0.01"
            placeholder="Price"
            value={form.price}
            onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-4 py-2"
            required
          />
          <textarea
            name="description"
            rows="3"
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-4 py-2"
          />
          <input
            name="image"
            placeholder="Image URL (optional)"
            value={form.image}
            onChange={(e) => setForm((prev) => ({ ...prev, image: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-4 py-2"
          />

          {dynamicFields}

          <button
            type="submit"
            disabled={submitting}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-60"
          >
            {submitting ? "Saving..." : "Create"}
          </button>
        </form>
      </div>
    </div>
  );
}
