"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.message || "Login failed");
      } else {
        window.dispatchEvent(new Event("auth-changed"));
        router.push("/");
        router.refresh();
      }
    } catch (err) {
      setError("Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
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

            <h2 className="text-xl md:text-2xl font-bold text-center mb-8 text-gray-800 font-['Raleway']">
              Welcome to Manaw Mart
            </h2>

            {error && (
              <p className="bg-red-100 text-red-700 p-2 mb-4 rounded text-sm text-center">
                {error}
              </p>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block mb-1 text-gray-600 text-sm">
                  Email
                </label>

                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block mb-1 text-gray-600 text-sm">
                  Password
                </label>

                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full border border-gray-300 rounded-md pl-3 pr-11 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-gray-500 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-red-500"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>

                {/* Forgot Password */}
                <div className="flex justify-end mt-2">
                  <Link
                    href="/forgot-password"
                    className="text-sm text-red-500 hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-black text-white py-2 rounded-md hover:bg-gray-800 transition duration-200 disabled:opacity-60"
              >
                {loading ? "Logging in..." : "Login"}
              </button>
            </form>

            <p className="mt-6 text-gray-600 text-sm text-center">
              Don&apos;t have an account?{" "}
              <Link
                href="/signup"
                className="text-red-500 hover:underline"
              >
                Sign Up
              </Link>
            </p>

          </div>
        </div>
      </div>
    </div>
  );
}
