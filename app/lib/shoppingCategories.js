export const SHOPPING_PRODUCT_CATEGORIES = [
  { value: "groceries", label: "Groceries" },
  { value: "fresh-food", label: "Fresh Food" },
  { value: "snacks-beverages", label: "Snacks & Beverages" },
  { value: "fashion", label: "Fashion" },
  { value: "beauty-personal-care", label: "Beauty & Personal Care" },
  { value: "electronics", label: "Electronics" },
  { value: "home-living", label: "Home & Living" },
  { value: "kitchen-dining", label: "Kitchen & Dining" },
  { value: "home-appliances", label: "Home Appliances" },
  { value: "baby-kids", label: "Baby & Kids" },
  { value: "pet-supplies", label: "Pet Supplies" },
  { value: "books-stationery", label: "Books & Stationery" },
  { value: "sports-outdoor", label: "Sports & Outdoor" },
  { value: "automotive", label: "Automotive", emoji: "🚗" },
  { value: "health-pharmacy", label: "Health & Pharmacy", emoji: "💊" },
  { value: "garden-tools", label: "Garden & Tools", emoji: "🌱" },
  { value: "gaming", label: "Gaming", emoji: "🎮" },
  { value: "gifts-party-supplies", label: "Gifts & Party Supplies", emoji: "🎁" },
];

/** @deprecated Legacy values kept so existing products remain valid */
export const LEGACY_SHOPPING_CATEGORIES = [
  "food & beverage",
  "DIY",
  "hardware",
  "furniture",
  "Media",
  "Beauty & personal care",
  "Tobacco products",
  "Toy and hobbies",
];

export const SHOPPING_CATEGORY_VALUES = SHOPPING_PRODUCT_CATEGORIES.map((item) => item.value);

export const ALL_VALID_SHOPPING_CATEGORIES = [
  ...SHOPPING_CATEGORY_VALUES,
  ...LEGACY_SHOPPING_CATEGORIES,
];

export function getShoppingCategoryLabel(value) {
  if (!value) return "";

  const match = SHOPPING_PRODUCT_CATEGORIES.find((item) => item.value === value);
  if (!match) return String(value);

  return match.emoji ? `${match.emoji} ${match.label}` : match.label;
}

export function isValidShoppingCategory(value) {
  return typeof value === "string" && ALL_VALID_SHOPPING_CATEGORIES.includes(value.trim());
}

export function isCurrentShoppingCategory(value) {
  return typeof value === "string" && SHOPPING_CATEGORY_VALUES.includes(value.trim());
}
