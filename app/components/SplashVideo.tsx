"use client";

import { useEffect, useState } from "react";

export default function SplashVideo() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // prevent body scroll while splash is visible
    if (visible) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black">
      <video
        src="/video/beta.mp4"
        autoPlay
        muted
        playsInline
        onEnded={() => setVisible(false)}
        className="w-full h-[100dvh] object-cover"
      />

      <button
        onClick={() => setVisible(false)}
        aria-label="Skip splash"
        className="absolute top-4 right-4 bg-black/40 text-white px-3 py-2 rounded-md backdrop-blur"
      >
        Skip
      </button>
    </div>
  );
}
