import Image from "next/image";
import Link from "next/link";

export default function ShopCard({ shop, isTransportation, ctaLabel }) {
  return (
    <div className="bg-white rounded-xl overflow-hidden border border-gray-200 hover:shadow-lg transition w-full">
      <div className={`relative w-full ${isTransportation ? "h-56 md:h-52" : "h-48"} bg-gray-100`}>
        {shop.image ? (
          <Image
            src={shop.image}
            alt={shop.name}
            fill
            sizes="(min-width:1280px) 20vw, (min-width:768px) 33vw, 100vw"
            className="object-cover"
          />
        ) : null}
      </div>

      <div className="p-4 md:p-5">
        <h2 className={`font-semibold ${isTransportation ? "text-base md:text-lg mb-3 min-h-[3rem]" : "text-lg mb-2"} line-clamp-2`}>
          {shop.name}
        </h2>
        {!isTransportation ? <p className="text-sm text-gray-600 line-clamp-3 mb-4">{shop.description}</p> : null}

        <Link
          href={`/shops/${shop._id}`}
          className={`inline-block w-full text-center bg-green-600 text-white ${isTransportation ? "text-sm md:text-base" : "text-sm"} py-2.5 rounded-lg hover:bg-green-700 transition`}
        >
          {isTransportation ? "See more" : ctaLabel}
        </Link>
      </div>
    </div>
  );
}
