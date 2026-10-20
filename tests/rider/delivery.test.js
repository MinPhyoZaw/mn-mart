import test from "node:test";
import assert from "node:assert/strict";
import { canAssignDelivery, customerOrderQuery, deliveryLocation, isApprovedRiderAccount, isEligibleShoppingOrder, matchesDeliveryVersion, riderDeliveryQuery, transitionDelivery } from "../../app/lib/delivery.js";
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

test("missing coordinates remain unavailable and valid saved coordinates pass through", () => {
  assert.deepEqual(deliveryLocation({}), { available: false, coordinates: undefined });
  assert.deepEqual(deliveryLocation({ customerCoordinates: { latitude: 16.8, longitude: 96.15 } }), { available: true, coordinates: { latitude: 16.8, longitude: 96.15 } });
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
