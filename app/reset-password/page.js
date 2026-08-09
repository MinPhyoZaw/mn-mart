"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setMessage("");

    // Check token
    if (!token) {
      setError("Invalid password reset link.");
      return;
    }

    // Check password length
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    // Check passwords match
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || "Unable to reset password.");
        return;
      }

      setMessage("Password reset successfully! Redirecting to login...");

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err) {
      console.error(err);
      setError("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-4xl bg-white rounded-lg overflow-hidden shadow-lg md:flex">

        {/* Left Image */}
        <div
          className="md:w-1/2 h-64 md:h-auto bg-cover bg-center"
          style={{
            backgroundImage: "url('/images/login-sample.png')",
          }}
        ></div>

        {/* Right Form */}
        <div className="md:w-1/2 flex items-center justify-center p-10">
          <div className="w-full max-w-sm">

            <h2 className="text-xl md:text-2xl font-bold text-center mb-3 text-gray-800 font-['Raleway']">
              Reset Password
            </h2>

            <p className="text-sm text-gray-500 text-center mb-8">
              Enter your new password below.
            </p>

            {/* Invalid Token */}
            {!token && (
              <div className="bg-red-100 text-red-700 p-3 mb-4 rounded-md text-sm text-center">
                Invalid password reset link.
              </div>
            )}

            {/* Success Message */}
            {message && (
              <div className="bg-green-100 text-green-700 p-3 mb-4 rounded-md text-sm text-center">
                {message}
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-100 text-red-700 p-3 mb-4 rounded-md text-sm text-center">
                {error}
              </div>
            )}

            {token && !message && (
              <form onSubmit={handleSubmit} className="space-y-5">

                {/* New Password */}
                <div>
                  <label className="block mb-1 text-gray-600 text-sm">
                    New Password
                  </label>

                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block mb-1 text-gray-600 text-sm">
                    Confirm Password
                  </label>

                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) =>
                      setConfirmPassword(e.target.value)
                    }
                    placeholder="Confirm new password"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-black text-white py-2 rounded-md hover:bg-gray-800 transition duration-200 disabled:opacity-50"
                >
                  {loading ? "Resetting..." : "Reset Password"}
                </button>

              </form>
            )}

            {/* Back to login */}
            <p className="mt-6 text-gray-600 text-sm text-center">
              <Link
                href="/login"
                className="text-red-500 hover:underline"
              >
                ← Back to Login
              </Link>
            </p>

          </div>
        </div>
      </div>
    </div>
  );
}