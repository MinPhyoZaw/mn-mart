"use client";

import React, { useMemo, useRef, useState } from "react";
import Image from "next/image";
import AddToCartButton from "./AddToCartButton";
import { normalizeWholesaleTiers } from "../lib/pricing";

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
  wholesaleTiers?: { minQty: number; price: number }[];
};

function CarouselProductCard({ product }: { product: ProductType }) {
  const [selectedWholesaleQty, setSelectedWholesaleQty] = useState<number | null>(null);

  const wholesaleTiers = useMemo(
    () => normalizeWholesaleTiers(product.wholesaleTiers || []),
    [product.wholesaleTiers]
  );

  const selectedWholesaleTier =
    wholesaleTiers.find((tier) => tier.minQty === selectedWholesaleQty) || null;

  return (
    <div className="w-[160px] md:w-[200px] snap-start rounded-xl bg-white shadow-sm hover:shadow-md transition p-3 group flex flex-col h-[340px] md:h-[390px]">
      
      <div className="relative w-full h-[120px] md:h-[150px] mb-3">
        <Image
          src={product.image || "/images/placeholder.png"}
          alt={product.name}
          fill
          className="object-cover rounded-lg group-hover:scale-105 transition"
        />
      </div>

      <h3 className="text-xs md:text-sm font-medium text-gray-800 line-clamp-2 min-h-[36px]">
        {product.name}
      </h3>

      <p className="text-[10px] text-red-400 mt-1 line-clamp-1">
        {product.shopName}
      </p>

      <p className="mt-2 text-sm md:text-base text-gray-500">
        {Number(product.price || 0).toLocaleString()} MMK
      </p>

      {/* Wholesale Section Fixed Height */}
      <div className="mt-2 h-8">
        {wholesaleTiers.length ? (
          <div className="space-y-0.5 rounded-lg border border-green-100 bg-green-50/70 p-1.5 text-[9px] text-green-800 h-full overflow-auto">
            {wholesaleTiers.map((tier) => (
              <label
                key={tier.minQty}
                className="flex cursor-pointer items-center gap-1"
              >
                <input
                  type="checkbox"
                  checked={selectedWholesaleQty === tier.minQty}
                  onChange={(e) =>
                    setSelectedWholesaleQty(
                      e.target.checked ? tier.minQty : null
                    )
                  }
                 className="h-3 w-3 accent-green-600"
                />

                <span>
                  လက်ကားဈေး : {tier.minQty} -{" "}
                  {Number(tier.price).toLocaleString()} MMK
                </span>
              </label>
            ))}
          </div>
        ) : null}
      </div>

      {/* Button always aligned */}
      <div className="mt-auto pt-3">
        <AddToCartButton
          product={{ ...product, selectedWholesaleTier }}
        />
      </div>
    </div>
  );
}

export default function ProductCarouselClient({
  products,
  heading,
}: {
  products: ProductType[];
  heading?: string;
}) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  const getAmount = () =>
    typeof window !== "undefined" && window.innerWidth > 768
      ? 240
      : 180;

  const scrollLeft = () => {
    scrollerRef.current?.scrollBy({
      left: -getAmount(),
      behavior: "smooth",
    });
  };

  const scrollRight = () => {
    scrollerRef.current?.scrollBy({
      left: getAmount(),
      behavior: "smooth",
    });
  };

  return (
    <section className="py-8 w-[92%] md:w-[90%] mx-auto relative">
      {heading && (
        <h2 className="text-lg md:text-2xl font-semibold mb-5 text-gray-800">
          {heading}
        </h2>
      )}

      <div className="relative">
        <button
          onClick={scrollLeft}
          aria-label="Scroll left"
          className="absolute left-1 top-1/2 -translate-y-1/2 z-10 bg-white border rounded-full p-2 shadow-md"
        >
          &lt;
        </button>

        <div
  ref={scrollerRef}
  className="overflow-x-auto hide-scrollbar pb-2 px-10 md:px-12"
>
          <div className="flex gap-4 min-w-max snap-x snap-mandatory">
            {products.map((product) => (
              <CarouselProductCard
                key={product._id}
                product={product}
              />
            ))}
          </div>
        </div>

        <button
          onClick={scrollRight}
          aria-label="Scroll right"
          className="absolute right-1 top-1/2 -translate-y-1/2 z-10 bg-white border rounded-full p-2 shadow-md"
        >
          &gt;
        </button>
      </div>
    </section>
  );
}