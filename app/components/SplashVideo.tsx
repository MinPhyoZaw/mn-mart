"use client";

import { useEffect, useState } from "react";

export default function SplashScreen() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    document.body.style.overflow = "hidden";

    const timer = setTimeout(() => {
      setVisible(false);
    }, 2500);

    return () => {
      clearTimeout(timer);
      document.body.style.overflow = "";
    };
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[9999] overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-600 via-green-700 to-red-600" />

      {/* Large Top Circle */}
      <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-lime-400/30 blur-sm" />

      {/* Large Bottom Circle */}
      <div className="absolute -bottom-60 -right-60 w-[800px] h-[800px] rounded-full bg-red-500/40 blur-sm" />

      {/* Floating Blur */}
      <div className="absolute top-1/3 left-1/4 w-48 h-48 rounded-full bg-white/10 blur-3xl animate-pulse" />

      {/* Content */}
      <div className="relative flex flex-col items-center justify-center h-full text-white px-6">

  
        <div className="animate-[fadeIn_1s_ease-out] text-center">
          
          <h1 className="text-6xl md:text-7xl font-extrabold tracking-tight">
            MN-Mart
          </h1>

          <p className="mt-4 text-xl md:text-2xl font-light text-white/90">
            Your All in One Marketplace
          </p>

          {/* Loading dots */}
          <div className="flex justify-center gap-2 mt-10">
            <span className="w-3 h-3 bg-white rounded-full animate-bounce" />
            <span className="w-3 h-3 bg-white rounded-full animate-bounce [animation-delay:0.15s]" />
            <span className="w-3 h-3 bg-white rounded-full animate-bounce [animation-delay:0.3s]" />
          </div>
        </div>
      </div>
    </div>
  );
}