"use client";

import { Home, ShoppingCart, Plane, Briefcase, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function MobileBottomBar() {
  const pathname = usePathname();

  const navItems = [
    { icon: Home, label: "Home", href: "/" },
    { icon: ShoppingCart, label: "Shop", href: "/shops" },
    { icon: Plane, label: "Travel", href: "/travel" },
    { icon: Briefcase, label: "Services", href: "/services" },
    { icon: User, label: "Account", href: "/account" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 sm:hidden z-50">
      <div className="flex justify-around items-center py-3">
        {navItems.map((item, idx) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={idx}
              href={item.href}
              className={`flex flex-col items-center justify-center text-xs transition-colors ${
                isActive ? "text-green-600" : "text-gray-500"
              }`}
            >
              <Icon size={22} />
              <span className="mt-1">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}