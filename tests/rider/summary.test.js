import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import "mingo/init/system";
import { aggregate, Query } from "mingo";
import { update } from "mingo/updater";
import Delivery from "../../app/models/Delivery.js";
import User from "../../app/models/User.js";
import RiderProfile from "../../app/models/RiderProfile.js";
import {
  createRiderSummaryHandler, deliveryTransitionUpdate, riderSummaryMonth, riderSummaryPipeline,
} from "../../app/lib/riderEarnings.js";

const rider = new mongoose.Types.ObjectId();
const other = new mongoose.Types.ObjectId();
const october = riderSummaryMonth(new Date("2026-10-15T00:00:00Z"));
const at = new Date("2026-10-10T05:00:00Z");
const completed = (overrides = {}) => ({
  _id: new mongoose.Types.ObjectId(), status: "delivered", completedBy: rider, deliveredAt: at,
  earning: { amount: 1800, currency: "MMK" }, ...overrides,
});
const totals = (rows, month = october) => aggregate(rows, riderSummaryPipeline(rider, month));
const legacy = (overrides = {}) => ({
  status: "delivered", assignedRiderId: other,
  events: [{ status: "delivered", actorRole: "rider", actorId: rider, at }], ...overrides,
});

test("monthly summary counts completed records only, attributes completer rather than assignee, and sums recorded rates", () => {
  assert.deepEqual(totals([
    completed({ assignedRiderId: other }),
    completed({ earning: { amount: 2200, currency: "MMK" } }),
    completed({ status: "out_for_delivery" }),
    completed({ status: "accepted" }),
    completed({ completedBy: other, assignedRiderId: rider }),
  ]), [{ successfulDeliveries: 2, earnedAmount: 4000, unpricedDeliveries: 0 }]);
});

test("Myanmar month range includes local midnight and excludes the next month's midnight", () => {
  assert.equal(october.start.toISOString(), "2026-09-30T17:30:00.000Z");
  assert.equal(october.end.toISOString(), "2026-10-31T17:30:00.000Z");
  assert.deepEqual(totals([
    completed({ deliveredAt: new Date("2026-09-30T17:29:59.999Z") }),
    completed({ deliveredAt: october.start }),
    completed({ deliveredAt: new Date("2026-10-31T17:29:59.999Z") }),
    completed({ deliveredAt: october.end }),
  ]), [{ successfulDeliveries: 2, earnedAmount: 3600, unpricedDeliveries: 0 }]);
  assert.equal(riderSummaryMonth(new Date("2026-10-31T17:29:59.999Z")).period, "2026-10");
  assert.equal(riderSummaryMonth(october.end).period, "2026-11");
  const january = riderSummaryMonth(new Date("2026-12-31T17:30:00Z"));
  assert.equal(january.period, "2027-01");
  assert.equal(january.end.toISOString(), "2027-01-31T17:30:00.000Z");
});

test("historical completions report missing snapshots without inventing a payable amount", () => {
  assert.deepEqual(totals([
    legacy(), completed({ earning: undefined }), completed(),
    legacy({ events: [{ status: "delivered", actorRole: "rider", actorId: other, at }] }),
    legacy({ status: "picked_up" }),
    completed({ earning: { currency: "USD", amount: 1800 } }),
  ]), [{ successfulDeliveries: 4, earnedAmount: 1800, unpricedDeliveries: 3 }]);
  // An ambiguous second event must not create a second completion or steal attribution.
  assert.deepEqual(totals([legacy({ events: [
    { status: "delivered", actorRole: "rider", actorId: other, at },
    { status: "delivered", actorRole: "rider", actorId: rider, at },
  ] })]), []);
});

test("legacy completion event uses Myanmar boundaries, never updatedAt or current assignment", () => {
  assert.deepEqual(totals([
    legacy({ updatedAt: new Date("2026-11-15"), events: [{ status: "delivered", actorRole: "rider", actorId: rider, at: october.start }] }),
    legacy({ events: [{ status: "delivered", actorRole: "rider", actorId: rider, at: october.end }] }),
    legacy({ assignedRiderId: rider, events: [] }),
  ]), [{ successfulDeliveries: 1, earnedAmount: 0, unpricedDeliveries: 1 }]);
});

test("completion writes price, rider, timestamp and event atomically; duplicate/conflicting requests cannot match twice", async (t) => {
  const current = {
    _id: new mongoose.Types.ObjectId(), orderId: new mongoose.Types.ObjectId(),
    assignedRiderId: rider, status: "out_for_delivery", version: 4, events: [],
  };
  const row = { ...current, events: [] };
  // Exercise Mongoose casting/immutable handling and the actual update's MongoDB
  // predicate/operators. The in-memory server substitute performs each CAS atomically.
  t.mock.method(Delivery.collection, "findOneAndUpdate", async (filter, change) => {
    if (!new Query(filter).test(row)) return null;
    for (const [operator, fields] of Object.entries(change)) {
      if (operator !== "$setOnInsert") update(row, { [operator]: fields });
    }
    return { ...row };
  });
  const change = deliveryTransitionUpdate(current, rider, 4, "delivered", at);
  const apply = () => Delivery.findOneAndUpdate(change.filter, change.update, change.options).lean();
  const results = await Promise.all([apply(), apply()]);
  assert.equal(results.filter(Boolean).length, 1);
  assert.equal(row.status, "delivered");
  assert.equal(row.version, 5);
  assert.equal(String(row.completedBy), String(rider));
  assert.equal(row.deliveredAt.getTime(), at.getTime());
  assert.equal(row.earning.amount, 1800);
  assert.equal(row.earning.currency, "MMK");
  assert.equal(row.events.length, 1);
  assert.equal(row.events[0].at.getTime(), at.getTime());
  assert.equal(await apply(), null);
  const conflict = deliveryTransitionUpdate(current, other, 4, "delivered", at);
  assert.equal(await Delivery.findOneAndUpdate(conflict.filter, conflict.update, conflict.options).lean(), null);
  assert.deepEqual(totals([row]), [{ successfulDeliveries: 1, earnedAmount: 1800, unpricedDeliveries: 0 }]);
  assert.equal("paymentStatus" in change.update.$set, false);
  assert.equal("settlementStatus" in change.update.$set, false);
});

test("existing snapshots are immutable and completion cannot overwrite even inconsistent preexisting fields", () => {
  const current = { _id: new mongoose.Types.ObjectId(), assignedRiderId: rider, status: "out_for_delivery", version: 4 };
  const { filter } = deliveryTransitionUpdate(current, rider, 4, "delivered", at);
  for (const fields of [{ earning: { amount: 500, currency: "MMK" } }, { completedBy: other }, { deliveredAt: at }]) {
    assert.equal(new Query(filter).test({ ...current, ...fields }), false);
  }
  const doc = Delivery.hydrate({ orderId: new mongoose.Types.ObjectId(), ...completed() });
  doc.earning.amount = 9999;
  doc.completedBy = other;
  doc.deliveredAt = new Date("2027-01-01");
  assert.equal(doc.earning.amount, 1800);
  assert.equal(String(doc.completedBy), String(rider));
  assert.equal(doc.deliveredAt.getTime(), at.getTime());
  const advance = deliveryTransitionUpdate(current, rider, 4, "picked_up", at);
  assert.equal("earning" in advance.update.$set, false);
  assert.equal("completedBy" in advance.update.$set, false);
});

test("summary endpoint scopes to authenticated rider despite supplied identity/period and marks success private", async () => {
  const GET = createRiderSummaryHandler({
    requireApprovedRider: async () => ({ ok: true, user: { _id: rider } }),
    Delivery: { aggregate: async (pipeline) => aggregate([completed(), completed({ completedBy: other })], pipeline) },
    now: () => at,
  });
  const response = await GET(new Request(`https://example.com/api/rider/summary?riderId=${other}&period=2020-01`));
  assert.equal(response.status, 200);
  assert.match(response.headers.get("Cache-Control"), /private, no-store/);
  assert.equal(response.headers.get("Vary"), "Authorization");
  assert.deepEqual(await response.json(), { success: true, data: {
    period: "2026-10", timezone: "Asia/Yangon", currency: "MMK",
    successfulDeliveries: 1, earnedAmount: 1800, unpricedDeliveries: 0,
  } });
});

test("new month returns zero totals without deleting or resetting history", async () => {
  const rows = [completed(), legacy()];
  const GET = createRiderSummaryHandler({
    requireApprovedRider: async () => ({ ok: true, user: { _id: rider } }),
    Delivery: { aggregate: async (pipeline) => aggregate(rows, pipeline) },
    now: () => october.end,
  });
  const { data } = await (await GET(new Request("https://example.com/api/rider/summary"))).json();
  assert.deepEqual(data, { period: "2026-11", timezone: "Asia/Yangon", currency: "MMK", successfulDeliveries: 0, earnedAmount: 0, unpricedDeliveries: 0 });
  assert.equal(rows.length, 2);
});

test("summary endpoint preserves authentication/approval rejection and never queries totals", async () => {
  for (const [status, code] of [[401, "UNAUTHORIZED"], [403, "RIDER_NOT_APPROVED"]]) {
    const GET = createRiderSummaryHandler({
      requireApprovedRider: async () => ({ ok: false, response: Response.json({ success: false, error: { code } }, { status }) }),
      Delivery: { aggregate: () => assert.fail("unauthorized aggregate") },
    });
    const response = await GET(new Request("https://example.com/api/rider/summary"));
    assert.equal(response.status, status);
    assert.match(response.headers.get("Cache-Control"), /private, no-store/);
    assert.equal((await response.json()).error.code, code);
  }
});

test("summary failures do not cache or disclose database errors", async (t) => {
  t.mock.method(console, "error", () => {});
  const GET = createRiderSummaryHandler({
    requireApprovedRider: async () => ({ ok: true, user: { _id: rider } }),
    Delivery: { aggregate: async () => { throw new Error("private database details"); } },
  });
  const response = await GET(new Request("https://example.com/api/rider/summary"));
  assert.equal(response.status, 500);
  assert.match(response.headers.get("Cache-Control"), /private, no-store/);
  assert.equal((await response.json()).error.code, "SERVER_ERROR");
});

test("real mobile guard rejects web/invalid tokens and checks current account and approval on every summary request", async (t) => {
  process.env.JWT_SECRET ??= "test-only-summary-secret";
  process.env.MONGODB_URI ??= "mongodb://127.0.0.1:27017/summary-test";
  const { requireApprovedRider, signRiderAccessToken } = await import("../../app/lib/riderAuth.js");
  const cached = globalThis.__mongoose;
  const previousConnection = cached.conn;
  cached.conn = {}; // No live database: queries below are explicitly substituted.
  t.after(() => { cached.conn = previousConnection; });
  let profileStatus = "approved";
  let role = "customer";
  const query = (value) => ({ select: () => ({ lean: async () => value }) });
  t.mock.method(User, "findById", (id) => {
    assert.equal(String(id), String(rider));
    return query({ _id: rider, role });
  });
  t.mock.method(RiderProfile, "findOne", ({ userId }) => {
    assert.equal(String(userId), String(rider));
    return query({ status: profileStatus });
  });
  let aggregateCalls = 0;
  const GET = createRiderSummaryHandler({
    requireApprovedRider,
    Delivery: { aggregate: async (pipeline) => { aggregateCalls++; return aggregate([completed()], pipeline); } },
    now: () => at,
  });
  const token = signRiderAccessToken(rider);
  const request = (authorization) => new Request("https://example.com/api/rider/summary", {
    headers: { authorization, cookie: `token=${token}` },
  });
  assert.equal((await GET(request(""))).status, 401);
  assert.equal((await GET(request("Bearer invalid"))).status, 401);
  assert.equal((await GET(request(`Bearer ${token}`))).status, 200);
  for (const status of ["pending", "rejected", "suspended"]) {
    profileStatus = status;
    assert.equal((await GET(request(`Bearer ${token}`))).status, 403);
  }
  profileStatus = "approved";
  role = "admin";
  assert.equal((await GET(request(`Bearer ${token}`))).status, 403);
  assert.equal(aggregateCalls, 1);
});
