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

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(total / limit));
  }, [total, limit]);

  const fetchRequests = useCallback(
    async (nextPage, nextFilter) => {
      setLoadingList(true);

      try {
        const params = new URLSearchParams({
          page: String(nextPage),
          limit: String(limit),
        });

        if (nextFilter !== "all") {
          params.set("status", nextFilter);
        }

        const res = await fetch(
          `/api/vendor-requests?${params.toString()}`,
          {
            cache: "no-store",
            credentials: "include",
          }
        );

        if (!res.ok) {
          throw new Error(
            `Failed to load vendor requests: ${res.status}`
          );
        }

        const data = await res.json();

        if (!data?.success) {
          throw new Error(
            data?.message || "Could not load requests"
          );
        }

        setRequests(data.data || []);
        setTotal(Number(data.pagination?.total || 0));
      } catch (error) {
        console.error(
          "Failed to fetch vendor requests:",
          error
        );

        alert("Could not load vendor requests.");
      } finally {
        setLoadingList(false);
      }
    },
    [limit]
  );

  useEffect(() => {
    /*
     * Initial page=1/filter=all already comes from
     * the server through initialRequests.
     *
     * Therefore we don't fetch it again.
     */
    if (page === 1 && filter === "all") {
      return;
    }

    void fetchRequests(page, filter);
  }, [page, filter, fetchRequests]);

  const handleFilterChange = (event) => {
    const nextFilter = event.target.value;

    /*
     * Important:
     * Do NOT call fetchRequests() here.
     *
     * Updating filter/page will trigger the effect
     * above once, avoiding duplicate API requests.
     */
    setFilter(nextFilter);
    setPage(1);
  };

  const updateRequest = async (id, action) => {
    if (loadingId) {
      return;
    }

    setLoadingId(id);

    try {
      const res = await fetch(
        `/api/vendor-requests/${id}`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok || !data?.success) {
        throw new Error(
          data?.message || `Action failed: ${res.status}`
        );
      }

      const nextStatus =
        data.request?.status ||
        (action === "approve"
          ? "approved"
          : "rejected");

      /*
       * Update the UI locally.
       * No router.refresh()
       * No window.location.reload()
       * No full /admindashboard reload.
       */
      setRequests((previousRequests) =>
        previousRequests.map((request) =>
          request._id === id
            ? {
                ...request,
                status: nextStatus,
              }
            : request
        )
      );

      /*
       * If current view is filtered to pending,
       * remove the processed request from that list.
       */
      if (filter === "pending") {
        setRequests((previousRequests) =>
          previousRequests.filter(
            (request) => request._id !== id
          )
        );
      }

      /*
       * Update local total when looking at a
       * status-specific list.
       */
      if (filter === "pending") {
        setTotal((previousTotal) =>
          Math.max(0, previousTotal - 1)
        );
      }

      /*
       * Refresh notification count.
       *
       * This only hits notification APIs.
       * It does NOT reload /admindashboard.
       */
      void refreshNotifications();
    } catch (error) {
      console.error(
        `Failed to ${action} vendor request:`,
        error
      );

      alert(
        action === "approve"
          ? "Could not approve vendor request."
          : "Could not reject vendor request."
      );
    } finally {
      setLoadingId(null);
    }
  };

  const goToPreviousPage = () => {
    if (loadingList) {
      return;
    }

    setPage((currentPage) =>
      Math.max(1, currentPage - 1)
    );
  };

  const goToNextPage = () => {
    if (loadingList) {
      return;
    }

    setPage((currentPage) =>
      Math.min(totalPages, currentPage + 1)
    );
  };

  return (
    <div className="space-y-6">
      {/* Header + Filter */}
      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm md:p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 md:text-xl">
              Vendor Requests
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Review and manage vendor registration
              requests.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <select
                value={filter}
                onChange={handleFilterChange}
                disabled={loadingList}
                className="cursor-pointer appearance-none rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-4 pr-10 text-sm text-gray-700 focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-black/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option value="all">
                  All Requests
                </option>

                <option value="pending">
                  Pending
                </option>

                <option value="approved">
                  Approved
                </option>

                <option value="rejected">
                  Rejected
                </option>
              </select>

              <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                <svg
                  className="h-4 w-4 text-gray-400"
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

            <div className="whitespace-nowrap rounded-xl bg-gray-100 px-3 py-2 text-xs font-medium text-gray-600">
              {total} total
            </div>
          </div>
        </div>
      </div>

      {/* Loading */}
      {loadingList && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="animate-pulse rounded-2xl border border-gray-100 bg-white p-5"
            >
              <div className="mb-4 h-40 rounded-xl bg-gray-100" />

              <div className="mb-3 h-5 w-1/2 rounded bg-gray-100" />

              <div className="mb-3 h-4 w-1/3 rounded bg-gray-100" />

              <div className="h-4 w-full rounded bg-gray-100" />
            </div>
          ))}
        </div>
      )}

      {/* Requests Grid */}
      {!loadingList && requests.length > 0 && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {requests.map((request) => {
            const isPending =
              request.status === "pending";

            const isApproved =
              request.status === "approved";

            const isRejected =
              request.status === "rejected";

            return (
              <div
                key={request._id}
                className="group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
              >
                {/* Shop Image */}
                {request.shopImage && (
                  <div className="relative h-44 w-full overflow-hidden bg-gray-100 md:h-48">
                    <Image
                      src={request.shopImage}
                      alt={`${
                        request.businessName ||
                        "Vendor"
                      } preview`}
                      fill
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                    />

                    <div className="absolute right-3 top-3">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium backdrop-blur-md ${
                          isPending
                            ? "border-amber-200 bg-amber-50/95 text-amber-700"
                            : isApproved
                            ? "border-emerald-200 bg-emerald-50/95 text-emerald-700"
                            : "border-red-200 bg-red-50/95 text-red-700"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            isPending
                              ? "bg-amber-500"
                              : isApproved
                              ? "bg-emerald-500"
                              : "bg-red-500"
                          }`}
                        />

                        {request.status
                          ? request.status
                              .charAt(0)
                              .toUpperCase() +
                            request.status.slice(1)
                          : "Unknown"}
                      </span>
                    </div>
                  </div>
                )}

                <div className="p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="truncate text-lg font-semibold text-gray-900">
                        {request.businessName ||
                          "Unnamed Business"}
                      </h3>

                      <p className="mt-1 text-sm text-gray-500">
                        Vendor:{" "}
                        <span className="font-medium text-gray-700">
                          {request.vendorName ||
                            "N/A"}
                        </span>
                      </p>
                    </div>

                    {!request.shopImage && (
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${
                          isPending
                            ? "bg-amber-50 text-amber-700"
                            : isApproved
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-red-50 text-red-700"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            isPending
                              ? "bg-amber-500"
                              : isApproved
                              ? "bg-emerald-500"
                              : "bg-red-500"
                          }`}
                        />

                        {request.status
                          ? request.status
                              .charAt(0)
                              .toUpperCase() +
                            request.status.slice(1)
                          : "Unknown"}
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-gray-50 p-3">
                      <p className="text-[11px] uppercase tracking-wide text-gray-400">
                        Vendor Type
                      </p>

                      <p className="mt-1 text-sm font-medium capitalize text-gray-700">
                        {request.vendorType ||
                          "N/A"}
                      </p>
                    </div>

                    <div className="rounded-xl bg-gray-50 p-3">
                      <p className="text-[11px] uppercase tracking-wide text-gray-400">
                        Phone
                      </p>

                      <p className="mt-1 text-sm font-medium text-gray-700">
                        {request.phone || "N/A"}
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  {request.description && (
                    <div className="mt-4">
                      <p className="mb-1 text-xs uppercase tracking-wide text-gray-400">
                        Description
                      </p>

                      <p className="line-clamp-3 text-sm leading-relaxed text-gray-600">
                        {request.description}
                      </p>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="mt-5 flex items-center justify-between gap-3 border-t border-gray-100 pt-4">
                    <div>
                      <p className="text-[11px] uppercase tracking-wide text-gray-400">
                        Submitted
                      </p>

                      <p className="mt-1 text-xs text-gray-500">
                        {mounted &&
                        request.createdAt
                          ? new Date(
                              request.createdAt
                            ).toLocaleString()
                          : ""}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          updateRequest(
                            request._id,
                            "reject"
                          )
                        }
                        disabled={
                          loadingId ===
                            request._id ||
                          !isPending
                        }
                        className="rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {loadingId ===
                        request._id
                          ? "..."
                          : "Reject"}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          updateRequest(
                            request._id,
                            "approve"
                          )
                        }
                        disabled={
                          loadingId ===
                            request._id ||
                          !isPending
                        }
                        className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {loadingId ===
                        request._id
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
      {!loadingList &&
        requests.length === 0 && (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-16 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
              <svg
                className="h-6 w-6 text-gray-400"
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

            <p className="mt-1 text-sm text-gray-500">
              There are no vendor requests
              matching this filter.
            </p>
          </div>
        )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <button
            type="button"
            onClick={goToPreviousPage}
            disabled={
              page <= 1 || loadingList
            }
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            ← Previous
          </button>

          <div className="text-sm text-gray-500">
            Page{" "}
            <span className="font-semibold text-gray-900">
              {page}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-gray-900">
              {totalPages}
            </span>
          </div>

          <button
            type="button"
            onClick={goToNextPage}
            disabled={
              page >= totalPages ||
              loadingList
            }
            className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}