export const DELIVERY_STATUSES = ["ready", "assigned", "accepted", "picked_up", "out_for_delivery", "delivered"];
export const NEXT_DELIVERY_STATUS = { assigned: "accepted", accepted: "picked_up", picked_up: "out_for_delivery", out_for_delivery: "delivered" };
export const DELIVERY_INDEXES = [{ orderId: 1 }, { assignedRiderId: 1, status: 1, updatedAt: -1 }, { status: 1, updatedAt: -1 }];

export function transitionDelivery(currentStatus, action) {
  if (action === "accept" && currentStatus === "assigned") return "accepted";
  if (action === "advance") return NEXT_DELIVERY_STATUS[currentStatus] || null;
  return null;
}

export function canAssignDelivery(status) {
  return ["ready", "assigned", "accepted"].includes(status);
}

export function riderDeliveryQuery(userId, deliveryId = null) {
  return { assignedRiderId: userId, ...(deliveryId ? { _id: deliveryId } : {}) };
}

export function customerOrderQuery(userId) {
  return { customerId: userId };
}

export function isApprovedRiderAccount(user, profile) {
  return Boolean(user?._id && profile?.status === "approved" && ["customer", "vendor"].includes(user.role));
}

export function matchesDeliveryVersion(delivery, version) {
  return Number.isInteger(version) && version >= 0 && delivery?.version === version;
}

export function isEligibleShoppingOrder(order) {
  return Boolean(order && order.serviceType === "shopping" && order.orderStatus === "confirmed" && order.paymentStatus === "paid" && order.vendorStatus === "accepted");
}

export function deliveryLocation(order) {
  const coordinates = order?.customerCoordinates;
  const keys = coordinates && typeof coordinates === "object" && !Array.isArray(coordinates) ? Object.keys(coordinates) : [];
  const latitude = coordinates?.latitude;
  const longitude = coordinates?.longitude;
  const available = keys.length === 2 && keys.includes("latitude") && keys.includes("longitude") && typeof latitude === "number" && Number.isFinite(latitude) && latitude >= -90 && latitude <= 90 && typeof longitude === "number" && Number.isFinite(longitude) && longitude >= -180 && longitude <= 180;
  return { available, coordinates: available ? { latitude, longitude } : null };
}

export function validateCustomerCoordinates(value) {
  if (value === undefined || value === null) return { valid: true, coordinates: undefined };
  const location = deliveryLocation({ customerCoordinates: value });
  return location.available ? { valid: true, coordinates: location.coordinates } : { valid: false };
}

export function validateDeliveryInstructions(value) {
  if (value === undefined) return { valid: true, value: "" };
  if (typeof value !== "string" || value.length > 300) return { valid: false };
  return { valid: true, value: value.trim() };
}

export function checkoutDropoffFields(coordinates, instructions) {
  return { ...(coordinates ? { customerCoordinates: { latitude: coordinates.latitude, longitude: coordinates.longitude } } : {}), deliveryInstructions: instructions || "" };
}

export function riderDeliveryView(delivery, order, { detail = false } = {}) {
  const location = deliveryLocation(order);
  const result = {
    deliveryId: String(delivery._id), orderId: String(order._id), orderNumber: order.orderId,
    status: delivery.status, version: delivery.version, locationAvailable: location.available,
    pickup: { address: delivery.pickup?.address || order.shopId?.address || "" },
    dropoff: { address: delivery.dropoff?.address || order.customerAddress || "", ward: delivery.dropoff?.ward || order.ward || "", phone: delivery.dropoff?.phone || order.customerPhone || "", coordinates: location.coordinates, landmarkInstructions: order.deliveryInstructions || "" },
    shop: order.shopId && typeof order.shopId === "object" ? { id: String(order.shopId._id), name: order.shopId.name || "" } : null,
    assignedAt: delivery.assignments?.at(-1)?.assignedAt || null,
    updatedAt: delivery.updatedAt, deliveredAt: delivery.events?.find((event) => event.status === "delivered")?.at || null,
    payment: { type: "prepaid", collectionRequired: false, amountToCollect: 0, currency: "MMK" },
  };
  if (detail) {
    result.customer = { name: order.customerName || "", phone: order.customerPhone || "" };
    result.items = (order.items || []).map((item) => ({ productName: item.name || "", thumbnail: item.image || null, quantity: item.quantity, selectedOptions: item.selectedWholesaleTier?.minQty ? { wholesaleTier: { minQty: item.selectedWholesaleTier.minQty, price: item.selectedWholesaleTier.price } } : {} }));
  }
  return result;
}
