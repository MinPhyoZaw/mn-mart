"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import ProductDetailsModal from "./ProductDetailsModal";
import { SHOPPING_PRODUCT_CATEGORIES } from "../lib/shoppingCategories";
import { getDisplayRetailPrice, normalizeDescription } from "../lib/productDisplay";

type ProductType = {
  _id: string;
  name: string;
  description?: string;
  price: number;
  image?: string;
  shopName?: string;
  shopId?: string;
  vendorId?: string;
  retailPrice?: number;
  wholesaleTiers?: {
    minQty: number;
    price: number;
  }[];
  category?: string;
};

function getCategoryLabel(category?: string) {
  if (!category) return "";

  const match = SHOPPING_PRODUCT_CATEGORIES.find(
    (item) => item.value === category
  );

  return match?.label || category;
}

function ProductCard({
  product,
  onOpenDetails,
}: {
  product: ProductType;
  onOpenDetails: (product: ProductType) => void;
}) {
  const description = normalizeDescription(product.description);
  const retailPrice = getDisplayRetailPrice(product.retailPrice, product.price);
  return (
    <article className="group min-w-0">
      <button
        type="button"
        onClick={() => onOpenDetails(product)}
        className="relative block aspect-[1/1] w-full overflow-hidden rounded-xl bg-gray-100"
      >
        <Image
          src={product.image || "/images/placeholder.png"}
          alt={product.name}
          fill
          sizes="
            (max-width: 639px) 50vw,
            (max-width: 1023px) 33vw,
            16vw
          "
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </button>

      <div className="pt-2">
        <button
          type="button"
          onClick={() => onOpenDetails(product)}
          className="text-left"
        >
          <h3 className="line-clamp-2 min-h-[38px] text-xs font-medium leading-[19px] text-gray-800 transition-colors hover:text-orange-600 md:text-sm">
            {product.name}
          </h3>
        </button>

        <p className="mt-1 truncate text-[10px] text-gray-400 md:text-xs">
          {product.shopName || "MN Mart Shop"}
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
              {Number(product.price || 0).toLocaleString()}
            </span>
            {retailPrice !== null ? (
              <p className="mt-0.5 text-[10px] text-gray-500 line-through md:text-xs">
                Retail Price: {retailPrice.toLocaleString()} MMK
              </p>
            ) : null}
          </div>

          {product.category ? (
            <span className="max-w-[45%] truncate rounded bg-orange-50 px-1.5 py-0.5 text-[9px] text-orange-600">
              {getCategoryLabel(product.category)}
            </span>
          ) : null}
        </div>

        <button
          type="button"
          onClick={() => onOpenDetails(product)}
          className="mt-2 flex h-8 w-full items-center justify-center rounded-lg bg-orange-500 text-[11px] font-medium text-white transition-colors hover:bg-orange-600 md:text-xs"
        >
          See Details
        </button>
      </div>
    </article>
  );
}

export default function ProductCarouselClient({
  products,
  heading,
  category,
}: {
  products: ProductType[];
  heading?: string;
  category?: string;
}) {
  const [selectedProduct, setSelectedProduct] = useState<ProductType | null>(null);

  if (!products.length) return null;

  const openDetails = (product: ProductType) => {
    setSelectedProduct(product);
  };

  return (
    <>
      <section className="mx-auto w-[96%] py-5 md:w-[90%] md:py-8">
        {heading ? (
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800 md:text-2xl">
              {heading}
            </h2>

            <Link
              href={`/shopping?category=${encodeURIComponent(category || "guess-you-like")}`}
              className="text-xs font-medium text-orange-600 hover:underline md:text-sm"
            >
              View all
            </Link>
          </div>
        ) : null}

        <div
          className="
            grid
            grid-cols-2
            gap-x-2.5
            gap-y-6
            sm:grid-cols-3
            md:grid-cols-4
            lg:grid-cols-6
            md:gap-x-3
            md:gap-y-7
          "
        >
          {products.map((product) => (
            <ProductCard
              key={product._id}
              product={product}
              onOpenDetails={() => openDetails(product)}
            />
          ))}
        </div>
      </section>

      <ProductDetailsModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />
    </>
  );
}
