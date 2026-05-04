const CATEGORY_TO_ROUTE_SEGMENT = {
  shopping: "shops",
  shops: "shops",
  shop: "shops",
  hotel: "hotel",
  hotels: "hotel",
  spa: "spa",
  transport: "transport",
  transportation: "transport",
};

export function getItemRoute(item) {
  const id = item?._id;
  const normalizedType = String(item?.type || item?.category || "").trim().toLowerCase();
  const routeSegment = CATEGORY_TO_ROUTE_SEGMENT[normalizedType] || "shops";

  return `/${routeSegment}/${id}`;
}
