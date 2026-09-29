"use client";

import Image from "next/image";
import { ImageIcon, LoaderCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { compressShopBannerBlob } from "./ImageUtils";

const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_SOURCE_BYTES = 10 * 1024 * 1024;

export default function ShopImageManager({ shop, onShopUpdated }) {
  const inputRef = useRef(null);
  const uploadLockRef = useRef(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [status, setStatus] = useState({ type: "", message: "" });
  const [uploading, setUploading] = useState(false);

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const clearSelection = () => {
    setSelectedImage(null);
    setPreviewUrl("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setStatus({ type: "", message: "" });
    if (!ACCEPTED_TYPES.has(file.type)) {
      clearSelection();
      setStatus({ type: "error", message: "Please select a JPG, PNG, or WebP image." });
      return;
    }
    if (file.size > MAX_SOURCE_BYTES) {
      clearSelection();
      setStatus({ type: "error", message: "Image source size must be 10 MB or less." });
      return;
    }

    try {
      const compressed = await compressShopBannerBlob(file);
      setSelectedImage(compressed);
      setPreviewUrl(URL.createObjectURL(compressed));
    } catch {
      clearSelection();
      setStatus({ type: "error", message: "Unable to process this image. Please choose another file." });
    }
  };

  const handleSave = async () => {
    if (!selectedImage || uploadLockRef.current) return;
    uploadLockRef.current = true;
    setUploading(true);
    setStatus({ type: "", message: "" });

    try {
      const formData = new FormData();
      formData.append("image", selectedImage, "shop-banner.webp");
      const response = await fetch("/api/vendor/shop-image", { method: "POST", body: formData });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || "Unable to update shop image.");

      onShopUpdated(data.data.shop);
      clearSelection();
      setStatus({ type: "success", message: "Shop image updated successfully." });
    } catch (error) {
      setStatus({ type: "error", message: error?.message || "Unable to update shop image. Please try again." });
    } finally {
      uploadLockRef.current = false;
      setUploading(false);
    }
  };

  const banner = (src, alt) => (
    <div className="relative aspect-[3/1] w-full overflow-hidden rounded-xl bg-gray-100">
      {src ? (
        <Image src={src} alt={alt} fill sizes="(max-width: 768px) 100vw, 720px" className="object-cover" unoptimized={src.startsWith("blob:")} />
      ) : (
        <div className="flex h-full items-center justify-center gap-2 text-sm text-gray-500">
          <ImageIcon aria-hidden="true" className="h-5 w-5" /> No shop image
        </div>
      )}
    </div>
  );

  return (
    <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm" aria-labelledby="shop-image-heading">
      <h2 id="shop-image-heading" className="text-sm font-semibold text-gray-900">Shop Image</h2>
      <p className="mt-1 text-sm text-gray-500">Recommended size: 1200 × 400 px (3:1). JPG, PNG or WebP.</p>
      <div className="mt-4">
        <p className="mb-2 text-sm font-medium text-gray-700">Current Shop Image</p>
        {banner(shop.image, `${shop.name} shop banner`)}
      </div>

      {previewUrl ? (
        <div className="mt-5">
          <p className="mb-2 text-sm font-medium text-gray-700">New Image Preview</p>
          {banner(previewUrl, "New shop banner preview")}
          <div className="mt-4 flex flex-wrap gap-3">
            <button type="button" onClick={clearSelection} disabled={uploading} className="rounded-lg border border-gray-300 px-4 py-2 font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60">Cancel</button>
            <button type="button" onClick={handleSave} disabled={uploading} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
              {uploading ? <><LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" /> Uploading...</> : "Save Image"}
            </button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => inputRef.current?.click()} className="mt-4 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white transition hover:bg-blue-700">Change Shop Image</button>
      )}

      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleSelect} className="sr-only" aria-label="Choose a new shop image" />
      {status.message ? <p role="status" className={`mt-3 text-sm ${status.type === "success" ? "text-green-700" : "text-red-600"}`}>{status.message}</p> : null}
    </section>
  );
}
