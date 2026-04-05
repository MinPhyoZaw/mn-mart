import Image from "next/image";

async function getShop(id) {
  const res = await fetch(`http://localhost:3000/api/shops/${id}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch shop");
  }

  const result = await res.json();
  return result?.data ?? null; // now returns { shop, items }
}

export default async function ShopDetailPage({ params }) {
  const { id } = await params;
  const data = await getShop(id);

  if (!data || !data.shop) {
    throw new Error("Shop not found");
  }

  const { shop, items } = data;

  return (
    <div className="max-w-6xl mx-auto p-6">

      {/* Shop Image */}
      <div className="relative w-full h-64 md:h-96 rounded-xl overflow-hidden shadow-lg">
        <Image
          src={shop.image || "/images/default-shop.png"}
          alt={shop.name}
          fill
          className="object-cover"
        />
      </div>

      {/* Shop Info */}
      <div className="mt-6">
        <h1 className="text-3xl font-bold text-yellow-600">{shop.name}</h1>

        <p className="text-gray-600 mt-2">
          {shop.description || "No description available"}
        </p>

        <div className="mt-4 space-y-2 text-sm text-gray-700">
          <p><strong>Category:</strong> {shop.category}</p>
          <p><strong>Phone:</strong> {shop.phone || "N/A"}</p>
          <p><strong>Address:</strong> {shop.address || "N/A"}</p>
        </div>
      </div>

      {/* ✅ Menu Section */}
      <div className="mt-10">
        <h2 className="text-2xl font-semibold mb-6">Menu</h2>

        {!items || items.length === 0 ? (
          <div className="bg-gray-100 p-4 rounded-lg text-gray-500">
            No items available
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">

            {items.map((item) => (
              <div
                key={item._id}
                className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition"
              >
                {/* Item Image */}
                <div className="relative w-full h-40">
                  <Image
                    src={item.image || "/images/default-shop.png"}
                    alt={item.name}
                    fill
                    className="object-cover"
                  />
                </div>

                {/* Item Info */}
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-800">
                    {item.name}
                  </h3>

                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                    {item.description || "No description"}
                  </p>

                  {/* Extra Info (dynamic) */}
                  {item.extra && (
                    <div className="text-xs text-gray-400 mt-2">
                      {Object.entries(item.extra).map(([key, value]) => (
                        <p key={key}>
                          {key}: {value}
                        </p>
                      ))}
                    </div>
                  )}

                  {/* Price + Button */}
                  <div className="flex justify-between items-center mt-4">
                    <span className="text-yellow-600 font-bold">
                      {item.price} MMK
                    </span>

                    <button className="bg-yellow-500 text-white px-3 py-1 text-sm rounded-md hover:bg-yellow-600 transition">
                      Add
                    </button>
                  </div>
                </div>
              </div>
            ))}

          </div>
        )}
      </div>

    </div>
  );
}