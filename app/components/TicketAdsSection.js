import Link from "next/link";
import {
  CheckCircle2,
  ArrowRightLeft,
  Bus,
  Clock3,
  ShieldCheck,
  MapPinned,
} from "lucide-react";

export default function TicketAdsSection() {
  const routes = [
    "မြစ်ကြီးနား ~ မန္တလေး",
    "မြစ်ကြီးနား ~ ရန်ကုန်",
    "မြစ်ကြီးနား ~ မိုးညှင်း",
    "မြစ်ကြီးနား ~ တနိုင်း",
  ];

  return (
    <section
      className="relative overflow-hidden rounded-[2rem] border border-white/20 shadow-2xl"
      style={{
        backgroundImage: "url('/images/car-ticket.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Layered overlays */}
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-900/78 to-slate-900/25" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />

      {/* Decorative glows */}
      <div className="absolute -left-16 -top-16 h-56 w-56 rounded-full bg-emerald-400/15 blur-3xl" />
      <div className="absolute -bottom-20 right-10 h-64 w-64 rounded-full bg-red-500/15 blur-3xl" />

      <div className="relative z-10 p-5 sm:p-7 md:p-9 lg:p-10">
        {/* Top row */}
        <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-2 backdrop-blur-xl">
            <CheckCircle2 size={15} className="text-emerald-400" />
            <span className="text-xs font-semibold text-white">
              MN-Mart Verified Transportation
            </span>
          </div>

          <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-2 text-xs text-white/80 backdrop-blur-md sm:flex">
            <Clock3 size={14} />
            Daily Trips Available
          </div>
        </div>

        <div className="grid items-center gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:gap-10">
          {/* Left */}
          <div>
            <div className="mb-5 flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-red-500 shadow-xl shadow-black/20">
                <Bus size={28} />
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
                  Travel With Confidence
                </p>

                <h2 className="mt-1 text-3xl font-black leading-tight text-white sm:text-4xl md:text-5xl">
                  Car Ticket
                  <span className="block text-emerald-300">Booking</span>
                </h2>
              </div>
            </div>

            <p className="max-w-xl text-sm leading-7 text-white/85 sm:text-base">
              MN-Mart မှတစ်ဆင့် ယုံကြည်စိတ်ချရသော ကားလက်မှတ်များကို
              လွယ်ကူမြန်ဆန်စွာ ရှာဖွေပြီး ကြိုတင်မှာယူနိုင်ပါသည်။
            </p>

            {/* Feature pills */}
            <div className="mt-5 flex flex-wrap gap-2.5">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3.5 py-2 text-xs font-medium text-white backdrop-blur-md">
                <MapPinned size={14} className="text-emerald-300" />
                20+ Routes
              </div>

              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3.5 py-2 text-xs font-medium text-white backdrop-blur-md">
                <Clock3 size={14} className="text-emerald-300" />
                Daily Trips
              </div>

              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3.5 py-2 text-xs font-medium text-white backdrop-blur-md">
                <ShieldCheck size={14} className="text-emerald-300" />
                Trusted Operators
              </div>
            </div>

            {/* CTA */}
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/transportation"
                className="inline-flex items-center justify-center rounded-2xl bg-emerald-500 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-950/20 transition duration-300 hover:-translate-y-0.5 hover:bg-emerald-400"
              >
                Book Ticket Now
              </Link>

              <Link
                href="/transportation"
                className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/10 px-5 py-3.5 text-sm font-semibold text-white backdrop-blur-md transition duration-300 hover:bg-white/15"
              >
                Explore Routes
              </Link>
            </div>
          </div>

          {/* Right */}
          <div className="rounded-[1.75rem] border border-white/10 bg-white/10 p-3 backdrop-blur-xl sm:p-4">
            <div className="mb-3 flex items-center justify-between px-1">
              <div>
                <p className="text-sm font-semibold text-white">
                  Popular Routes
                </p>
                <p className="mt-0.5 text-xs text-white/60">
                  Quick access to frequent destinations
                </p>
              </div>

              <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-200">
                DAILY
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {routes.map((route, index) => (
                <Link
                  key={index}
                  href="/transportation"
                  className="group rounded-2xl border border-white/10 bg-white/95 p-4 shadow-lg transition duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-500 transition group-hover:bg-red-100">
                      <ArrowRightLeft size={17} />
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-bold leading-snug text-gray-900">
                        {route}
                      </p>

                      <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400">
                        View available trips
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <div className="mt-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-xs leading-5 text-white/75">
              Choose your route, check available departure times and book directly
              through MN-Mart.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}