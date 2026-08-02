"use client";

import Link from "next/link";

const categories = [
  {
    name: "Shopping",
    link: "/shops",
    image: "/images/categories/catego.png",
    gradientClass:
      "bg-gradient-to-r from-orange-950/90 via-orange-900/55 to-transparent",
  },
  {
    name: "Car Ticket",
    link: "/transportation",
    image: "/images/categories/car.png",
    gradientClass:
      "bg-gradient-to-r from-blue-950/90 via-blue-900/55 to-transparent",
  },
  {
    name: "Hotel",
    link: "/hotel",
    image: "/images/categories/hotel.png",
    gradientClass:
      "bg-gradient-to-r from-emerald-950/90 via-emerald-900/55 to-transparent",
  },
  {
    name: "Spa",
    link: "/spa",
    image: "/images/categories/spa.png",
    gradientClass:
      "bg-gradient-to-r from-pink-950/90 via-pink-900/55 to-transparent",
  },
];

export default function Categories() {
  return (
    <section className="mx-auto w-[94%] py-7 md:w-[90%] md:py-10">
      <div className="mb-4 md:mb-6">
        <h2 className="text-xl font-semibold text-gray-900 md:text-2xl">
          Explore Services
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        {categories.map((category) => (
          <Link
            key={category.name}
            href={category.link}
            className="
              group
              relative
              block
              h-[92px]
              overflow-hidden
              rounded-[20px]
              bg-gray-200
              sm:h-[105px]
              md:h-[125px]
            "
          >
            {/* Background image */}
            <div
              className="
                absolute
                inset-0
                bg-cover
                bg-center
                transition-transform
                duration-500
                group-hover:scale-110
              "
              style={{
                backgroundImage: `url(${category.image})`,
              }}
            />

            {/* Gradient overlay */}
            <div
              className={`absolute inset-0 ${category.gradientClass}`}
            />

            {/* Bottom shadow */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />

            {/* Category name */}
            <div className="relative z-10 flex h-full items-center px-4 md:px-5">
              <h3
                className="
                  max-w-[65%]
                  text-sm
                  font-semibold
                  leading-tight
                  text-white
                  drop-shadow-sm
                  sm:text-base
                  md:text-lg
                "
              >
                {category.name}
              </h3>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}