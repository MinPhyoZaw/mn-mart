# Manaw Mart Rider API (phase one)

Base path: `/api`. All responses are JSON and use `{ "success": true, "data": ... }` on success. Errors use `{ "success": false, "error": { "code": "...", "message": "..." } }`. Existing-profile results from `/rider/apply` use a successful response with the current status because no new application was created.

`user.id` is the MongoDB User `_id` used for account identity. `rider.profileId` is the separate RiderProfile `_id` used by admin review. Neither is supplied by a public registration request. User roles remain `customer`, `vendor`, or `admin`; rider approval is independent.

## Registration and mobile login

### `POST /rider/register`

Creates a customer User and pending RiderProfile atomically in a MongoDB transaction. Email is trimmed and lowercased for new rider accounts; lookup checks case-insensitively before creating. Existing accounts are never linked or overwritten. If the email exists, use sign in and `/rider/apply`.

Password policy: at least 8 characters and at most 72 UTF-8 bytes (bcrypt limit). The server rejects longer byte sequences; it does not silently truncate them. `name` must be 2–100 characters, email valid and at most 254 characters, and phone 5–32 characters.

Request:

```json
{
  "name": "Aye Aye",
  "email": "aye@example.com",
  "phone": "09123456789",
  "password": "a-long-password"
}
```

Response (`201`):

```json
{
  "success": true,
  "data": {
    "user": { "id": "USER_ID", "name": "Aye Aye", "email": "aye@example.com", "role": "customer" },
    "rider": { "profileId": "RIDER_PROFILE_ID", "status": "pending", "appliedAt": "2026-10-20T00:00:00.000Z" }
  }
}
```

Possible errors: `400 VALIDATION_ERROR`, `409 ACCOUNT_EXISTS`, `409 ACCOUNT_EXISTS` (duplicate/racing profile or email), `429 RATE_LIMITED`, `500 SERVER_ERROR`. Registration is limited to 5 requests per client IP per 5-minute window.

### `POST /rider/login`

Accepts any existing account with valid credentials, including customers and vendors without a rider profile. Email matching is case-insensitive. Pending, rejected, and suspended applicants can sign in to inspect their current state; this does not grant delivery access.

Request: `{ "email": "aye@example.com", "password": "a-long-password" }`

Response (`200`):

```json
{
  "success": true,
  "data": {
    "accessToken": "ACCESS_TOKEN",
    "tokenType": "Bearer",
    "expiresIn": 900,
    "refreshToken": "REFRESH_TOKEN",
    "user": { "id": "USER_ID", "name": "Aye Aye", "email": "aye@example.com", "role": "customer" },
    "rider": { "profileId": "RIDER_PROFILE_ID", "status": "pending", "reason": null, "appliedAt": "2026-10-20T00:00:00.000Z", "reviewedAt": null }
  }
}
```

For an existing account with no application, `rider` is `{ "profileId": null, "status": "not_applied", "reason": null, "appliedAt": null, "reviewedAt": null }`. Errors: `400 VALIDATION_ERROR`, `401 INVALID_CREDENTIALS`, `429 RATE_LIMITED`, `500 SERVER_ERROR`. Login is limited to 10 attempts per client IP per minute.

Access tokens are JWTs scoped to audience `mn-mart-rider-mobile` and purpose `rider-mobile`, expire after 15 minutes, and must be sent as `Authorization: Bearer ACCESS_TOKEN`. They are not accepted as web session cookies, and the web session JWT is not accepted as a mobile access token. Refresh tokens are random opaque values; the database stores only SHA-256 hashes. Refresh sessions expire after 30 days and rotate on every refresh.

### `POST /rider/refresh`

Request: `{ "refreshToken": "CURRENT_REFRESH_TOKEN" }`

Response (`200`): same shape as login, with a new access token and a **new refresh token**. The submitted refresh token is revoked as part of rotation and cannot be reused. An invalid, expired, revoked, or already-used token returns `401 INVALID_REFRESH_TOKEN`. Rate limit: 20 per IP per minute.

The server logs privacy-safe phase timings for MongoDB connection, refresh-session lookup, transaction/rotation, user/profile loading, and total request duration. Logs contain only outcome and durations, never credentials, tokens, connection strings, or customer data.

### `POST /rider/logout`

Request: `{ "refreshToken": "CURRENT_REFRESH_TOKEN" }`

Response (`200`): `{ "success": true, "data": { "loggedOut": true } }`. Revokes that refresh session; it does not revoke an already-issued access JWT, which expires within 15 minutes. Rate limit: 20 per IP per minute.

Flutter should store refresh tokens only in OS-protected secure storage, keep access tokens in memory where practical, use HTTPS outside local development, replace the stored refresh token after each successful refresh, and discard it after logout. Never log tokens or include them in URLs.

## Existing account application and current status

### `POST /rider/apply`

Requires a valid browser `token` cookie or rider mobile bearer access token. Existing customer and vendor roles are allowed and unchanged. The server derives the user ID from verified authentication and accepts optional `name` and `phone` overrides only; approval state and reviewer fields are ignored. Cookie-authenticated requests must include the same-site `Origin`.

Request: `{ "name": "Aye Aye", "phone": "09123456789" }` (both optional; account values are defaults).

New request (`201`):

```json
{ "success": true, "data": { "rider": { "profileId": "RIDER_PROFILE_ID", "status": "pending", "reason": null, "appliedAt": "2026-10-20T00:00:00.000Z", "reviewedAt": null } } }
```

If a profile already exists, the endpoint returns `200` with the same `data.rider` and a message. It does not reactivate rejected or suspended profiles. Rate limit: 10 per IP per minute. Errors include `401 UNAUTHORIZED`, `403 ACCOUNT_NOT_ELIGIBLE`, `400 VALIDATION_ERROR`, and `429 RATE_LIMITED`.

### `GET /rider/me`

Requires browser cookie or bearer access token. It loads the User and RiderProfile from MongoDB each time, so approval and suspension changes are visible without waiting for a token refresh.

Response (`200`):

```json
{ "success": true, "data": { "user": { "id": "USER_ID", "name": "Aye Aye", "email": "aye@example.com", "role": "customer" }, "rider": { "profileId": "RIDER_PROFILE_ID", "status": "approved", "reason": null, "appliedAt": "2026-10-20T00:00:00.000Z", "reviewedAt": "2026-10-20T00:30:00.000Z" } } }
```

The `rider.status` examples are `not_applied`, `pending`, `approved`, `rejected`, or `suspended`. `reason` is null unless rejection/suspension has a reason. The approved-rider server guard `requireApprovedRider` in `app/lib/riderAuth.js` checks both the current User record and current RiderProfile status in MongoDB. Delivery actions are documented in [delivery-api.md](delivery-api.md).

## Account Center monthly earnings

### `GET /api/rider/summary`

Requires `Authorization: Bearer ACCESS_TOKEN` from rider mobile login/refresh and **current** approved-rider access. Browser cookies alone are not accepted. The server checks the existing User and RiderProfile on every request; pending, rejected, suspended, deleted, or otherwise ineligible accounts cannot read totals. Identity comes exclusively from verified mobile authentication. No rider ID or period parameter is supported; supplied query parameters cannot select another rider or month.

Exact success response (`200`, example for October 2026):

```json
{
  "success": true,
  "data": {
    "period": "2026-10",
    "timezone": "Asia/Yangon",
    "currency": "MMK",
    "successfulDeliveries": 10,
    "earnedAmount": 18000,
    "unpricedDeliveries": 0
  }
}
```

- `period`: server-selected current calendar month, `YYYY-MM`, in `Asia/Yangon` (UTC+06:30).
- `successfulDeliveries`: actual `status=delivered` records completed by this rider during that month, including attributable historical records without a price. This is not a counter stored on RiderProfile and does not depend on the current assignee or subsequent order/payment changes.
- `earnedAmount`: sum of recorded, non-negative MMK earning snapshots for those deliveries; never recomputed using the current rate. **Earned is not paid out, withdrawn, or an available payout balance.** This endpoint does not change or report payout/settlement state.
- `unpricedDeliveries`: number of those completed records without a usable earning snapshot. If nonzero, the UI must label `earnedAmount` as recorded/partial earnings, display the unpriced count, and avoid presenting it as final or payable. Example: 10 completed deliveries, 2 unpriced, and 8 snapshots of 1,800 produce `successfulDeliveries: 10`, `earnedAmount: 14400`, `unpricedDeliveries: 2`.

Monthly filtering uses `deliveredAt >= local-month-start` and `< next-local-month-start`. October 2026 runs from `2026-09-30T17:30:00.000Z` inclusive to `2026-10-31T17:30:00.000Z` exclusive. At November's midnight, a rider with no November completions receives period `2026-11` and all three numeric totals `0`. Nothing deletes or resets history; there is no reset cron job. Account Center should refetch on opening/resuming and when the local calendar month changes.

All outcomes, including errors, use `Cache-Control: private, no-store, max-age=0` and `Vary: Authorization`. Errors use the standard envelope: `401 UNAUTHORIZED` (missing/invalid/expired mobile token), `403 RIDER_NOT_APPROVED` (current account/profile ineligible), or `500 SERVER_ERROR` (unable to load summary). No customer, bank, payment, or other riders' data is returned.

### Completion snapshots and duplicate protection

The existing sequential `PATCH /api/rider/deliveries/{deliveryId}` action remains unchanged. On `out_for_delivery → delivered`, the server atomically records:

```json
{
  "deliveredAt": "2026-10-20T12:00:00.000Z",
  "completedBy": "COMPLETING_USER_OBJECT_ID",
  "earning": { "amount": 1800, "currency": "MMK" }
}
```

`completedBy` is the authenticated rider's User `_id`, not a client-supplied value or RiderProfile ID. The timestamp is server-generated and matches the completion event. These fields are immutable snapshots; a future rate change applies only to future completions. They are written in the same compare-and-set as status, event, and version increment, conditioned on current assignment, status, version, and absent completion fields. Concurrent/repeated/stale requests cannot award twice or overwrite a snapshot; they receive the existing `409 VERSION_CONFLICT` or `409 INVALID_TRANSITION` response. Existing acceptance, eligibility checks, payment fields, and settlement behavior remain unchanged.

### Historical-data policy and explicit backfill proposal

Old deliveries have completion events but no dedicated timestamp, completing-rider field, or earning snapshot. Read-only summary aggregation uses the first recorded rider `delivered` event's `actorId` and `at` as the legacy completion attribution and `deliveredAt` equivalent. It never uses `assignedRiderId`, `updatedAt`, or today's rate to invent historical earnings. Such records contribute to successful and unpriced counts, but contribute zero to recorded earnings. Records without an identifiable completion event/date cannot be assigned to a rider/month safely; they are excluded and require a separate historical-data audit. Multiple/conflicting completion events also require audit; the fallback consistently uses the first recorded rider completion and never counts one delivery twice.

No production-history reads, backfills, resets, or rate assumptions are performed automatically by this change. The endpoint reports the authenticated rider's attributable unpriced count for the current month; it is not an all-time production audit. Proposed backfill, as a separate explicitly approved operation:

1. Run a read-only audit on a backed-up database to enumerate all delivered records missing completion/snapshot fields, grouped by event-derived rider/month. Separately list missing dates/actors and conflicting events; do not guess their ownership or month.
2. Review historical rate/payment evidence and explicitly approve per-record or effective-date MMK amounts. Do not presume today's 1,800 rate was payable historically. Resolve ambiguous attribution/timestamps manually.
3. Dry-run an auditable manifest containing delivery IDs, completion evidence, approved amount/currency, and reviewer approval. Test it on a disposable copy first.
4. Only after explicit authorization, apply guarded, idempotent updates to still-delivered records whose snapshot is still absent. Recheck completion evidence, preserve all events/payment/settlement history, and never overwrite an existing snapshot. A maintenance operation must deliberately opt into writing immutable fields; no automatic migration is included.
5. Reconcile counts and sums against the reviewed manifest and retain the audit. Incomplete earnings remain labelled partial until the corresponding unpriced count is zero.

## Admin review

Both endpoints require the existing web token cookie and a user whose **current MongoDB role** is `admin`. The list supports `page`, `limit` (maximum 50), and `status` (`pending`, `approved`, `rejected`, `suspended`, or `all`). Approved records remain queryable through `status=approved` or `status=all`.

### `GET /admin/riders?status=pending&page=1&limit=20`

Response (`200`):

```json
{
  "success": true,
  "data": [{
    "profileId": "RIDER_PROFILE_ID", "userId": "USER_ID", "name": "Aye Aye",
    "email": "aye@example.com", "phone": "09123456789", "currentRole": "customer",
    "status": "pending", "appliedAt": "2026-10-20T00:00:00.000Z",
    "reviewerId": null, "reviewedAt": null, "reason": ""
  }],
  "pagination": { "page": 1, "limit": 20, "total": 1, "totalPages": 1, "hasNextPage": false }
}
```

### `PATCH /admin/riders/{profileId}`

Requires JSON and a same-origin `Origin` header. The UI supplies the rejection reason.

- Pending → approved: `{ "action": "approve" }`
- Pending → rejected: `{ "action": "reject", "reason": "Unable to verify the submitted details." }` (reason required, maximum 500 chars)
- Approved → suspended: `{ "action": "suspend", "reason": "Optional reason" }`

Response (`200`): `{ "success": true, "data": { "profileId": "RIDER_PROFILE_ID", "userId": "USER_ID", "status": "approved", "reviewerId": "ADMIN_USER_ID", "reviewedAt": "2026-10-20T00:30:00.000Z" } }` (also includes name, email, phone, role, appliedAt, and reason).

Updates use an atomic status precondition. A competing review returns `409 ALREADY_REVIEWED`; an unsupported transition returns `409 INVALID_TRANSITION`. A rejected/suspended profile cannot be reactivated through this endpoint. Review never modifies `User.role`. Other errors: `400 INVALID_PROFILE_ID`, `400 INVALID_ACTION`, `400 VALIDATION_ERROR`, `403 FORBIDDEN`, `403 INVALID_ORIGIN`, `404 NOT_FOUND`, `401 UNAUTHORIZED`.

## Configuration and index setup

No new environment variables are needed. Existing `MONGODB_URI` and `JWT_SECRET` must be configured in the local server environment. Do not expose their values to the app. MongoDB transactions require a replica set or sharded cluster; registration and refresh intentionally fail closed if the deployment does not support transactions.

Ensure these indexes exist before using the API in a deployment where Mongoose automatic index creation is disabled:

- `users.email`: existing unique index from the User model.
- `riderprofiles.userId`: unique index (one rider profile per account).
- `riderprofiles.status`: status query index.
- `riderrefreshsessions.tokenHash`: unique index; `userId` index; `expiresAt` TTL index.
- `riderratelimits.key`: unique index; `expiresAt` TTL index.
- `deliveries.{completedBy, deliveredAt}`: compound partial index for `status: delivered`, supporting the summary's rider equality and monthly date range.
- `deliveries.{events.actorId, events.status, events.at}`: compound multikey partial index for `status: delivered`, supporting the legacy completion-event branch without scanning all delivery history. All indexed event paths belong to the same events array. This fallback index can be reviewed for removal only after a separately approved complete historical backfill and removal of the fallback query. Existing assignment/status indexes remain unchanged.

The summary performs one filtered server-side aggregation; it does not load delivery history into application memory or store/reset cumulative counters. Index declarations do not replace deployment index review when auto-indexing is disabled.

For isolated automated coverage, use Node 22 and `npm run test:rider`. The runner disables test-process isolation so individual assertions execute in this environment. Monthly aggregation and compare-and-set tests use the test-only `mingo` evaluator and a substituted collection, exercising Mongoose casting/immutability without a production connection. They do not replace integration verification against a disposable MongoDB database.

The project does not configure a shared external rate-limit service. Rider endpoint limits use atomic MongoDB counters, so they work across server instances sharing this MongoDB deployment. The expiry indexes are for cleanup; rate checks enforce bucket expiry themselves.

## Local verification flow

1. Start the Next.js app against a local/test MongoDB replica set with the required existing environment variables and indexes.
2. `POST /api/rider/register` with a new email; expect `201`, `role: customer`, and `status: pending`.
3. `POST /api/rider/login` with the new credentials; keep `accessToken` and `refreshToken` locally and inspect `rider.status`.
4. Sign into the web dashboard as an existing admin, open **Rider Applications**, approve or reject the pending request, or use the suspended/approved filters to inspect approved accounts.
5. Call `GET /api/rider/me` with the mobile bearer access token; it should reflect the admin decision immediately. A rejected/suspended record can be confirmed with its status filter and remains unable to pass `requireApprovedRider`.
6. Verify rotation by refreshing once and confirming the old refresh token returns `401`; logout with the new token and confirm it can no longer refresh.

Use a disposable local database for manual flow testing. No production records should be used or changed.
