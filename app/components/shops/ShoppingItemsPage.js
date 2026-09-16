"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import ShoppingItemCard from "./ShoppingItemCard";
import {
  getShoppingCategoryLabel,
  SHOPPING_PRODUCT_CATEGORIES,
} from "../../lib/shoppingCategories";

const PAGE_SIZE = 24;

export default function ShoppingItemsPage() {
  const searchParams = useSearchParams();
  const selectedCategory = searchParams.get("category")?.trim() || "";
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);

  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const [hasNextPage, setHasNextPage] = useState(false);
  const [error, setError] = useState("");

  const fetchItems = useCallback(async (targetPage = 1, append = false) => {
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

      if (selectedCategory) {
        params.set("category", selectedCategory);
      }

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
  }, [selectedCategory]);

  useEffect(() => {
    void fetchItems(1, false);
  }, [fetchItems]);

  const handleLoadMore = () => {
    if (isLoadingMore || !hasNextPage) {
      return;
    }

    void fetchItems(page + 1, true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-6 md:py-8">
        <section className="mb-8">
          <nav
            aria-label="Product categories"
            className="max-w-full overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            <div className="flex w-max min-w-full gap-2 whitespace-nowrap md:flex-wrap">
              <CategoryLink href="/shops" active={!selectedCategory}>
                All
              </CategoryLink>
              {SHOPPING_PRODUCT_CATEGORIES.map((category) => (
                <CategoryLink
                  key={category.value}
                  href={`/shops?category=${encodeURIComponent(category.value)}`}
                  active={selectedCategory === category.value}
                >
                  {category.emoji ? `${category.emoji} ` : ""}
                  {category.label}
                </CategoryLink>
              ))}
            </div>
          </nav>
        </section>

        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-orange-500">Products</p>
            <h2 className="text-xl font-semibold text-gray-900">
              {selectedCategory
                ? getShoppingCategoryLabel(selectedCategory)
                : "All shopping products"}
            </h2>
          </div>
        </div>

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
          <div className="rounded-xl border border-dashed border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
            <p>
              {selectedCategory
                ? "No products found in this category."
                : "No shopping products are available yet."}
            </p>
            {selectedCategory ? (
              <Link
                href="/shops"
                scroll={false}
                className="mt-4 inline-flex rounded-lg bg-orange-500 px-4 py-2 font-medium text-white transition-colors hover:bg-orange-600"
              >
                View all products
              </Link>
            ) : null}
          </div>
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

function CategoryLink({ href, active, children }) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={active ? "page" : undefined}
      className={`rounded-full border px-4 py-2.5 text-sm font-medium transition-colors ${
        active
          ? "border-orange-500 bg-orange-500 text-white shadow-sm"
          : "border-gray-200 bg-white text-gray-700 hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600"
      }`}
    >
      {children}
    </Link>
  );
}
