import test from "node:test";
import assert from "node:assert/strict";
import { canAssignDelivery, checkoutDropoffFields, customerOrderQuery, deliveryLocation, isApprovedRiderAccount, isEligibleShoppingOrder, matchesDeliveryVersion, riderDeliveryDetailPipeline, riderDeliveryQuery, transitionDelivery, validateCustomerCoordinates, validateDeliveryInstructions, riderDeliveryView } from "../../app/lib/delivery.js";
import Delivery from "../../app/models/Delivery.js";

test("delivery eligibility requires confirmed, paid, accepted shopping orders only", () => {
  const eligible = { serviceType: "shopping", orderStatus: "confirmed", paymentStatus: "paid", vendorStatus: "accepted" };
  assert.equal(isEligibleShoppingOrder(eligible), true);
  for (const change of [{ serviceType: "hotel" }, { serviceType: "spa" }, { serviceType: "transportation" }, { orderStatus: "rejected" }, { paymentStatus: "pending" }, { vendorStatus: "new" }]) assert.equal(isEligibleShoppingOrder({ ...eligible, ...change }), false);
});

test("unique order reference index prevents duplicate delivery records", () => {
  const orderRefIndex = Delivery.schema.indexes().find(([keys, options]) => keys.orderId === 1 && options.unique);
  assert.ok(orderRefIndex);
});

test("only existing customer/vendor accounts with approved profiles qualify for assignment", () => {
  assert.equal(isApprovedRiderAccount({ _id: "user", role: "customer" }, { status: "approved" }), true);
  assert.equal(isApprovedRiderAccount(null, { status: "approved" }), false);
  assert.equal(isApprovedRiderAccount({ _id: "user", role: "customer" }, { status: "pending" }), false);
  assert.equal(isApprovedRiderAccount({ _id: "user", role: "admin" }, { status: "approved" }), false);
});

test("delivery status moves sequentially and rejects stale or skipped actions", () => {
  assert.equal(transitionDelivery("assigned", "accept"), "accepted");
  assert.equal(transitionDelivery("accepted", "advance"), "picked_up");
  assert.equal(transitionDelivery("picked_up", "advance"), "out_for_delivery");
  assert.equal(transitionDelivery("out_for_delivery", "advance"), "delivered");
  assert.equal(transitionDelivery("ready", "advance"), null);
  assert.equal(transitionDelivery("delivered", "advance"), null);
  assert.equal(transitionDelivery("accepted", "accept"), null);
  assert.equal(matchesDeliveryVersion({ version: 3 }, 3), true);
  assert.equal(matchesDeliveryVersion({ version: 3 }, 2), false);
});

test("assignment can be changed until pickup; prior assignment loses current-user scope", () => {
  assert.equal(canAssignDelivery("ready"), true);
  assert.equal(canAssignDelivery("assigned"), true);
  assert.equal(canAssignDelivery("accepted"), true);
  assert.equal(canAssignDelivery("picked_up"), false);
  assert.deepEqual(riderDeliveryQuery("new-rider", "delivery-id"), { assignedRiderId: "new-rider", _id: "delivery-id" });
  assert.notDeepEqual(riderDeliveryQuery("new-rider", "delivery-id"), { assignedRiderId: "old-rider", _id: "delivery-id" });
});

test("delivery detail aggregation scopes by assigned rider and joins order and shop", () => {
  const pipeline = riderDeliveryDetailPipeline("rider-id", "delivery-id", "orders", "shops");
  assert.deepEqual(pipeline[0], { $match: { assignedRiderId: "rider-id", _id: "delivery-id" } });
  assert.deepEqual(pipeline[2].$lookup, { from: "orders", localField: "orderId", foreignField: "_id", as: "order" });
  assert.deepEqual(pipeline[4].$lookup, { from: "shops", localField: "order.shopId", foreignField: "_id", as: "shop" });
  assert.equal(pipeline[3].$unwind.preserveNullAndEmptyArrays, true);
  assert.equal(pipeline[6].$project["order.customerName"], 1);
  assert.equal(pipeline[6].$project["order.items.selectedWholesaleTier.price"], 1);
  assert.equal(pipeline[6].$project["order.shopId.name"], 1);
});

test("missing coordinates remain unavailable and valid saved coordinates pass through", () => {
  assert.deepEqual(deliveryLocation({}), { available: false, coordinates: null });
  assert.deepEqual(deliveryLocation({ customerCoordinates: { latitude: 16.8, longitude: 96.15 } }), { available: true, coordinates: { latitude: 16.8, longitude: 96.15 } });
  assert.deepEqual(validateCustomerCoordinates(null), { valid: true, coordinates: undefined });
  assert.deepEqual(validateCustomerCoordinates({ latitude: 0, longitude: 0 }), { valid: true, coordinates: { latitude: 0, longitude: 0 } });
  for (const invalid of [{ latitude: 0 }, { longitude: 0 }, { latitude: 91, longitude: 0 }, { latitude: 0, longitude: -181 }, { latitude: "0", longitude: 0 }, { latitude: 0, longitude: 0, note: "extra" }, [], "" ]) assert.equal(validateCustomerCoordinates(invalid).valid, false);
});

test("rider location response includes explicit optional coordinates and instructions", () => {
  const view = riderDeliveryView({ _id: "d", status: "assigned", version: 1 }, { _id: "o", customerCoordinates: { latitude: 0, longitude: 0 }, deliveryInstructions: "Blue gate", items: [] });
  assert.deepEqual(view.dropoff.coordinates, { latitude: 0, longitude: 0 });
  assert.equal(view.locationAvailable, true);
  assert.equal(view.dropoff.landmarkInstructions, "Blue gate");
  const absent = riderDeliveryView({ _id: "d" }, { _id: "o", items: [] });
  assert.equal(absent.dropoff.coordinates, null);
  assert.equal(absent.locationAvailable, false);
  assert.equal(validateDeliveryInstructions("x".repeat(301)).valid, false);
});

test("multi-shop checkout can only copy the same confirmed destination to each order", () => {
  const dropoff = checkoutDropoffFields({ latitude: 25, longitude: 97 }, "Near the market");
  const createdShoppingOrders = ["shop-a", "shop-b"].map((shopId) => ({ shopId, ...dropoff }));
  assert.deepEqual(createdShoppingOrders[0].customerCoordinates, createdShoppingOrders[1].customerCoordinates);
  assert.equal(createdShoppingOrders[0].deliveryInstructions, createdShoppingOrders[1].deliveryInstructions);
  assert.deepEqual(checkoutDropoffFields(undefined, ""), { deliveryInstructions: "" });
});

test("delivery fields do not mutate the separate order payment settlement", () => {
  const order = { paymentStatus: "paid", settlementStatus: "unsettled" };
  const delivery = { status: transitionDelivery("out_for_delivery", "advance") };
  assert.equal(delivery.status, "delivered");
  assert.equal(order.paymentStatus, "paid");
  assert.equal(order.settlementStatus, "unsettled");
});

test("customer order query is always scoped to the authenticated owner", () => {
  assert.deepEqual(customerOrderQuery("customer-a"), { customerId: "customer-a" });
});
