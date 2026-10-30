import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { validateRiderRegistration, buildRiderAccountDocuments, buildExistingAccountRiderApplication } from "../../app/lib/riderInput.js";
import { reviewTransition } from "../../app/lib/riderReview.js";
import RiderRefreshSession from "../../app/models/RiderRefreshSession.js";

process.env.JWT_SECRET = "test-only-rider-secret-do-not-use-in-production";
process.env.MONGODB_URI ??= "mongodb://127.0.0.1:27017/rider-test";
const { createRefreshToken, riderTokenHash, signRiderAccessToken, verifyRiderAccessToken, ACCESS_TTL_SECONDS } = await import("../../app/lib/riderAuth.js");

test("new account input normalizes identity and rejects invalid or bcrypt-truncated passwords", () => {
  const valid = validateRiderRegistration({ name: " May " , email: " MAY@EXAMPLE.COM ", phone: " 0912345 ", password: "long-enough-password" });
  assert.deepEqual(valid.value, { name: "May", email: "may@example.com", phone: "0912345", password: "long-enough-password" });
  assert.match(validateRiderRegistration({ name: "M", email: "x@example.com", phone: "12345", password: "long-enough" }).error, /Name/);
  assert.match(validateRiderRegistration({ name: "May", email: "x@example.com", phone: "12345", password: "short" }).error, /Password/);
  assert.match(validateRiderRegistration({ name: "May", email: "x@example.com", phone: "12345", password: "é".repeat(37) }).error, /72 UTF-8 bytes/);
});

test("public registration payload always creates a customer and pending profile", () => {
  const parsed = validateRiderRegistration({ name: "Rider", email: "r@example.com", phone: "0912345", password: "12345678", role: "admin", status: "approved", userId: "attacker" }).value;
  const docs = buildRiderAccountDocuments({ ...parsed, passwordHash: "hashed" });
  assert.equal(docs.user.role, "customer");
  assert.equal(docs.rider.status, "pending");
  assert.equal(docs.rider.userId, undefined);
  assert.equal(docs.user.password, "hashed");
  assert.equal("role" in docs.rider, false);
});

test("existing-account application is derived from authenticated identity and starts pending", () => {
  const profile = buildExistingAccountRiderApplication({ userId: "verified-user-id", name: "Vendor Rider", phone: "0912345" });
  assert.equal(profile.userId, "verified-user-id");
  assert.equal(profile.status, "pending");
  assert.equal("role" in profile, false);
});

test("review state machine permits only pending decisions and approved suspension", () => {
  assert.deepEqual(reviewTransition("pending", "approve"), { status: "approved" });
  assert.deepEqual(reviewTransition("pending", "reject"), { status: "rejected" });
  assert.deepEqual(reviewTransition("approved", "suspend"), { status: "suspended" });
  for (const [status, action] of [["rejected", "approve"], ["suspended", "approve"], ["pending", "suspend"], ["approved", "reject"]]) {
    assert.equal(reviewTransition(status, action), null);
  }
});

test("mobile access JWT is purpose/audience scoped and short lived", () => {
  const token = signRiderAccessToken("user-123");
  const claims = verifyRiderAccessToken(token);
  assert.equal(claims.userId, "user-123");
  assert.equal(claims.purpose, "rider-mobile");
  assert.ok(claims.exp - claims.iat <= ACCESS_TTL_SECONDS);
  assert.throws(() => jwt.verify(token, process.env.JWT_SECRET), /signature/);
  assert.throws(() => verifyRiderAccessToken(jwt.sign({ userId: "user-123" }, process.env.JWT_SECRET, { expiresIn: "1h" })), /signature/);
});

test("refresh credentials are random and stored as non-reversible hashes", () => {
  const first = createRefreshToken();
  const second = createRefreshToken();
  const hash = riderTokenHash(first);
  assert.notEqual(first, second);
  assert.notEqual(hash, first);
  assert.equal(riderTokenHash(first), hash);
  assert.equal(hash.length, 64);
});

test("refresh session expiresAt has exactly one TTL index", () => {
  const expiryIndexes = RiderRefreshSession.schema.indexes().filter(([keys]) => keys.expiresAt === 1);
  assert.equal(expiryIndexes.length, 1);
  assert.equal(expiryIndexes[0][1].expireAfterSeconds, 0);
});
