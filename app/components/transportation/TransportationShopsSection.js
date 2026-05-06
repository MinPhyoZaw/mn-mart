"use client";

import { useEffect, useState } from "react";
import ShopsGrid from "../shops/ShopsGrid";

export default function TransportationShopsSection() {
  const [shops, setShops] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchShops = async () => {
      try {
        setIsLoading(true);
        const res = await fetch("/api/shops?category=transportation&page=1&limit=20", {
          cache: "force-cache",
        });
        const data = await res.json();
        if (isMounted) setShops(data?.data || []);
      } catch (error) {
        console.error("Failed to fetch transportation shops:", error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchShops();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="px-4 md:px-10 pb-4">
      <div className="mx-auto max-w-7xl">
        <h2 className="text-center text-2xl font-bold mb-6">Available Car Operators</h2>
        {isLoading ? (
          <p className="text-center text-gray-500">Loading car operators...</p>
        ) : shops.length === 0 ? (
          <p className="text-center text-gray-500">No transportation shops available</p>
        ) : (
          <ShopsGrid shops={shops} isTransportation ctaLabel="See more" />
        )}
      </div>
    </section>
  );
}
