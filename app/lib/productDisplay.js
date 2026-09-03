export function normalizeDescription(value) {
  if (typeof value !== "string") {
    return null;
  }

  const description = value.trim();
  return description || null;
}
