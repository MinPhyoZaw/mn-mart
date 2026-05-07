// "use client";

// import Image from "next/image";
// import { Swiper, SwiperSlide } from "swiper/react";
// import "swiper/css";

// const PaidShopSection = () => {
//   const shop = {
//     name: "Viva Shop",
//     description: "Best deals and exclusive products for you.",
//     bgImage: "/images/mn-sh.jpg",
//     categories: [
//       { name: "Electronics", alt: "Electronics" },
//       { name: "Clothing", alt: "Clothing" },
//       { name: "Books", alt: "Books" },
//       { name: "Beauty & Health", alt: "Beauty" },
//       { name: "Sports", alt: "Sports" },
//       { name: "Toys", alt: "Toys" },
//     ],
//   };

//   const categoryLogo = "/images/mn-sh.jpg"; // small category image/logo

//   return (
//     <section className="container mx-auto p-4 sm:p-8">
//       <div className="flex flex-col lg:flex-row gap-6 rounded-xl overflow-hidden shadow-md">
//         {/* LEFT: Shop image + overlay */}
//         <div className="relative w-full lg:w-1/2 h-64 lg:h-auto flex-shrink-0">
//           <Image
//             src={shop.bgImage}
//             alt={shop.name}
//             fill
//             className="object-cover"
//           />
//           <div className="absolute inset-0 bg-black/40 flex flex-col justify-center px-6">
//             <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
//               {shop.name}
//             </h2>
//             <p className="text-white text-sm sm:text-base">{shop.description}</p>
//           </div>
//         </div>

//         {/* RIGHT: Shop categories */}
//         <div className="w-full lg:w-1/2 p-4 bg-[#fdfcf7]">
//           {/* Desktop: 2 per row */}
//           <div className="hidden sm:grid grid-cols-2 gap-4">
//             {shop.categories.map((cat, idx) => (
//               <div
//                 key={idx}
//                 className="bg-white rounded-lg flex items-center justify-between p-4 shadow-sm hover:shadow-md transition"
//               >
//                 <div className="flex-1 pr-2">
//                   <p className="text-sm sm:text-base font-semibold">{cat.name}</p>
//                 </div>
//                 <div className="relative w-16 h-16 flex-shrink-0">
//                   <Image
//                     src={categoryLogo}
//                     alt={cat.alt}
//                     fill
//                     className="object-contain"
//                   />
//                 </div>
//               </div>
//             ))}
//           </div>

//           {/* Mobile: Swiper */}
//           <div className="sm:hidden">
//             <Swiper
//               spaceBetween={12}
//               slidesPerView={1.5}
//               grabCursor={true}
//             >
//               {shop.categories.map((cat, idx) => (
//                 <SwiperSlide key={idx}>
//                   <div className="bg-white rounded-lg flex items-center justify-between p-4 shadow-sm hover:shadow-md transition">
//                     <div className="flex-1 pr-2">
//                       <p className="text-sm font-semibold">{cat.name}</p>
//                     </div>
//                     <div className="relative w-16 h-16 flex-shrink-0">
//                       <Image
//                         src={categoryLogo}
//                         alt={cat.alt}
//                         fill
//                         className="object-contain"
//                       />
//                     </div>
//                   </div>
//                 </SwiperSlide>
//               ))}
//             </Swiper>
//           </div>
//         </div>
//       </div>
//     </section>
//   );
// };

// export default PaidShopSection;