"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

export default function AdminVendorRequests({ initialRequests, initialPageSize = 20, initialTotal = 0 }) {
  const [requests, setRequests] = useState(initialRequests || []);
  const [loadingId, setLoadingId] = useState(null);
  const [loadingList, setLoadingList] = useState(false);
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [limit] = useState(initialPageSize);
  const [total, setTotal] = useState(initialTotal);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total, limit]);

  const fetchRequests = useCallback(async (nextPage, nextFilter) => {
    setLoadingList(true);
    try {
      const params = new URLSearchParams({
        page: String(nextPage),
        limit: String(limit),
      });
      if (nextFilter !== "all") params.set("status", nextFilter);

      const res = await fetch(`/api/vendor-requests?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setRequests(data.data || []);
        setTotal(data.pagination?.total || 0);
      } else {
        alert(data.message || "Could not load requests");
      }
    } catch (err) {
      console.error(err);
      alert("Server error");
    } finally {
      setLoadingList(false);
    }
  }, [limit]);

  useEffect(() => {
    if (page === 1 && filter === "all") return;
    fetchRequests(page, filter);
  }, [page, filter, fetchRequests]);

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
      {requests.length === 0 && !loadingList && (
        <div className="md:col-span-2 p-6 bg-white rounded-lg shadow text-sm text-gray-500">
          No vendor requests found for this filter.
        </div>
      )}

      <div className="md:col-span-2 mt-2 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <label htmlFor="request-filter" className="text-sm text-gray-600">Filter:</label>
          <select
            id="request-filter"
            value={filter}
            onChange={(e) => {
              setPage(1);
              setFilter(e.target.value);
            }}
            className="border rounded px-2 py-1 text-sm"
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || loadingList}
            className="px-3 py-1 rounded bg-gray-200 disabled:opacity-50"
          >
            Prev
          </button>
          <span className="text-sm text-gray-600">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages || loadingList}
            className="px-3 py-1 rounded bg-gray-200 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
