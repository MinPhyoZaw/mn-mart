"use client";

import Image from "next/image";
import { CalendarClock, MapPin, PhoneCall, Users } from "lucide-react";
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
    addToCart(item);
    openCart();
  };

  const isRoom = (item) => item.type === "room";
  const isHotel = shop?.category === "hotel";
  const isTransportation = shop?.category === "transportation";

  const getAmenityList = (item) => {
    const amenities = item?.extra?.amenities || {};
    return Object.entries(amenities)
      .filter(([, enabled]) => Boolean(enabled))
      .map(([key]) => AMENITY_META[key] || { label: key });
  };

  const renderTransportationCard = (item) => {
    const routeFrom = item?.extra?.from || item?.extra?.start || "Pickup";
    const routeTo = item?.extra?.to || item?.extra?.destination || "Destination";
    const dateText = item?.extra?.date || item?.extra?.tripDate || "Date on request";
    const startTime = item?.extra?.startTime || item?.extra?.time || "Time on request";
    const passengerText = item?.extra?.passengers || item?.extra?.capacity || "1";
    const distanceText = item?.extra?.distance || "Distance on request";
    const durationText = item?.extra?.duration || "Duration on request";
    const currency = item?.extra?.currency || "MMK";

    return (
      <article
        key={item._id}
        className="overflow-hidden rounded-2xl border-2 border-gray-100 bg-white shadow-sm"
      >
        <div className="relative h-52 w-full overflow-hidden sm:h-64">
          {item.image ? (
            <Image
              src={item.image}
              alt={item.name}
              fill
              sizes="100vw"
              className="object-cover"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-r from-slate-700 via-slate-500 to-slate-400" />
          )}

          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/70" />

          <div className="absolute inset-x-0 top-0 p-4 sm:p-6">
            <h3 className="text-2xl font-extrabold text-white drop-shadow sm:text-3xl">{item.name}</h3>
          </div>

          <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6">
            <p className="text-lg font-semibold text-white sm:text-2xl">{item?.extra?.carName || item.name}</p>
            <p className="mt-1 text-sm text-gray-100 sm:text-base">
              {item.description || "Comfortable transportation service"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 p-4 sm:p-6 md:grid-cols-[1.5fr_1fr] md:gap-6">
          <div className="space-y-4 md:pr-6 md:border-r md:border-gray-200">
            <div className="flex gap-3">
              <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-blue-900" />
              <div>
                <p className="text-xl font-semibold text-gray-900">Trip Info</p>
                <p className="text-base text-gray-700">
                  Route: <span className="font-semibold">{routeFrom} → {routeTo}</span>
                </p>
                <p className="text-base text-gray-700">
                  Distance: {distanceText} | Duration: {durationText}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <CalendarClock className="mt-0.5 h-5 w-5 shrink-0 text-blue-900" />
              <div>
                <p className="text-xl font-semibold text-gray-900">Date & Time</p>
                <p className="text-base text-gray-700">Date: <span className="font-semibold">{dateText}</span></p>
                <p className="text-base text-gray-700">Start Time: <span className="font-semibold">{startTime}</span></p>
              </div>
            </div>

            <div className="flex gap-3">
              <Users className="mt-0.5 h-5 w-5 shrink-0 text-blue-900" />
              <div>
                <p className="text-xl font-semibold text-gray-900">Passengers</p>
                <p className="text-base text-gray-700">No. of passengers: {passengerText}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-end gap-3">
            <p className="text-3xl font-extrabold leading-tight text-green-600 sm:text-4xl">
              {currency} {Number(item.price).toLocaleString()}
              <span className="text-xl font-semibold text-green-700"> / person</span>
            </p>

            {shop.phone ? (
              <a
                href={`tel:${shop.phone}`}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-800 sm:text-base"
              >
                <PhoneCall className="h-5 w-5" />
                CALL TO BOOK: {shop.phone}
              </a>
            ) : (
              <button
                onClick={() => handleAddToCart(item)}
                className="inline-flex w-full items-center justify-center rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-green-700 sm:text-base"
              >
                Add to cart
              </button>
            )}
          </div>
        </div>
      </article>
    );
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
            isTransportation ? (
              <div className="space-y-5">
                {items.map((item) => renderTransportationCard(item))}
              </div>
            ) : (
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
            )
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
