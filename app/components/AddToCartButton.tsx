"use client";

import React from "react";
import { useCart } from "../context/CartContext";

type WholesaleTier = { minQty: number; price: number };

type ProductForCart = {
  _id: string;
  name: string;
  price: number;
  retailPrice?: number;
  wholesaleTiers?: WholesaleTier[];
  selectedWholesaleTier?: WholesaleTier | null;
  image?: string;
  shopId?: string;
  shopName?: string;
  vendorId?: string;
};

type CartProduct = Omit<ProductForCart, "image"> & {
  image: string | null;
  quantity: number;
  vendorName: string;
};

type CartContextValue = {
  addToCart: (item: CartProduct) => void;
  openCart: () => void;
};

type Props = {
  product: ProductForCart;
};

export default function AddToCartButton({ product }: Props) {
  const { addToCart, openCart } = useCart() as CartContextValue;

  const handle = () => {
    const selectedWholesaleTier = product.selectedWholesaleTier || null;

    addToCart({
      _id: product._id,
      name: product.name,
      price: selectedWholesaleTier?.price ?? product.price,
      image: product.image || null,
      retailPrice: product.retailPrice ?? product.price,
      wholesaleTiers: product.wholesaleTiers || [],
      selectedWholesaleTier,
      quantity: selectedWholesaleTier?.minQty || 1,
      shopId: product.shopId || "",
      shopName: product.shopName || "",
      vendorId: product.vendorId || product.shopId || "",
      vendorName: "",
    });
    openCart();
  };

  return (
    <button
      onClick={handle}
      className="mt-3 w-full text-sm bg-[#f7fff2] border border-[#318616] text-[#318616] px-3 py-1.5 rounded-md font-semibold hover:bg-[#ecf9e2]"
      aria-label={`Add ${product.name} to cart`}
    >
      Add to cart
    </button>
  );
}
