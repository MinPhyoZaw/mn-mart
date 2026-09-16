"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Camera, Loader2, Search } from "lucide-react";
import { getItemRoute } from "../lib/getItemRoute";
import ProductDetailsModal from "./ProductDetailsModal";

type Shop = { _id: string; name: string };
type ShopReference = { _id?: string; name?: string; vendorId?: string } | string;
type SearchProduct = {
  _id: string;
  name: string;
  description?: string;
  price: number;
  image?: string;
  category?: string;
  wholesaleTiers?: { minQty: number; price: number }[];
  shopId?: ShopReference;
};

export default function SearchBar() {
  const [productQuery, setProductQuery] = useState("");
  const [shopQuery, setShopQuery] = useState("");
  const [products, setProducts] = useState<SearchProduct[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [productLoading, setProductLoading] = useState(false);
  const [shopLoading, setShopLoading] = useState(false);
  const [productSearched, setProductSearched] = useState(false);
  const [shopSearched, setShopSearched] = useState(false);
  const [productOpen, setProductOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<SearchProduct | null>(null);
  const [visionLoading, setVisionLoading] = useState(false);
  const [visionLabels, setVisionLabels] = useState<string[]>([]);
  const [visionCategory, setVisionCategory] = useState<string | null>(null);
  const [visionProducts, setVisionProducts] = useState<SearchProduct[]>([]);
  const [visionError, setVisionError] = useState("");
  const rootRef = useRef<HTMLDivElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const onDocumentClick = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setProductOpen(false);
        setShopOpen(false);
      }
    };
    document.addEventListener("click", onDocumentClick);
    return () => document.removeEventListener("click", onDocumentClick);
  }, []);

  useEffect(() => {
    const query = productQuery.trim();
    if (!query) {
      setProducts([]);
      setProductLoading(false);
      setProductSearched(false);
      setProductOpen(false);
      return;
    }

    const controller = new AbortController();
    setProductLoading(true);
    setProductSearched(false);
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(query)}&scope=products`,
          { signal: controller.signal }
        );
        const data = await response.json();
        if (!response.ok || !data?.success) throw new Error(data?.message || "Search failed");
        setProducts(data.data.products || []);
        setProductSearched(true);
        setProductOpen(true);
      } catch (error) {
        if (error instanceof Error && error.name !== "AbortError") console.error(error);
      } finally {
        if (!controller.signal.aborted) setProductLoading(false);
      }
    }, 300);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [productQuery]);

  useEffect(() => {
    const query = shopQuery.trim();
    if (!query) {
      setShops([]);
      setShopLoading(false);
      setShopSearched(false);
      setShopOpen(false);
      return;
    }

    const controller = new AbortController();
    setShopLoading(true);
    setShopSearched(false);
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(query)}&scope=shops`,
          { signal: controller.signal }
        );
        const data = await response.json();
        if (!response.ok || !data?.success) throw new Error(data?.message || "Search failed");
        setShops(data.data.shops || []);
        setShopSearched(true);
        setShopOpen(true);
      } catch (error) {
        if (error instanceof Error && error.name !== "AbortError") console.error(error);
      } finally {
        if (!controller.signal.aborted) setShopLoading(false);
      }
    }, 300);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [shopQuery]);

  const modalProduct = (product: SearchProduct) => {
    const shop = typeof product.shopId === "object" ? product.shopId : null;
    return {
      ...product,
      shopId: shop?._id || (typeof product.shopId === "string" ? product.shopId : ""),
      shopName: shop?.name,
      vendorId: shop?.vendorId,
    };
  };

  const openProduct = (product: SearchProduct) => {
    setSelectedProduct(modalProduct(product));
    setProductOpen(false);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setVisionLoading(true);
      setVisionError("");
      setVisionProducts([]);
      setVisionLabels([]);
      setVisionCategory(null);
      const formData = new FormData();
      formData.append("image", file);
      const response = await fetch("/api/vision-search", { method: "POST", body: formData });
      const data = await response.json();
      if (!response.ok || !data?.success) throw new Error(data?.message || "Image search failed");
      setVisionLabels(data.data?.labels || []);
      setVisionCategory(data.data?.mappedCategory || null);
      setVisionProducts(data.data?.products || []);
    } catch (error) {
      setVisionError(error instanceof Error ? error.message : "Unable to search with image");
    } finally {
      setVisionLoading(false);
      event.target.value = "";
    }
  };

  return (
    <div ref={rootRef} className="mx-auto w-full max-w-7xl px-3 py-3 sm:px-6">
      <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
        <section className="relative min-w-0" aria-label="Product Search">
          <label htmlFor="product-search" className="sr-only">Product Search</label>
          <div className="relative">
            <Search aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
            <input
              id="product-search"
              type="search"
              value={productQuery}
              onChange={(event) => setProductQuery(event.target.value)}
              onFocus={() => productQuery.trim() && setProductOpen(true)}
              placeholder="Products"
              aria-label="Product Search"
              role="combobox"
              aria-autocomplete="list"
              aria-controls="product-search-results"
              aria-expanded={productOpen}
              className="w-full min-w-0 rounded-full border border-gray-200 bg-white py-2.5 pl-9 pr-11 text-sm outline-none focus:border-green-500 sm:pr-12 sm:text-base"
            />
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              disabled={visionLoading}
              aria-label="Search products with an image"
              className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-60"
            >
              {visionLoading ? <Loader2 className="animate-spin" size={17} /> : <Camera size={17} />}
            </button>
            <input ref={imageInputRef} type="file" accept="image/*" capture="environment" onChange={handleImageUpload} className="hidden" />
          </div>

          {productOpen && productQuery.trim() && (
            <div id="product-search-results" role="listbox" aria-label="Product results" className="absolute left-0 right-0 z-50 mt-2 max-h-80 overflow-y-auto rounded-xl border bg-white p-1 shadow-lg">
              {productLoading ? <p className="px-3 py-4 text-sm text-gray-500">Searching products...</p> : null}
              {!productLoading && productSearched && products.length === 0 ? <p className="px-3 py-4 text-sm text-gray-500">No products found</p> : null}
              {!productLoading && products.map((product) => (
                <button key={product._id} type="button" role="option" aria-selected="false" onClick={() => openProduct(product)} className="flex w-full min-w-0 items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none">
                  <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-md bg-gray-100">
                    {product.image ? <Image src={product.image} alt={product.name} fill sizes="44px" className="object-cover" /> : null}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-gray-900">{product.name}</span>
                    {Number.isFinite(product.price) ? <span className="block text-xs text-gray-500">{Number(product.price).toLocaleString()} MMK</span> : null}
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="relative min-w-0" aria-label="Shop Search">
          <label htmlFor="shop-search" className="sr-only">Shop Search</label>
          <div className="relative">
            <Search aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
            <input id="shop-search" type="search" value={shopQuery} onChange={(event) => setShopQuery(event.target.value)} onFocus={() => shopQuery.trim() && setShopOpen(true)} placeholder="Shops" aria-label="Shop Search" role="combobox" aria-autocomplete="list" aria-controls="shop-search-results" aria-expanded={shopOpen} className="w-full min-w-0 rounded-full border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-green-500 sm:text-base" />
          </div>
          {shopOpen && shopQuery.trim() && (
            <div id="shop-search-results" role="listbox" aria-label="Shop results" className="absolute left-0 right-0 z-50 mt-2 max-h-80 overflow-y-auto rounded-xl border bg-white p-1 shadow-lg">
              {shopLoading ? <p className="px-3 py-4 text-sm text-gray-500">Searching shops...</p> : null}
              {!shopLoading && shopSearched && shops.length === 0 ? <p className="px-3 py-4 text-sm text-gray-500">No shops found</p> : null}
              {!shopLoading && shops.map((shop) => (
                <Link key={shop._id} href={getItemRoute(shop)} role="option" aria-selected="false" onClick={() => setShopOpen(false)} className="block truncate rounded-lg px-3 py-3 text-sm text-gray-800 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none">{shop.name}</Link>
              ))}
            </div>
          )}
        </section>
      </div>

      {(visionLoading || visionError || visionProducts.length > 0 || visionLabels.length > 0) && (
        <section aria-live="polite" className="mt-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          {visionLoading ? <div className="flex items-center gap-2 text-sm text-gray-600"><Loader2 className="animate-spin" size={16} /> Processing image search...</div> : null}
          {!visionLoading && visionError ? <p className="text-sm text-red-600">{visionError}</p> : null}
          {!visionLoading && !visionError ? (
            <>
              <p className="mb-3 text-sm text-gray-600">{visionLabels.length ? <>Labels: <span className="font-medium text-gray-800">{visionLabels.join(", ")}</span>{visionCategory ? <> · Category: <span className="font-medium text-gray-800">{visionCategory}</span></> : null}</> : "No similar products found"}</p>
              {visionProducts.length ? <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{visionProducts.map((product) => <button key={product._id} type="button" onClick={() => openProduct(product)} className="rounded-lg border border-gray-200 p-3 text-left hover:border-green-400"><p className="line-clamp-2 text-sm font-medium text-gray-900">{product.name}</p></button>)}</div> : visionLabels.length ? <p className="text-sm text-gray-500">No similar products found</p> : null}
            </>
          ) : null}
        </section>
      )}

      <ProductDetailsModal product={selectedProduct ? modalProduct(selectedProduct) : null} onClose={() => setSelectedProduct(null)} />
    </div>
  );
}
