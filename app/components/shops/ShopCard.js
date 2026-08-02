import Image from "next/image";
import Link from "next/link";
import { getItemRoute } from "../../lib/getItemRoute";

export default function ShopCard({ shop, isTransportation, ctaLabel }) {
  const isFeatured = Boolean(shop.category || shop.isFeatured);

  return (
    <article className="group min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md">
      <Link
        href={isTransportation ? `/transportation/${shop._id}` : getItemRoute(shop)}
        className="block"
      >
        <div className={`relative w-full ${isTransportation ? "h-56 md:h-52" : "h-48"} bg-gray-100`}>
          {shop.image ? (
            <Image
              src={shop.image}
              alt={shop.name}
              fill
              sizes="(min-width:1280px) 20vw, (min-width:768px) 33vw, 100vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : null}
        </div>
      </Link>

      <div className="p-4 md:p-5">
        <Link href={isTransportation ? `/transportation/${shop._id}` : getItemRoute(shop)}>
          <h2 className={`line-clamp-2 font-semibold text-gray-800 ${isTransportation ? "mb-3 min-h-[3rem] text-base md:text-lg" : "mb-2 text-lg"}`}>
            {shop.name}
          </h2>
        </Link>

        {!isTransportation ? (
          <p className="mb-4 line-clamp-3 text-sm text-gray-600">
            {shop.description || "Discover trusted products and services from this shop."}
          </p>
        ) : null}

        <div className="flex items-center justify-between gap-2">
          {isFeatured ? (
            <span className="rounded-full bg-orange-50 px-2.5 py-1 text-[11px] font-medium text-orange-600">
              {shop.category || "Featured"}
            </span>
          ) : (
            <span className="text-sm font-medium text-gray-500">Trusted shop</span>
          )}

          <Link
            href={isTransportation ? `/transportation/${shop._id}` : getItemRoute(shop)}
            className="inline-flex items-center justify-center rounded-lg bg-orange-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-orange-600"
          >
            {isTransportation ? "See more" : ctaLabel || "View shop"}
          </Link>
        </div>
      </div>
    </article>
  );
}
