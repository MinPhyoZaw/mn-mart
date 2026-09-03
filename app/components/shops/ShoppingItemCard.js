"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import AddToCartButton from "../AddToCartButton";
import ProductDetailsModal from "../ProductDetailsModal";
import { normalizeWholesaleTiers } from "../../lib/pricing";
import { SHOPPING_PRODUCT_CATEGORIES } from "../../lib/shoppingCategories";

function getCategoryLabel(category) {
  if (!category) return "";

  const match = SHOPPING_PRODUCT_CATEGORIES.find((item) => item.value === category);

  return match?.label || category;
}

export default function ShoppingItemCard({ item }) {
  const numericPrice = typeof item.price === "number" ? item.price : Number(item.price) || 0;
  const retailPrice = Number(item.retailPrice ?? numericPrice) || 0;
  const wholesaleTiers = useMemo(
    () => normalizeWholesaleTiers(item.wholesaleTiers ?? item.extra?.wholesaleTiers ?? []),
    [item.wholesaleTiers, item.extra?.wholesaleTiers]
  );
  const [selectedWholesaleQty, setSelectedWholesaleQty] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const selectedWholesaleTier = wholesaleTiers.find((tier) => tier.minQty === selectedWholesaleQty) || null;

  const handleOpenDetails = () => {
    setSelectedProduct({
      _id: item._id,
      name: item.name,
      description: item.description,
      price: numericPrice,
      image: item.image,
      shopName: item.shop?.name || "MN Mart Shop",
      shopId: item.shop?._id,
      vendorId: item.vendor?._id || item.shop?.vendorId,
      retailPrice,
      wholesaleTiers,
      category: item.category,
    });
  };

  return (
    <>
      <article className="group min-w-0">
        <button
          type="button"
          onClick={handleOpenDetails}
          className="relative block aspect-[1/1] w-full overflow-hidden rounded-xl bg-gray-100"
        >
          {item.image ? (
            <Image
              src={item.image}
              alt={item.name}
              fill
              sizes="(min-width:1280px) 20vw, (min-width:1024px) 20vw, (min-width:768px) 33vw, 50vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : null}
        </button>

        <div className="pt-2">
          <button type="button" onClick={handleOpenDetails} className="text-left">
            <h3 className="line-clamp-2 min-h-[38px] text-xs font-medium leading-[19px] text-gray-800 transition-colors hover:text-orange-600 md:text-sm">
              {item.name}
            </h3>
          </button>

          <p className="mt-1 truncate text-[10px] text-gray-400 md:text-xs">
            {item.shop?.name || "MN Mart Shop"}
          </p>

          <p className="mt-1 line-clamp-2 min-h-[30px] text-[10px] leading-[15px] text-gray-500 md:text-xs">
            {item.description || "No description provided."}
          </p>

          <div className="mt-1.5 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <span className="mr-1 text-[10px] font-semibold text-orange-600">MMK</span>
              <span className="text-base font-bold text-orange-600 md:text-lg">
                {Number(numericPrice || 0).toLocaleString()}
              </span>
              <p className="mt-0.5 text-[10px] text-gray-500 md:text-xs">
                Retail: {retailPrice.toLocaleString()} MMK
              </p>
            </div>

            {item.category ? (
              <span className="max-w-[45%] truncate rounded bg-orange-50 px-1.5 py-0.5 text-[9px] text-orange-600">
                {getCategoryLabel(item.category)}
              </span>
            ) : null}
          </div>

          <button
            type="button"
            onClick={handleOpenDetails}
            className="mt-2 flex h-8 w-full items-center justify-center rounded-lg bg-orange-500 text-[11px] font-medium text-white transition-colors hover:bg-orange-600 md:text-xs"
          >
            See Details
          </button>
        </div>

        {wholesaleTiers.length ? (
          <div className="mt-3 space-y-1 rounded-lg border border-orange-100 bg-orange-50/70 p-2 text-[11px] text-orange-700">
            {wholesaleTiers.map((tier) => (
              <label key={tier.minQty} className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedWholesaleQty === tier.minQty}
                  onChange={(e) => setSelectedWholesaleQty(e.target.checked ? tier.minQty : null)}
                  className="h-4 w-4 accent-orange-600"
                />
                <span>Wholesale: {tier.minQty}+ - {Number(tier.price).toLocaleString()} MMK</span>
              </label>
            ))}
          </div>
        ) : null}

        {/* <div className="mt-3">
          <AddToCartButton
            product={{
              _id: item._id,
              name: item.name,
              price: numericPrice,
              retailPrice,
              wholesaleTiers,
              selectedWholesaleTier,
              image: item.image,
              shopId: item.shop?._id,
              shopName: item.shop?.name,
              vendorId: item.vendor?._id || item.shop?.vendorId,
            }}
          />
        </div> */}
      </article>

      <ProductDetailsModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />
    </>
  );
}
