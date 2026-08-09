"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setMessage("");
    setError("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Something went wrong");
        return;
      }

      setMessage(
        data.message || "Password reset link has been sent."
      );
    } catch (err) {
      setError("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white shadow-lg rounded-xl p-8">

        <h1 className="text-2xl font-bold text-center text-gray-800">
          Forgot Password?
        </h1>

        <p className="text-sm text-gray-500 text-center mt-2 mb-6">
          Enter your email address and we'll send you a link to
          reset your password.
        </p>

        {message && (
          <div className="bg-green-100 text-green-700 text-sm p-3 rounded-md mb-4">
            {message}
          </div>
        )}

        {error && (
          <div className="bg-red-100 text-red-700 text-sm p-3 rounded-md mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label className="block text-sm text-gray-600 mb-1">
            Email Address
          </label>

          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@gmail.com"
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-5 bg-black text-white py-2 rounded-md hover:bg-gray-800 transition disabled:opacity-50"
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        <div className="text-center mt-6">
          <Link
            href="/login"
            className="text-sm text-red-500 hover:underline"
          >
            ← Back to Login
          </Link>
        </div>

      </div>
    </div>
  );
}