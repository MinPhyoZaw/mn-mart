"use client";

import { useEffect, useState } from "react";
import { Edit3, Trash2 } from "lucide-react";

import { compressItemImageBlob } from "./ImageUtils";
import { uploadImageToSupabaseStorage } from "../../lib/supabase";

const PAGE_SIZE = 24;

export default function ManageProducts({
  shop,
  serviceType,
  setMessage,
  onUpdated,
}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  const loadItems = async (targetPage = 1) => {
    if (!shop?._id) return;

    setLoading(true);

    try {
      const res = await fetch(
        `/api/items?shopId=${shop._id}&page=${targetPage}&limit=${PAGE_SIZE}`,
        {
          cache: "no-store",
        }
      );

      const data = await res.json();

      if (!res.ok || !data.success) {
        setMessage?.(
          data?.message ||
            "Failed to load products"
        );
        return;
      }

      setItems(data.data || []);
      setPagination(data.pagination || null);
      setPage(targetPage);
    } catch (error) {
      console.error(
        "Failed to load products:",
        error
      );

      setMessage?.(
        "Failed to load products"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!shop?._id) return;

    setPage(1);
    void loadItems(1);
  }, [shop?._id]);

  const handleDelete = async (id) => {
    if (
      !confirm(
        "Delete this item? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const res = await fetch(
        `/api/items/${id}`,
        {
          method: "DELETE",
        }
      );

      const data = await res.json();

      if (!res.ok || !data.success) {
        setMessage?.(
          data?.message ||
            "Failed to delete"
        );
        return;
      }

      setMessage?.(
        "Deleted successfully."
      );

      /*
       * Reload the current page so pagination
       * totals remain accurate.
       *
       * If we deleted the last item on a page,
       * move back one page when possible.
       */
      const isLastItemOnPage =
        items.length === 1 &&
        page > 1;

      const nextPage =
        isLastItemOnPage
          ? page - 1
          : page;

      await loadItems(nextPage);

      onUpdated?.();
    } catch (error) {
      console.error(
        "Failed to delete item:",
        error
      );

      setMessage?.(
        "Server error while deleting item"
      );
    }
  };

  const openEdit = (item) => {
    setEditing({
      ...item,
    });
  };

  const handleImageUpload = async (e) => {
    const file =
      e.target.files?.[0];

    if (!file || !editing) {
      return;
    }

    setSaving(true);
    setMessage?.(
      "Uploading image..."
    );

    try {
      const compressed =
        await compressItemImageBlob(
          file
        );

      const url =
        await uploadImageToSupabaseStorage(
          compressed,
          {
            folder: `items/${
              shop?._id || "general"
            }`,
          }
        );

      setEditing((previous) => ({
        ...previous,
        image: url,
      }));

      setMessage?.(
        "Image uploaded."
      );
    } catch (error) {
      console.error(
        "Image upload failed:",
        error
      );

      setMessage?.(
        error?.message ||
          "Image upload failed"
      );
    } finally {
      setSaving(false);

      if (e.target) {
        e.target.value = "";
      }
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (!editing) {
      return;
    }

    setSaving(true);

    try {
      const payload = {
        name: editing.name,
        price: Number(
          editing.price || 0
        ),
        image: editing.image,
        category:
          editing.category,
        tagName:
          editing.tagName,
        isAvailable:
          Boolean(
            editing.isAvailable
          ),
        retailPrice:
          editing.retailPrice,
        extra:
          editing.extra,
      };

      const res = await fetch(
        `/api/items/${editing._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify(
            payload
          ),
        }
      );

      const data =
        await res.json();

      if (
        !res.ok ||
        !data.success
      ) {
        setMessage?.(
          data?.message ||
            "Failed to update"
        );
        return;
      }

      /*
       * Update the item locally.
       */
      setItems((previous) =>
        previous.map((item) =>
          String(item._id) ===
          String(data.data._id)
            ? data.data
            : item
        )
      );

      setMessage?.(
        "Updated successfully."
      );

      setEditing(null);

      onUpdated?.();
    } catch (error) {
      console.error(
        "Failed to update item:",
        error
      );

      setMessage?.(
        "Server error while updating item"
      );
    } finally {
      setSaving(false);
    }
  };

  const goToPreviousPage = () => {
    if (
      loading ||
      !pagination?.hasPreviousPage
    ) {
      return;
    }

    void loadItems(
      Math.max(page - 1, 1)
    );
  };

  const goToNextPage = () => {
    if (
      loading ||
      !pagination?.hasNextPage
    ) {
      return;
    }

    void loadItems(page + 1);
  };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">
            Manage Products
          </h3>

          {pagination ? (
            <p className="mt-1 text-xs text-gray-500">
              {pagination.total}{" "}
              item
              {pagination.total === 1
                ? ""
                : "s"}
            </p>
          ) : null}
        </div>
      </div>

      {loading ? (
        <div>
          Loading products...
        </div>
      ) : items.length === 0 ? (
        <div className="text-sm text-gray-500">
          No products yet.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {items.map(
              (item) => (
                <div
                  key={item._id}
                  className="flex flex-col rounded-lg border bg-white p-3 shadow-sm"
                >
                  <div className="mb-2 flex h-32 w-full items-center justify-center overflow-hidden rounded bg-gray-100">
                    {item.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={
                          item.image
                        }
                        alt={
                          item.name
                        }
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="text-gray-400">
                        No image
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="text-sm font-medium">
                      {
                        item.name
                      }
                    </div>

                    <div className="text-xs text-gray-500">
                      {item.category ||
                        item.type}
                    </div>

                    <div className="mt-2 font-semibold">
                      {item.price
                        ? `${Number(
                            item.price
                          ).toLocaleString()}`
                        : "-"}{" "}
                      ks
                    </div>
                  </div>

                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        openEdit(
                          item
                        )
                      }
                      className="flex flex-1 items-center justify-center gap-2 rounded-md border px-3 py-2"
                    >
                      <Edit3 className="h-4 w-4" />
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleDelete(
                          item._id
                        )
                      }
                      className="rounded-md border px-3 py-2 text-red-600"
                      aria-label={`Delete ${item.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )
            )}
          </div>

          {pagination &&
          pagination.totalPages >
            1 ? (
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={
                  goToPreviousPage
                }
                disabled={
                  loading ||
                  !pagination.hasPreviousPage
                }
                className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>

              <span className="text-sm text-gray-600">
                Page{" "}
                {pagination.page}{" "}
                of{" "}
                {pagination.totalPages}
              </span>

              <button
                type="button"
                onClick={
                  goToNextPage
                }
                disabled={
                  loading ||
                  !pagination.hasNextPage
                }
                className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          ) : null}
        </>
      )}

      {editing ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <form
            onSubmit={
              handleSave
            }
            className="w-11/12 max-w-lg rounded-lg bg-white p-5"
          >
            <h4 className="mb-3 font-semibold">
              Edit Product
            </h4>

            <input
              value={
                editing.name ||
                ""
              }
              onChange={(e) =>
                setEditing(
                  (
                    previous
                  ) => ({
                    ...previous,
                    name: e
                      .target
                      .value,
                  })
                )
              }
              className="mb-2 w-full rounded border px-3 py-2"
            />

            <input
              value={
                editing.price ||
                ""
              }
              onChange={(e) =>
                setEditing(
                  (
                    previous
                  ) => ({
                    ...previous,
                    price:
                      e.target
                        .value,
                  })
                )
              }
              type="number"
              className="mb-2 w-full rounded border px-3 py-2"
            />

            {serviceType ===
            "shopping" ? (
              <>
                <input
                  value={
                    editing.category ||
                    ""
                  }
                  onChange={(
                    e
                  ) =>
                    setEditing(
                      (
                        previous
                      ) => ({
                        ...previous,
                        category:
                          e
                            .target
                            .value,
                      })
                    )
                  }
                  className="mb-2 w-full rounded border px-3 py-2"
                />

                <input
                  value={
                    editing.tagName ||
                    ""
                  }
                  onChange={(
                    e
                  ) =>
                    setEditing(
                      (
                        previous
                      ) => ({
                        ...previous,
                        tagName:
                          e
                            .target
                            .value,
                      })
                    )
                  }
                  className="mb-2 w-full rounded border px-3 py-2"
                />
              </>
            ) : null}

            <label className="mb-1 block text-sm">
              Replace Image
            </label>

            <input
              type="file"
              accept="image/*"
              onChange={
                handleImageUpload
              }
              className="mb-3"
            />

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() =>
                  setEditing(
                    null
                  )
                }
                disabled={saving}
                className="rounded border px-3 py-2 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="rounded bg-green-600 px-3 py-2 text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving
                  ? "Saving..."
                  : "Save"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}