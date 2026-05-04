import Image from "next/image";
import Link from "next/link";
import AddToCartButton from "../AddToCartButton";

export default function ShoppingItemCard({ item }) {
  const numericPrice = typeof item.price === "number" ? item.price : Number(item.price) || 0;
  const formattedPrice = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(numericPrice);

  return (
    <div className="h-full bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition duration-200">
      <div className="relative w-full h-40 bg-gray-100">
        {item.image ? (
          <Image
            src={item.image}
            alt={item.name}
            fill
            sizes="(min-width:1280px) 20vw, (min-width:1024px) 20vw, (min-width:768px) 33vw, 50vw"
            className="object-cover"
          />
        ) : null}
      </div>

      <div className="p-4 flex flex-col h-[calc(100%-10rem)]">
        <h3 className="font-semibold text-sm md:text-base text-gray-900 line-clamp-2 min-h-[2.5rem]">{item.name}</h3>

        <Link
          href={`/shops/${item.shop?._id}`}
          className="mt-1 text-xs md:text-sm text-green-700 hover:text-green-800 hover:underline line-clamp-1"
        >
          {item.shop?.name || "Unknown shop"}
        </Link>

        <p className="mt-2 text-sm md:text-base font-bold text-gray-900">{formattedPrice}</p>

        <div className="mt-auto">
          <AddToCartButton
            product={{
              _id: item._id,
              name: item.name,
              price: numericPrice,
              image: item.image,
              shopId: item.shop?._id,
              shopName: item.shop?.name,
              vendorId: item.vendor?._id,
            }}
          />
        </div>
      </div>
    </div>
  );
}
