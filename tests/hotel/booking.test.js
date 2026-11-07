import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import ts from "typescript";
import mongoose from "mongoose";

// Use a dedicated replica-set database. Never point this at MN-Mart production.
const uri = process.env.HOTEL_TEST_MONGODB_URI;
const require = createRequire(import.meta.url);
const cache = new Map();
const root = path.resolve("app");
const userId = new mongoose.Types.ObjectId();
const otherUserId = new mongoose.Types.ObjectId();
const vendorId = new mongoose.Types.ObjectId();
const shopId = new mongoose.Types.ObjectId();
const roomId = new mongoose.Types.ObjectId();

function load(filename) {
  filename = path.resolve(filename);
  if (cache.has(filename)) return cache.get(filename);
  const exports = {};
  cache.set(filename, exports);
  const source = ts.transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const localRequire = (name) => {
    if (!name.startsWith(".")) return require(name);
    const target = path.resolve(path.dirname(filename), name) + ".js";
    if (target === path.join(root, "lib/pushNotifications.js"))
      return { sendPushToUser: async () => {} };
    if (target === path.join(root, "lib/mongodb.js")) return { default: async () => mongoose };
    if (target === path.join(root, "lib/routeAuth.js"))
      return {
        requireAuth: (req) =>
          req.headers.get("x-deny")
            ? { ok: false, response: new Response("{}", { status: 401 }) }
            : { ok: true, user: { userId: req.headers.get("x-user") || userId, role: "customer" } },
        requireVendorAuth: async (req) => ({
          ok: true,
          user: { role: "vendor", userId },
          vendor: { _id: req.headers.get("x-vendor") || vendorId },
        }),
      };
    return load(target);
  };
  new Function("require", "exports", source)(localRequire, exports);
  return exports;
}

function request(body, method = "POST", headers = {}) {
  return new Request("http://localhost/api/hotel-booking", {
    method,
    headers: { "Content-Type": "application/json", ...headers },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}
const stay = { checkIn: "2090-05-10", checkOut: "2090-05-12" };
function payload(extra = {}) {
  return {
    ...stay,
    roomItemId: String(roomId),
    shopId: String(shopId),
    customerName: "Test Guest",
    customerPhone: "099999999",
    guestCount: 2,
    extraBedAmount: 0,
    receiptImage: "https://example.test/receipt.jpg",
    paymentProvider: "kbzpay_2",
    bookingKey: `hotel-test-${new mongoose.Types.ObjectId()}`,
    ...extra,
  };
}

test(
  "hotel routes preserve room availability and booking isolation",
  { skip: !uri },
  async (suite) => {
    suite.after(async () => {
      await mongoose.disconnect();
    });
    assert.match(
      new URL(uri).pathname,
      /^\/hotel-tests(?:[-_][a-zA-Z0-9_-]+)?$/,
      "Use a dedicated hotel-tests database.",
    );
    await mongoose.connect(uri);
    const Item = load(path.join(root, "models/Item.js")).default;
    const Order = load(path.join(root, "models/Order.js")).default;
    const Shop = load(path.join(root, "models/Shop.js")).default;
    const Block = load(path.join(root, "models/HotelBlock.js")).default;
    const Vendor = load(path.join(root, "models/Vendor.js")).default;
    const shopRoute = load(path.join(root, "api/shops/[id]/route.js"));
    const itemRoute = load(path.join(root, "api/items/route.js"));
    const booking = load(path.join(root, "api/hotel-booking/route.js"));
    const calendar = load(path.join(root, "api/vendor/rooms/[id]/calendar/route.js"));
    const admin = load(path.join(root, "api/admin/orders/[id]/route.js"));
    const vendor = load(path.join(root, "api/vendor/orders/[id]/route.js"));
    const availability = load(path.join(root, "lib/hotelAvailability.js"));
    await Promise.all([Item.init(), Order.init(), Shop.init(), Block.init()]);
    const params = { params: Promise.resolve({ id: String(roomId) }) };
    async function reset() {
      await Promise.all([
        Item.deleteMany({}),
        Order.deleteMany({}),
        Shop.deleteMany({}),
        Block.deleteMany({}),
        Vendor.deleteMany({}),
      ]);
      await Vendor.collection.insertOne({ _id: vendorId, userId });
      await Shop.collection.insertOne({
        _id: shopId,
        vendorId,
        category: "hotel",
        name: "Test Hotel",
        isActive: true,
      });
      await Item.create({
        _id: roomId,
        shopId,
        name: "Room 101",
        type: "room",
        price: 40000,
        roomNumber: "101",
        roomType: "Double",
        maxGuests: 2,
        extra: { amenities: { extraBed: false } },
      });
    }
    try {
      await suite.test(
        "two customers racing for one room produce exactly one booking",
        async () => {
          await reset();
          const responses = await Promise.all([
            booking.POST(request(payload())),
            booking.POST(request(payload(), "POST", { "x-user": String(otherUserId) })),
          ]);
          assert.deepEqual(responses.map((response) => response.status).sort(), [201, 409]);
          assert.equal(await Order.countDocuments({}), 1);
          const order = await Order.findOne().lean();
          assert.equal(order.totalAmount, 80000);
          assert.equal(order.items[0].quantity, 2);
          assert.equal(order.bookingDetails.nights, 2);
        },
      );
      await suite.test(
        "retry is idempotent and never reveals another customer’s order",
        async () => {
          await reset();
          const body = payload();
          const responses = await Promise.all([
            booking.POST(request(body)),
            booking.POST(request(body)),
          ]);
          assert.ok(responses.every((response) => response.status >= 200 && response.status < 300));
          assert.equal(await Order.countDocuments({}), 1);
          const other = await booking.POST(
            request(body, "POST", { "x-user": String(otherUserId) }),
          );
          assert.equal(other.status, 409);
          assert.equal((await other.json()).data, undefined);
          assert.equal(
            (await booking.POST(request({ ...body, checkOut: "2090-05-14" }))).status,
            409,
          );
        },
      );
      await suite.test("checkout is exclusive and overlapping stays are blocked", async () => {
        await reset();
        assert.equal((await booking.POST(request(payload()))).status, 201);
        assert.equal(
          (await booking.POST(request(payload({ checkIn: "2090-05-11", checkOut: "2090-05-13" }))))
            .status,
          409,
        );
        assert.equal(
          (await booking.POST(request(payload({ checkIn: "2090-05-12", checkOut: "2090-05-14" }))))
            .status,
          201,
        );
      });
      await suite.test("rejection by admin releases the dates", async () => {
        await reset();
        const submitted = await (await booking.POST(request(payload()))).json();
        assert.equal(
          (
            await admin.PATCH(request({ action: "reject" }, "PATCH"), {
              params: Promise.resolve({ id: submitted.data._id }),
            })
          ).status,
          200,
        );
        assert.equal((await booking.POST(request(payload()))).status, 201);
      });
      await suite.test("vendor rejection releases dates after admin payment approval", async () => {
        await reset();
        const submitted = await (await booking.POST(request(payload()))).json();
        const orderParams = { params: Promise.resolve({ id: submitted.data._id }) };
        assert.equal(
          (await admin.PATCH(request({ action: "approve" }, "PATCH"), orderParams)).status,
          200,
        );
        assert.equal(
          (await vendor.PATCH(request({ action: "rejected" }, "PATCH"), orderParams)).status,
          200,
        );
        assert.equal((await booking.POST(request(payload()))).status, 201);
      });
      await suite.test(
        "capacity, closed rooms and missing dates are checked before creating an order",
        async () => {
          await reset();
          assert.equal((await booking.POST(request(payload({ guestCount: 3 })))).status, 400);
          assert.equal((await booking.POST(request(payload({ extraBedAmount: 1 })))).status, 400);
          assert.equal((await booking.POST(request(payload({ checkIn: undefined })))).status, 400);
          await Item.updateOne({ _id: roomId }, { $set: { isAvailable: false } });
          assert.equal((await booking.POST(request(payload()))).status, 409);
          assert.equal(await Order.countDocuments({}), 0);
        },
      );
      await suite.test(
        "phone bookings and maintenance share the booking lock and stay owner-scoped",
        async () => {
          await reset();
          const body = { ...stay, kind: "external", reason: "Walk-in guest" };
          assert.equal(
            (
              await calendar.POST(
                request(body, "POST", { "x-vendor": String(new mongoose.Types.ObjectId()) }),
                params,
              )
            ).status,
            404,
          );
          const blocked = await calendar.POST(request(body), params);
          assert.equal(blocked.status, 201);
          const block = (await blocked.json()).data;
          assert.equal((await booking.POST(request(payload()))).status, 409);
          assert.equal(
            (await calendar.DELETE(request({ blockId: block._id }, "DELETE"), params)).status,
            200,
          );
          assert.equal((await booking.POST(request(payload()))).status, 201);
        },
      );
      await suite.test(
        "a calendar block racing with a booking cannot double reserve the room",
        async () => {
          await reset();
          const responses = await Promise.all([
            booking.POST(request(payload())),
            calendar.POST(request({ ...stay, kind: "maintenance", reason: "" }), params),
          ]);
          assert.deepEqual(responses.map((response) => response.status).sort(), [201, 409]);
          assert.equal((await Order.countDocuments({})) + (await Block.countDocuments({})), 1);
        },
      );
      await suite.test(
        "legacy undated orders close availability until the owner assigns dates",
        async () => {
          await reset();
          const response = await booking.POST(request(payload()));
          const old = (await response.json()).data;
          await Order.updateOne(
            { _id: old._id },
            { $unset: { "bookingDetails.checkIn": "", "bookingDetails.checkOut": "" } },
          );
          const [room] = await availability.roomAvailability([await Item.findById(roomId).lean()], {
            checkIn: "2090-06-01",
            checkOut: "2090-06-03",
          });
          assert.equal(room.availability, "unavailable");
          assert.equal(
            (await calendar.PATCH(request({ ...stay, orderId: old._id }, "PATCH"), params)).status,
            200,
          );
          assert.equal(
            (
              await booking.POST(
                request(payload({ checkIn: "2090-06-01", checkOut: "2090-06-03" })),
              )
            ).status,
            201,
          );
        },
      );
      await suite.test("room numbers are unique within each hotel", async () => {
        await reset();
        await assert.rejects(
          Item.create({ shopId, type: "room", name: "Duplicate", price: 40000, roomNumber: "101" }),
          (error) => error.code === 11000,
        );
      });
      await suite.test(
        "public room availability includes closed rooms without exposing reservations",
        async () => {
          await reset();
          await booking.POST(request(payload()));
          const url = `http://localhost/api/shops/${shopId}?checkIn=${stay.checkIn}&checkOut=${stay.checkOut}`;
          const response = await shopRoute.GET(new Request(url), {
            params: Promise.resolve({ id: String(shopId) }),
          });
          assert.equal(response.status, 200);
          assert.equal(response.headers.get("cache-control"), "no-store");
          const data = (await response.json()).data;
          assert.equal(data.items[0].availability, "unavailable");
          assert.equal(data.items[0].roomNumber, "101");
          assert.equal(data.items[0].bookingDetails, undefined);
          assert.equal(data.items[0].customerName, undefined);
          const invalid = await shopRoute.GET(
            new Request(`http://localhost/api/shops/${shopId}?checkIn=2090-05-10`),
            { params: Promise.resolve({ id: String(shopId) }) },
          );
          assert.equal(invalid.status, 400);
        },
      );
      await suite.test("vendor room creation validates room identity and ownership", async () => {
        await reset();
        const body = {
          shopId: String(shopId),
          type: "room",
          name: "102",
          price: 50000,
          roomNumber: "102",
          roomType: "Double",
          maxGuests: 2,
        };
        assert.equal((await itemRoute.POST(request({ ...body, roomNumber: "" }))).status, 400);
        assert.equal(
          (
            await itemRoute.POST(
              request(body, "POST", { "x-vendor": String(new mongoose.Types.ObjectId()) }),
            )
          ).status,
          403,
        );
        assert.equal((await itemRoute.POST(request(body))).status, 201);
        assert.equal((await itemRoute.POST(request(body))).status, 409);
      });
      await suite.test("anonymous submissions are rejected before booking", async () => {
        await reset();
        assert.equal(
          (await booking.POST(request(payload(), "POST", { "x-deny": "true" }))).status,
          401,
        );
        assert.equal(await Order.countDocuments({}), 0);
      });
    } finally {
      await mongoose.disconnect();
    }
  },
);
