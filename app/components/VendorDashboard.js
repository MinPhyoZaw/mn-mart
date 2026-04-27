"use client";

import { useEffect, useMemo, useState } from "react";

const MAX_IMAGE_SIDE = 1280;
const OUTPUT_QUALITY = 0.8;

const fileToDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = () => reject(new Error("Unable to read the image file."));
  reader.readAsDataURL(file);
});

const loadImageElement = (src) => new Promise((resolve, reject) => {
  const img = new window.Image();
  img.onload = () => resolve(img);
  img.onerror = () => reject(new Error("Unable to load selected image."));
  img.src = src;
});

const compressItemImage = async (file) => {
  const sourceDataUrl = await fileToDataUrl(file);
  const image = await loadImageElement(sourceDataUrl);

  const scale = Math.min(MAX_IMAGE_SIDE / image.width, MAX_IMAGE_SIDE / image.height, 1);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));

  const ctx = canvas.getContext("2d", { alpha: false });
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

  return canvas.toDataURL("image/webp", OUTPUT_QUALITY);
};

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
  roomType: "",
  amenities: {
    wifi: false,
    swimmingPool: false,
    aircon: false,
    breakfast: false,
    extraBed: false,
  },
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

export default function VendorDashboard() {
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [vendor, setVendor] = useState(null);
  const [shop, setShop] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [checkoutSummary, setCheckoutSummary] = useState(null);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const fetchVendor = async () => {
      try {
        const [vendorRes, summaryRes, orderRes] = await Promise.all([
          fetch("/api/vendor/me", { cache: "no-store" }),
          fetch("/api/vendor/checkout-summary", { cache: "no-store" }),
          fetch("/api/vendor/orders", { cache: "no-store" }),
        ]);

        const vendorData = await vendorRes.json();
        const summaryData = await summaryRes.json();
        const orderData = await orderRes.json();

        if (vendorData.success) {
          setVendor(vendorData.data.vendor);
          setShop(vendorData.data.shop);
        } else {
          setMessage(vendorData.message || "Unable to load vendor dashboard");
        }

        if (summaryData.success) {
          setCheckoutSummary(summaryData.data);
        }

        if (orderData.success) {
          setOrders(orderData.data || []);
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
    if (serviceType === "shopping") {
      return (
        <>
          <input
            name="category"
            placeholder="Category"
            value={form.category}
            onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-4 py-2"
            required
          />
          <input
            name="quantity"
            type="number"
            min="0"
            placeholder="Quantity"
            value={form.quantity}
            onChange={(e) => setForm((prev) => ({ ...prev, quantity: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-4 py-2"
            required
          />
        </>
      );
    }

    if (serviceType === "hotel") {
      return (
        <>
          <input
            name="roomType"
            placeholder="Room Type"
            value={form.roomType}
            onChange={(e) => setForm((prev) => ({ ...prev, roomType: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-4 py-2"
            required
          />

          <div className="border border-gray-200 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-700 mb-3">Amenities</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {AMENITIES.map((amenity) => (
                <label key={amenity.key} className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={form.amenities[amenity.key]}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        amenities: {
                          ...prev.amenities,
                          [amenity.key]: e.target.checked,
                        },
                      }))
                    }
                    className="h-4 w-4"
                  />
                  {amenity.label}
                </label>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.isAvailable}
              onChange={(e) => setForm((prev) => ({ ...prev, isAvailable: e.target.checked }))}
              className="h-4 w-4"
            />
            Room available
          </label>
        </>
      );
    }

    if (serviceType === "transportation") {
      return (
        <>
          <input
            name="carName"
            placeholder="Car Name"
            value={form.carName}
            onChange={(e) => setForm((prev) => ({ ...prev, carName: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-4 py-2"
            required
          />
          <input
            name="routeFrom"
            placeholder="From (e.g. Myitkyina)"
            value={form.routeFrom}
            onChange={(e) => setForm((prev) => ({ ...prev, routeFrom: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-4 py-2"
            required
          />
          <input
            name="routeTo"
            placeholder="To (e.g. Yangon)"
            value={form.routeTo}
            onChange={(e) => setForm((prev) => ({ ...prev, routeTo: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-4 py-2"
            required
          />
          <input
            name="startDateTime"
            type="datetime-local"
            value={form.startDateTime}
            onChange={(e) => setForm((prev) => ({ ...prev, startDateTime: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-4 py-2"
            required
          />
        </>
      );
    }

    if (serviceType === "spa") {
      return (
        <input
          name="duration"
          placeholder="Duration (e.g. 60 min)"
          value={form.duration}
          onChange={(e) => setForm((prev) => ({ ...prev, duration: e.target.value }))}
          className="w-full border border-gray-300 rounded-lg px-4 py-2"
          required
        />
      );
    }

    return null;
  }, [form, serviceType]);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMessage("Please upload a valid image file.");
      return;
    }

    setUploadingImage(true);
    setMessage("");

    try {
      const image = await compressItemImage(file);
      setForm((prev) => ({ ...prev, image }));
    } catch (error) {
      setMessage(error.message || "Image upload failed");
    } finally {
      setUploadingImage(false);
      e.target.value = "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!shop?._id) return;

    if (!form.image) {
      setMessage("Please upload an image before submitting.");
      return;
    }

    setSubmitting(true);
    setMessage("");

    const payload = {
      shopId: shop._id,
      name: form.name,
      price: Number(form.price),
      image: form.image,
      type: TYPE_MAP[serviceType] || "service",
      category: form.category || serviceType,
      extra: {},
      isAvailable: true,
    };

    if (serviceType === "shopping") {
      payload.extra.quantity = Number(form.quantity);
      payload.category = form.category;
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
      const res = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!data.success) {
        setMessage(data.message || "Failed to create item/service");
      } else {
        setMessage("Created successfully.");
        setForm(INITIAL_FORM);
      }
    } catch {
      setMessage("Server error while creating item/service");
    } finally {
      setSubmitting(false);
    }
  };


  const handleOrderAction = async (id, action) => {
    const res = await fetch(`/api/vendor/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });

    const data = await res.json();
    if (!data.success) {
      setMessage(data.message || "Unable to update order status.");
      return;
    }

    setOrders((prev) => prev.map((order) => (order._id === id ? data.data : order)));
    setMessage(`Order marked as ${action}.`);
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

      <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-yellow-200 rounded-xl p-5 mb-6">
        <h2 className="text-lg font-semibold text-yellow-800">Today Payment Notice</h2>
        <p className="text-sm text-gray-700 mt-2">
          Approved sale&apos;s amount today: <span className="font-semibold">{Number(checkoutSummary?.todaySalesAmount || 0).toLocaleString()} MMK</span>
        </p>
        <p className="text-sm text-gray-700 mt-1">
          Amount to pay admin (1.5%): <span className="font-semibold">{Number(checkoutSummary?.todayAmountToAdmin || 0).toLocaleString()} MMK</span>
        </p>
        <p className="text-xs text-gray-500 mt-1">Total orders today: {checkoutSummary?.todayOrderCount || 0}</p>
        <p className="text-xs text-gray-500 mt-1">
          Shop approved order qty: {Number(shop?.approvedOrderQty || 0).toLocaleString()} • Shop income:{" "}
          {Number(shop?.approvedIncome || 0).toLocaleString()} MMK
        </p>
      </div>

      <div className="bg-white rounded-xl shadow p-5 mb-6">
        <h2 className="text-lg font-semibold">Orders</h2>
        {orders.length === 0 ? (
          <p className="text-sm text-gray-500 mt-3">No orders yet.</p>
        ) : (
          <div className="mt-4 space-y-4">
            {orders.map((order) => (
              <div key={order._id} className="rounded-xl border border-gray-200 p-4">
                <p className="text-sm font-semibold">Order ID: {order.orderId}</p>
                {order.orderStatus === "pending" && (
                  <p className="mt-1 text-sm font-medium text-amber-700">
                    Order pending state: wait for admin confirmation for payment.
                  </p>
                )}
                {order.orderStatus === "confirmed" && (
                  <p className="mt-1 text-sm font-medium text-emerald-700">Admin approved the order.</p>
                )}
                {order.orderStatus === "rejected" && (
                  <p className="mt-1 text-sm font-medium text-rose-700">Order rejected by admin.</p>
                )}
                <p className="text-sm">Customer: {order.customerName}</p>
                <p className="text-sm">Phone: {order.customerPhone}</p>
                <p className="text-sm">Delivery info: {order.customerAddress}</p>
                <div className="mt-2 text-sm">
                  <p className="font-medium">Items</p>
                  {order.items?.map((item) => (
                    <p key={item.itemId}>{item.name} × {item.quantity}</p>
                  ))}
                </div>
                {order.orderStatus === "confirmed" && order.vendorStatus === "new" && (
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleOrderAction(order._id, "accepted")}
                      className="px-3 py-2 rounded bg-green-600 text-white text-sm"
                    >
                      Accept order
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOrderAction(order._id, "rejected")}
                      className="px-3 py-2 rounded bg-rose-600 text-white text-sm"
                    >
                      Reject order
                    </button>
                  </div>
                )}

                {order.orderStatus === "confirmed" && order.vendorStatus === "accepted" && (
                  <p className="mt-3 text-sm font-medium text-emerald-700">Order approved.</p>
                )}
                {order.orderStatus === "confirmed" && order.vendorStatus === "rejected" && (
                  <p className="mt-3 text-sm font-medium text-rose-700">Order rejected.</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow p-5">
        <h2 className="text-lg font-semibold mb-3">{FORM_TITLE[serviceType] || "Add New Service/Item"}</h2>

        {message && <p className="mb-3 text-sm text-blue-600">{message}</p>}

        <form onSubmit={handleSubmit} className="space-y-3">
          {(serviceType === "shopping" || serviceType === "spa") && (
            <input
              name="name"
              placeholder={serviceType === "shopping" ? "Product Name" : "Service Name"}
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
              required
            />
          )}
          <input
            name="price"
            type="number"
            min="0"
            step="0.01"
            placeholder={
              serviceType === "hotel"
                ? "Price Per Night"
                : serviceType === "transportation"
                  ? "Ticket Price Per Person"
                  : "Price"
            }
            value={form.price}
            onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-4 py-2"
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Image Upload (required)</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
              required={!form.image}
            />
            <p className="mt-1 text-xs text-gray-500">
              {uploadingImage
                ? "Uploading image..."
                : form.image
                  ? "Image uploaded successfully."
                  : "Please upload an image file."}
            </p>
          </div>

          {dynamicFields}

          <button
            type="submit"
            disabled={submitting || uploadingImage}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-60"
          >
            {submitting ? "Saving..." : "Create"}
          </button>
        </form>
      </div>
    </div>
  );
}
