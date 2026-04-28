"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

type Shop = { _id: string; name: string };

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [shops, setShops] = useState<Shop[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const timerRef = useRef<number | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setShops([]);
      setProducts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        if (data?.success) {
          setShops(data.data.shops || []);
          setProducts(data.data.products || []);
          setOpen(true);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [query]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/shops?search=${encodeURIComponent(query)}`);
    setOpen(false);
  };

  return (
    <div ref={rootRef} className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-3">
      <form onSubmit={onSubmit} className="relative">

        {/* INPUT WRAPPER */}
        <div className="relative">

          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => query.trim() && setOpen(true)}
            placeholder="Search shops and products..."
            className="
              w-full
              rounded-full
              border border-gray-200
              bg-white
              pl-4
              pr-36   /* 👈 space for right content */
              py-2.5
              shadow-sm
              focus:outline-none
              focus:ring-2
              focus:ring-green-200
            "
          />

          {/* RIGHT SIDE (inside input) */}
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">

            {/* MN-Mart Badge */}
            <div className="hidden sm:flex items-center bg-green-500 px-3 py-1 rounded-sm">
              <span className="text-xs  font-semibold text-white">
                MN-Mart
              </span>
            </div>

            {/* Search Button */}
            <button
              type="submit"
              className="
                bg-green-500
                hover:bg-green-600
                text-white
                p-2
                rounded-full
                transition
              "
            >
              <Search size={18} />
            </button>

          </div>
        </div>

        {/* DROPDOWN */}
        {open && (shops.length > 0 || products.length > 0) && (
          <div className="absolute left-0 right-0 mt-2 z-50 rounded-lg border bg-white shadow-lg">
            <div className="p-2">

              {shops.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 px-2">Shops</p>
                  <div className="divide-y">
                    {shops.map((s) => (
                      <Link
                        key={s._id}
                        href={`/shops/${s._id}`}
                        onClick={() => setOpen(false)}
                        className="block px-3 py-2 hover:bg-gray-50"
                      >
                        <div className="text-sm text-gray-800">{s.name}</div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {products.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs font-semibold text-gray-500 px-2">Products</p>
                  <div className="divide-y">
                    {products.map((p: any) => (
                      <Link
                        key={p._id}
                        href={`/shops/${p.shopId?._id || p.shopId}?product=${p._id}`}
                        onClick={() => setOpen(false)}
                        className="block px-3 py-2 hover:bg-gray-50"
                      >
                        <div className="text-sm text-gray-800">{p.name}</div>
                        <div className="text-xs text-gray-500">{p.shopId?.name || ""}</div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

      </form>
    </div>
  );
}