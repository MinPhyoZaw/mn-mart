import CategoryShopsPage from "../components/CategoryShopsPage";

export default function TransportationPage() {
  return (
    <div>
      <CategoryShopsPage
        category="transportation"
        title="Transportation"
        heroImage="/images/promo-2.png"
        ctaLabel="Book Now"
      />

      {/* 🚗 Popular Routes Section */}
     <section className="px-4 md:px-10 py-10">
  <h2 className="text-center text-2xl font-bold mb-6">
    Popular Routes
  </h2>

  <div className="flex justify-center">
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-fit">

      {/* 1 */}
      <div className="relative rounded-xl overflow-hidden shadow-md h-85 w-57">
        <img
          src="/images/mdy.png"
          className="w-full h-full object-cover"
          alt="route"
        />
        <div className="absolute bottom-2 left-2 right-2 bg-black/40 rounded px-2 py-2 flex items-center justify-center">
          <span className="text-white text-sm font-semibold text-center">
            မြစ်ကြီးနား - မန္တလေး
          </span>
        </div>
      </div>

      {/* 2 */}
      <div className="relative rounded-xl overflow-hidden shadow-md h-85 w-57">
        <img
          src="/images/put.jpg"
          className="w-full h-full object-cover"
          alt="route"
        />
        <div className="absolute bottom-2 left-2 right-2 bg-black/40 rounded px-2 py-2 flex items-center justify-center">
          <span className="text-white text-sm font-semibold text-center">
            မြစ်ကြီးနား - ပူတာအို
          </span>
        </div>
      </div>

      {/* 3 */}
      <div className="relative rounded-xl overflow-hidden shadow-md h-85 w-57">
        <img
          src="/images/Laiza.jpg"
          className="w-full h-full object-cover"
          alt="route"
        />
        <div className="absolute bottom-2 left-2 right-2 bg-black/40 rounded px-2 py-2 flex items-center justify-center">
          <span className="text-white text-sm font-semibold text-center">
            မြစ်ကြီးနား - လိုင်ဇာ
          </span>
        </div>
      </div>

      {/* 4 */}
      <div className="relative rounded-xl overflow-hidden shadow-md h-85 w-57">
        <img
          src="/images/panwa.jpg"
          className="w-full h-full object-cover"
          alt="route"
        />
        <div className="absolute bottom-2 left-2 right-2 bg-black/40 rounded px-2 py-2 flex items-center justify-center">
          <span className="text-white text-sm font-semibold text-center">
            မြစ်ကြီးနား - ပန်ဝါ
          </span>
        </div>
      </div>

    </div>
  </div>
</section>
    </div>
  );
}