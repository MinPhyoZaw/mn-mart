
import Link from "next/link";
import {
  CheckCircle2,
  ArrowRightLeft,
  Bus,
} from "lucide-react";

export default function TicketAdsSection() {
  const routes = [
    "မြစ်ကြီးနား ~ မန္တလေး",
    "မြစ်ကြီးနား ~ ပူတာအို",
    "မြစ်ကြီးနား ~ လိုင်ဇာ",
    "မြစ်ကြီးနား ~ ပန်ဝါ",
  ];

  return (
    <section
      className="relative overflow-hidden rounded-3xl p-5 md:p-6 shadow-xl mb-[2px]"
      style={{
        backgroundImage: `
          
          url('/images/Putao.jpg')
        `,
        backgroundSize: "cover",
        
      }}
    >
      {/* Blur Overlay */}
      <div className="absolute inset-0 backdrop-blur-[1.5px]"></div>

      {/* Floating Glow */}
      <div className="absolute -top-10 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>

      {/* Main Content */}
      <div className="relative z-10">

        {/* Verified Badge */}
        <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 mb-4 shadow">
          <CheckCircle2
            size={15}
            className="text-green-300"
          />

          <span className="text-xs font-semibold text-white tracking-wide">
            MN-Mart Verified Transportation
          </span>
        </div>

        {/* Layout */}
        <div className="grid md:grid-cols-2 gap-5 items-center">

          {/* Left Side */}
          <div>

            {/* Title */}
            <div className="flex items-center gap-3 mb-3">

              <div className="bg-white text-red-500 p-2.5 rounded-2xl shadow-lg">
                <Bus size={22} />
              </div>

              <div>
                <h2 className="text-2xl md:text-3xl font-black text-black leading-tight drop-shadow">
                  Car Ticket Booking
                </h2>

                <p className="text-[11px] text-green-300 mt-1 tracking-wide">
                  SAFE • FAST • RELIABLE
                </p>
              </div>
            </div>

            {/* Description */}
            <p className="text-xs md:text-sm text-black leading-relaxed max-w-md">
              MN-Mart မှတစ်ဆင့် ယုံကြည်စိတ်ချရသော
              ကားလက်မှတ်များကို အလွယ်တကူ
              ကြိုတင်မှာယူနိုင်ပါသည်။
            </p>

            {/* Buttons */}
            <div className="flex gap-3 mt-4">

             <Link href="/transportation">
                <button className="bg-white text-green-700 hover:bg-green-50 transition-all duration-300 px-4 py-2 rounded-xl text-sm font-semibold shadow-lg hover:scale-105">
                  Book Now
                </button>
              </Link>

              <Link href="/transportation">
                <button className="bg-white/15 border border-white/20 backdrop-blur-md text-white hover:bg-white/20 transition-all duration-300 px-4 py-2 rounded-xl text-sm font-semibold">
                  View Routes
                </button>
              </Link>


            </div>
          </div>

          {/* Right Side Routes */}
          <div className="grid grid-cols-2 gap-3">

            {routes.map((route, index) => (
              <div
                key={index}
                className="group bg-white/12 backdrop-blur-md border border-white/20 rounded-2xl p-3 hover:bg-white/20 transition-all duration-300 shadow-lg hover:scale-[1.03]"
              >

                <div className="flex items-start gap-2">

                  {/* Icon */}
                  <div className="bg-white text-red-500 p-1.5 rounded-xl mt-0.5 shadow">
                    <ArrowRightLeft size={14} />
                  </div>

                  {/* Route */}
                  <div>
                    <p className="text-black font-semibold text-sm leading-snug">
                      {route}
                    </p>

                    <p className="text-black text-[10px] mt-1 tracking-wide">
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