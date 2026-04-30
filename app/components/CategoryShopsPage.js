"use client";

import { useEffect, useState } from "react";
import ShopsHero from "./shops/ShopsHero";
import ShopsGrid from "./shops/ShopsGrid";

export default function CategoryShopsPage({
  category,
  title,
  heroImage,
  ctaLabel = "Book Now",
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
