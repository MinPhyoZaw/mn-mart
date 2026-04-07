"use client";

import Link from "next/link";
import { Menu, ShoppingCart, User, X } from "lucide-react";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useCart } from "../context/CartContext";

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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


  const closeMenu = () => setIsMenuOpen(false);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    window.dispatchEvent(new Event("auth-changed"));
    setIsMenuOpen(false);
    router.push("/");
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-100/80 bg-white/95 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            <span className="font-[var(--font-raleway)] text-green-600">MN</span>
            <span className="font-[var(--font-raleway)] text-red-500">Mart</span>
          </Link>

          <div className="hidden items-center gap-2 md:flex">
            {!user ? (
              <>
                <Link
                  href="/login"
                  onClick={closeMenu}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 hover:text-green-600"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  onClick={closeMenu}
                  className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700"
                >
                  Sign Up
                </Link>
              </>
            ) : (
              <>
                {user.role === "admin" && (
                  <Link
                    href="/admindashboard"
                    onClick={closeMenu}
                    className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 hover:text-green-600"
                  >
                    Admin
                  </Link>
                )}

                {user.role === "vendor" && (
                  <Link
                    href="/vendordashboard"
                    onClick={closeMenu}
                    className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 hover:text-green-600"
                  >
                    Vendor Dashboard
                  </Link>
                )}

                <Link
                  href="/account"
                  onClick={closeMenu}
                  className="rounded-full p-2 text-gray-700 transition hover:bg-gray-100"
                  aria-label="Open account"
                >
                  <User size={21} className="rounded-full" />
                </Link>

                <button
                  onClick={() => {
                    toggleCart();
                    closeMenu();
                  }}
                  className="relative rounded-full p-2 text-gray-700 transition hover:bg-gray-100"
                  aria-label="Open shopping cart"
                >
                  <ShoppingCart size={21} />
                  <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-green-600 px-1.5 py-0.5 text-center text-xs font-bold text-white">
                    {totalItems}
                  </span>
                </button>

                <button
                  onClick={handleLogout}
                  className="rounded-lg px-3 py-2 text-sm font-semibold text-red-500 transition hover:bg-red-50 hover:text-red-600"
                >
                  Logout
                </button>
              </>
            )}
          </div>

          <button
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className="rounded-lg p-2 text-gray-700 transition hover:bg-gray-100 md:hidden"
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          >
            {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <div className="border-t border-gray-100 bg-white px-4 pb-4 pt-3 shadow-sm md:hidden">
          <div className="flex flex-col gap-2">
            {!user ? (
              <>
                <Link
                  href="/login"
                  onClick={closeMenu}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 hover:text-green-600"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  onClick={closeMenu}
                  className="rounded-lg bg-green-600 px-3 py-2 text-center text-sm font-semibold text-white transition hover:bg-green-700"
                >
                  Sign Up
                </Link>
              </>
            ) : (
              <>
                {user.role === "admin" && (
                  <Link
                    href="/admindashboard"
                    onClick={closeMenu}
                    className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 hover:text-green-600"
                  >
                    Admin
                  </Link>
                )}

                {user.role === "vendor" && (
                  <Link
                    href="/vendordashboard"
                    onClick={closeMenu}
                    className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 hover:text-green-600"
                  >
                    Vendor Dashboard
                  </Link>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/account"
                    onClick={closeMenu}
                    className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700"
                  >
                    <User size={18} /> Account
                  </Link>

                  <button
                    onClick={() => {
                    toggleCart();
                    closeMenu();
                  }}
                    className="relative flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700"
                    aria-label="Open shopping cart"
                  >
                    <ShoppingCart size={18} /> Cart
                    <span className="absolute right-2 top-1 min-w-5 rounded-full bg-green-600 px-1.5 py-0.5 text-center text-[10px] font-bold text-white">
                      {totalItems}
                    </span>
                  </button>
                </div>

                <button
                  onClick={handleLogout}
                  className="rounded-lg px-3 py-2 text-left text-sm font-semibold text-red-500 transition hover:bg-red-50 hover:text-red-600"
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
