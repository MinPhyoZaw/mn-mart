"use client";

import { useEffect, useState } from "react";
import NavBar from "../components/NavBar";
import Link from "next/link";

export default function ShopsPage() {
  const [shops, setShops] = useState([]);

  useEffect(() => {
    const fetchShops = async () => {
      try {
        const res = await fetch("/api/getShops");
        const data = await res.json();
        setShops(data.shops);
      } catch (error) {
        console.error("Failed to fetch shops:", error);
      }
    };

    fetchShops();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      

      {/* HERO SECTION */}
      <div
        className="relative h-64 md:h-80 bg-cover bg-center"
        style={{
          backgroundImage:
            "url('/images/kachin62dfcc5.webp')", // put image in public folder
        }}
      >
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
          <h1 className="text-white text-3xl md:text-5xl font-bold tracking-wide">
            Shops
          </h1>
        </div>
      </div>

      {/* SHOPS GRID */}
      <div className="max-w-6xl mx-auto px-4 py-10">
        {shops.length === 0 ? (
          <p className="text-center text-gray-500">No shops available</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {shops.map((shop) => (
              <div
                key={shop._id}
                className="bg-white rounded-xl overflow-hidden border border-gray-200 hover:shadow-md transition"
              >
                {/* Shop Image */}
                <img
                  src={shop.image}
                  alt={shop.name}
                  className="w-full h-32 md:h-40 object-cover"
                />

                {/* Shop Info */}
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
                    Shop Now
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