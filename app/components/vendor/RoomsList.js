"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

const PAGE_SIZE = 24;

export default function RoomsList({ shop, refreshToken = 0 }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [showAvailable, setShowAvailable] = useState(true);
  const [showNotAvailable, setShowNotAvailable] = useState(false);

  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  const loadRooms = async (targetPage = 1) => {
    if (!shop?._id) return;

    setLoading(true);
    setMessage("");

    try {
      const params = new URLSearchParams({
        shopId: String(shop._id),
        type: "room",
        page: String(targetPage),
        limit: String(PAGE_SIZE),
      });

      const res = await fetch(`/api/items?${params.toString()}`, {
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setItems([]);
        setPagination(null);
        setMessage(data?.message || "Failed to load rooms");
        return;
      }

      setItems(data.data || []);
      setPagination(data.pagination || null);
      setPage(targetPage);
    } catch (err) {
      console.error("Failed to load rooms:", err);

      setItems([]);
      setPagination(null);
      setMessage("Failed to load rooms");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!shop?._id) return;

    setPage(1);
    void loadRooms(1);
  }, [shop?._id, refreshToken]);

  const filteredItems = items.filter((item) => {
    if (item.isAvailable) {
      return showAvailable;
    }

    return showNotAvailable;
  });

  const toggleAvailability = async (itemId, current) => {
    try {
      const res = await fetch(`/api/items/${itemId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isAvailable: !current,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setMessage(data?.message || "Failed to update");
        return;
      }

      setItems((prev) =>
        prev.map((item) =>
          String(item._id) === String(itemId)
            ? {
                ...item,
                isAvailable: data.data.isAvailable,
              }
            : item
        )
      );

      setMessage("");
    } catch (err) {
      console.error("Failed to update room availability:", err);
      setMessage("Server error");
    }
  };

  const goToPreviousPage = () => {
    if (
      loading ||
      !pagination?.hasPreviousPage
    ) {
      return;
    }

    void loadRooms(page - 1);
  };

  const goToNextPage = () => {
    if (
      loading ||
      !pagination?.hasNextPage
    ) {
      return;
    }

    void loadRooms(page + 1);
  };

  if (loading) {
    return (
      <div className="p-4">
        Loading rooms...
      </div>
    );
  }

  return (
    <div className="mb-6">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">
            Your Rooms
          </h2>

          {pagination ? (
            <p className="mt-1 text-xs text-gray-500">
              {pagination.total}{" "}
              room{pagination.total === 1 ? "" : "s"}
            </p>
          ) : null}
        </div>
      </div>

      {message ? (
        <p className="mb-2 text-sm text-red-500">
          {message}
        </p>
      ) : null}

      <div className="mb-4 flex flex-wrap gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showAvailable}
            onChange={(e) =>
              setShowAvailable(e.target.checked)
            }
          />

          <span>Available</span>
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showNotAvailable}
            onChange={(e) =>
              setShowNotAvailable(e.target.checked)
            }
          />

          <span>Not Available</span>
        </label>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-gray-500">
          No rooms created yet.
        </p>
      ) : filteredItems.length === 0 ? (
        <p className="text-sm text-gray-500">
          No rooms match selected availability filter.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredItems.map((item) => (
              <div
                key={item._id}
                className="rounded-lg border bg-white p-3 shadow-sm"
              >
                <div className="relative h-40 overflow-hidden rounded-md bg-gray-100">
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  ) : null}
                </div>

                <div className="mt-3">
                  <h3 className="text-lg font-semibold">
                    {item.name}
                  </h3>

                  <p className="text-sm text-gray-600">
                    {Number(
                      item.price || 0
                    ).toLocaleString()}{" "}
                    MMK
                  </p>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={Boolean(item.isAvailable)}
                      onChange={() =>
                        toggleAvailability(
                          item._id,
                          item.isAvailable
                        )
                      }
                    />

                    <span className="text-sm">
                      Available
                    </span>
                  </label>

                  <span className="text-sm text-gray-500">
                    {new Date(
                      item.createdAt
                    ).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {pagination && pagination.totalPages > 1 ? (
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={goToPreviousPage}
                disabled={
                  loading ||
                  !pagination.hasPreviousPage
                }
                className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>

              <span className="text-sm text-gray-600">
                Page {pagination.page} of{" "}
                {pagination.totalPages}
              </span>

              <button
                type="button"
                onClick={goToNextPage}
                disabled={
                  loading ||
                  !pagination.hasNextPage
                }
                className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}