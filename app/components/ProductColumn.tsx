import connectDB from "../lib/mongodb";
import Product from "../models/Product";
import Item from "../models/Item";
import Shop from "../models/Shop"; // 👈 THIS LINE FIXES IT
import ProductCarouselClient from "./ProductCarouselClient";

type WholesaleTier = { minQty?: unknown; qty?: unknown; quantity?: unknown; minQuantity?: unknown; price?: unknown };
type SerializedWholesaleTier = { minQty: number; price: number };

type ProductType = {
  _id: string;
  name: string;
  description?: string;
  price: number;
  image?: string;
  shopName?: string;
  shopId?: string;
  vendorId?: string;
  retailPrice?: number;
  wholesaleTiers?: SerializedWholesaleTier[];
};

type LeanShop = {
  _id: unknown;
  name?: string;
  vendorId?: unknown;
};

type LeanItem = {
  _id: unknown;
  shopId?: unknown;
  name?: string;
  description?: string;
  price?: number;
  retailPrice?: number;
  wholesaleTiers?: WholesaleTier[];
  image?: string;
  shopName?: string;
};

type LeanProduct = {
  _id: unknown;
  shopId?: unknown;
  name?: string;
  description?: string;
  price?: number;
  image?: string;
  shopName?: string;
};

export const dynamic = "force-dynamic";

const getTierQuantity = (tier: WholesaleTier) => tier.minQty ?? tier.qty ?? tier.quantity ?? tier.minQuantity;

const serializeWholesaleTiers = (tiers?: WholesaleTier[]): SerializedWholesaleTier[] =>
  (Array.isArray(tiers) ? tiers : [])
    .map((tier) => ({
      minQty: Number(getTierQuantity(tier)),
      price: Number(tier.price),
    }))
    .filter((tier) => Number.isFinite(tier.minQty) && Number.isFinite(tier.price) && tier.minQty > 1 && tier.price >= 0)
    .sort((a, b) => a.minQty - b.minQty);

const normalizeTagName = (tagName?: string) => (tagName || "").trim().toLowerCase();

const getTagAliases = (tagName?: string): string[] => {
  if (!tagName) return [];

  const normalized = normalizeTagName(tagName);
  const map: Record<string, string[]> = {
    newarrival: ["NewArrival", "newarrival", "new-arrival", "New Arrival"],
    bestsellers: ["BestSellers", "BestSeller", "bestsellers", "best-sellers", "Best Sellers"],
    toppicks: ["TopPicks", "TopPick", "toppicks", "top-picks", "Top Picks"],
    recomendedforyou: ["RecomendedForYou", "RecommendedForYou", "recomendedforyou", "recommendedforyou", "Recommended For You"],
    recommendedforyou: ["RecommendedForYou", "RecomendedForYou", "recommendedforyou", "recomendedforyou", "Recommended For You"],
  };

  return map[normalized] || [tagName];
};

async function fetchProductsByTag(tagName?: string, limit = 10): Promise<ProductType[]> {
  await connectDB();

  console.log("Searching tag:", tagName);

const count = await Item.countDocuments();
console.log("Item count:", count);

const sample = await Item.findOne().lean();
console.log("Sample item:", sample);

  const itemQuery: Record<string, unknown> = { type: "product", isAvailable: true };
  const tagAliases = getTagAliases(tagName);
  if (tagAliases.length) itemQuery.tagName = { $in: tagAliases };

  const items = await Item.find(itemQuery).sort({ createdAt: -1 }).limit(limit).lean();

  if (items.length) {
    const shopIds = Array.from(new Set(items.map((it) => String(it.shopId)).filter(Boolean)));
    const shops = shopIds.length ? await Shop.find({ _id: { $in: shopIds } }).lean() : [];
    const shopMap = (shops as LeanShop[]).reduce((acc, s) => ({ ...acc, [String(s._id)]: s }), {} as Record<string, LeanShop>);

    return (items as LeanItem[]).map((item) => {
      const sid = item.shopId ? String(item.shopId) : "";
      const shop = shopMap[sid] || {};
      return {
        _id: String(item._id),
        name: item.name || "",
        description: item.description,
        price: Number(item.price) || 0,
        retailPrice: Number(item.retailPrice ?? item.price) || 0,
        wholesaleTiers: serializeWholesaleTiers(item.wholesaleTiers),
        image: item.image,
        shopId: sid,
        shopName: shop.name || item.shopName || "",
        vendorId: shop.vendorId ? String(shop.vendorId) : "",
      } as ProductType;
    });
  }

  const productQuery: Record<string, unknown> = { isActive: true };
  if (tagAliases.length && Product.schema.path("tagName")) {
    productQuery.tagName = { $in: tagAliases };
  }

  const products = await Product.find(productQuery).sort({ createdAt: -1 }).limit(limit).lean();
  if (!products.length) return [];

  const shopIds = Array.from(new Set(products.map((p) => String(p.shopId)).filter(Boolean)));
  const shops = shopIds.length ? await Shop.find({ _id: { $in: shopIds } }).lean() : [];
  const shopMap = (shops as LeanShop[]).reduce((acc, s) => ({ ...acc, [String(s._id)]: s }), {} as Record<string, LeanShop>);

  return (products as LeanProduct[]).map((product) => {
    const sid = product.shopId ? String(product.shopId) : "";
    const shop = shopMap[sid] || {};
    return {
      _id: String(product._id),
      name: product.name || "",
      description: product.description,
      price: Number(product.price) || 0,
      image: product.image,
      shopId: sid,
      shopName: shop.name || product.shopName || "",
      vendorId: shop.vendorId ? String(shop.vendorId) : "",
    } as ProductType;
  });
}

type Props = {
  tagName?: string;
  title?: string;
  limit?: number;
};

export default async function ProductColumn({ tagName = "NewArrival", title, limit = 10 }: Props) {
  const products = await fetchProductsByTag(tagName, limit);
  const heading = title || tagName.replace(/([A-Z])/g, " $1").trim();

  if (!products.length) return null;

  return <ProductCarouselClient products={products} heading={heading} />;
}
