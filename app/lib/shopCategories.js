export const MAX_SHOP_CATEGORIES = 30;
export const MAX_SHOP_CATEGORY_NAME_LENGTH = 60;

export function normalizeShopCategoryName(value) {
  if (typeof value !== "string") return "";
  return value.trim().replace(/\s+/g, " ");
}

export function createShopCategorySlug(value) {
  return normalizeShopCategoryName(value)
    .normalize("NFKC")
    .toLocaleLowerCase("en-US")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function validateShopCategoryName(value) {
  const name = normalizeShopCategoryName(value);
  if (!name) return { error: "Category name is required" };
  if (name.length > MAX_SHOP_CATEGORY_NAME_LENGTH) {
    return {
      error: `Category name must be ${MAX_SHOP_CATEGORY_NAME_LENGTH} characters or fewer`,
    };
  }

  const slug = createShopCategorySlug(name);
  if (!slug) return { error: "Category name must contain letters or numbers" };
  return { name, slug };
}
