"use client";

import Link from "next/link";
import { ShoppingCart, User } from "lucide-react";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

export default function Navbar() {
  const [user, setUser] = useState(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        const data = await res.json();
        setUser(data.user);
      } catch {
        setUser(null);
      }
    };

    fetchUser();

    const syncAuth = () => {
      fetchUser();
    };

    window.addEventListener("auth-changed", syncAuth);
    return () => window.removeEventListener("auth-changed", syncAuth);
  }, [pathname]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    window.dispatchEvent(new Event("auth-changed"));
    router.push("/");
  };

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo */}
          <Link href="/" className="text-3xl font-extrabold tracking-tight">
            <span className="text-green-500 font-['Raleway']">MN</span>
            <span className="text-red-500 font-['Raleway']">Mart</span>
          </Link>

          {/* Right Side */}
          <div className="flex items-center gap-4">

            {/* If NOT Logged In */}
            {!user && (
              <>
                <Link
                  href="/login"
                  className="text-sm font-medium text-gray-700 hover:text-yellow-600 transition"
                >
                  Login
                </Link>

                <Link
                  href="/signup"
                  className="bg-green-500 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-green-600 transition shadow-sm"
                >
                  Sign Up
                </Link>
              </>
            )}

            {/* If Logged In */}
            {user && (
              <>
                {user.role === "admin" && (
                  <Link
                    href="/admindashboard"
                    className="text-sm font-medium text-gray-700 hover:text-yellow-600 transition"
                  >
                    Admin
                  </Link>
                )}

                {/* Account Icon */}
                <Link
                  href="/account"
                  className="p-2 rounded-full hover:bg-gray-100 transition"
                >
                  <User size={22} className="text-gray-700 rounded-full" />
                </Link>

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  className="text-sm font-medium text-red-500 hover:text-red-600 transition"
                >
                  Logout
                </button>
              </>
            )}

            {/* Cart Icon */}
            <Link
              href="/cart"
              className="relative p-2 rounded-full hover:bg-gray-100 transition"
            >
              <ShoppingCart size={22} className="text-gray-700" />
              <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                2
              </span>
            </Link>

          </div>
        </div>
      </div>
    </nav>
  );
}
