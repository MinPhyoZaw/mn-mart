import Image from "next/image";
import Link from "next/link";

export default function ShoppingItemCard({ item }) {
  const formattedPrice = typeof item.price === "number"
    ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(item.price)
    : item.price;

  return (
    <div className="bg-white rounded-xl overflow-hidden border border-gray-200 hover:shadow-md transition">
      <div className="relative w-full h-36 bg-gray-100">
        {item.image ? (
          <Image
            src={item.image}
            alt={item.name}
            fill
            sizes="(min-width:1280px) 20vw, (min-width:768px) 25vw, 50vw"
            className="object-cover"
          />
        ) : null}
      </div>

      <div className="p-3 space-y-1.5">
        <h3 className="font-semibold text-sm md:text-base text-gray-900 line-clamp-2 min-h-[2.5rem]">{item.name}</h3>

        <Link
          href={`/shops/${item.shop?._id}`}
          className="text-xs md:text-sm text-green-700 hover:text-green-800 hover:underline line-clamp-1"
        >
          {item.shop?.name || "Unknown shop"}
        </Link>

        <p className="text-sm md:text-base font-bold text-gray-900">{formattedPrice}</p>
      </div>
    </div>
  );
}
