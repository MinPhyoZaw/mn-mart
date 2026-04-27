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
  const sanitizedPhone = shop?.phone ? String(shop.phone).replace(/[^\d+]/g, "") : "";

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
  const isTransportation = shop?.category === "transportation";
  const isSpa = shop?.category === "spa";
  const supportsCart = shop?.category === "shopping";

  const getAmenityList = (item) => {
    const amenities = item?.extra?.amenities || {};
    return Object.entries(amenities)
      .filter(([, enabled]) => Boolean(enabled))
      .map(([key]) => AMENITY_META[key] || { label: key });
  };

  const sectionTitle = isHotel
    ? "Available Room"
    : isSpa
      ? "Available Service"
      : isTransportation
        ? "Available Routes"
        : "Available Products";

  const formatDateTime = (value) => {
    if (!value) return { date: "-", time: "-" };
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return { date: "-", time: "-" };
    return {
      date: parsed.toLocaleDateString(),
      time: parsed.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
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
            <div className="mt-1 flex items-center gap-3">
              <p className="font-medium text-gray-800 break-all">{shop.phone || "N/A"}</p>
              {sanitizedPhone ? (
                <a
                  href={`tel:${sanitizedPhone}`}
                  className="inline-flex items-center gap-2 rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700"
                >
                  📞 Call Now
                </a>
              ) : null}
            </div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-xs uppercase tracking-wide text-gray-500">Address</p>
            <p className="mt-1 font-medium text-gray-800 break-words">{shop.address || "N/A"}</p>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-3">{sectionTitle}</h2>

          {items?.length ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((item) => {
                const amenityList = getAmenityList(item);
                const routeDateTime = isTransportation ? formatDateTime(item?.extra?.startDateTime) : null;
                return (
                  <div
                    key={item._id}
                    className={`overflow-hidden h-full flex flex-col ${
                      isRoom(item)
                        ? "border bg-white rounded-xl shadow-sm"
                        : "w-full max-w-[250px] mx-auto rounded-2xl border border-gray-200 bg-white shadow-[0_1px_6px_rgba(0,0,0,0.08)] hover:shadow-[0_6px_18px_rgba(0,0,0,0.12)] transition-shadow"
                    }`}
                  >
                    <div
                      className={`relative w-full bg-white ${
                        isRoom(item) ? "h-40" : "h-36 border-b border-gray-200"
                      }`}
                    >
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          sizes="(max-width: 1024px) 50vw, 33vw"
                          className={isRoom(item) ? "object-cover" : "object-contain p-3"}
                        />
                      ) : null}
                    </div>

                    <div className={`flex flex-col flex-1 ${isRoom(item) ? "p-3" : "p-3.5"}`}>
                      <h3
                        className={`leading-tight break-words ${
                          isRoom(item) ? "font-semibold" : "mt-2 text-sm font-semibold min-h-[36px]"
                        }`}
                      >
                        {isTransportation
                          ? `${item?.extra?.routeFrom || "-"} ↔ ${item?.extra?.routeTo || "-"}`
                          : item.name}
                      </h3>

                      {isRoom(item) && (
                        <p className="mt-1 text-sm text-gray-600">
                          <span className="font-medium">Room Type :</span>{" "}
                          <span className="break-words">{item?.extra?.roomType || item.name}</span>
                        </p>
                      )}

                      {isTransportation && (
                        <div className="mt-2 space-y-1 text-sm text-gray-700">
                          <p>
                            <span className="font-medium">Date:</span> {routeDateTime?.date}
                          </p>
                          <p>
                            <span className="font-medium">Time:</span> {routeDateTime?.time}
                          </p>
                        </div>
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

                      <p
                        className={`text-sm text-gray-500 break-words ${
                          isRoom(item) ? "mt-2 line-clamp-2" : isTransportation ? "mt-2 line-clamp-2" : "mt-1"
                        }`}
                      >
                        {item.description || ""}
                      </p>

                      <div className="mt-3 flex items-center justify-between gap-2 mt-auto">
                        {!isTransportation && (
                          <span className={`${isRoom(item) ? "font-semibold text-yellow-600" : "text-base font-bold text-gray-900"}`}>
                            {Number(item.price || 0).toLocaleString()} MMK
                          </span>
                        )}
                        {!supportsCart ? (
                          <a
                            href={sanitizedPhone ? `tel:${sanitizedPhone}` : "#"}
                            className="text-xs sm:text-sm px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-md whitespace-nowrap"
                          >
                            Call to book
                          </a>
                        ) : (
                          <button
                            onClick={() => handleAddToCart(item)}
                            className="text-xs sm:text-sm px-3 py-1.5 border border-[#318616] text-[#318616] bg-[#f7fff2] hover:bg-[#ecf9e2] rounded-md font-semibold whitespace-nowrap"
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
              {isHotel ? "No rooms available yet." : isTransportation ? "No routes available yet." : "No items yet."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
