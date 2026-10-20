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

The `rider.status` examples are `not_applied`, `pending`, `approved`, `rejected`, or `suspended`. `reason` is null unless rejection/suspension has a reason. An approved-rider server guard is available as `requireApprovedRider` in `app/lib/riderAuth.js`; it checks both the current User record and current RiderProfile status in MongoDB. No delivery routes are added in this phase.

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

The project does not configure a shared external rate-limit service. Rider endpoint limits use atomic MongoDB counters, so they work across server instances sharing this MongoDB deployment. The expiry indexes are for cleanup; rate checks enforce bucket expiry themselves.

## Local verification flow

1. Start the Next.js app against a local/test MongoDB replica set with the required existing environment variables and indexes.
2. `POST /api/rider/register` with a new email; expect `201`, `role: customer`, and `status: pending`.
3. `POST /api/rider/login` with the new credentials; keep `accessToken` and `refreshToken` locally and inspect `rider.status`.
4. Sign into the web dashboard as an existing admin, open **Rider Applications**, approve or reject the pending request, or use the suspended/approved filters to inspect approved accounts.
5. Call `GET /api/rider/me` with the mobile bearer access token; it should reflect the admin decision immediately. A rejected/suspended record can be confirmed with its status filter and remains unable to pass `requireApprovedRider`.
6. Verify rotation by refreshing once and confirming the old refresh token returns `401`; logout with the new token and confirm it can no longer refresh.

Use a disposable local database for manual flow testing. No production records should be used or changed.
