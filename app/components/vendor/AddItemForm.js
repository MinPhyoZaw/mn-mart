"use client";

import { useMemo, useState } from "react";
import { compressItemImage } from "./ImageUtils";

const TYPE_MAP = {
  shopping: "product",
  spa: "service",
  hotel: "room",
  transportation: "transport",
};

const INITIAL_FORM = {
  name: "",
  price: "",
  quantity: "",
  category: "",
  tagName: "NewArrival",
  roomType: "",
  amenities: { wifi: false, swimmingPool: false, aircon: false, breakfast: false, extraBed: false },
  isAvailable: false,
  carName: "",
  routeFrom: "",
  routeTo: "",
  startDateTime: "",
  duration: "",
  image: "",
};

const AMENITIES = [
  { key: "wifi", label: "WiFi" },
  { key: "swimmingPool", label: "Swimming Pool" },
  { key: "aircon", label: "Aircon" },
  { key: "breakfast", label: "Breakfast" },
  { key: "extraBed", label: "Extra Bed" },
];

const FORM_TITLE = {
  shopping: "Add New Products",
  hotel: "Add New Room",
  transportation: "Add New Routes",
  spa: "Add New Service",
};

const SHOPPING_TAGS = ["NewArrival", "BestSellers", "TopPicks", "RecomendedForYou"];

export default function AddItemForm({ serviceType, shop, onCreated, setMessage }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const dynamicFields = useMemo(() => {
    if (serviceType === "shopping") {
      return (
        <>
          <input name="category" placeholder="Category" value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-4 py-2" required />
          <input name="quantity" type="number" min="0" placeholder="Quantity" value={form.quantity} onChange={(e) => setForm((p) => ({ ...p, quantity: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-4 py-2" required />
          <select name="tagName" value={form.tagName} onChange={(e) => setForm((p) => ({ ...p, tagName: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-4 py-2" required>
            {SHOPPING_TAGS.map((tag) => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>
        </>
      );
    }

    if (serviceType === "hotel") {
      return (
        <>
          <input name="roomType" placeholder="Room Type" value={form.roomType} onChange={(e) => setForm((p) => ({ ...p, roomType: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-4 py-2" required />
          <div className="border border-gray-200 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-700 mb-3">Amenities</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {AMENITIES.map((amenity) => (
                <label key={amenity.key} className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" checked={form.amenities[amenity.key]} onChange={(e) => setForm((p) => ({ ...p, amenities: { ...p.amenities, [amenity.key]: e.target.checked } }))} className="h-4 w-4" />
                  {amenity.label}
                </label>
              ))}
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={form.isAvailable} onChange={(e) => setForm((p) => ({ ...p, isAvailable: e.target.checked }))} className="h-4 w-4" />
            Room available
          </label>
        </>
      );
    }

    if (serviceType === "transportation") {
      return (
        <>
          <input name="carName" placeholder="Car Name" value={form.carName} onChange={(e) => setForm((p) => ({ ...p, carName: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-4 py-2" required />
          <input name="routeFrom" placeholder="From (e.g. Myitkyina)" value={form.routeFrom} onChange={(e) => setForm((p) => ({ ...p, routeFrom: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-4 py-2" required />
          <input name="routeTo" placeholder="To (e.g. Yangon)" value={form.routeTo} onChange={(e) => setForm((p) => ({ ...p, routeTo: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-4 py-2" required />
          <input name="startDateTime" type="datetime-local" value={form.startDateTime} onChange={(e) => setForm((p) => ({ ...p, startDateTime: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-4 py-2" required />
        </>
      );
    }

    if (serviceType === "spa") {
      return <input name="duration" placeholder="Duration (e.g. 60 min)" value={form.duration} onChange={(e) => setForm((p) => ({ ...p, duration: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-4 py-2" required />;
    }

    return null;
  }, [form, serviceType]);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setMessage?.("Please upload a valid image file.");
      return;
    }
    setUploadingImage(true);
    setMessage?.("");
    try {
      const image = await compressItemImage(file);
      setForm((p) => ({ ...p, image }));
    } catch (error) {
      setMessage?.(error.message || "Image upload failed");
    } finally {
      setUploadingImage(false);
      e.target.value = "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!shop?._id) return;
    if (!form.image) {
      setMessage?.("Please upload an image before submitting.");
      return;
    }
    setSubmitting(true);
    setMessage?.("");

    const payload = { shopId: shop._id, name: form.name, price: Number(form.price), image: form.image, type: TYPE_MAP[serviceType] || "service", category: form.category || serviceType, extra: {}, isAvailable: true };

    if (serviceType === "shopping") {
      payload.extra.quantity = Number(form.quantity);
      payload.category = form.category;
      payload.tagName = form.tagName;
    }

    if (serviceType === "hotel") {
      payload.name = form.roomType;
      payload.category = "hotel-room";
      payload.extra.roomType = form.roomType;
      payload.extra.amenities = form.amenities;
      payload.isAvailable = form.isAvailable;
    }

    if (serviceType === "transportation") {
      payload.name = form.carName;
      payload.category = "transport-route";
      payload.extra.carName = form.carName;
      payload.extra.routeFrom = form.routeFrom;
      payload.extra.routeTo = form.routeTo;
      payload.extra.routeLabel = `From ${form.routeFrom} to ${form.routeTo}`;
      payload.extra.startDateTime = form.startDateTime;
    }

    if (serviceType === "spa") {
      payload.extra.duration = form.duration;
      payload.category = "spa-service";
    }

    try {
      const res = await fetch("/api/items", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!data.success) {
        setMessage?.(data.message || "Failed to create item/service");
      } else {
        setMessage?.("Created successfully.");
        setForm(INITIAL_FORM);
        onCreated?.();
      }
    } catch {
      setMessage?.("Server error while creating item/service");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow p-5">
      <h2 className="text-lg font-semibold mb-3">{FORM_TITLE[serviceType] || "Add New Service/Item"}</h2>

      <form onSubmit={handleSubmit} className="space-y-3">
        {(serviceType === "shopping" || serviceType === "spa") && (
          <input name="name" placeholder={serviceType === "shopping" ? "Product Name" : "Service Name"} value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-4 py-2" required />
        )}

        <input name="price" type="number" min="0" step="0.01" placeholder={serviceType === "hotel" ? "Price Per Night" : serviceType === "transportation" ? "Ticket Price Per Person" : "Price"} value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-4 py-2" required />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Image Upload (required)</label>
          <input type="file" accept="image/*" onChange={handleImageUpload} className="w-full border border-gray-300 rounded-lg px-4 py-2" required={!form.image} />
          <p className="mt-1 text-xs text-gray-500">{uploadingImage ? "Uploading image..." : form.image ? "Image uploaded successfully." : "Please upload an image file."}</p>
        </div>

        {dynamicFields}

        <button type="submit" disabled={submitting || uploadingImage} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-60">{submitting ? "Saving..." : "Create"}</button>
      </form>
    </div>
  );
}
