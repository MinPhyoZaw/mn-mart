"use client";

import React, { useRef } from "react";
import Image from "next/image";
import AddToCartButton from "./AddToCartButton";

type ProductType = {
  _id: string;
  name: string;
  description?: string;
  price: number;
  image?: string;
  shopName?: string;
  shopId?: string;
  vendorId?: string;
};

export default function ProductCarouselClient({ products, heading }: { products: ProductType[]; heading?: string }) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  const getAmount = () => (typeof window !== "undefined" && window.innerWidth > 768 ? 240 : 180);

  const scrollLeft = () => {
    scrollerRef.current?.scrollBy({ left: -getAmount(), behavior: "smooth" });
  };

  const scrollRight = () => {
    scrollerRef.current?.scrollBy({ left: getAmount(), behavior: "smooth" });
  };

  return (
    <section className="py-8 w-[92%] md:w-[90%] mx-auto relative">
      {heading && <h2 className="text-lg md:text-2xl font-semibold mb-5 text-gray-800">{heading}</h2>}

      <div className="relative">
        <button
          onClick={scrollLeft}
          aria-label="Scroll left"
          className="absolute left-1 top-1/2 -translate-y-1/2 z-10 bg-white border rounded-full p-2 shadow-md"
        >
          &lt;
        </button>

        <div ref={scrollerRef} className="overflow-x-auto hide-scrollbar pb-2">
          <div className="flex gap-4 min-w-max snap-x snap-mandatory">
            {products.map((product) => (
              <div
                key={product._id}
                className="w-[160px] md:w-[200px] snap-start rounded-xl bg-white shadow-sm hover:shadow-md transition p-3 group"
              >
                <div className="relative w-full h-[120px] md:h-[150px] mb-3">
                  <Image
                    src={product.image || "/images/placeholder.png"}
                    alt={product.name}
                    fill
                    className="object-cover rounded-lg group-hover:scale-105 transition"
                  />
                </div>

                <h3 className="text-xs md:text-sm font-medium text-gray-800 line-clamp-2">{product.name}</h3>

                <p className="text-[10px] text-red-400 mt-1">{product.shopName}</p>

                <p className="mt-2 text-sm md:text-base  text-gray-500">{Number(product.price || 0).toLocaleString()} MMK</p>

                <AddToCartButton product={product} />
              </div>
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
