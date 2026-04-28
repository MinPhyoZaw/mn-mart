import connectDB from "../lib/mongodb";
import Product from "../models/Product";
import Item from "../models/Item";
import AddToCartButton from "./AddToCartButton";
import Image from "next/image";

type ProductType = {
  _id: string;
  name: string;
  description?: string;
  price: number;
  image?: string; // 👈 added
  shopName?: string; // 👈 added
};

async function getLatestProducts(): Promise<ProductType[]> {
  await connectDB();

  const items = await Item.find({ type: "product", isAvailable: true })
    .sort({ createdAt: -1 })
    .limit(10)
    .populate("shopId", "vendorId name")
    .lean();

  if (items.length) {
    return items.map((item) => ({
      _id: String(item._id),
      name: item.name,
      description: item.description,
      price: item.price,
      image: item.image,
      shopId: item.shopId?._id ? String(item.shopId._id) : String(item.shopId || ""),
      shopName: item.shopId?.name || item.shopName || "",
      vendorId: item.shopId?.vendorId ? String(item.shopId.vendorId) : "",
    }));
  }

  const products = await Product.find({ isActive: true })
    .sort({ createdAt: -1 })
    .limit(20)
    .populate("shopId", "vendorId name")
    .lean();

  return products.map((product) => ({
    _id: String(product._id),
    name: product.name,
    description: product.description,
    price: product.price,
    image: product.image,
    shopId: product.shopId?._id ? String(product.shopId._id) : String(product.shopId || ""),
    shopName: product.shopId?.name || product.shopName || "",
    vendorId: product.shopId?.vendorId ? String(product.shopId.vendorId) : "",
  }));
}

export default async function ProductColumn() {
  const products = await getLatestProducts();

  return (
    <section className="py-8 w-[92%] md:w-[90%] mx-auto">
      
      <h2 className="text-lg md:text-2xl font-semibold mb-5 text-gray-800">
        New Arrival
      </h2>

      {products.length ? (
        <div className="overflow-x-auto pb-2">
          <div className="flex gap-4 min-w-max snap-x snap-mandatory">

            {products.map((product) => (
              <div
                key={product._id}
                className="
                  w-[160px] md:w-[200px]
                  snap-start
                  rounded-xl
                  bg-white
                  shadow-sm
                  hover:shadow-md
                  transition
                  p-3
                  group
                "
              >

                {/* IMAGE */}
                <div className="relative w-full h-[120px] md:h-[150px] mb-3">
                  <Image
                    src={product.image || "/images/placeholder.png"}
                    alt={product.name}
                    fill
                    className="object-cover rounded-lg group-hover:scale-105 transition"
                  />
                </div>

                {/* NAME */}
                <h3 className="text-xs md:text-sm font-medium text-gray-800 line-clamp-2">
                  {product.name}
                </h3>

                {/* DESCRIPTION */}
                <p className="text-[10px] text-red-400 mt-1">
  {product.shopName}
</p>

                {/* PRICE */}
                <p className="mt-2 text-sm md:text-base  text-gray-500">
                  {Number(product.price || 0).toLocaleString()} MMK
                </p>

                {/* ADD TO CART */}
                <AddToCartButton product={product} />

              </div>
            ))}

          </div>
        </div>
      ) : (
        <div className="rounded-lg bg-gray-100 p-4 text-gray-500">
          No products available.
        </div>
      )}
    </section>
  );
}