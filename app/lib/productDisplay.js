export function normalizeRetailPrice(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const retailPrice = Number(value);
  return Number.isFinite(retailPrice) && retailPrice > 0
    ? retailPrice
    : null;
}

export function getDisplayRetailPrice(retailPrice, sellingPrice) {
  const normalizedRetailPrice = normalizeRetailPrice(retailPrice);
  const normalizedSellingPrice = Number(sellingPrice);

  return normalizedRetailPrice !== null &&
    Number.isFinite(normalizedSellingPrice) &&
    normalizedRetailPrice > normalizedSellingPrice
    ? normalizedRetailPrice
    : null;
}

export function normalizeDescription(value) {
  if (typeof value !== "string") {
    return null;
  }

  const description = value.trim();
  return description || null;
}
