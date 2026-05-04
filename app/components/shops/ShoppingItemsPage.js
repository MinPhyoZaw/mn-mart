"use client";

import { useEffect, useState } from "react";
import ShopsHero from "./ShopsHero";
import ShoppingItemCard from "./ShoppingItemCard";

export default function ShoppingItemsPage({ title, heroImage }) {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchItems = async () => {
      try {
        setIsLoading(true);
        const res = await fetch("/api/items?shopCategory=shopping", { cache: "force-cache" });
        const data = await res.json();

        if (isMounted) {
          const allItems = data.data || [];
          const randomizedItems = [...allItems].sort(() => Math.random() - 0.5);
          setItems(randomizedItems);
        }
      } catch (error) {
        console.error("Failed to fetch shopping items:", error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchItems();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <ShopsHero title={title} heroImage={heroImage} />

      <div className="max-w-7xl mx-auto px-4 py-10">
        {isLoading ? (
          <p className="text-center text-gray-500">Loading shopping items...</p>
        ) : items.length === 0 ? (
          <p className="text-center text-gray-500">No shopping items available</p>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 md:gap-5">
            {items.map((item) => (
              <ShoppingItemCard key={item._id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
