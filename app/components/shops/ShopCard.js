import Image from "next/image";
import Link from "next/link";
import { BedDouble } from "lucide-react";
import { getItemRoute } from "../../lib/getItemRoute";

export default function ShopCard({ shop, isTransportation, ctaLabel }) {
  if (!isTransportation && ctaLabel === "See Hotel Rooms") {
    return <HotelCard shop={shop} />;
  }

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

function HotelCard({ shop }) {
  const image = shop.image?.trim();
  const address = shop.address?.trim();
  const description = shop.description?.trim();

  return (
    <article className="relative isolate flex h-full w-full min-w-0 max-w-[380px] flex-col rounded-2xl border border-gray-200 bg-white shadow-sm [font-family:'Noto_Sans_Myanmar',system-ui,sans-serif] motion-safe:transition-[transform,box-shadow] motion-safe:hover:-translate-y-0.5 hover:shadow-md">
      <div className="relative flex aspect-[4/3] w-full shrink-0 items-center justify-center overflow-hidden rounded-t-[15px] bg-gray-100">
        {image ? (
          <Image
            src={image}
            alt={shop.name}
            fill
            loading="lazy"
            sizes="(min-width: 1280px) 20vw, (min-width: 1024px) 25vw, (min-width: 768px) 33vw, (min-width: 640px) 50vw, min(380px, calc(100vw - 32px))"
            className="object-cover"
          />
        ) : (
          <BedDouble aria-hidden="true" className="size-9 text-gray-500" />
        )}
      </div>

      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="space-y-1">
          <h2 className="line-clamp-2 break-words text-lg leading-relaxed font-bold text-gray-900">
            {shop.name}
          </h2>
          {address && (
            <p className="break-words text-sm leading-relaxed text-gray-600">{address}</p>
          )}
          {description && description !== "Discover trusted products and services from this shop." && (
            <p className="line-clamp-2 break-words text-sm leading-relaxed text-gray-600">
              {description}
            </p>
          )}
        </div>

        <div className="mt-auto flex justify-end">
          <Link
            href={getItemRoute(shop)}
            aria-label={`See rooms at ${shop.name}`}
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[#0b7a3b] px-4 py-2 text-center text-sm leading-relaxed font-semibold text-white outline-none after:absolute after:inset-0 after:rounded-2xl hover:bg-[#096631] focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-[#0b7a3b]"
          >
            See rooms
          </Link>
        </div>
      </div>
    </article>
  );
}
