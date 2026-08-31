"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Tag } from "lucide-react";

export default function SeptemberPromoBanner() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <section className="w-full px-3 pt-3 sm:px-5">
      <div className="relative mx-auto w-full overflow-hidden rounded-2xl border border-green-600/20 bg-green-700 shadow-[0_8px_30px_rgba(21,128,61,0.15)] lg:w-[80%]">
        {/* DECORATIVE BACKGROUND */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {/* Left glow */}
          <div className="absolute -left-10 -top-14 h-32 w-32 rounded-full bg-white/[0.06]" />

          {/* Right glow */}
          <div className="absolute -bottom-20 right-[10%] h-40 w-40 rounded-full bg-yellow-300/[0.07]" />

          {/* Dot pattern */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "radial-gradient(circle, white 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }}
          />
        </div>

        {/* =====================================================
            MOBILE
            Two-line layout
            Below 768px
        ====================================================== */}
        <div className="relative flex flex-col items-center justify-center px-2 py-2.5 md:hidden">
          {/* FIRST LINE */}
          <div className="flex items-center justify-center gap-1.5">
            <Tag className="h-3.5 w-3.5 flex-none text-yellow-300" />

            <span className="font-sans text-[11px] font-bold tracking-tight text-yellow-300">
              September Special 🎉
            </span>
          </div>

          {/* SECOND LINE */}
          <div className="mt-1.5 flex w-full items-center justify-center gap-1 whitespace-nowrap">
            {/* Promotion text */}
            <p className="font-sans text-[8px] font-medium tracking-tight text-white/95 min-[360px]:text-[9px] min-[400px]:text-[10px]">
              Sell on MN-Mart{" "}
              <span className="font-extrabold text-yellow-300">
                100% FREE
              </span>{" "}
              for September
            </p>

            {/* Start Selling */}
            <Link
              href="/vendor-register"
              className="group inline-flex flex-none items-center gap-0.5 font-sans text-[8px] font-bold text-white underline decoration-white/40 underline-offset-2 transition hover:decoration-white min-[360px]:text-[9px] min-[400px]:text-[10px]"
            >
              Start Selling

              <ArrowRight className="h-2.5 w-2.5 flex-none transition-transform group-hover:translate-x-0.5" />
            </Link>

            {/* Close */}
            <button
              type="button"
              onClick={() => setIsVisible(false)}
              aria-label="Close promotion"
              className="ml-0.5 flex-none rounded-full border border-white/15 bg-white/10 px-1.5 py-0.5 font-sans text-[7px] font-semibold text-white/70 transition hover:bg-white/20 hover:text-white min-[400px]:px-2 min-[400px]:text-[8px]"
            >
              Close
            </button>
          </div>
        </div>

        {/* =====================================================
            TABLET / DESKTOP
            One-line layout
            768px and above
        ====================================================== */}
        <div className="relative hidden min-h-[54px] items-center justify-center gap-2.5 px-5 py-2.5 md:flex lg:gap-3 lg:px-6">
          {/* Promotion Icon */}
          <Tag className="h-4 w-4 flex-none text-yellow-300" />

          {/* Special Label */}
          <span className="flex-none whitespace-nowrap font-sans text-[11px] font-bold tracking-tight text-yellow-300 lg:text-xs xl:text-[13px]">
            September Special 🎉
          </span>

          {/* Separator */}
          <span className="flex-none text-white/30">
            •
          </span>

          {/* Promotion Text */}
          <p className="whitespace-nowrap font-sans text-[11px] font-medium tracking-tight text-white/95 lg:text-xs xl:text-[13px]">
            Sell on MN-Mart{" "}
            <span className="font-extrabold text-yellow-300">
              100% FREE
            </span>{" "}
            for September
          </p>

          {/* CTA */}
         <a
  href="https://mn-mart-vendor-form.bolt.host/"
  target="_blank"
  rel="noopener noreferrer"
  className="group inline-flex flex-none items-center gap-1 whitespace-nowrap font-sans text-[11px] font-bold text-white underline decoration-white/40 underline-offset-3 transition hover:decoration-white lg:text-xs xl:text-[13px]"
>
  Start Selling

  <ArrowRight className="h-3 w-3 flex-none transition-transform group-hover:translate-x-0.5 lg:h-3.5 lg:w-3.5" />
</a>

          {/* Close */}
          <button
            type="button"
            onClick={() => setIsVisible(false)}
            aria-label="Close promotion"
            className="ml-1 flex-none rounded-full border border-white/15 bg-white/10 px-2.5 py-1 font-sans text-[9px] font-semibold text-white/70 transition hover:bg-white/20 hover:text-white lg:text-[10px]"
          >
            Close
          </button>
        </div>
      </div>
    </section>
  );
}