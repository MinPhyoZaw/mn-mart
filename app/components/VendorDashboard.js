"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const AddItemForm = dynamic(() => import("./vendor/AddItemForm"), { ssr: false });
const OrdersPanel = dynamic(() => import("./vendor/OrdersPanel"), { ssr: false });
const CheckoutSummary = dynamic(() => import("./vendor/CheckoutSummary"), { ssr: false });
const RoomsList = dynamic(() => import("./vendor/RoomsList"), { ssr: false });

const TYPE_MAP = { shopping: "shop", transport: "transport", transportation: "transport", hotel: "hotel", spa: "spa" };

export default function VendorDashboard({ expectedType = "" }) {
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [vendor, setVendor] = useState(null);
  const [shop, setShop] = useState(null);
  const [checkoutSummary, setCheckoutSummary] = useState(null);
  const [orders, setOrders] = useState([]);
  const [roomsRefreshToken, setRoomsRefreshToken] = useState(0);

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

        if (summaryData.success) setCheckoutSummary(summaryData.data);
        if (orderData.success) setOrders(orderData.data || []);
      } catch {
        setMessage("Unable to load vendor dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchVendor();
  }, []);

  const serviceType = shop?.category || vendor?.serviceType || "";
  const normalizedType = TYPE_MAP[serviceType] || serviceType;

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

  const refreshData = async () => {
    setLoading(true);
    try {
      const [summaryRes, orderRes] = await Promise.all([
        fetch("/api/vendor/checkout-summary", { cache: "no-store" }),
        fetch("/api/vendor/orders", { cache: "no-store" }),
      ]);
      const summaryData = await summaryRes.json();
      const orderData = await orderRes.json();
      if (summaryData.success) setCheckoutSummary(summaryData.data);
      if (orderData.success) setOrders(orderData.data || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleCreated = async () => {
    setRoomsRefreshToken((prev) => prev + 1);
    await refreshData();
  };

  if (loading) return <div className="p-8">Loading vendor dashboard...</div>;

  if (!shop || !vendor) {
    return (
      <div className="p-8">
        <p className="text-red-500">{message || "Vendor access required."}</p>
      </div>
    );
  }

  if (expectedType && normalizedType && expectedType !== normalizedType) {
    return (
      <div className="p-8">
        <p className="text-red-500">Unauthorized vendor dashboard route.</p>
      </div>
    );
  }

  return (
    <div>
      <CheckoutSummary vendor={vendor} shop={shop} checkoutSummary={checkoutSummary} serviceType={serviceType} />

      <div className="max-w-3xl mx-auto p-6">
        {message && <p className="mb-3 text-sm text-blue-600">{message}</p>}

        <OrdersPanel orders={orders} onAction={handleOrderAction} messageSetter={setMessage} />

        {normalizedType === "hotel" && <RoomsList shop={shop} refreshToken={roomsRefreshToken} />}

        <AddItemForm serviceType={serviceType} shop={shop} onCreated={handleCreated} setMessage={setMessage} />
      </div>
    </div>
  );
}
