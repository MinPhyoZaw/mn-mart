"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

// Transportation tags removed from listing — details handled on shop page

export default function CategoryShopsPage({
  category,
  title,
  heroImage,
  ctaLabel = "Book Now",
}) {
  const [shops, setShops] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const isTransportation = category === "transportation";

  const gridClasses = isTransportation
    ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6"
    : "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6";

  useEffect(() => {
    const fetchShops = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/shops?category=${encodeURIComponent(category)}`);
        const data = await res.json();
        setShops(data.data || []);
      } catch (error) {
        console.error(`Failed to fetch ${category} shops:`, error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchShops();
  }, [category]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div
        className="relative h-64 md:h-80 bg-cover bg-center"
        style={{ backgroundImage: `url('${heroImage}')` }}
      >
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
          <h1 className="text-white text-3xl md:text-5xl font-bold tracking-wide">
            {title}
          </h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-10">
        {isLoading ? (
          <p className="text-center text-gray-500">
            {category === "shopping"
              ? "Loading the shops..."
              : category === "transportation"
              ? "Loading the routes..."
              : category === "spa"
              ? "Loading spa services..."
              : "Loading rooms..."}
          </p>
        ) : shops.length === 0 ? (
          <p className="text-center text-gray-500">No {title.toLowerCase()} available</p>
        ) : (
          <div className={gridClasses}>
            {shops.map((shop) => (
              <div
                key={shop._id}
                className="bg-white rounded-xl overflow-hidden border border-gray-200 hover:shadow-lg transition max-w-full mx-auto w-full"
              >
                {isTransportation ? (
                  <>
                    <div className="relative w-full h-56 md:h-52 bg-gray-100">
                      {shop.image ? (
                        <Image
                          src={shop.image}
                          alt={shop.name}
                          fill
                          sizes="(min-width:1280px) 20vw, (max-width:768px) 100vw"
                          className="object-cover"
                        />
                      ) : null}
                    </div>

                    <div className="p-4 md:p-5">
                      <h2 className="font-semibold text-base md:text-lg mb-3 line-clamp-2 min-h-[3rem]">
                        {shop.name}
                      </h2>
                      <Link
                        href={`/shops/${shop._id}`}
                        className="inline-block w-full text-center bg-green-600 text-white text-sm md:text-base py-2.5 rounded-lg hover:bg-green-700 transition"
                      >
                        See more
                      </Link>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col md:flex-row">
                    <div className="relative w-full md:w-40 h-40 md:h-auto flex-shrink-0 bg-gray-100">
                      {shop.image ? (
                        <Image
                          src={shop.image}
                          alt={shop.name}
                          fill
                          sizes="(max-width: 768px) 100vw, 240px"
                          className="object-cover"
                        />
                      ) : null}
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <h2 className="font-semibold text-lg mb-1 line-clamp-1 font-['Raleway']">
                          {shop.name}
                        </h2>

                        <p className="text-sm text-gray-600 line-clamp-2 mb-3">{shop.description}</p>
                      </div>

                      <div className="mt-4 flex items-center justify-between gap-3">
                        <Link
                          href={`/shops/${shop._id}`}
                          className="inline-flex items-center justify-center px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition"
                        >
                          {ctaLabel}
                        </Link>

                        <div className="text-xs text-gray-500">
                          {category === 'transportation' ? (
                            shop.extra?.startDateTime ? new Date(shop.extra.startDateTime).toLocaleString() : ''
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
