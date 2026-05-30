"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import AddToCartButton from "../AddToCartButton";
import { normalizeWholesaleTiers } from "../../lib/pricing";

export default function ShoppingItemCard({ item }) {
  const numericPrice = typeof item.price === "number" ? item.price : Number(item.price) || 0;
  const retailPrice = Number(item.retailPrice ?? numericPrice) || 0;
  const formattedPrice = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(numericPrice);
  const wholesaleTiers = useMemo(
    () => normalizeWholesaleTiers(item.wholesaleTiers ?? item.extra?.wholesaleTiers ?? []),
    [item.wholesaleTiers, item.extra?.wholesaleTiers]
  );
  const [selectedWholesaleQty, setSelectedWholesaleQty] = useState(null);
  const selectedWholesaleTier = wholesaleTiers.find((tier) => tier.minQty === selectedWholesaleQty) || null;

  return (
    <div className="h-full bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition duration-200">
      <div className="relative w-full h-40 bg-gray-100">
        {item.image ? (
          <Image
            src={item.image}
            alt={item.name}
            fill
            sizes="(min-width:1280px) 20vw, (min-width:1024px) 20vw, (min-width:768px) 33vw, 50vw"
            className="object-cover"
          />
        ) : null}
      </div>

      <div className="p-4 flex flex-col h-[calc(100%-10rem)]">
        <h3 className="font-semibold text-sm md:text-base text-gray-900 line-clamp-2 min-h-[2.5rem]">{item.name}</h3>

        <Link
          href={`/shops/${item.shop?._id}`}
          className="mt-1 text-xs md:text-sm text-green-700 hover:text-green-800 hover:underline line-clamp-1"
        >
          {item.shop?.name || "Unknown shop"}
        </Link>

        <p className="mt-2 text-sm md:text-base font-bold text-gray-900">{formattedPrice}</p>

        {wholesaleTiers.length ? (
          <div className="mt-2 space-y-1 rounded-lg border border-green-100 bg-green-50/70 p-2 text-xs text-green-800">
            {wholesaleTiers.map((tier) => (
              <label key={tier.minQty} className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedWholesaleQty === tier.minQty}
                  onChange={(e) => setSelectedWholesaleQty(e.target.checked ? tier.minQty : null)}
                  className="h-4 w-4 accent-green-600"
                />
                <span>လက်ကားဈေး : {tier.minQty} - {Number(tier.price).toLocaleString()} MMK</span>
              </label>
            ))}
          </div>
        ) : null}

        <div className="mt-auto">
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
        </div>
      </div>
    </div>
  );
}
