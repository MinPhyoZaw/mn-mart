"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useCart } from "../context/CartContext";
import { SHOPPING_PRODUCT_CATEGORIES } from "../lib/shoppingCategories";

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

type Props = {
  product: ProductType | null;
  onClose: () => void;
};

function getCategoryLabel(category?: string) {
  if (!category) return "";

  const match = SHOPPING_PRODUCT_CATEGORIES.find((item) => item.value === category);
  return match?.label || category;
}

export default function ProductDetailsModal({ product, onClose }: Props) {
  const useCartCompat = useCart as unknown as () => { addToCart: (item: unknown) => void };
  const addToCart = useCartCompat().addToCart;
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (!product) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [product, onClose]);

  if (!product) return null;

  const handleAddToCart = () => {
    addToCart({
      _id: product._id,
      name: product.name,
      price: product.price,
      image: product.image || null,
      retailPrice: product.retailPrice ?? product.price,
      wholesaleTiers: product.wholesaleTiers || [],
      selectedWholesaleTier: null,
      quantity: Math.max(Number(quantity) || 1, 1),
      shopId: product.shopId || "",
      shopName: product.shopName || "",
      vendorId: product.vendorId || product.shopId || "",
      vendorName: "",
    });

    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-xl text-gray-700 shadow-sm"
          aria-label="Close product details"
        >
          ×
        </button>

        <div className="flex flex-col md:flex-row">
          <div className="relative min-h-[260px] w-full bg-gray-100 md:w-[45%] md:min-h-[420px]">
            <Image
              src={product.image || "/images/placeholder.png"}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 100vw, 45vw"
              className="object-cover"
            />
          </div>

          <div className="flex w-full flex-col justify-between p-5 md:w-[55%] md:p-8">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">{product.name}</h3>
              <p className="mt-2 text-sm text-gray-500">
                {product.shopName || "MN Mart Shop"}
              </p>

              {product.category ? (
                <span className="mt-3 inline-flex rounded-full bg-orange-50 px-2.5 py-1 text-xs font-medium text-orange-600">
                  {getCategoryLabel(product.category)}
                </span>
              ) : null}

              <p className="mt-4 text-sm leading-6 text-gray-700">
                {product.description || "No description provided for this product yet."}
              </p>

              <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm font-medium text-gray-500">Price</p>
                <p className="mt-1 text-2xl font-bold text-orange-600">
                  {Number(product.price || 0).toLocaleString()} MMK
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <label className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700">
                <span>Quantity</span>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(event) => setQuantity(Math.max(Number(event.target.value) || 1, 1))}
                  className="w-20 rounded border border-gray-300 px-2 py-1 text-right"
                />
              </label>

              <button
                type="button"
                onClick={handleAddToCart}
                className="flex w-full items-center justify-center rounded-lg bg-orange-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-orange-600"
              >
                Add to cart
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
