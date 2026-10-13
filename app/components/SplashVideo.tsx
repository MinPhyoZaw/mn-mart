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

  const handleSkip = () => {
    document.body.style.overflow = "";
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="splash-screen fixed inset-0 z-[9999] bg-white overflow-hidden">
      {/* Background Gradient Orbs */}
      {/* Premium Gray Orbs */}
      <div className="splash-screen__orb absolute -top-40 left-0 h-[450px] w-[450px] rounded-full bg-gray-400 blur-[120px] opacity-25" />

      <div className="splash-screen__orb absolute top-1/2 -right-20 h-[350px] w-[350px] rounded-full bg-slate-400 blur-[120px] opacity-20" />

      <div className="splash-screen__orb absolute -bottom-20 left-1/3 h-[300px] w-[300px] rounded-full bg-zinc-300 blur-[100px] opacity-20" />

      {/* Skip Button */}
      <button
        onClick={handleSkip}
        className="splash-screen__skip absolute top-5 right-5 px-4 py-2 text-sm text-gray-600 rounded-full bg-white/80 backdrop-blur-md border border-gray-200 shadow-sm hover:bg-white transition"
      >
        Skip
      </button>

      {/* Main Content */}
      <div className="splash-screen__content relative flex h-full items-center justify-center px-6">
        <div className="flex flex-col items-center">
          <Image
            src="/images/sp-image.png"
            alt="MN-Mart Logo"
            width={220}
            height={220}
            priority
            className="splash-screen__logo object-contain"
          />

          <h1 className="splash-screen__title font-[family-name:var(--font-nunito)] text-5xl font-extrabold">
            <span className="text-emerald-600">Manaw</span>
            <span className="text-gray-300">-</span>
            <span className="text-rose-600">Mart</span>
          </h1>

          <p className="splash-screen__tagline mt-2 text-center text-base md:text-lg text-gray-500 font-[family-name:var(--font-nunito)]">
            All in One Marketplace
          </p>
        </div>
      </div>
    </div>
  );
}