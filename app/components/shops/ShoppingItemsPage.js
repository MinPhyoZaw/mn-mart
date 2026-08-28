"use client";

import { useEffect, useState } from "react";
import ShopsHero from "./ShopsHero";
import ShoppingItemCard from "./ShoppingItemCard";

const PAGE_SIZE = 24;

export default function ShoppingItemsPage({ title, heroImage }) {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);

  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const [hasNextPage, setHasNextPage] = useState(false);
  const [error, setError] = useState("");

  const fetchItems = async (targetPage = 1, append = false) => {
    if (append) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
    }

    setError("");

    try {
      const params = new URLSearchParams({
        shopCategory: "shopping",
        type: "product",
        page: String(targetPage),
        limit: String(PAGE_SIZE),
      });

      const res = await fetch(`/api/items?${params.toString()}`, {
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(
          data?.message || "Failed to fetch shopping items"
        );
      }

      const newItems = data.data || [];

      /*
       * Keep the existing randomized display behavior.
       * This randomizes products inside the fetched page.
       */
      const randomizedItems = [...newItems].sort(
        () => Math.random() - 0.5
      );

      if (append) {
        setItems((previousItems) => {
          /*
           * Protect against accidental duplicates.
           */
          const existingIds = new Set(
            previousItems.map((item) => String(item._id))
          );

          const uniqueNewItems = randomizedItems.filter(
            (item) => !existingIds.has(String(item._id))
          );

          return [...previousItems, ...uniqueNewItems];
        });
      } else {
        setItems(randomizedItems);
      }

      setPage(targetPage);
      setHasNextPage(
        Boolean(data.pagination?.hasNextPage)
      );
    } catch (error) {
      console.error(
        "Failed to fetch shopping items:",
        error
      );

      setError(
        error?.message || "Failed to load shopping items"
      );

      if (!append) {
        setItems([]);
      }
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    void fetchItems(1, false);
  }, []);

  const handleLoadMore = () => {
    if (isLoadingMore || !hasNextPage) {
      return;
    }

    void fetchItems(page + 1, true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <ShopsHero
        title={title}
        heroImage={heroImage}
      />

      <div className="mx-auto max-w-7xl px-4 py-10">
        {error ? (
          <div className="mb-6 rounded-lg border border-red-100 bg-red-50 p-3 text-center text-sm text-red-600">
            {error}
          </div>
        ) : null}

        {isLoading ? (
          <p className="text-center text-gray-500">
            Loading shopping items...
          </p>
        ) : items.length === 0 ? (
          <p className="text-center text-gray-500">
            No shopping items available
          </p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-x-2.5 gap-y-6 sm:grid-cols-3 md:grid-cols-4 md:gap-x-3 md:gap-y-7 lg:grid-cols-6">
              {items.map((item) => (
                <ShoppingItemCard
                  key={item._id}
                  item={item}
                />
              ))}
            </div>

            {hasNextPage ? (
              <div className="mt-10 flex justify-center">
                <button
                  type="button"
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  className="rounded-lg border border-gray-200 bg-white px-6 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isLoadingMore
                    ? "Loading..."
                    : "Load More"}
                </button>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}