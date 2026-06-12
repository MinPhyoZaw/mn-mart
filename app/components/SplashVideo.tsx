"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export default function SplashScreen() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const closeSplash = () => {
      document.body.style.overflow = previousOverflow;
      setVisible(false);
    };

    const timer = setTimeout(closeSplash, 2500);

    return () => {
      clearTimeout(timer);
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-white">
      {/* Skip Button */}
      <button
        onClick={() => setVisible(false)}
        className="absolute top-5 right-5 px-4 py-2 text-sm text-gray-600 rounded-full bg-white/50 backdrop-blur-sm border border-gray-200"
      >
        Skip
      </button>

      <div className="flex h-full items-center justify-center px-6">
        <div className="flex flex-col items-center">
          <Image
            src="/images/sp-image.png"
            alt="MN-Mart Logo"
            width={200}
            height={200}
            priority
            className="object-contain"
          />

          <h1 className="-mt-2 text-4xl md:text-5xl font-bold text-gray-900">
            MN-Mart
          </h1>

          <p className="mt-1 text-center text-base md:text-lg text-gray-500">
            All in One Marketplace
          </p>
        </div>
      </div>
    </div>
  );
}