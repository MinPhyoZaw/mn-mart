"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, BadgePercent } from "lucide-react";

export default function SeptemberVendorPromotion() {
  return (
    <section className="w-full px-3 py-5 sm:px-5 lg:px-8">
      <div className="relative mx-auto h-[420px] w-full max-w-[1600px] overflow-hidden rounded-3xl sm:h-[450px] lg:h-[480px]">

        {/* BACKGROUND IMAGE */}
        <Image
          src="/images/23.jpg"
          alt="MN-Mart September Promotion"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />

        {/* 
          LEFT GRADIENT ONLY
          The right side of the image is completely untouched.
        */}
        <div
          className="
            absolute inset-y-0 left-0
            w-[85%]
            bg-gradient-to-r
            from-[#210035]/95
            via-[#210035]/70
            to-transparent
            sm:w-[70%]
            md:w-[60%]
            lg:w-[52%]
          "
        />

        {/* CONTENT */}
        <div className="absolute inset-0 z-10 flex items-center px-5 sm:px-10 lg:px-16">
          <div className="max-w-[580px]">

            {/* LABEL */}
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/20 px-3 py-1.5 backdrop-blur-md">
              <BadgePercent className="h-4 w-4 text-yellow-300" />

              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-white sm:text-xs">
                MN-Mart Vendor Special
              </span>
            </div>

            {/* HEADER */}
            <h2 className="text-4xl font-black leading-[0.95] tracking-[-0.04em] text-white sm:text-5xl lg:text-6xl">
              September

              <span className="block text-yellow-300">
                Promotion
              </span>
            </h2>

            {/* SUB HEADER */}
            <p className="mt-4 max-w-[540px] text-sm leading-7 text-white/90 sm:text-base sm:leading-8">
              MN Mart မှာ ကိုယ့်ဆိုင်ရဲ့ ကုန်ပစ္စည်းတွေကို{" "}

              <span className="font-bold text-yellow-300">
                September တစ်လလုံး အခမဲ့
              </span>{" "}

              ရောင်းချလို့ရမယ့် အခွင့်အရေးရှိနေပြီမို့ ခုပဲ Vendor
              အဖြစ် လာရောက်လျှောက်ထားလိုက်တော့နော်...
            </p>

            {/* CTA */}
           <a
  href="https://mn-mart-vendor-form.bolt.host/"
  target="_blank"
  rel="noopener noreferrer"
  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-yellow-300 px-5 py-3 text-sm font-bold text-[#2d004d] shadow-lg transition-all hover:-translate-y-0.5 hover:bg-yellow-200"
>
  Vendor အဖြစ်လျှောက်ထားမယ်
  <ArrowUpRight className="h-4 w-4" />
</a>
          </div>
        </div>
      </div>
    </section>
  );
}