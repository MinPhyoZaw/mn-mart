"use client";

import Image from "next/image";
import { useCart } from "../context/CartContext";

export default function ShopDetailClient({ shop, items }) {
  const { addToCart, openCart } = useCart();

  const handleAddToCart = (item) => {
    addToCart(item);
    openCart();
  };

  const isRoom = (item) => item.type === "room";

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="relative w-full h-64 md:h-96 rounded-xl overflow-hidden shadow-lg">
        <Image
          src={shop.image || "/images/default-shop.png"}
          alt={shop.name}
          fill
          className="object-cover"
        />
      </div>

      <div className="mt-6">
        <h1 className="text-3xl font-bold text-yellow-600">{shop.name}</h1>

        <p className="text-gray-600 mt-2">{shop.description || "No description available"}</p>

        <div className="mt-4 space-y-2 text-sm text-gray-700">
          <p>
            <strong>Category:</strong> {shop.category}
          </p>
          <p>
            <strong>Phone:</strong> {shop.phone || "N/A"}
          </p>
          <p>
            <strong>Address:</strong> {shop.address || "N/A"}
          </p>
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-3">Menus</h2>

          {items?.length ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {items.map((item) => (
                <div key={item._id} className="border bg-white rounded-xl p-3 flex gap-3">
                  <div className="relative h-20 w-20 rounded-md overflow-hidden bg-gray-100 shrink-0">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    ) : null}
                  </div>

                  <div className="flex-1">
                    <h3 className="font-semibold leading-tight">{item.name}</h3>
                    {isRoom(item) && item.isAvailable && (
                      <p className="mt-1 flex items-center gap-2 text-sm text-green-600">
                        <span className="inline-block h-2.5 w-2.5 rounded-full bg-green-500" />
                        Available
                      </p>
                    )}
                    <p className="text-sm text-gray-500 line-clamp-2">{item.description || ""}</p>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span className="font-semibold text-yellow-600">${Number(item.price).toFixed(2)}</span>
                      <button
                        onClick={() => handleAddToCart(item)}
                        className="text-sm px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-md"
                      >
                        Add to cart
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-gray-100 p-4 rounded-lg text-gray-500">No menu items yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}
