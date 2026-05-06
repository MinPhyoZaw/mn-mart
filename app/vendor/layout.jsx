"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const MENU = {
  shop: [
    { href: "/vendor/shop/dashboard", label: "Dashboard" },
    { href: "/vendor/shop/products", label: "Products" },
  ],
  transport: [
    { href: "/vendor/transport/dashboard", label: "Dashboard" },
    { href: "/vendor/transport/routes", label: "Routes" },
    { href: "/vendor/transport/tickets", label: "Tickets" },
  ],
  hotel: [
    { href: "/vendor/hotel/dashboard", label: "Dashboard" },
    { href: "/vendor/hotel/rooms", label: "Rooms" },
  ],
  spa: [
    { href: "/vendor/spa/dashboard", label: "Dashboard" },
    { href: "/vendor/spa/services", label: "Services" },
    { href: "/vendor/spa/bookings", label: "Bookings" },
  ],
};

export default function VendorLayout({ children }) {
  const pathname = usePathname();
  const vendorType = pathname?.split("/")[2] || "";
  const menu = MENU[vendorType] || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 p-4 md:grid-cols-[240px_1fr]">
        <aside className="rounded-xl border bg-white p-4 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold capitalize">{vendorType || "Vendor"} Panel</h2>
          <nav className="space-y-1">
            {menu.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block rounded-lg px-3 py-2 text-sm ${active ? "bg-green-100 text-green-700" : "text-gray-700 hover:bg-gray-100"}`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <main className="rounded-xl border bg-white p-4 shadow-sm">{children}</main>
      </div>
    </div>
  );
}
