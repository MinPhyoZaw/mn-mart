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

export function riderDeliveryDetailPipeline(userId, deliveryId, orderCollection, shopCollection) {
  return [
    { $match: riderDeliveryQuery(userId, deliveryId) },
    {
      $project: {
        _id: 1,
        orderId: 1,
        status: 1,
        version: 1,
        "pickup.address": 1,
        "dropoff.address": 1,
        "dropoff.ward": 1,
        "dropoff.phone": 1,
        "assignments.assignedAt": 1,
        "events.status": 1,
        "events.at": 1,
        updatedAt: 1,
      },
    },
    { $lookup: { from: orderCollection, localField: "orderId", foreignField: "_id", as: "order" } },
    { $unwind: { path: "$order", preserveNullAndEmptyArrays: true } },
    { $lookup: { from: shopCollection, localField: "order.shopId", foreignField: "_id", as: "shop" } },
    {
      $set: {
        order: {
          $cond: [
            { $ne: ["$order", null] },
            { $mergeObjects: ["$order", { shopId: { $ifNull: [{ $arrayElemAt: ["$shop", 0] }, null] } }] },
            null,
          ],
        },
      },
    },
    {
      $project: {
        _id: 1,
        orderId: 1,
        status: 1,
        version: 1,
        pickup: 1,
        dropoff: 1,
        assignments: 1,
        events: 1,
        updatedAt: 1,
        "order._id": 1,
        "order.orderId": 1,
        "order.serviceType": 1,
        "order.orderStatus": 1,
        "order.paymentStatus": 1,
        "order.vendorStatus": 1,
        "order.customerName": 1,
        "order.customerPhone": 1,
        "order.customerAddress": 1,
        "order.ward": 1,
        "order.deliveryInstructions": 1,
        "order.customerCoordinates": 1,
        "order.items.name": 1,
        "order.items.image": 1,
        "order.items.quantity": 1,
        "order.items.selectedWholesaleTier.minQty": 1,
        "order.items.selectedWholesaleTier.price": 1,
        "order.shopId._id": 1,
        "order.shopId.name": 1,
        "order.shopId.address": 1,
      },
    },
  ];
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
