"use client";

import { useEffect, useState } from "react";
import ShopsHero from "./shops/ShopsHero";
import ShopsGrid from "./shops/ShopsGrid";
// Destructure inside function to avoid parser/transpile duplication issues

export default function CategoryShopsPage(param) {
  const { category, title, heroImage, ctaLabel = "Book Now", serviceCategories = [] } = param || {};
  const [shops, setShops] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState(
    serviceCategories[0]?.name || ""
  );

  const isTransportation = category === "transportation";

  useEffect(() => {
    let isMounted = true;

    const fetchShops = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(
          `/api/shops?category=${encodeURIComponent(category)}&page=1&limit=20`,
          { cache: "no-store" }
        );
        const data = await res.json();

        if (isMounted) {
          setShops(res.ok && data?.success ? data.data || [] : []);
        }
      } catch (error) {
        console.error(`Failed to fetch ${category} shops:`, error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchShops();
    return () => (isMounted = false);
  }, [category]);

  return (
    <div className="min-h-screen bg-gray-50">
      <ShopsHero title={title} heroImage={heroImage} />

      <div className="max-w-7xl mx-auto px-4 py-10">

        {/* ✅ SERVICE CATEGORIES */}
       {serviceCategories.length > 0 && (
  <section className="mb-10">

    {/* Title */}
    <h2 className="text-center text-xl md:text-2xl font-semibold text-gray-900 mb-6">
      Service Categories
    </h2>

    {/* Categories */}
    <div className="
      flex gap-10
      overflow-x-auto
      whitespace-nowrap
      px-2 pb-2
      scroll-smooth
      md:flex-wrap
      md:justify-center
      md:overflow-visible
    ">

      {serviceCategories.map((service) => {
        const isActive = activeCategory === service.name;

        return (
          <button
            key={service.name}
            onClick={() => setActiveCategory(service.name)}
            className={`shrink-0 px-5 py-2 rounded-full text-sm transition
              ${
                isActive
                  ? "bg-[#318616] text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }
            `}
          >
            {service.name}
          </button>
        );
      })}

    </div>
  </section>
)}

        {/* SHOPS */}
        {isLoading ? (
          <p className="text-center text-gray-500">
            Loading {title.toLowerCase()}...
          </p>
        ) : shops.length === 0 ? (
          <p className="text-center text-gray-500">
            No {title.toLowerCase()} available
          </p>
        ) : (
          <ShopsGrid
            shops={shops}
            isTransportation={isTransportation}
            ctaLabel={ctaLabel}
          />
        )}
      </div>
    </div>
  );
}