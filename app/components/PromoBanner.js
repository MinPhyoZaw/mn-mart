"use client";

import { CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function PromoBanner() {
  const router = useRouter();

  const handleBecomeVendor = async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      const data = await res.json();
      if (data?.user) {
        router.push("/vendorForm");
        return;
      }
    } catch {
      // If auth check fails, safely continue to signup flow.
    }

    router.push("/signup?vendor=true");
  };

  return (
    <div className="w-full flex justify-center mt-8">
      <div className="relative w-[95%] lg:w-[90%] h-[260px] sm:h-[320px] md:h-[380px] lg:h-[420px] rounded-2xl overflow-hidden shadow-xl">
        
        {/* Background */}
        <div
  className="absolute inset-0 bg-cover bg-right md:bg-center"
  style={{ backgroundImage: "url('/images/mn-banner.png')" }}
/>

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />

        {/* Content */}
        <div className="relative h-full flex items-center px-6 md:px-16">
          <div className="max-w-md text-left text-white">
            
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="text-green-400 w-8 h-8" />
              <span className="text-3xl font-bold">MN Mart</span>
            </div>

            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 font-['Raleway']">
              Discover Local Vendors
            </h2>

            <p className="text-sm sm:text-base mb-5 text-white/90">
             Grow your business with MN-Mart and reach more local customers.
            </p>

            {/* Button */}
            <button
              onClick={handleBecomeVendor}
              className="inline-block bg-green-500 hover:bg-green-600 transition px-5 py-2.5 rounded-lg font-semibold shadow-md text-sm sm:text-base"
            >
              Become a Vendor
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
