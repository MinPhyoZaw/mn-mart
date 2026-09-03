"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import ProductDetailsModal from "../components/ProductDetailsModal";
import { SHOPPING_PRODUCT_CATEGORIES } from "../lib/shoppingCategories";
import { getDisplayRetailPrice, normalizeDescription } from "../lib/productDisplay";

type Shop = {
  name?: string;
};

type Product = {
  _id: string;
  name: string;
  price: number;
  image?: string;
  category?: string;
  shopName?: string;
  shop?: Shop;
  description?: string;
  retailPrice?: number;
  type?: string;
  tagName?: string;
  stock?: number;
};

type ProductsApiResponse = {
  success?: boolean;
  data?: Product[];
};

function getCategoryLabel(category?: string) {
  if (!category || category === "guess-you-like") {
    return "Guess you like";
  }

  const match = SHOPPING_PRODUCT_CATEGORIES.find(
    (item) => item.value === category
  );

  return match?.label || category;
}

export default function ShoppingCategoryContent() {
  const searchParams = useSearchParams();

  const category =
    searchParams.get("category") || "guess-you-like";

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] =
    useState<Product | null>(null);

  useEffect(() => {
    let active = true;

    const loadProducts = async () => {
      setLoading(true);

      try {
        const endpoint = `/api/items/category?category=${encodeURIComponent(
          category
        )}&limit=18`;

        const res = await fetch(endpoint, {
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error(
            `Failed to fetch products: ${res.status}`
          );
        }

        const data: ProductsApiResponse = await res.json();

        if (active && data.success) {
          const normalizedProducts = (data.data || []).map(
            (product) => ({
              ...product,
              price: Number(product.price || 0),
              retailPrice:
                product.retailPrice === undefined || product.retailPrice === null
                  ? undefined
                  : Number(product.retailPrice),
            })
          );

          setProducts(normalizedProducts);
        }
      } catch (error) {
        console.error(
          "Failed to load category products",
          error
        );

        if (active) {
          setProducts([]);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadProducts();

    return () => {
      active = false;
    };
  }, [category]);

  const pageTitle = useMemo(
    () => getCategoryLabel(category),
    [category]
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto w-[92%] max-w-7xl py-8 md:w-[90%] md:py-10">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-orange-500">
              Shopping
            </p>

            <h1 className="text-2xl font-semibold text-gray-900 md:text-3xl">
              {pageTitle}
            </h1>

            <p className="mt-2 text-sm text-gray-600">
              Showing the latest products from all shops in
              this category.
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
          <div className="grid grid-cols-2 gap-x-2.5 gap-y-6 sm:grid-cols-3 md:grid-cols-4 md:gap-x-3 md:gap-y-7 lg:grid-cols-6">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} onOpenDetails={setSelectedProduct} />
            ))}
          </div>
        )}
      </div>

      <ProductDetailsModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />
    </div>
  );
}

function ProductCard({ product, onOpenDetails }: { product: Product; onOpenDetails: (product: Product) => void }) {
  const description = normalizeDescription(product.description);
  const retailPrice = getDisplayRetailPrice(product.retailPrice, product.price);

  return (
    <article className="group min-w-0">
      <button
                  type="button"
                  onClick={() =>
                    onOpenDetails(product)
                  }
                  className="relative block aspect-square w-full overflow-hidden rounded-xl bg-gray-100"
                >
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
                      No image
                    </div>
                  )}
                </button>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() =>
                    onOpenDetails(product)
                    }
                    className="text-left"
                  >
                    <h3 className="line-clamp-2 min-h-[38px] text-xs font-medium leading-[19px] text-gray-800 transition-colors hover:text-orange-600 md:text-sm">
                      {product.name}
                    </h3>
                  </button>

                  <p className="mt-1 truncate text-[10px] text-gray-400 md:text-xs">
                    {product.shopName ||
                      product.shop?.name ||
                      "MN Mart Shop"}
                  </p>

                  {description ? (
                    <p className="mt-1 line-clamp-2 text-[10px] leading-[15px] text-gray-500 md:text-xs">
                      {description}
                    </p>
                  ) : null}

                  <div className="mt-1.5 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <span className="mr-1 text-[10px] font-semibold text-orange-600">
                        MMK
                      </span>

                      <span className="text-base font-bold text-orange-600 md:text-lg">
                        {product.price.toLocaleString()}
                      </span>
                      {retailPrice !== null ? (
                        <p className="mt-0.5 text-[10px] text-gray-500 line-through md:text-xs">
                          Retail Price: {retailPrice.toLocaleString()} MMK
                        </p>
                      ) : null}
                    </div>

                    {product.category ? (
                      <span className="max-w-[45%] truncate rounded bg-orange-50 px-1.5 py-0.5 text-[9px] text-orange-600">
                        {getCategoryLabel(
                          product.category
                        )}
                      </span>
                    ) : null}
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      onOpenDetails(product)
                    }
                    className="mt-2 flex h-8 w-full items-center justify-center rounded-lg bg-orange-500 text-[11px] font-medium text-white transition-colors hover:bg-orange-600 md:text-xs"
                  >
                    See Details
                  </button>
                </div>
    </article>
  );
}
