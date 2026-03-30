"use client";

import Link from "next/link";
import { CheckCircle } from "lucide-react";
import { useState, useEffect } from "react";

export default function PromoBanner() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    setIsLoggedIn(!!token);
  }, []);

  const handleClick = () => {
    if (!isLoggedIn) {
      setShowAuthModal(true);
    }
  };

  return (
    <div className="w-full flex justify-center mt-8">
      <div className="relative w-[95%] lg:w-[90%] h-[260px] sm:h-[320px] md:h-[380px] lg:h-[420px] rounded-2xl overflow-hidden shadow-xl">
        
        {/* Background */}
        <div
          className="absolute inset-0 bg-cover bg-center md:bg-right"
          style={{ backgroundImage: "url('/images/mn-banner.png')" }}
        />

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />

        {/* Content */}
        <div className="relative h-full flex items-center px-6 md:px-16">
          <div className="max-w-md text-left text-white">
            
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="text-green-400 w-6 h-6" />
              <span className="text-xl font-bold">MN Mart</span>
            </div>

            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 font-['Raleway']">
              Discover Local Vendors
            </h2>

            <p className="text-sm sm:text-base mb-5 text-white/90">
              Start your vendor journey with us today and connect with your community like never before.
            </p>

            {/* Button */}
            {isLoggedIn ? (
              <Link
                href="/vendorForm"
                className="inline-block bg-green-500 hover:bg-green-600 transition px-5 py-2.5 rounded-lg font-semibold shadow-md text-sm sm:text-base"
              >
                Become a Vendor
              </Link>
            ) : (
              <button
                onClick={handleClick}
                className="inline-block bg-green-500 hover:bg-green-600 transition px-5 py-2.5 rounded-lg font-semibold shadow-md text-sm sm:text-base"
              >
                Become a Vendor
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 🔥 Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-[90%] max-w-sm text-center shadow-lg">
            
            <h3 className="text-lg font-semibold mb-3">
              You must sign in to become a vendor
            </h3>

            <p className="text-sm text-gray-600 mb-5">
              Please login or create an account to continue.
            </p>

            <div className="flex gap-3 justify-center">
              <Link
                href="/login"
                className="bg-blue-500 text-white px-4 py-2 rounded-lg"
              >
                Login
              </Link>

              <Link
                href="/signup"
                className="bg-green-500 text-white px-4 py-2 rounded-lg"
              >
                Sign Up
              </Link>
            </div>

            <button
              onClick={() => setShowAuthModal(false)}
              className="mt-4 text-sm text-gray-500 hover:underline"
            >
              Cancel
            </button>

          </div>
        </div>
      )}
    </div>
  );
}