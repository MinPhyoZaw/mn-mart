"use client";

import Link from "next/link";
import { ShoppingCart, Car, Hotel, Sparkles } from "lucide-react";

const categories = [
  {
    name: "Shopping",
    desc: "Buy from local shops",
    icon: <ShoppingCart size={22} />,
    link: "/shops",
    color: "bg-orange-500",
  },
  {
    name: "Transportation",
    desc: "Book travel easily",
    icon: <Car size={22} />,
    link: "/transportation",
    color: "bg-blue-500",
  },
  {
    name: "Hotel",
    desc: "Find best hotels",
    icon: <Hotel size={22} />,
    link: "/hotel",
    color: "bg-green-500",
  },
  {
    name: "Spa",
    desc: "Relax & refresh",
    icon: <Sparkles size={22} />,
    link: "/spa",
    color: "bg-pink-500",
  },
];

export default function Categories() {
  return (
    <div className="w-[92%] md:w-[90%] mx-auto py-8 md:py-10">
      
      {/* Title */}
      <h2 className="text-lg md:text-xl font-semibold mb-4 md:mb-6">
        Explore Services
      </h2>

      {/* Responsive Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">

        {categories.map((cat) => (
          <Link
            key={cat.name}
            href={cat.link}
            className="
              bg-white
              rounded-xl md:rounded-2xl
              shadow-sm
              hover:shadow-md
              transition
              p-3 md:p-4
              h-[90px] sm:h-[100px] md:h-[110px]
              flex items-center justify-between
              group
            "
          >

            {/* LEFT TEXT */}
            <div className="pr-2">
              <h3 className="text-xs sm:text-sm font-semibold text-gray-800 leading-tight">
                {cat.name}
              </h3>

              <p className="text-[10px] sm:text-xs text-gray-500 mt-1 line-clamp-2">
                {cat.desc}
              </p>
            </div>

            {/* RIGHT ICON */}
            <div
              className={`
                ${cat.color}
                text-white
                p-2 md:p-2.5
                rounded-full
                group-hover:scale-110
                transition
                shrink-0
              `}
            >
              {cat.icon}
            </div>

          </Link>
        ))}

      </div>
    </div>
  );
}