"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

export default function CategoryShopsPage({
  category,
  title,
  heroImage,
  ctaLabel = "Book Now",
}) {
  const [shops, setShops] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

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

      <div className="max-w-6xl mx-auto px-4 py-10">
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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {shops.map((shop) => (
              <div
                key={shop._id}
                className="bg-white rounded-xl overflow-hidden border border-gray-200 hover:shadow-md transition"
              >
                <div className="relative w-full h-32 md:h-40 bg-gray-100">
                  {shop.image ? (
                    <Image
                      src={shop.image}
                      alt={shop.name}
                      fill
                      sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                      className="object-cover"
                    />
                  ) : null}
                </div>

                <div className="p-4">
                  <h2 className="font-semibold text-lg mb-1 line-clamp-1 font-['Raleway']">
                    {shop.name}
                  </h2>

                  <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                    {shop.description}
                  </p>

                  <Link
                    href={`/shops/${shop._id}`}
                    className="block text-center bg-green-600 text-white text-sm py-2 rounded-lg hover:bg-green-700 transition"
                  >
                    {ctaLabel}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
