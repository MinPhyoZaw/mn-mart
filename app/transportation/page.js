import { CheckCircle, Bus, Clock, Zap, ShieldCheck } from "lucide-react";
import ShopsHero from "../components/shops/ShopsHero";
import CreatedTicketsSection from "../components/transportation/CreatedTicketsSection";
import TransportationShopsSection from "../components/transportation/TransportationShopsSection";


const popularRoutes = [
  {
    label: "Myitkyina - Mandalay",
    burmeseLabel: "မြစ်ကြီးနား - မန္တလေး",
    image: "/images/mdy.png",
  },
  {
    label: "Myitkyina - Yangon",
    burmeseLabel: "မြစ်ကြီးနား - ရန်ကုန်",
    image: "/images/ygn.jpg",
  },
  {
    label: "Myitkyina - Tanai",
    burmeseLabel: "မြစ်ကြီးနား - တနိုင်း",
    image: "/images/tn.webp",
  },
  {
    label: "Myitkyina - Mohnyin ",
    burmeseLabel: "မြစ်ကြီးနား - မိုးညှင်း ",
    image: "/images/mn.jpg",
  },
];


export default function TransportationPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <ShopsHero title="Transportation" heroImage="/images/promo-2.png" />

    
      {/* ✅ Feature Section */}
      <section className="px-4 md:px-10 py-8">
  <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">

    <div className="bg-white rounded-xl shadow-sm px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Bus className="text-[#318616]" size={24} />
        <p className="text-sm font-semibold">50+ Car Operators</p>
      </div>
      <CheckCircle className="text-green-500" size={18} />
    </div>

    <div className="bg-white rounded-xl shadow-sm px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Zap className="text-[#318616]" size={24} />
        <p className="text-sm font-semibold">Easy Booking</p>
      </div>
      <CheckCircle className="text-green-500" size={18} />
    </div>

    <div className="bg-white rounded-xl shadow-sm px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Clock className="text-[#318616]" size={24} />
        <p className="text-sm font-semibold">24/7 Availability</p>
      </div>
      <CheckCircle className="text-green-500" size={18} />
    </div>

    <div className="bg-white rounded-xl shadow-sm px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <ShieldCheck className="text-[#318616]" size={24} />
        <p className="text-sm font-semibold">Instant Confirmation</p>
      </div>
      <CheckCircle className="text-green-500" size={18} />
    </div>

  </div>
</section>

      {/* ✅ Popular Routes */}
      {/* ✅ Popular Routes */}
<section className="px-4 md:px-10 py-10">
  <h2 className="text-center text-2xl font-bold mb-6">
    Popular Routes
  </h2>

  <div className="flex justify-center">
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 w-full max-w-5xl">
      {popularRoutes.map((route) => (
        <div
          key={route.label}
          className="relative rounded-xl overflow-hidden shadow-md h-40 sm:h-52 md:h-60 w-full cursor-default"
        >
          <img
            src={route.image}
            alt={route.label}
            className="w-full h-full object-cover"
            draggable={false}
          />

          {/* Dark Overlay */}
          <div className="absolute inset-0 bg-black/20" />

          {/* Route Label */}
          <div className="absolute bottom-0 left-0 w-full">
            <div className="bg-black/50 backdrop-blur-sm px-3 py-2">
              <p className="text-white text-xs md:text-sm font-medium text-center">
                {route.label}
              </p>

              {route.burmeseLabel && (
                <p className="text-white/90 text-[10px] md:text-xs text-center mt-1">
                  {route.burmeseLabel}
                </p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
</section>

      <TransportationShopsSection />

    </div>
  );
}