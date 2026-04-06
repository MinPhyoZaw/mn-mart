"use client";

import { useState } from "react";

export default function AdminVendorRequests({ initialRequests }) {
  const [requests, setRequests] = useState(initialRequests || []);
  const [loadingId, setLoadingId] = useState(null);

  const updateRequest = async (id, action) => {
    setLoadingId(id);
    try {
      const res = await fetch(`/api/vendor-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (data.success) {
        // update local state
        setRequests((r) => r.map((it) => (it._id === id ? { ...it, status: data.request?.status || (action === 'approve' ? 'approved' : 'rejected') } : it)));
      } else {
        alert(data.message || "Action failed");
      }
    } catch (err) {
      console.error(err);
      alert("Server error");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {requests.map((r) => (
        <div key={r._id} className="p-4 bg-white rounded-lg shadow">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold">{r.businessName}</h3>
              <p className="text-xs text-gray-500">Vendor: {r.vendorName || "N/A"}</p>
              <p className="text-sm text-gray-500">{r.vendorType} • {r.phone}</p>
            </div>
            <div className="text-sm text-gray-400">{r.status}</div>
          </div>
          <p className="text-sm mt-2 text-gray-700">{r.description}</p>
          <p className="text-xs text-gray-400 mt-2">Submitted: {new Date(r.createdAt).toLocaleString()}</p>

          <div className="mt-3 flex gap-2">
            <button
              onClick={() => updateRequest(r._id, "approve")}
              disabled={loadingId === r._id || r.status !== "pending"}
              className="bg-green-600 text-white px-3 py-1 rounded disabled:opacity-50"
            >
              {loadingId === r._id ? "Processing..." : "Approve"}
            </button>

            <button
              onClick={() => updateRequest(r._id, "reject")}
              disabled={loadingId === r._id || r.status !== "pending"}
              className="bg-red-500 text-white px-3 py-1 rounded disabled:opacity-50"
            >
              {loadingId === r._id ? "Processing..." : "Reject"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
