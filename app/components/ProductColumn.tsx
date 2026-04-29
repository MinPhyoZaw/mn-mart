import connectDB from "../lib/mongodb";
import Product from "../models/Product";
import Item from "../models/Item";
import Shop from "../models/Shop"; // 👈 THIS LINE FIXES IT
import ProductCarouselClient from "./ProductCarouselClient";

type ProductType = {
  _id: string;
  name: string;
  description?: string;
  price: number;
  image?: string;
  shopName?: string;
  shopId?: string;
  vendorId?: string;
};

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

  const itemQuery: any = { type: "product", isAvailable: true };
  const tagAliases = getTagAliases(tagName);
  if (tagAliases.length) itemQuery.tagName = { $in: tagAliases };

  const items = await Item.find(itemQuery).sort({ createdAt: -1 }).limit(limit).lean();

  if (items.length) {
    const shopIds = Array.from(new Set(items.map((it) => String(it.shopId)).filter(Boolean)));
    const shops = shopIds.length ? await Shop.find({ _id: { $in: shopIds } }).lean() : [];
    const shopMap = shops.reduce((acc, s) => ({ ...acc, [String(s._id)]: s }), {} as Record<string, any>);

    return items.map((item) => {
      const sid = item.shopId ? String(item.shopId) : "";
      const shop = shopMap[sid] || {};
      return {
        _id: String(item._id),
        name: item.name,
        description: item.description,
        price: item.price,
        image: item.image,
        shopId: sid,
        shopName: shop.name || item.shopName || "",
        vendorId: shop.vendorId ? String(shop.vendorId) : "",
      } as ProductType;
    });
  }

  const productQuery: any = { isActive: true };
  if (tagAliases.length && Product.schema.path("tagName")) {
    productQuery.tagName = { $in: tagAliases };
  }

  const products = await Product.find(productQuery).sort({ createdAt: -1 }).limit(limit).lean();
  if (!products.length) return [];

  const shopIds = Array.from(new Set(products.map((p) => String(p.shopId)).filter(Boolean)));
  const shops = shopIds.length ? await Shop.find({ _id: { $in: shopIds } }).lean() : [];
  const shopMap = shops.reduce((acc, s) => ({ ...acc, [String(s._id)]: s }), {} as Record<string, any>);

  return products.map((product) => {
    const sid = product.shopId ? String(product.shopId) : "";
    const shop = shopMap[sid] || {};
    return {
      _id: String(product._id),
      name: product.name,
      description: product.description,
      price: product.price,
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
