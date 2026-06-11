import Link from "next/link";
import {
  CheckCircle2,
  ArrowRightLeft,
  Bus,
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
      className="relative overflow-hidden rounded-3xl p-6 md:p-8 shadow-xl"
      style={{
        backgroundImage: "url('/images/car-ticket.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/45" />

      {/* Glow */}
      <div className="absolute -top-10 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl" />

      {/* Content */}
      <div className="relative z-10">
        {/* Verified Badge */}
        <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md px-3 py-2 rounded-full border border-white/20 mb-5">
          <CheckCircle2
            size={15}
            className="text-green-400"
          />
          <span className="text-xs font-semibold text-white">
            MN-Mart Verified Transportation
          </span>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
          {/* Left Side */}
          <div>
            {/* Heading */}
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-white text-red-500 p-3 rounded-2xl shadow-lg">
                <Bus size={24} />
              </div>

              <div>
                <h2 className="text-3xl md:text-4xl font-black text-white leading-tight">
                  Car Ticket Booking
                </h2>

                <p className="text-xs text-green-300 tracking-wider mt-1">
                  SAFE • FAST • RELIABLE
                </p>
              </div>
            </div>

            {/* Description */}
            <p className="text-sm md:text-base text-white/90 leading-relaxed max-w-lg">
              MN-Mart မှတစ်ဆင့် ယုံကြည်စိတ်ချရသော
              ကားလက်မှတ်များကို လွယ်ကူစွာ
              ကြိုတင်မှာယူနိုင်ပါသည်။
            </p>

            {/* Stats */}
            <div className="flex flex-wrap gap-2 mt-4">
              <span className="bg-white/15 backdrop-blur-md text-white text-xs px-3 py-1 rounded-full">
                20+ Routes
              </span>

              <span className="bg-white/15 backdrop-blur-md text-white text-xs px-3 py-1 rounded-full">
                Daily Trips
              </span>

              <span className="bg-white/15 backdrop-blur-md text-white text-xs px-3 py-1 rounded-full">
                Trusted Service
              </span>
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <Link
                href="/transportation"
                className="w-full sm:w-auto"
              >
                <button className="w-full bg-white text-green-700 hover:bg-green-50 transition-all duration-300 px-5 py-3 rounded-xl text-sm font-semibold shadow-lg">
                  Book Now
                </button>
              </Link>

              <Link
                href="/transportation"
                className="w-full sm:w-auto"
              >
                <button className="w-full bg-white/15 border border-white/20 backdrop-blur-md text-white hover:bg-white/20 transition-all duration-300 px-5 py-3 rounded-xl text-sm font-semibold">
                  View Routes
                </button>
              </Link>
            </div>
          </div>

          {/* Right Side Routes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {routes.map((route, index) => (
              <div
                key={index}
                className="bg-white/90 rounded-2xl p-4 shadow-lg hover:scale-[1.02] transition-all duration-300"
              >
                <div className="flex items-start gap-3">
                  <div className="bg-red-100 text-red-500 p-2 rounded-xl">
                    <ArrowRightLeft size={16} />
                  </div>

                  <div>
                    <p className="text-gray-800 font-bold text-sm leading-snug">
                      {route}
                    </p>

                    <p className="text-gray-500 text-[11px] mt-1">
                      DAILY AVAILABLE
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}