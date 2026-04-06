"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function VendorForm() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    vendorName: "",
    businessName: "",
    vendorType: "",
    phone: "",
    address: "",
    description: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
    const [user, setUser] = useState(null);

    useEffect(() => {
      const fetchUser = async () => {
        try {
          const res = await fetch('/api/auth/me');
          const data = await res.json();
          const signedInUser = data.user || null;
          setUser(signedInUser);
          setFormData((prev) => ({
            ...prev,
            vendorName: signedInUser?.name || "",
          }));
        } catch {
          setUser(null);
        }
      };

      fetchUser();
    }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
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
        
        <h2 className="text-3xl font-bold text-center mb-8 text-gray-800">
          Become a Vendor
        </h2>

        {message && (
          <div className="mb-6 text-center text-sm text-red-500">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Vendor Name (from signed-in account) */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Vendor Name
            </label>
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
          
          {/* Business Name */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Business Name
            </label>
            <input
              type="text"
              name="businessName"
              required
              value={formData.businessName}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Vendor Type Dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Vendor Type
            </label>
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

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Business Phone
            </label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Business Address
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Business Description
            </label>
            <textarea
              name="description"
              rows="4"
              value={formData.description}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Submit Button */}
            {!user && (
              <div className="mb-4 text-center text-sm text-yellow-600">
                Only logged in users can request to become a vendor. Please log in.
              </div>
            )}
          <button
            type="submit"
            disabled={loading || !user}
            className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition duration-200 shadow-md"
          >
            {loading ? "Submitting..." : "Submit Request"}
          </button>
        </form>
      </div>
    </div>
  );
}
