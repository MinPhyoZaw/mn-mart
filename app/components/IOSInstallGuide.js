"use client";

import { useState } from "react";
import Image from "next/image";
import {
  X,
  Share,
  PlusSquare,
  Smartphone,
  AppleIcon,
  ShoppingBag,
  Wifi,
  Sparkles,
} from "lucide-react";

const steps = [
  {
    number: 1,
    title: "Open MN-Mart in Safari",
    description:
      "Open Safari on your iPhone and visit www.mn-mart.store.",
    icon: Smartphone,
  },
  {
    number: 2,
    title: "Tap the Share Button",
    description:
      "Tap the Share icon at the bottom of Safari.",
    icon: Share,
  },
  {
    number: 3,
    title: 'Select "Add to Home Screen"',
    description:
      'Scroll down and tap "Add to Home Screen".',
    icon: PlusSquare,
  },
  {
    number: 4,
    title: 'Enable "Open as Web App"',
    description:
      'Turn on "Open as Web App" if the option appears.',
    icon: AppleIcon,
  },
  {
    number: 5,
    title: 'Tap "Add"',
    description:
      "Tap Add in the top-right corner. MN-Mart will appear on your Home Screen.",
    icon: PlusSquare,
  },
];

export default function IOSInstallGuide() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* =========================
          IOS INSTALL SECTION
      ========================== */}

     <section className="w-full lg:w-1/2">
  <div className="relative h-full overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
    
    {/* SUBTLE BACKGROUND */}
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      
      {/* VERY LIGHT DOT PATTERN */}
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "radial-gradient(circle, #111827 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* SUBTLE GREEN GLOW */}
      <div className="absolute -left-24 -top-24 h-64 w-64 rounded-full bg-green-200/15 blur-3xl" />

      {/* SUBTLE RED GLOW */}
      <div className="absolute -bottom-24 -right-20 h-72 w-72 rounded-full bg-red-200/10 blur-3xl" />
    </div>

    {/* CONTENT */}
    <div className="relative z-10 grid min-h-[430px] items-center gap-6 px-5 py-6 sm:px-7 sm:py-8 md:grid-cols-[0.9fr_1.1fr] lg:min-h-[470px] lg:grid-cols-1 xl:grid-cols-[0.92fr_1.08fr]">
      
      {/* LEFT CONTENT */}
      <div className="relative z-10">
        
        {/* LABEL */}
<div className="mb-4 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm">
  <AppleIcon className="h-4 w-4" />
  iPhone User
</div>

        {/* TITLE */}
        <h2 className="max-w-md text-2xl font-black leading-[1.08] tracking-tight text-gray-950 sm:text-3xl xl:text-[34px]">
          Install{" "}
          <span className="text-green-600">MN</span>
          <span className="text-red-500">Mart</span>
          {" "}on your{" "}
          <span className="text-gray-950">iPhone</span>
        </h2>

        {/* DESCRIPTION */}
        <p className="mt-4 max-w-md text-sm leading-6 text-gray-600 sm:text-[15px]">
          Add{" "}
          <span className="font-semibold">
            <span className="text-green-600">MN</span>
            <span className="text-red-500">Mart</span>
          </span>{" "}
          to your iPhone Home Screen and enjoy a faster, smoother
          app-like shopping experience.
        </p>

        {/* SMALL BENEFITS */}
        <div className="mt-5 flex flex-wrap gap-2">
          <div className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-gray-600 shadow-sm">
            <Smartphone className="h-3.5 w-3.5 text-green-600" />
            Quick Access
          </div>

          <div className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-gray-600 shadow-sm">
            <ShoppingBag className="h-3.5 w-3.5 text-red-500" />
            App-like Shopping
          </div>

          <div className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-gray-600 shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-green-600" />
            Easy Install
          </div>
        </div>

        {/* CTA */}
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition duration-200 hover:bg-green-700 hover:shadow-md active:scale-[0.98] sm:w-auto"
        >
          
          Show Installation Instruction
        </button>
      </div>

      {/* RIGHT IMAGE */}
      <div className="relative flex items-center justify-center">
        
        {/* VERY SUBTLE GLOW */}
        <div className="absolute h-[85%] w-[85%] rounded-full bg-green-100/30 blur-3xl" />

        {/* IMAGE CONTAINER */}
        <div className="relative h-[460px] w-full max-w-[320px] overflow-hidden rounded-2xl border border-gray-200 bg-white p-2 shadow-[0_18px_50px_rgba(15,23,42,0.10)] sm:h-[520px] sm:max-w-[350px] md:h-[560px] lg:h-[500px] xl:h-[580px]">
          
          <div className="relative h-full w-full overflow-hidden rounded-xl border border-gray-200 bg-white">
            <Image
              src="/images/install-guide.png"
              alt="Install MN-Mart on iPhone"
              fill
              sizes="(max-width: 640px) 85vw, (max-width: 1024px) 45vw, 350px"
              className="object-contain"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

      {/* =========================
          INSTALLATION MODAL
      ========================== */}

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4">
          {/* OVERLAY */}

          <button
            type="button"
            aria-label="Close installation guide"
            onClick={() => setIsOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* MODAL */}

          <div className="relative z-10 max-h-[94dvh] w-full overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:max-h-[90vh] sm:max-w-5xl sm:rounded-3xl">
            {/* =========================
                MODAL HEADER
            ========================== */}

            <div className="sticky top-0 z-20 flex items-center justify-between border-b border-gray-100 bg-white/95 px-4 py-4 backdrop-blur sm:px-7">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-orange-100 text-orange-600">
                  <AppleIcon className="h-5 w-5" />
                </div>

                <div className="min-w-0">
                  <h3 className="truncate text-base font-bold text-gray-950 sm:text-xl">
                    How to Install MN-Mart on iPhone
                  </h3>

                  <p className="mt-0.5 text-xs text-gray-500">
                    Follow these simple steps
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="ml-3 flex h-9 w-9 flex-none items-center justify-center rounded-full bg-gray-100 text-gray-600 transition hover:bg-gray-200"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* =========================
                MODAL CONTENT
            ========================== */}

            <div className="p-4 pb-6 sm:p-7">
              {/* STEPS */}

              <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-5">
                {steps.map((step) => {
                  const Icon = step.icon;

                  return (
                    <div
                      key={step.number}
                      className="relative rounded-2xl border border-gray-100 bg-gradient-to-b from-white to-gray-50 p-4 shadow-sm"
                    >
                      {/* NUMBER + ICON */}

                      <div className="mb-4 flex items-center justify-between">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-500 text-sm font-bold text-white shadow-sm">
                          {step.number}
                        </div>

                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50">
                          <Icon className="h-4.5 w-4.5 text-orange-500" />
                        </div>
                      </div>

                      {/* TEXT */}

                      <h4 className="text-sm font-bold leading-5 text-gray-900">
                        {step.title}
                      </h4>

                      <p className="mt-2 text-xs leading-5 text-gray-500">
                        {step.description}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* SAFARI NOTE */}

              <div className="mt-5 flex gap-3 rounded-2xl border border-orange-100 bg-orange-50 px-4 py-4 text-sm text-gray-700 sm:mt-6">
                <AppleIcon className="mt-0.5 h-5 w-5 flex-none text-orange-500" />

                <p>
                  <span className="font-semibold text-orange-600">
                    Important:
                  </span>{" "}
                  For the easiest installation
                  experience, open MN-Mart using Safari
                  on your iPhone.
                </p>
              </div>

              {/* CLOSE BUTTON */}

              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="w-full rounded-xl bg-gray-950 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 sm:w-auto"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}