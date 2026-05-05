import ShopsHero from "../components/shops/ShopsHero";

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

      <section className="px-4 md:px-10 py-10">
        <h2 className="text-center text-2xl font-bold mb-6">Popular Routes</h2>

        <div className="flex justify-center">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-fit">
            {popularRoutes.map((route) => (
              <a
                key={route.label}
                href={`/transportation?search=${encodeURIComponent(route.label)}`}
                className="group relative rounded-xl overflow-hidden shadow-md h-85 w-57 block"
              >
                <img
                  src={route.image}
                  className="w-full h-full object-cover transition duration-300 group-hover:scale-105 group-hover:blur-sm"
                  alt={route.label}
                />

                <div className="absolute inset-0 bg-black/15 group-hover:bg-black/45 transition duration-300" />

                <div className="absolute inset-0 flex flex-col items-center justify-center px-3 opacity-0 group-hover:opacity-100 transition duration-300">
                  <span className="text-white text-base font-semibold text-center mb-3">
                    {route.label}
                  </span>
                  <span className="bg-[#318616] text-white text-sm font-medium px-4 py-2 rounded-lg shadow">
                    Search Route
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
