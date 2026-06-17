import ShopDetailClient from "./ShopDetailClient";

async function getShop(id) {
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXTAUTH_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined) ||
    "http://localhost:3000";

  const res = await fetch(`${origin}/api/shops/${id}`, {
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
