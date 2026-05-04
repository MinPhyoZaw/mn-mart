import ShopDetailClient from "./ShopDetailClient";

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
  const data = await getShop(id);

  if (!data?.shop) {
    throw new Error("Shop not found");
  }

  return <ShopDetailClient shop={data.shop} items={data.items || []} />;
}
