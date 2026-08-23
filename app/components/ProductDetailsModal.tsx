"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useCart } from "../context/CartContext";
import { SHOPPING_PRODUCT_CATEGORIES } from "../lib/shoppingCategories";
import ProductReviews from "./reviews/ProductReview";

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

  const match = SHOPPING_PRODUCT_CATEGORIES.find(
    (item) => item.value === category
  );

  return match?.label || category;
}

export default function ProductDetailsModal({
  product,
  onClose,
}: Props) {
  const useCartCompat = useCart as unknown as () => {
    addToCart: (item: unknown) => void;
  };

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

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
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
        className="
          relative
          w-full
          max-w-5xl
          max-h-[92vh]
          overflow-y-auto
          rounded-2xl
          bg-white
          shadow-2xl
        "
        onClick={(event) => event.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="
            sticky
            top-3
            float-right
            mr-3
            mt-3
            z-20
            flex
            h-9
            w-9
            items-center
            justify-center
            rounded-full
            bg-white
            text-xl
            text-gray-700
            shadow-md
          "
          aria-label="Close product details"
        >
          ×
        </button>

        {/* Product Detail */}
        <div className="clear-both flex flex-col md:flex-row">
          {/* Product Image */}
          <div className="relative min-h-[260px] w-full bg-gray-100 md:w-[45%] md:min-h-[420px]">
            <Image
              src={product.image || "/images/placeholder.png"}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 100vw, 45vw"
              className="object-cover"
            />
          </div>

          {/* Product Information */}
          <div className="flex w-full flex-col justify-between p-5 md:w-[55%] md:p-8">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                {product.name}
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                {product.shopName || "MN Mart Shop"}
              </p>

              {product.category && (
                <span className="mt-3 inline-flex rounded-full bg-orange-50 px-2.5 py-1 text-xs font-medium text-orange-600">
                  {getCategoryLabel(product.category)}
                </span>
              )}

              <p className="mt-4 text-sm leading-6 text-gray-700">
                {product.description ||
                  "No description provided for this product yet."}
              </p>

              <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm font-medium text-gray-500">
                  Price
                </p>

                <p className="mt-1 text-2xl font-bold text-orange-600">
                  {Number(product.price || 0).toLocaleString()} MMK
                </p>
              </div>
            </div>

            {/* Quantity + Add to Cart */}
            <div className="mt-6 space-y-3">
              <label className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700">
                <span>Quantity</span>

                <span className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setQuantity((current) => Math.max(current - 1, 1))}
                    className="flex h-8 w-8 items-center justify-center rounded border border-gray-300 text-lg leading-none text-gray-700 hover:bg-gray-100"
                    aria-label="Decrease quantity"
                  >
                    -
                  </button>

                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(event) =>
                      setQuantity(
                        Math.max(
                          Number(event.target.value) || 1,
                          1
                        )
                      )
                    }
                    className="w-16 rounded border border-gray-300 px-2 py-1 text-center"
                  />

                  <button
                    type="button"
                    onClick={() => setQuantity((current) => current + 1)}
                    className="flex h-8 w-8 items-center justify-center rounded border border-gray-300 text-lg leading-none text-gray-700 hover:bg-gray-100"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </span>
              </label>

              <button
                type="button"
                onClick={handleAddToCart}
                className="
                  flex
                  w-full
                  items-center
                  justify-center
                  rounded-lg
                  bg-orange-500
                  px-4
                  py-3
                  text-sm
                  font-semibold
                  text-white
                  transition
                  hover:bg-orange-600
                "
              >
                Add to cart
              </button>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-100" />

        {/* Reviews */}
        <div className="px-5 pb-8 md:px-8">
          <ProductReviews productId={product._id} />
        </div>
      </div>
    </div>
  );
}