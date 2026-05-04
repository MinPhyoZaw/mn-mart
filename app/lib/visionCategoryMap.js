const categoryMap = {
  shoe: "fashion",
  clothing: "fashion",
  shirt: "fashion",
  furniture: "furniture",
  chair: "furniture",
  table: "furniture",
  electronics: "electronics",
  device: "electronics",
  food: "food & beverage",
  drink: "food & beverage",
  tool: "DIY",
  hardware: "hardware",
};

export function mapLabelsToCategory(labels = []) {
  for (const label of labels) {
    const normalized = String(label || "").trim().toLowerCase();
    if (!normalized) continue;

    if (categoryMap[normalized]) return categoryMap[normalized];

    for (const [key, value] of Object.entries(categoryMap)) {
      if (normalized.includes(key)) return value;
    }
  }

  return null;
}

export default categoryMap;
