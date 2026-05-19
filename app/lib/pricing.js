export function normalizeWholesaleTiers(tiers = []) {
  return (Array.isArray(tiers) ? tiers : [])
    .map((tier) => ({
      minQty: Number(tier?.minQty),
      price: Number(tier?.price),
    }))
    .filter((tier) => Number.isFinite(tier.minQty) && Number.isFinite(tier.price) && tier.minQty > 1 && tier.price >= 0)
    .sort((a, b) => a.minQty - b.minQty);
}

export function getWholesalePrice(product, qty) {
  const quantity = Math.max(1, Number(qty) || 1);
  const retailPrice = Number(product?.retailPrice ?? product?.price ?? 0) || 0;
  const wholesaleTiers = normalizeWholesaleTiers(product?.wholesaleTiers ?? product?.extra?.wholesaleTiers ?? []);

  let finalPrice = retailPrice;
  wholesaleTiers.forEach((tier) => {
    if (quantity >= tier.minQty) {
      finalPrice = tier.price;
    }
  });

  return finalPrice;
}
