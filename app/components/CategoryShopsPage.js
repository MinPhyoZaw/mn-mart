"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import ShopsHero from "./shops/ShopsHero";
import ShopsGrid from "./shops/ShopsGrid";

export default function CategoryShopsPage({
  category,
  title,
  heroImage,
  ctaLabel = "Book Now",
  serviceCategories = [],
}) {
  const [shops, setShops] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const isTransportation = category === "transportation";

  useEffect(() => {
    let isMounted = true;

    const fetchShops = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/shops?category=${encodeURIComponent(category)}&page=1&limit=20`, {
          cache: "force-cache",
        });
        const data = await res.json();
        if (isMounted) {
          setShops(data.data || []);
        }
      } catch (error) {
        console.error(`Failed to fetch ${category} shops:`, error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchShops();
    return () => {
      isMounted = false;
    };
  }, [category]);

  return (
    <div className="min-h-screen bg-gray-50">
      <ShopsHero title={title} heroImage={heroImage} />

      <div className="max-w-7xl mx-auto px-4 py-10">
        {serviceCategories.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-4">Service Categories</h2>

            <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory md:grid md:grid-cols-5 md:gap-6 md:overflow-visible">
              {serviceCategories.map((service) => {
                const Icon = service.icon || Sparkles;

                return (
                  <div
                    key={service.name}
                    className="min-w-[130px] shrink-0 rounded-full border border-emerald-100 bg-white px-4 py-5 text-center shadow-sm snap-start md:min-w-0"
                  >
                    <div className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <p className="text-sm font-medium text-gray-700 leading-tight">{service.name}</p>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {isLoading ? (
          <p className="text-center text-gray-500">Loading {title.toLowerCase()}...</p>
        ) : shops.length === 0 ? (
          <p className="text-center text-gray-500">No {title.toLowerCase()} available</p>
        ) : (
          <ShopsGrid shops={shops} isTransportation={isTransportation} ctaLabel={ctaLabel} />
        )}
      </div>
    </div>
  );
}
