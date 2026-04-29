"use client";

import { useEffect, useState } from "react";

const ads = [
  {
    title: "Beauty & Cosmetics",
    desc: "Discover premium skincare and beauty products.",
    image: "/images/ad1.webp",
    button: "Shop Now",
  },
  {
    title: "Travel Deals",
    desc: "Book your next adventure with the best prices.",
    image: "/images/travel.jpg",
    button: "Explore",
  },
  {
    title: "Luxury Hotels",
    desc: "Find and book the best hotels for your stay.",
    image: "/images/hotel.jpg",
    button: "Book Now",
  },
];

export default function Advertisement() {
  const [index, setIndex] = useState(0);

  // Auto slide
  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % ads.length);
    }, 6000); // change every 4s

    return () => clearInterval(interval);
  }, []);

  const current = ads[index];

  return (
    <div className="w-full flex justify-center mt-8">
      <div className="relative w-[95%] lg:w-[90%] h-[220px] sm:h-[280px] md:h-[340px] lg:h-[380px] rounded-2xl overflow-hidden shadow-lg">

        {/* Background */}
        <div
          className="absolute inset-0 bg-cover bg-center transition-all duration-700"
          style={{ backgroundImage: `url(${current.image})` }}
        />

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r  to-transparent" />

        {/* Content */}
        <div className="relative h-full flex items-center px-6 md:px-16 text-white">
          <div className="max-w-md">

            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 text-black">
              {current.title}
            </h2>

            <p className="text-sm sm:text-base mb-4 text-grey">
              {current.desc}
            </p>

            <button className="bg-green-500 hover:bg-green-600 px-5 py-2 rounded-lg text-sm font-semibold transition">
              {current.button}
            </button>

          </div>
        </div>

        {/* Indicators */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
          {ads.map((_, i) => (
            <div
              key={i}
              className={`h-2 w-2 rounded-full ${
                i === index ? "bg-white" : "bg-white/50"
              }`}
            />
          ))}
        </div>

      </div>
    </div>
  );
}