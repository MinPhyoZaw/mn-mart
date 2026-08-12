"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { compressItemImage } from "./vendor/ImageUtils";

export default function VendorForm() {
  const router = useRouter();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    vendorName: "",
    businessName: "",
    vendorType: "",
    phone: "",
    address: "",
    description: "",
    shopImage: "",
    kbzPayNumber: "",
    wavePayNumber: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  useEffect(() => {
    if (!user?.name) return;

    setFormData((prev) => ({
      ...prev,
      vendorName: user.name,
    }));
  }, [user?.name]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMessage("Please select a valid image file.");
      return;
    }

    setMessage("");
    setIsUploadingImage(true);

    try {
      const optimizedImage = await compressItemImage(file);
      setFormData((prev) => ({ ...prev, shopImage: optimizedImage }));
      setImagePreview(optimizedImage);
    } catch {
      setMessage("Unable to upload image. Please try another file.");
    } finally {
      setIsUploadingImage(false);
      e.target.value = "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const payload = {
        ...formData,
        userId: user?._id || undefined,
      };

      const res = await fetch("/api/vendor-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!data.success) {
        setMessage(data.message || "Submission failed");
      } else {
        setMessage("Vendor request submitted successfully!");
        setTimeout(() => router.push("/"), 1500);
      }
    } catch {
      setMessage("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
  <div className="min-h-screen bg-gradient-to-b from-emerald-50/70 via-white to-white px-4 py-8 sm:px-6 lg:px-8">
    <div className="mx-auto max-w-5xl">
      {/* Header */}
      <div className="mb-8 overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-700 via-green-600 to-teal-600 px-6 py-8 text-white shadow-xl sm:px-10 sm:py-10">
        <div className="max-w-2xl">
          <span className="inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur-sm">
            MN-Mart Vendor Program
          </span>

          <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
            Become a Vendor
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-6 text-emerald-50 sm:text-base">
            Grow your business with MN-Mart. Submit your business information
            and our team will review your vendor request.
          </p>
        </div>
      </div>

      {message && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          {/* Main form */}
          <div className="space-y-6">
            {/* Business Information */}
            <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
              <div className="mb-6">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">
                  Step 01
                </p>

                <h2 className="mt-1 text-xl font-semibold text-gray-900">
                  Business Information
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Tell us about you and your business.
                </p>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                {/* Vendor Name */}
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Vendor Name
                  </label>

                  <div className="relative">
                    <input
                      type="text"
                      name="vendorName"
                      readOnly
                      value={formData.vendorName}
                      className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 pr-24 text-sm text-gray-700 outline-none"
                    />

                    <span className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-gray-200 px-2.5 py-1 text-[11px] font-medium text-gray-600">
                      Verified
                    </span>
                  </div>

                  <p className="mt-2 text-xs text-gray-500">
                    Auto-filled from your sign-in profile.
                  </p>
                </div>

                {/* Business Name */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Business Name
                  </label>

                  <input
                    type="text"
                    name="businessName"
                    required
                    value={formData.businessName}
                    onChange={handleChange}
                    placeholder="e.g. Golden Fashion Store"
                    className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                  />
                </div>

                {/* Vendor Type */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Business Type
                  </label>

                  <select
                    name="vendorType"
                    required
                    value={formData.vendorType}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3.5 text-sm text-gray-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                  >
                    <option value="">Select business type</option>
                    <option value="shopping">Shop</option>
                    <option value="transportation">Transportation</option>
                    <option value="hotel">Hotel</option>
                    <option value="spa">Spa</option>
                  </select>
                </div>

                {/* Phone */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Business Phone
                  </label>

                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="09xxxxxxxxx"
                    className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3.5 text-sm outline-none transition placeholder:text-gray-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                  />
                </div>

                {/* Address */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Business Address
                  </label>

                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Enter your business location"
                    className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3.5 text-sm outline-none transition placeholder:text-gray-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                  />
                </div>

                {/* Description */}
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Business Description
                  </label>

                  <textarea
                    name="description"
                    rows={5}
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Tell customers what your business offers..."
                    className="w-full resize-none rounded-2xl border border-gray-200 bg-white px-4 py-3.5 text-sm outline-none transition placeholder:text-gray-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                  />
                </div>
              </div>
            </section>

            {/* Payment Information */}
            {formData.vendorType === "transportation" && (
              <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
                <div className="mb-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">
                    Step 02
                  </p>

                  <h2 className="mt-1 text-xl font-semibold text-gray-900">
                    Payment Information
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Add payment accounts customers can use when booking.
                  </p>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      KBZPay Number
                    </label>

                    <input
                      type="text"
                      name="kbzPayNumber"
                      value={formData.kbzPayNumber}
                      onChange={handleChange}
                      placeholder="09xxxxxxxxx"
                      className="w-full rounded-2xl border border-gray-200 px-4 py-3.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      WavePay Number
                    </label>

                    <input
                      type="text"
                      name="wavePayNumber"
                      value={formData.wavePayNumber}
                      onChange={handleChange}
                      placeholder="09xxxxxxxxx"
                      className="w-full rounded-2xl border border-gray-200 px-4 py-3.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                    />
                  </div>
                </div>
              </section>
            )}

            {/* Shop Image */}
            <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
              <div className="mb-6">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">
                  {formData.vendorType === "transportation"
                    ? "Step 03"
                    : "Step 02"}
                </p>

                <h2 className="mt-1 text-xl font-semibold text-gray-900">
                  Business Image
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Upload a clear image representing your shop or business.
                </p>
              </div>

              <label className="group flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-gray-200 bg-gray-50 px-5 py-10 text-center transition hover:border-emerald-400 hover:bg-emerald-50/40">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm">
                  <svg
                    className="h-6 w-6 text-emerald-600"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 16.5V19a2 2 0 002 2h14a2 2 0 002-2v-2.5M16 8l-4-4m0 0L8 8m4-4v12"
                    />
                  </svg>
                </div>

                <p className="mt-4 text-sm font-semibold text-gray-800">
                  Upload business image
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  JPG, PNG or WEBP recommended
                </p>

                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>

              {isUploadingImage && (
                <div className="mt-4 rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-600">
                  Uploading image...
                </div>
              )}

              {imagePreview && (
                <div className="mt-5 overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 p-2">
                  <div className="relative h-52 w-full overflow-hidden rounded-xl">
                    <Image
                      src={imagePreview}
                      alt="Shop preview"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                </div>
              )}
            </section>
          </div>

          {/* Desktop Sidebar */}
          <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">
            <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-600">
                Vendor Application
              </p>

              <h3 className="mt-2 text-lg font-semibold text-gray-900">
                Ready to grow with MN-Mart?
              </h3>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                Complete your business information and submit your request for
                review.
              </p>

              <div className="mt-5 space-y-4">
                {[
                  "Business details",
                  "Contact information",
                  "Business image",
                  "Admin review",
                ].map((item, index) => (
                  <div key={item} className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-700">
                      {index + 1}
                    </div>

                    <span className="text-sm text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl bg-gray-950 p-5 text-white shadow-lg">
              <p className="text-sm font-semibold">Why join MN-Mart?</p>

              <div className="mt-4 space-y-3 text-sm text-gray-300">
                <p>✓ Reach more local customers</p>
                <p>✓ Manage your own products</p>
                <p>✓ Receive customer orders</p>
                <p>✓ Build your digital storefront</p>
              </div>
            </div>
          </aside>
        </div>

        {/* Submit area */}
        <div className="mt-6 rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:flex sm:items-center sm:justify-between sm:gap-6 sm:p-6">
          <div>
            <h3 className="text-base font-semibold text-gray-900">
              Submit your vendor request
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              MN-Mart will review your information before activating your vendor account.
            </p>
          </div>

          <div className="mt-5 sm:mt-0 sm:min-w-[220px]">
            {!user && (
              <p className="mb-3 text-center text-xs text-amber-600 sm:text-left">
                Please log in before submitting.
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !user || isUploadingImage}
              className="w-full rounded-2xl bg-emerald-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Submitting Request..." : "Submit Vendor Request"}
            </button>
          </div>
        </div>
      </form>
    </div>
  </div>
);
}
