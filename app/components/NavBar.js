"use client";

import Link from "next/link";
import { ShoppingCart, User } from "lucide-react";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useCart } from "../context/CartContext";

export default function Navbar() {
  const [user, setUser] = useState(null);
  const router = useRouter();
  const pathname = usePathname();
  const { totalItems, toggleCart } = useCart();

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
          <Link href="/" className="text-3xl font-extrabold tracking-tight">
            <span className="text-green-500 font-['Raleway']">MN</span>
            <span className="text-red-500 font-['Raleway']">Mart</span>
          </Link>

          <div className="flex items-center gap-4">
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

                {user.role === "vendor" && (
                  <Link
                    href="/vendordashboard"
                    className="text-sm font-medium text-gray-700 hover:text-yellow-600 transition"
                  >
                    Vendor Dashboard
                  </Link>
                )}

                <Link
                  href="/account"
                  className="p-2 rounded-full hover:bg-gray-100 transition"
                >
                  <User size={22} className="text-gray-700 rounded-full" />
                </Link>

                <button
                  onClick={handleLogout}
                  className="text-sm font-medium text-red-500 hover:text-red-600 transition"
                >
                  Logout
                </button>
              </>
            )}

            <button
              onClick={toggleCart}
              className="relative p-2 rounded-full hover:bg-gray-100 transition"
              aria-label="Open shopping cart"
            >
              <ShoppingCart size={22} className="text-gray-700" />
              <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-5 text-center">
                {totalItems}
              </span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
