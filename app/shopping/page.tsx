"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import ProductDetailsModal from "../components/ProductDetailsModal";
import { SHOPPING_PRODUCT_CATEGORIES } from "../lib/shoppingCategories";

function getCategoryLabel(category?: string) {
  if (!category || category === "guess-you-like") return "Guess you like";
  const match = SHOPPING_PRODUCT_CATEGORIES.find((item) => item.value === category);
  return match?.label || category;
}

export default function ShoppingCategoryPage() {
  const searchParams = useSearchParams();
  const category = searchParams.get("category") || "guess-you-like";
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);

  useEffect(() => {
    let active = true;

    const loadProducts = async () => {
      setLoading(true);
      try {
        const endpoint = `/api/items/category?category=${encodeURIComponent(category)}&limit=18`;
        const res = await fetch(endpoint, { cache: "no-store" });
        const data = await res.json();

        if (active && data?.success) {
          setProducts(data.data || []);
        }
      } catch (error) {
        console.error("Failed to load category products", error);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadProducts();
    return () => {
      active = false;
    };
  }, [category]);

  const pageTitle = useMemo(() => getCategoryLabel(category), [category]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto w-[92%] max-w-7xl py-8 md:w-[90%] md:py-10">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-orange-500">Shopping</p>
            <h1 className="text-2xl font-semibold text-gray-900 md:text-3xl">{pageTitle}</h1>
            <p className="mt-2 text-sm text-gray-600">
              Showing the latest products from all shops in this category.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="rounded-xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
            Loading products...
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
            No products available for this category yet.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-2.5 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 md:gap-x-3 md:gap-y-7">
            {products.map((product) => (
              <article key={product._id} className="group min-w-0">
                <button
                  type="button"
                  onClick={() => setSelectedProduct(product)}
                  className="relative block aspect-[1/1] w-full overflow-hidden rounded-xl bg-gray-100"
                >
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : null}
                </button>

                <div className="pt-2">
                  <button type="button" onClick={() => setSelectedProduct(product)} className="text-left">
                    <h3 className="line-clamp-2 min-h-[38px] text-xs font-medium leading-[19px] text-gray-800 transition-colors hover:text-orange-600 md:text-sm">
                      {product.name}
                    </h3>
                  </button>

                  <p className="mt-1 truncate text-[10px] text-gray-400 md:text-xs">
                    {product.shopName || product.shop?.name || "MN Mart Shop"}
                  </p>

                  <div className="mt-1.5 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <span className="mr-1 text-[10px] font-semibold text-orange-600">MMK</span>
                      <span className="text-base font-bold text-orange-600 md:text-lg">
                        {Number(product.price || 0).toLocaleString()}
                      </span>
                    </div>

                    {product.category ? (
                      <span className="max-w-[45%] truncate rounded bg-orange-50 px-1.5 py-0.5 text-[9px] text-orange-600">
                        {getCategoryLabel(product.category)}
                      </span>
                    ) : null}
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedProduct(product)}
                    className="mt-2 flex h-8 w-full items-center justify-center rounded-lg bg-orange-500 text-[11px] font-medium text-white transition-colors hover:bg-orange-600 md:text-xs"
                  >
                    See Details
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <ProductDetailsModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
    </div>
  );
}
