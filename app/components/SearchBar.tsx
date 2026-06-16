"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { getItemRoute } from "../lib/getItemRoute";
import { useRouter } from "next/navigation";
import { Camera, Loader2, Search } from "lucide-react";

type Shop = { _id: string; name: string };
type SearchProduct = { _id: string; name: string; shopId?: { _id?: string; name?: string } | string };

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [shops, setShops] = useState<Shop[]>([]);
  const [products, setProducts] = useState<SearchProduct[]>([]);
  const [open, setOpen] = useState(false);
  const [visionLoading, setVisionLoading] = useState(false);
  const [visionLabels, setVisionLabels] = useState<string[]>([]);
  const [visionCategory, setVisionCategory] = useState<string | null>(null);
  const [visionProducts, setVisionProducts] = useState<SearchProduct[]>([]);
  const [visionError, setVisionError] = useState("");
  const timerRef = useRef<number | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
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

  const handleOpenImageInput = () => {
    imageInputRef.current?.click();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setVisionLoading(true);
      setVisionError("");
      setVisionProducts([]);
      setVisionLabels([]);
      setVisionCategory(null);

      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch("/api/vision-search", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data?.success) {
        throw new Error(data?.message || "Image search failed");
      }

      setVisionLabels(data?.data?.labels || []);
      setVisionCategory(data?.data?.mappedCategory || null);
      setVisionProducts(data?.data?.products || []);
      setOpen(false);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unable to search with image";
      setVisionError(message);
    } finally {
      setVisionLoading(false);
      e.target.value = "";
    }
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
            placeholder="Search shops & products..."
className="
  w-full
  rounded-full
  border border-gray-200
  bg-white
  pl-4
  pr-24 sm:pr-48
  py-2.5
  text-sm sm:text-base
  placeholder:text-xs sm:placeholder:text-sm
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
              type="button"
              onClick={handleOpenImageInput}
              disabled={visionLoading}
              className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 p-2 rounded-full transition disabled:opacity-60"
              aria-label="Search with image"
            >
              {visionLoading ? <Loader2 size={18} className="animate-spin" /> : <Camera size={18} />}
            </button>

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
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
            </button>

          </div>

          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleImageUpload}
            className="hidden"
          />
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
                        href={getItemRoute(s)}
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
                    {products.map((p) => (
                      <Link
                        key={p._id}
                        href={`${getItemRoute(p.shopId)}?product=${p._id}`}
                        onClick={() => setOpen(false)}
                        className="block px-3 py-2 hover:bg-gray-50"
                      >
                        <div className="text-sm text-gray-800">{p.name}</div>
                        <div className="text-xs text-gray-500">{typeof p.shopId === "object"
    ? p.shopId?.name
    : "Shop"}</div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        {(visionLoading || visionError || visionProducts.length > 0 || visionLabels.length > 0) && (
          <div className="mt-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            {visionLoading && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Loader2 className="animate-spin" size={16} /> Processing image search...
              </div>
            )}

            {!visionLoading && visionError && <p className="text-sm text-red-600">{visionError}</p>}

            {!visionLoading && !visionError && (
              <>
                <div className="mb-3 text-sm text-gray-600">
                  {visionLabels.length > 0 ? (
                    <>
                      Labels: <span className="font-medium text-gray-800">{visionLabels.join(", ")}</span>
                      {visionCategory ? (
                        <span> · Category: <span className="font-medium text-gray-800">{visionCategory}</span></span>
                      ) : null}
                    </>
                  ) : (
                    "No similar products found"
                  )}
                </div>

                {visionProducts.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {visionProducts.map((p) => (
                      <Link
                        key={p._id}
                        href={`${getItemRoute(p.shopId)}?product=${p._id}`}
                        className="rounded-lg border border-gray-200 p-3 hover:border-green-400 hover:shadow-sm transition"
                      >
                        <p className="text-sm font-medium text-gray-900 line-clamp-2">{p.name}</p>
                        <p className="mt-1 text-xs text-gray-500">{typeof p.shopId === "object" ? p.shopId?.name : ""}</p>
                      </Link>
                    ))}
                  </div>
                ) : (
                  visionLabels.length > 0 && <p className="text-sm text-gray-500">No similar products found</p>
                )}
              </>
            )}
          </div>
        )}

      </form>
    </div>
  );
}
