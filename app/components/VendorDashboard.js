"use client";

import dynamic from "next/dynamic";
import { Package, Plus, CheckCircle } from "lucide-react";
import { useEffect, useState } from "react";

const AddItemForm = dynamic(() => import("./vendor/AddItemForm"), { ssr: false });
const OrdersPanel = dynamic(() => import("./vendor/OrdersPanel"), { ssr: false });
const CheckoutSummary = dynamic(() => import("./vendor/CheckoutSummary"), { ssr: false });
const RoomsList = dynamic(() => import("./vendor/RoomsList"), { ssr: false });

export default function VendorDashboard() {
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [vendor, setVendor] = useState(null);
  const [shop, setShop] = useState(null);
  const [checkoutSummary, setCheckoutSummary] = useState(null);
  const [orders, setOrders] = useState([]);
  const [roomsRefreshToken, setRoomsRefreshToken] = useState(0);
  const [shoppingPanel, setShoppingPanel] = useState(null);
  const [vendorPanel, setVendorPanel] = useState(null);

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

  const serviceType = vendor?.serviceType || shop?.category || "";
  const isShoppingDashboard = serviceType === "shopping";

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

  return (
    <div>
      <CheckoutSummary vendor={vendor} shop={shop} checkoutSummary={checkoutSummary} serviceType={serviceType} />

      <div className="max-w-3xl mx-auto p-6">
        {message && (
          <div className="mb-4 flex items-start gap-3 rounded-md bg-green-50 border border-green-200 p-3 text-sm text-green-800">
            <CheckCircle className="h-6 w-6 text-green-600 flex-none" />
            <div>{message}</div>
          </div>
        )}

        {isShoppingDashboard ? (
          <>
            <div className="mb-6 grid gap-4 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setShoppingPanel("orders")}
                className={`rounded-2xl border p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                  shoppingPanel === "orders" ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white"
                }`}
                aria-pressed={shoppingPanel === "orders"}
              >
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                  <Package aria-hidden="true" className="h-8 w-8" />
                </span>
                <span className="mt-4 block text-xl font-semibold text-gray-900">Orders</span>
                <span className="mt-1 block text-sm text-gray-500">View and manage customer orders.</span>
              </button>

              <button
                type="button"
                onClick={() => setShoppingPanel("addProduct")}
                className={`rounded-2xl border p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                  shoppingPanel === "addProduct" ? "border-emerald-500 bg-emerald-50" : "border-gray-200 bg-white"
                }`}
                aria-pressed={shoppingPanel === "addProduct"}
              >
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                  <Plus aria-hidden="true" className="h-9 w-9" />
                </span>
                <span className="mt-4 block text-xl font-semibold text-gray-900">Add New Product</span>
                <span className="mt-1 block text-sm text-gray-500">Open the form to create a product.</span>
              </button>
            </div>

            {shoppingPanel === "orders" ? (
              <OrdersPanel orders={orders} onAction={handleOrderAction} messageSetter={setMessage} />
            ) : null}

            {shoppingPanel === "addProduct" ? (
              <AddItemForm serviceType={serviceType} shop={shop} onCreated={handleCreated} setMessage={setMessage} />
            ) : null}
          </>
        ) : (
          <>
            {serviceType === "transportation" ? (
              <>
                <div className="mb-6 grid gap-4 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setVendorPanel("orders")}
                    className={`rounded-2xl border p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                      vendorPanel === "orders" ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white"
                    }`}
                    aria-pressed={vendorPanel === "orders"}
                  >
                    <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                      <Package aria-hidden="true" className="h-8 w-8" />
                    </span>
                    <span className="mt-4 block text-xl font-semibold text-gray-900">Orders</span>
                    <span className="mt-1 block text-sm text-gray-500">View and manage transport orders.</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setVendorPanel("addItem")}
                    className={`rounded-2xl border p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                      vendorPanel === "addItem" ? "border-emerald-500 bg-emerald-50" : "border-gray-200 bg-white"
                    }`}
                    aria-pressed={vendorPanel === "addItem"}
                  >
                    <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                      <Plus aria-hidden="true" className="h-9 w-9" />
                    </span>
                    <span className="mt-4 block text-xl font-semibold text-gray-900">Add New Item</span>
                    <span className="mt-1 block text-sm text-gray-500">Open the form to create a transport item.</span>
                  </button>
                </div>

                {vendorPanel === "orders" ? (
                  <OrdersPanel orders={orders} onAction={handleOrderAction} messageSetter={setMessage} />
                ) : null}

                {vendorPanel === "addItem" ? (
                  <AddItemForm serviceType={serviceType} shop={shop} onCreated={handleCreated} setMessage={setMessage} />
                ) : null}
              </>
            ) : (
              <>
                <OrdersPanel orders={orders} onAction={handleOrderAction} messageSetter={setMessage} />

                {serviceType === "hotel" ? <RoomsList shop={shop} refreshToken={roomsRefreshToken} /> : null}

                <AddItemForm serviceType={serviceType} shop={shop} onCreated={handleCreated} setMessage={setMessage} />
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
