import Image from "next/image";

async function getShop(id) {
  const res = await fetch(`http://localhost:3000/api/shops/${id}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch shop");
  }

  const result = await res.json();
  return result?.data ?? null;
}

export default async function ShopDetailPage({ params }) {
  const { id } = await params;
  const shop = await getShop(id);

  if (!shop) {
    throw new Error("Shop not found");
  }

  return (
    <div className="max-w-5xl mx-auto p-6">

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

        {/* Future: Menu Section */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-2">Menus</h2>

          <div className="bg-gray-100 p-4 rounded-lg text-gray-500">
            Menu system coming soon...
          </div>
        </div>
      </div>

    </div>
  );
}
