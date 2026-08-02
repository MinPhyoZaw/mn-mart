"use client";

import { useEffect, useState } from "react";
import ProductCarouselClient from "./ProductCarouselClient";
import { SHOPPING_PRODUCT_CATEGORIES } from "../lib/shoppingCategories";

export default function ShoppingCategoryShowcase() {
  const [selectedCategory, setSelectedCategory] = useState("guess-you-like");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;

    const loadProducts = async () => {
      setLoading(true);
      try {
        const endpoint = selectedCategory === "guess-you-like"
          ? "/api/items?type=product&limit=12"
          : `/api/items?type=product&category=${encodeURIComponent(selectedCategory)}&limit=8`;

        const res = await fetch(endpoint, {
          cache: "no-store",
        });
        const data = await res.json();

        if (active && data.success) {
          const items = data.data || [];
          const shuffled = [...items].sort(() => Math.random() - 0.5);
          setProducts(shuffled.slice(0, 12));
        }
      } catch (error) {
        console.error("Failed to load shopping products", error);
        if (active) setProducts([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadProducts();

    return () => {
      active = false;
    };
  }, [selectedCategory]);

  const selectedLabel = selectedCategory === "guess-you-like"
    ? "Guess you like"
    : SHOPPING_PRODUCT_CATEGORIES.find((item) => item.value === selectedCategory)?.label || "Category";

  return (
    <section className="w-[92%] md:w-[90%] mx-auto py-4 md:py-6">
      {/* <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg md:text-xl font-semibold text-gray-800">Shop by Category</h2>
          <p className="text-sm text-gray-500">Swipe through products for your favorite shopping category.</p>
        </div>
      </div> */}

      <div className="mb-4 flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
        <button
          type="button"
          onClick={() => setSelectedCategory("guess-you-like")}
          className={`whitespace-nowrap rounded-full border px-3 py-2 text-sm transition ${
            selectedCategory === "guess-you-like"
              ? "border-emerald-600 bg-emerald-600 text-white"
              : "border-gray-200 bg-white text-gray-700 hover:border-emerald-400"
          }`}
        >
          ♥ Guess you like
        </button>

        {SHOPPING_PRODUCT_CATEGORIES.map((category) => (
          <button
            key={category.value}
            type="button"
            onClick={() => setSelectedCategory(category.value)}
            className={`whitespace-nowrap rounded-full border px-3 py-2 text-sm transition ${
              selectedCategory === category.value
                ? "border-emerald-600 bg-emerald-600 text-white"
                : "border-gray-200 bg-white text-gray-700 hover:border-emerald-400"
            }`}
          >
            {category.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-500">
          Loading products...
        </div>
      ) : products.length ? (
        <ProductCarouselClient products={products} heading={selectedLabel} category={selectedCategory} />
      ) : (
        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
          No products available for {selectedLabel} yet.
        </div>
      )}
    </section>
  );
}
