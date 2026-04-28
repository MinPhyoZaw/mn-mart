import connectDB from "../lib/mongodb";
import Product from "../models/Product";

type ProductType = {
  _id: string;
  name: string;
  description?: string;
  price: number;
};

async function getLatestProducts(): Promise<ProductType[]> {
  await connectDB();

  const products = await Product.find({ isActive: true })
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

  return products.map((product) => ({
    _id: String(product._id),
    name: product.name,
    description: product.description,
    price: product.price,
  }));
}

export default async function ProductColumn() {
  const products = await getLatestProducts();

  return (
    <section className="py-8">
      <h2 className="text-xl md:text-3xl font-thin mb-6 font-['Raleway'] text-gray-800">New Arrival</h2>

      {products.length ? (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {products.map((product) => (
            <div
              key={product._id}
              className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <h3 className="text-sm md:text-base font-semibold text-gray-900 line-clamp-2">{product.name}</h3>
              <p className="mt-2 text-xs md:text-sm text-gray-500 line-clamp-2">
                {product.description || "No description"}
              </p>
              <p className="mt-4 text-sm md:text-base font-bold text-[#318616]">
                {Number(product.price || 0).toLocaleString()} MMK
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg bg-gray-100 p-4 text-gray-500">No products available.</div>
      )}
    </section>
  );
}
