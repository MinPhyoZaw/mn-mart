"use client";

import Image from "next/image";
import { useCart } from "../context/CartContext";

const AMENITY_META = {
  wifi: { label: "WiFi" },
  swimmingPool: { label: "Swimming Pool" },
  aircon: { label: "Aircon" },
  breakfast: { label: "Breakfast" },
  extraBed: { label: "Extra Bed" },
};

export default function ShopDetailClient({ shop, items }) {
  const { addToCart, openCart } = useCart();

  const handleAddToCart = (item) => {
    addToCart({
      ...item,
      shopId: shop?._id,
      shopName: shop?.name,
      vendorId: shop?.vendorId,
      vendorName: shop?.vendorName,
    });
    openCart();
  };

  const isRoom = (item) => item.type === "room";
  const isHotel = shop?.category === "hotel";

  const getAmenityList = (item) => {
    const amenities = item?.extra?.amenities || {};
    return Object.entries(amenities)
      .filter(([, enabled]) => Boolean(enabled))
      .map(([key]) => AMENITY_META[key] || { label: key });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-5 sm:p-6">
      <div className="relative w-full h-64 md:h-96 rounded-xl overflow-hidden shadow-lg">
        <Image
          src={shop.image || "/images/default-shop.png"}
          alt={shop.name}
          fill
          className="object-cover"
        />
      </div>

      <div className="mt-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-yellow-600 break-words">{shop.name}</h1>

        <p className="text-gray-600 mt-2 break-words">{shop.description || "No description available"}</p>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-xs uppercase tracking-wide text-gray-500">Phone</p>
            <p className="mt-1 font-medium text-gray-800 break-all">{shop.phone || "N/A"}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-xs uppercase tracking-wide text-gray-500">Address</p>
            <p className="mt-1 font-medium text-gray-800 break-words">{shop.address || "N/A"}</p>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-3">{isHotel ? "Available Room" : "Available Items"}</h2>

          {items?.length ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((item) => {
                const amenityList = getAmenityList(item);
                return (
                  <div
                    key={item._id}
                    className="border bg-white rounded-xl overflow-hidden shadow-sm h-full flex flex-col"
                  >
                    <div className="relative w-full h-40 bg-gray-100">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          sizes="(max-width: 1024px) 50vw, 33vw"
                          className="object-cover"
                        />
                      ) : null}
                    </div>

                    <div className="p-3 flex flex-col flex-1">
                      <h3 className="font-semibold leading-tight break-words">{item.name}</h3>

                      {isRoom(item) && (
                        <p className="mt-1 text-sm text-gray-600">
                          <span className="font-medium">Room Type :</span>{" "}
                          <span className="break-words">{item?.extra?.roomType || item.name}</span>
                        </p>
                      )}

                      {isRoom(item) && item.isAvailable && (
                        <p className="mt-1 flex items-center gap-2 text-sm text-green-600">
                          <span className="inline-block h-2.5 w-2.5 rounded-full bg-green-500" />
                          Available
                        </p>
                      )}

                      {isRoom(item) && (
                        <div className="mt-3 min-h-[86px]">
                          <p className="text-sm font-semibold text-gray-700">Amenities</p>
                          {amenityList.length ? (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {amenityList.map((amenity) => (
                                <span
                                  key={amenity.label}
                                  className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700 break-words"
                                >
                                  <span>✅</span>
                                  <span>{amenity.label}</span>
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="mt-1 text-sm text-gray-500">No amenities listed.</p>
                          )}
                        </div>
                      )}

                      <p className="mt-2 text-sm text-gray-500 line-clamp-2 break-words">
                        {item.description || ""}
                      </p>

                      <div className="mt-3 flex items-center justify-between gap-2 mt-auto">
                        <span className="font-semibold text-yellow-600">${Number(item.price).toFixed(2)}</span>
                        {isHotel ? (
                          <a
                            href={shop.phone ? `tel:${shop.phone}` : "#"}
                            className="text-xs sm:text-sm px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-md whitespace-nowrap"
                          >
                            Call for booking
                          </a>
                        ) : (
                          <button
                            onClick={() => handleAddToCart(item)}
                            className="text-xs sm:text-sm px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-md whitespace-nowrap"
                          >
                            Add to cart
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-gray-100 p-4 rounded-lg text-gray-500">
              {isHotel ? "No rooms available yet." : "No items yet."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
