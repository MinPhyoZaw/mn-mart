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
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-[90%] max-w-2xl bg-white shadow-xl rounded-2xl p-8">
        <h2 className="text-3xl font-bold text-center mb-8 text-gray-800">Become a Vendor</h2>

        {message && (
          <div className="mb-6 text-center text-sm text-red-500">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Vendor Name</label>
            <input
              type="text"
              name="vendorName"
              readOnly
              value={formData.vendorName}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-gray-100 text-gray-700 cursor-not-allowed"
            />
            <p className="mt-1 text-xs text-gray-500">
              Auto-filled from your sign-in profile for consistent vendor verification.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Business Name</label>
            <input
              type="text"
              name="businessName"
              required
              value={formData.businessName}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Vendor Type</label>
            <select
              name="vendorType"
              required
              value={formData.vendorType}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">Select Type</option>
              <option value="shopping">Shop</option>
              <option value="transportation">Transportation</option>
              <option value="hotel">Hotel</option>
              <option value="spa">Spa</option>
            </select>
          </div>

          {formData.vendorType === "transportation" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">KBZ Pay Number</label>
                <input
                  type="text"
                  name="kbzPayNumber"
                  value={formData.kbzPayNumber}
                  onChange={handleChange}
                  placeholder="e.g. 09xxxxxxxxx"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Wave Pay Number</label>
                <input
                  type="text"
                  name="wavePayNumber"
                  value={formData.wavePayNumber}
                  onChange={handleChange}
                  placeholder="e.g. 09xxxxxxxxx"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Business Phone</label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Business Address</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Business Description</label>
            <textarea
              name="description"
              rows="4"
              value={formData.description}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Shop Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white"
            />
            <p className="mt-1 text-xs text-gray-500">
              Upload your main shop photo to show in your vendor request.
            </p>
            {isUploadingImage && <p className="text-xs text-blue-600 mt-2">Uploading image...</p>}
            {imagePreview && (
              <div className="mt-3 rounded-lg border border-gray-200 p-2 bg-gray-50">
                <div className="relative h-40 w-full">
                  <Image src={imagePreview} alt="Shop preview" fill className="object-cover rounded-md" unoptimized />
                </div>
              </div>
            )}
          </div>

          {!user && (
            <div className="mb-4 text-center text-sm text-yellow-600">
              Only logged in users can request to become a vendor. Please log in.
            </div>
          )}
          <button
            type="submit"
            disabled={loading || !user || isUploadingImage}
            className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition duration-200 shadow-md disabled:opacity-70"
          >
            {loading ? "Submitting..." : "Submit Request"}
          </button>
        </form>
      </div>
    </div>
  );
}
