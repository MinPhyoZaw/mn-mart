import { CheckCircle, Bus, Clock, Zap, ShieldCheck } from "lucide-react";
import ShopsHero from "../components/shops/ShopsHero";
import CreatedTicketsSection from "../components/transportation/CreatedTicketsSection";
import TransportationShopsSection from "../components/transportation/TransportationShopsSection";


const popularRoutes = [
  { label: "မြစ်ကြီးနား - မန္တလေး", image: "/images/mdy.png" },
  { label: "မြစ်ကြီးနား - ပူတာအို", image: "/images/put.jpg" },
  { label: "မြစ်ကြီးနား - လိုင်ဇာ", image: "/images/Laiza.jpg" },
  { label: "မြစ်ကြီးနား - ပန်ဝါ", image: "/images/panwa.jpg" },
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
              <p className="text-sm font-semibold">50+ Car Operator</p>
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
              <p className="text-sm font-semibold">24/7 Available</p>
            </div>
            <CheckCircle className="text-green-500" size={18} />
          </div>

          <div className="bg-white rounded-xl shadow-sm px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShieldCheck className="text-[#318616]" size={24} />
              <p className="text-sm font-semibold">Instant Confirm</p>
            </div>
            <CheckCircle className="text-green-500" size={18} />
          </div>

        </div>
      </section>

      {/* ✅ Popular Routes */}
      <section className="px-4 md:px-10 py-10">
        <h2 className="text-center text-2xl font-bold mb-6">
          Popular Routes
        </h2>

       <div className="flex justify-center">
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 w-full max-w-5xl">
    {popularRoutes.map((route) => (
      <a
        key={route.label}
        href={`/transportation?search=${encodeURIComponent(route.label)}`}
        className="group relative rounded-xl overflow-hidden shadow-md h-40 sm:h-52 md:h-60 w-full block"
      >
        <img
          src={route.image}
          className="w-full h-full object-cover transition duration-300 group-hover:scale-105 group-hover:blur-sm"
          alt={route.label}
        />

        <div className="absolute inset-0 bg-black/15 group-hover:bg-black/45 transition duration-300" />

        <div className="absolute inset-0 flex flex-col items-center justify-center px-3 opacity-0 group-hover:opacity-100 transition duration-300">
          <span className="text-white text-sm md:text-base font-semibold text-center mb-2">
            {route.label}
          </span>
          <span className="bg-[#318616] text-white text-xs md:text-sm font-medium px-3 py-1.5 rounded-lg shadow">
            Search Route
          </span>
        </div>
      </a>
    ))}
  </div>
</div>
      </section>

      <TransportationShopsSection />
      <CreatedTicketsSection />
    </div>
  );
}