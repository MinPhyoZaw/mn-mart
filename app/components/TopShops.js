"use client";

import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";

const topShops = [
  {
    id: 1,
    name: "Golden Market",
    image: "/images/mn-mart-sh.jpg",
  },
  {
    id: 2,
    name: "Shwe Mart",
    image: "/images/mn-sh.jpg",
  },
  {
    id: 3,
    name: "City Fresh Store",
    image: "/images/mn-sh2.png",
  },
  {
    id: 4,
    name: "Royal Food Corner",
    image: "/images/unity.jpg",
  },
  {
    id: 5,
    name: "Urban Trend Shop",
    image: "/images/dceo.jpg",
  },
];

export default function TopShops() {
  return (
    <div className="w-[90%] mx-auto py-10">
      <h2 className="text-xl md:text-3xl font-thin mb-6 font-['Raleway'] text-gray-800">
      Popular Shops
      </h2>

      <Swiper
       spaceBetween={16} // default gap (mobile)
  slidesPerView={2}
  className="!pl-0"
  breakpoints={{
    640: {
      slidesPerView: 3,
      spaceBetween: 16,
    },
    1024: {
      slidesPerView: 4,
      spaceBetween: 16,
    },
    1280: {
      slidesPerView: 5,
      spaceBetween: 10, // smaller gap on large screens
    },
  }}
      >
        {topShops.map((shop) => (
          <SwiperSlide key={shop.id}>
            <div className="flex flex-col items-start group">
              
              {/* Image */}
              <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-md overflow-hidden shadow-md">
                <Image
                  src={shop.image}
                  alt={shop.name}
                  fill
                  sizes="(max-width: 768px) 128px, 160px"
                  className="object-cover group-hover:scale-105 transition duration-300"
                />
              </div>

              {/* Name under image */}
              <p className="mt-3 w-32 md:w-40 text-center font-medium text-gray-800 font-['Raleway']">
                {shop.name}
              </p>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
