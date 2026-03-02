"use client";

import Link from "next/link";
import { ShoppingCart, Car, Hotel, Sparkles } from "lucide-react";

const categories = [
  {
    name: "Shopping",
    image: "/images/shopping-girl.png",
    hoverImage: "/images/kachin-2.jpg",
    link: "/shops",
    icon: <ShoppingCart size={28} />,
    backColor: "bg-red-500",
    service:"shop now",
  },
  {
    name: "Transportation",
    image: "/images/promo-2.png",
    hoverImage: "/images/car-ticket-2.jpg",
    link: "/car-tickets",
    icon: <Car size={28} />,
    backColor: "bg-blue-500",
    service:"book now",
  },
  {
    name: "Hotel",
    image: "/images/mn-hotel.jpg",
    hoverImage: "/images/hotel-2.jpg",
    link: "/hotels",
    icon: <Hotel size={28} />,
    backColor: "bg-green-500",
    service: "book now",
  },
  {
    name: "Spa",
    image: "/images/nail-spa.jpg",
    hoverImage: "/images/spa-2.jpg",
    link: "/spa",
    icon: <Sparkles size={28} />,
    backColor: "bg-yellow-500",
    service: "book now",
  },
];
export default function Categories() {
  return (
    <div className="w-[90%] mx-auto py-16">
      <div className="flex flex-col md:flex-row rounded-3xl overflow-hidden shadow-2xl">

        {categories.map((cat) => (
          <div
            key={cat.name}
            className="relative md:w-1/4 h-[220px] md:h-[350px] group perspective overflow-hidden"
          >
            {/* Flip Wrapper */}
            <div className="flip-card absolute inset-0">

              {/* Front */}
              <div
                className="absolute inset-0 bg-cover bg-center flip-front"
                style={{ backgroundImage: `url(${cat.image})` }}
              />

              {/* Back */}
              <div
                className={`
    absolute inset-0
    bg-cover bg-center
    flip-back
    ${cat.backColor}
    bg-blend-multiply
  `}
  style={{ backgroundImage: `url(${cat.hoverImage})` }}
              />

            </div>

            {/* Dark Overlay */}
            

            {/* TEXT + ICON CONTENT */}
          <div className="absolute inset-0 z-20 text-white">

  {/* TOP LEFT CATEGORY NAME */}
  <div className="absolute top-4 left-4 font-['Raleway']">
    <h2 className="
      text-sm md:text-base font-bold tracking-wide
      bg-black/40
      px-4 py-2
      rounded-lg
      backdrop-blur-sm
      font-['Raleway']
    ">
      {cat.name}
    </h2>
  </div>


  {/* CENTER CONTENT (ICON + EXPLORE) */}
  <div className="absolute inset-0 flex flex-col items-center justify-center">

    {/* ICON */}
    <div
      className={`
        ${cat.color}
        p-3
        rounded-full
        shadow-lg
        opacity-0
        scale-75
        group-hover:opacity-100
        group-hover:scale-100
        transition-all
        duration-500
        flex
        items-center
        justify-center
        border-4 border-white
      `}
    >
      {cat.icon}
    </div>

    <Link
      href={cat.link}
      className="mt-5 bg-white text-black px-5 py-2 rounded-full text-sm font-medium hover:bg-gray-200 transition"
    >
      {cat.service}
    </Link>

  </div>

</div>
          </div>
        ))}

      </div>
    </div>
  );
}