"use client";

import Link from "next/link";
import { CheckCircle } from "lucide-react";

export default function PromoBanner() {
  return (
    <div className="w-full flex justify-center mt-8">
      <div className="relative w-[95%] lg:w-[90%] h-[260px] sm:h-[320px] md:h-[380px] lg:h-[420px] rounded-2xl overflow-hidden shadow-xl">
        
        {/* Background */}
        <div
          className="absolute inset-0 bg-cover bg-center md:bg-right"
          style={{ backgroundImage: "url('/images/mn-banner.png')" }}
        />

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />

        {/* Content */}
        <div className="relative h-full flex items-center px-6 md:px-16">
          <div className="max-w-md text-left text-white">
            
            {/* MN Mart with Check Icon */}
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="text-green-400 w-6 h-6" />
              <span className="text-xl font-bold">MN Mart</span>
            </div>

            {/* Main Title */}
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 font-['Raleway']">
              Discover Local Vendors
            </h2>

            {/* Description */}
            <p className="text-sm sm:text-base mb-5 text-white/90">
              Support local businesses and explore amazing shops near you.
            </p>

            {/* Button */}
            <Link
              href="/shops"
              className="inline-block bg-green-500 hover:bg-green-600 transition px-5 py-2.5 rounded-lg font-semibold shadow-md text-sm sm:text-base"
            >
              Explore Now
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}