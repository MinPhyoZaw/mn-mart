"use client";

import { useEffect, useMemo, useState } from "react";
import { compressItemImage } from "./ImageUtils";

const TYPE_MAP = {
  shopping: "product",
  spa: "service",
  hotel: "room",
  transportation: "transport",
};

const INITIAL_FORM = {
  name: "",
  duration: "",
  customDuration: "",
  availableTime: "",
  price: "",
  quantity: "",
  category: "",
  tagName: "NewArrival",
  roomType: "",
  amenities: { wifi: false, swimmingPool: false, aircon: false, breakfast: false, extraBed: false },
  isAvailable: false,
  routeId: "",
  companyId: "",
  vehicleType: "Standard",
  totalSeats: "",
  availableSeats: "",
  departureDate: "",
  departureTime: "",
  arrivalTime: "",
  ticketAmenities: "",
  instantConfirm: true,
  status: "active",
  driverPhone: "",
  image: "",
};

const INITIAL_ROUTE_FORM = {
  companyName: "",
  fromCity: "",
  toCity: "",
  boardingPoints: "",
  droppingPoints: "",
  duration: "",
};

const AMENITIES = [
  { key: "wifi", label: "WiFi" },
  { key: "swimmingPool", label: "Swimming Pool" },
  { key: "aircon", label: "Aircon" },
  { key: "breakfast", label: "Breakfast" },
  { key: "extraBed", label: "Extra Bed" },
];



const FORM_TITLE = { shopping: "Add New Products", hotel: "Add New Room", transportation: "Create Transportation Ticket", spa: "Add New Service" };

const SHOPPING_CATEGORIES = [
  "electronics",
  "fashion",
  "food & beverage",
  "DIY",
  "hardware",
  "furniture",
  "Media",
  "Beauty & personal care",
  "Tobacco products",
  "Toy and hobbies",
];

const TAG_OPTIONS = ["NewArrival", "BestSellers", "TopPicks", "RecomendedForYou"];

export default function AddItemForm({ serviceType, shop, onCreated, setMessage }) {
  const [form, setForm] = useState({ ...INITIAL_FORM, category: SHOPPING_CATEGORIES[0] });
  const [routeForm, setRouteForm] = useState(INITIAL_ROUTE_FORM);
  const [routes, setRoutes] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [creatingRoute, setCreatingRoute] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (serviceType !== "transportation") return;
    const loadRoutes = async () => {
      const res = await fetch("/api/transport-routes", { cache: "no-store" });
      const data = await res.json();
      if (data.success) setRoutes(data.data || []);
    };
    loadRoutes();
  }, [serviceType]);

  const handleCreateRoute = async () => {
    setCreatingRoute(true);
    const payload = { ...routeForm, companyId: form.companyId || undefined };
    try {
      const res = await fetch("/api/transport-routes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!data.success) return setMessage?.(data.message || "Failed to create route");
      setRoutes((prev) => [data.data, ...prev]);
      setForm((p) => ({ ...p, routeId: data.data._id }));
      setRouteForm(INITIAL_ROUTE_FORM);
      setMessage?.("Route template saved.");
    } finally {
      setCreatingRoute(false);
    }
  };

  const routeTemplateForm = useMemo(() => {
    if (serviceType !== "transportation") return null;
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleCreateRoute();
        }}
        className="border rounded-lg p-3 space-y-2 mb-4"
      >
        <p className="font-medium text-sm">Create reusable route template</p>
        <input placeholder="Company Name" value={routeForm.companyName} onChange={(e) => setRouteForm((p) => ({ ...p, companyName: e.target.value }))} className="w-full border rounded-lg px-3 py-2" />
        <div className="grid grid-cols-2 gap-2">
          <input placeholder="From City" value={routeForm.fromCity} onChange={(e) => setRouteForm((p) => ({ ...p, fromCity: e.target.value }))} className="border rounded-lg px-3 py-2" />
          <input placeholder="To City" value={routeForm.toCity} onChange={(e) => setRouteForm((p) => ({ ...p, toCity: e.target.value }))} className="border rounded-lg px-3 py-2" />
        </div>
        <input placeholder="တက်လို့ရမည့်နေရာများ" value={routeForm.boardingPoints} onChange={(e) => setRouteForm((p) => ({ ...p, boardingPoints: e.target.value }))} className="w-full border rounded-lg px-3 py-2" />
        <input placeholder="ဆင်းလို့ရမည့်နေရာများ" value={routeForm.droppingPoints} onChange={(e) => setRouteForm((p) => ({ ...p, droppingPoints: e.target.value }))} className="w-full border rounded-lg px-3 py-2" />
        <input placeholder="Duration (e.g. 7 hr 30 min)" value={routeForm.duration} onChange={(e) => setRouteForm((p) => ({ ...p, duration: e.target.value }))} className="w-full border rounded-lg px-3 py-2" />
        <button type="submit" disabled={creatingRoute} className="bg-gray-900 text-white rounded-lg px-3 py-2 text-sm">{creatingRoute ? "Saving..." : "Save Route Template"}</button>
      </form>
    );
  }, [serviceType, routeForm, creatingRoute]);

  const dynamicFields = useMemo(() => {
    if (serviceType === "shopping")
      return (
        <>
          <input
            name="name"
            placeholder="Product Name"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-4 py-2"
            required
          />

          <select
            name="tagName"
            value={form.tagName}
            onChange={(e) => setForm((p) => ({ ...p, tagName: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-4 py-2"
          >
            <option value="NewArrival">New Arrival</option>
            <option value="TopPicks">Top Picks</option>
            <option value="Recommended">Recommended for you</option>
          </select>
        </>
      );
    if (serviceType === "hotel") return <input name="roomType" placeholder="Room Type" value={form.roomType} onChange={(e) => setForm((p) => ({ ...p, roomType: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-4 py-2" required />;
    if (serviceType === "spa")
      return (
        <>
          <input name="name" placeholder="Service Name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-4 py-2" required />
          <select name="duration" value={form.duration || ""} onChange={(e) => setForm((p) => ({ ...p, duration: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-4 py-2" required>
            <option value="" disabled>Select duration</option>
            <option value="30">30 minutes</option>
            <option value="45">45 minutes</option>
            <option value="60">60 minutes</option>
            <option value="custom">Custom</option>
          </select>
          {form.duration === "custom" ? (
            <input
              name="customDuration"
              type="number"
              min="1"
              placeholder="Custom duration (minutes)"
              value={form.customDuration || ""}
              onChange={(e) => setForm((p) => ({ ...p, customDuration: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
              required
            />
          ) : null}
          <div>
            <label className="block text-sm font-medium mb-1">Available time</label>
            <input name="availableTime" type="time" value={form.availableTime || ""} onChange={(e) => setForm((p) => ({ ...p, availableTime: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-4 py-2" required />
          </div>
        </>
      );
    if (serviceType === "shopping") {
      return (
        <>
          <input name="name" placeholder="Product name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-4 py-2" required />
          <input name="quantity" type="number" min="0" placeholder="Quantity" value={form.quantity} onChange={(e) => setForm((p) => ({ ...p, quantity: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-4 py-2" />
          <select name="category" value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-4 py-2" required>
            <option value="" disabled>Select category</option>
            {SHOPPING_CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
          </select>
          <select name="tagName" value={form.tagName} onChange={(e) => setForm((p) => ({ ...p, tagName: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-4 py-2">
            {TAG_OPTIONS.map((tag) => <option key={tag} value={tag}>{tag}</option>)}
          </select>
        </>
      );
    }
    if (serviceType !== "transportation") return null;

    return (
      <>
        <select name="routeId" value={form.routeId} onChange={(e) => setForm((p) => ({ ...p, routeId: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-4 py-2" required>
          <option value="" disabled>ခရီးစဉ်ရွေးချယ်မည်</option>
          {routes.map((route) => <option key={route._id} value={route._id}>{route.companyName} - {route.fromCity} → {route.toCity}</option>)}
        </select>
        {/* <input name="companyId" placeholder="Company ID" value={form.companyId} onChange={(e) => setForm((p) => ({ ...p, companyId: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-4 py-2" required /> */}
        <select name="vehicleType" placeholder="ကားအမျိုးအစား" value={form.vehicleType} onChange={(e) => setForm((p) => ({ ...p, vehicleType: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-4 py-2" required>
          <option value="VIP">VIP</option><option value="Standard">Standard</option><option value="Mini Van">Mini Van</option>
        </select>
        <input name="totalSeats" type="number" min="1" placeholder="ခုံအရေအတွက်" value={form.totalSeats} onChange={(e) => setForm((p) => ({ ...p, totalSeats: e.target.value }))} className="w-full border rounded-lg px-4 py-2" required />
        <input name="availableSeats" type="number" min="0" placeholder="ရနိုင်မည့်ခုံအရေအတွက်" value={form.availableSeats} onChange={(e) => setForm((p) => ({ ...p, availableSeats: e.target.value }))} className="w-full border rounded-lg px-4 py-2" required />
        <div>
          <label className="text-sm font-medium mb-1 block">ကားထွက်မည့်ရက်</label>
          <input name="departureDate" type="date" value={form.departureDate} onChange={(e) => setForm((p) => ({ ...p, departureDate: e.target.value }))} className="w-full border rounded-lg px-4 py-2" required />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">ကားထွက်မည့်အချိန်</label>
          <input name="departureTime" type="time" value={form.departureTime} onChange={(e) => setForm((p) => ({ ...p, departureTime: e.target.value }))} className="w-full border rounded-lg px-4 py-2" required />
        </div>
        {/* <input name="arrivalTime" type="time" value={form.arrivalTime} onChange={(e) => setForm((p) => ({ ...p, arrivalTime: e.target.value }))} className="w-full border rounded-lg px-4 py-2" /> */}
        <input name="ticketAmenities" placeholder="၀န်ဆောင်မှုများ ( AC , ရေသန့် ...)" value={form.ticketAmenities} onChange={(e) => setForm((p) => ({ ...p, ticketAmenities: e.target.value }))} className="w-full border rounded-lg px-4 py-2" />
        {/* <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.instantConfirm} onChange={(e) => setForm((p) => ({ ...p, instantConfirm: e.target.checked }))} />Instant Confirm</label> */}
        {/* <select name="status" value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))} className="w-full border rounded-lg px-4 py-2"><option value="active">active</option><option value="cancelled">cancelled</option><option value="full">full</option></select> */}
        { <input name="driverPhone" placeholder=" Company Phone Number" value={form.driverPhone} onChange={(e) => setForm((p) => ({ ...p, driverPhone: e.target.value }))} className="w-full border rounded-lg px-4 py-2" required/> }
      </>
    );
  }, [serviceType, form, routes]);

  const handleImageUpload = async (e) => { const file = e.target.files?.[0]; if (!file) return; setUploadingImage(true); try { const image = await compressItemImage(file); setForm((p) => ({ ...p, image })); } finally { setUploadingImage(false); } };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const defaultNameByServiceType = {
      hotel: form.roomType,
      spa: form.name,
      shopping: form.name,
      transportation: "Transportation Ticket",
    };

    const payload = {
      shopId: shop._id,
      name: defaultNameByServiceType[serviceType] || form.name || "Item",
      price: Number(form.price),
      image: form.image,
      type: TYPE_MAP[serviceType] || "service",
      category: serviceType === "shopping" ? form.category : undefined,
      tagName: serviceType === "shopping" ? form.tagName : undefined,
      extra: {},
      isAvailable: true,
    };

    if (serviceType === "shopping") {
      payload.extra = { quantity: Number(form.quantity || 0) };
    }
    if (serviceType === "spa") {
      const durationMinutes = form.duration === "custom" ? Number(form.customDuration) : Number(form.duration);
      payload.extra = {
        durationMinutes,
        availableTime: form.availableTime,
      };
    }

    if (serviceType === "transportation") {
      payload.name = `Ticket ${form.departureDate} ${form.departureTime}`;
      payload.extra = {
        routeId: form.routeId,
        companyId: form.companyId,
        vehicleType: form.vehicleType,
        totalSeats: Number(form.totalSeats),
        availableSeats: Number(form.availableSeats),
        departureDate: form.departureDate,
        departureTime: form.departureTime,
        arrivalTime: form.arrivalTime || null,
        amenities: form.ticketAmenities.split(",").map((v) => v.trim()).filter(Boolean),
        instantConfirm: Boolean(form.instantConfirm),
        status: form.status,
        driverPhone: form.driverPhone || null,
      };
    }

    try {
      const res = await fetch("/api/items", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!data.success) return setMessage?.(data.message || "Failed");
      setMessage?.("Created successfully.");
      setForm({ ...INITIAL_FORM, category: SHOPPING_CATEGORIES[0] });
      onCreated?.();
    } catch { setMessage?.("Server error while creating item/service"); } finally { setSubmitting(false); }
  };

  return <div className="bg-white rounded-xl shadow p-5"><h2 className="text-lg font-semibold mb-3">{FORM_TITLE[serviceType] || "Add New Service/Item"}</h2>{routeTemplateForm}<form onSubmit={handleSubmit} className="space-y-3">{serviceType === "spa" ? <><input name="name" placeholder="Service Name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-4 py-2" required /><input name="price" type="number" min="0" step="0.01" placeholder="Price" value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-4 py-2" required /><input type="file" accept="image/*" onChange={handleImageUpload} className="w-full border border-gray-300 rounded-lg px-4 py-2" required={!form.image} /><select name="duration" value={form.duration || ""} onChange={(e) => setForm((p) => ({ ...p, duration: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-4 py-2" required><option value="" disabled>Select duration</option><option value="30">30 minutes</option><option value="45">45 minutes</option><option value="60">60 minutes</option><option value="custom">Custom</option></select>{form.duration === "custom" ? <input name="customDuration" type="number" min="1" placeholder="Custom duration (minutes)" value={form.customDuration || ""} onChange={(e) => setForm((p) => ({ ...p, customDuration: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-4 py-2" required /> : null}<div><label className="block text-sm font-medium mb-1">Order တင်လိုသည့်အချိန်</label><input name="availableTime" type="time" value={form.availableTime || ""} onChange={(e) => setForm((p) => ({ ...p, availableTime: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-4 py-2" required /></div></> : <><input name="price" type="number" min="0" step="0.01" placeholder="Price" value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-4 py-2" required /><input type="file" accept="image/*" onChange={handleImageUpload} className="w-full border border-gray-300 rounded-lg px-4 py-2" required={!form.image} />{dynamicFields}</>}<button type="submit" disabled={submitting || uploadingImage} className="bg-green-600 text-white px-4 py-2 rounded-lg">{submitting ? "Saving..." : "Create"}</button></form></div>;
}
