"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useNotifications } from "../context/NotificationsContext";

export default function AdminVendorRequests({
  initialRequests,
  initialPageSize = 20,
  initialTotal = 0,
}) {
  const [requests, setRequests] = useState(initialRequests || []);
  const [loadingId, setLoadingId] = useState(null);
  const [loadingList, setLoadingList] = useState(false);
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [limit] = useState(initialPageSize);
  const [total, setTotal] = useState(initialTotal);

  const [mounted, setMounted] = useState(false);
  const { refresh: refreshNotifications } = useNotifications();

  useEffect(() => {
    setMounted(true);
  }, []);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / limit)),
    [total, limit]
  );

  const fetchRequests = useCallback(
    async (nextPage, nextFilter) => {
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
    },
    [limit]
  );

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
        setRequests((r) =>
          r.map((it) =>
            it._id === id
              ? {
                  ...it,
                  status:
                    data.request?.status ||
                    (action === "approve" ? "approved" : "rejected"),
                }
              : it
          )
        );
        refreshNotifications();
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
  <div className="space-y-6">
    {/* Header + Filter */}
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-5">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-lg md:text-xl font-semibold text-gray-900">
            Vendor Requests
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Review and manage vendor registration requests.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              value={filter}
              onChange={(e) => {
                const nextFilter = e.target.value;
                setFilter(nextFilter);
                setPage(1);
                fetchRequests(1, nextFilter);
              }}
              className="appearance-none bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-xl pl-4 pr-10 py-2.5 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-gray-300 cursor-pointer"
            >
              <option value="all">All Requests</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>

            <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
              <svg
                className="w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m19 9-7 7-7-7"
                />
              </svg>
            </div>
          </div>

          <div className="bg-gray-100 text-gray-600 text-xs font-medium px-3 py-2 rounded-xl whitespace-nowrap">
            {total} total
          </div>
        </div>
      </div>
    </div>

    {/* Loading */}
    {loadingList && (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse"
          >
            <div className="h-40 bg-gray-100 rounded-xl mb-4" />
            <div className="h-5 bg-gray-100 rounded w-1/2 mb-3" />
            <div className="h-4 bg-gray-100 rounded w-1/3 mb-3" />
            <div className="h-4 bg-gray-100 rounded w-full" />
          </div>
        ))}
      </div>
    )}

    {/* Requests Grid */}
    {!loadingList && requests.length > 0 && (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {requests.map((r) => {
          const isPending = r.status === "pending";
          const isApproved = r.status === "approved";
          const isRejected = r.status === "rejected";

          return (
            <div
              key={r._id}
              className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden"
            >
              {/* Image */}
              {r.shopImage && (
                <div className="relative h-44 md:h-48 w-full bg-gray-100 overflow-hidden">
                  <Image
                    src={r.shopImage}
                    alt={`${r.businessName} preview`}
                    fill
                    className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
                    unoptimized
                  />

                  <div className="absolute top-3 right-3">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-md ${
                        isPending
                          ? "bg-amber-50/95 text-amber-700 border border-amber-200"
                          : isApproved
                          ? "bg-emerald-50/95 text-emerald-700 border border-emerald-200"
                          : "bg-red-50/95 text-red-700 border border-red-200"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isPending
                            ? "bg-amber-500"
                            : isApproved
                            ? "bg-emerald-500"
                            : "bg-red-500"
                        }`}
                      />
                      {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                    </span>
                  </div>
                </div>
              )}

              <div className="p-5">
                {/* Top */}
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                      {r.businessName}
                    </h3>

                    <p className="text-sm text-gray-500 mt-1">
                      Vendor:{" "}
                      <span className="text-gray-700 font-medium">
                        {r.vendorName || "N/A"}
                      </span>
                    </p>
                  </div>

                  {!r.shopImage && (
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                        isPending
                          ? "bg-amber-50 text-amber-700"
                          : isApproved
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isPending
                            ? "bg-amber-500"
                            : isApproved
                            ? "bg-emerald-500"
                            : "bg-red-500"
                        }`}
                      />
                      {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="grid grid-cols-2 gap-3 mt-5">
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-[11px] uppercase tracking-wide text-gray-400">
                      Vendor Type
                    </p>
                    <p className="text-sm font-medium text-gray-700 mt-1 capitalize">
                      {r.vendorType || "N/A"}
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-[11px] uppercase tracking-wide text-gray-400">
                      Phone
                    </p>
                    <p className="text-sm font-medium text-gray-700 mt-1">
                      {r.phone || "N/A"}
                    </p>
                  </div>
                </div>

                {/* Description */}
                {r.description && (
                  <div className="mt-4">
                    <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">
                      Description
                    </p>
                    <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">
                      {r.description}
                    </p>
                  </div>
                )}

                {/* Submitted */}
                <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-gray-400">
                      Submitted
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {mounted
                        ? new Date(r.createdAt).toLocaleString()
                        : ""}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateRequest(r._id, "reject")}
                      disabled={
                        loadingId === r._id || r.status !== "pending"
                      }
                      className="px-4 py-2 rounded-xl border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {loadingId === r._id ? "..." : "Reject"}
                    </button>

                    <button
                      onClick={() => updateRequest(r._id, "approve")}
                      disabled={
                        loadingId === r._id || r.status !== "pending"
                      }
                      className="px-4 py-2 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-black transition shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {loadingId === r._id
                        ? "Processing..."
                        : "Approve"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    )}

    {/* Empty State */}
    {requests.length === 0 && !loadingList && (
      <div className="bg-white border border-dashed border-gray-200 rounded-2xl py-16 px-6 text-center">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
          <svg
            className="w-6 h-6 text-gray-400"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12h6m-6 4h6M7 4h10a2 2 0 0 1 2 2v14H5V6a2 2 0 0 1 2-2Z"
            />
          </svg>
        </div>

        <h3 className="text-base font-semibold text-gray-800">
          No vendor requests
        </h3>

        <p className="text-sm text-gray-500 mt-1">
          There are no vendor requests matching this filter.
        </p>
      </div>
    )}

    {/* Pagination */}
    {totalPages > 1 && (
      <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-4 flex items-center justify-between">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page <= 1 || loadingList}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          ← Previous
        </button>

        <div className="text-sm text-gray-500">
          Page{" "}
          <span className="font-semibold text-gray-900">{page}</span>{" "}
          of{" "}
          <span className="font-semibold text-gray-900">
            {totalPages}
          </span>
        </div>

        <button
          onClick={() =>
            setPage((p) => Math.min(totalPages, p + 1))
          }
          disabled={page >= totalPages || loadingList}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-black transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Next →
        </button>
      </div>
    )}
  </div>
);
}