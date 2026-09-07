const getTierQuantity = (tier) => tier?.minQty ?? tier?.qty ?? tier?.quantity ?? tier?.minQuantity ?? tier?.minimumQuantity;

export function normalizeWholesaleTiers(tiers = []) {
  return (Array.isArray(tiers) ? tiers : [])
    .map((tier) => ({
      minQty: Number(getTierQuantity(tier)),
      price: Number(tier?.price),
    }))
    .filter((tier) => Number.isFinite(tier.minQty) && Number.isFinite(tier.price) && tier.minQty > 1 && tier.price >= 0)
    .sort((a, b) => a.minQty - b.minQty);
}

export function getProductPrice(product) {
  const price = Number(
    product?.retailPrice ?? product?.basePrice ?? product?.price ?? 0
  );

  return Number.isFinite(price) ? price : 0;
}

export function getWholesalePrice(product, qty) {
  const quantity = Math.max(1, Number(qty) || 1);
  const normalPrice = getProductPrice(product);
  const wholesaleTiers = normalizeWholesaleTiers(product?.wholesaleTiers ?? product?.extra?.wholesaleTiers ?? []);

  let finalPrice = normalPrice;
  wholesaleTiers.forEach((tier) => {
    if (quantity >= tier.minQty) {
      finalPrice = tier.price;
    }
  });

  return finalPrice;
}
