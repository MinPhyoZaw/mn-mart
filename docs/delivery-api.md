# Manaw Mart Delivery API (phase two)

All endpoints use JSON and the phase one envelope: success is `{ "success": true, "data": ... }`; errors are `{ "success": false, "error": { "code": "...", "message": "..." } }`.

## Data model and eligibility

Checkout creates one `Order` per shop from a multi-shop cart. A `Delivery` references exactly one MongoDB Order `_id`; it does not copy the full order. Delivery creation happens idempotently when an admin loads deliveries and uses a unique `Delivery.orderId` index. Eligible orders are shopping orders where `orderStatus=confirmed`, `paymentStatus=paid`, and `vendorStatus=accepted`. This follows checkout, payment approval, and vendor acceptance fields. Hotel, spa, transportation, rejected/cancelled-like, pending payment, and unaccepted orders are excluded. Existing enum values have no cancelled state.

Order `_id` is the database order identifier; `orderId` is the human readable order number. `deliveryId` is the Delivery `_id`. `riderUserId`/`assignedRiderId` is the User `_id`, not the RiderProfile `_id`. Rider approval remains a RiderProfile status and does not change User role.

`Order.customerCoordinates` is optional and has the exact shape `{ latitude: Number, longitude: Number }`. Checkout persists it only after explicit map confirmation; missing pins are omitted from the order. Both values must be finite JSON numbers in latitude `[-90, 90]` and longitude `[-180, 180]`; zero is valid. Objects with missing fields, string values, or extra keys are rejected. `Order.deliveryInstructions` is optional plain text, trimmed and limited to 300 characters. Existing orders without coordinates remain valid and are never backfilled. The order model also has no COD type. Current checkout accepts receipt-based payment providers only; eligible deliveries are paid/prepaid, so the API reports `collectionRequired: false`, amount zero, currency MMK. No payment or settlement fields are updated by delivery transitions.

Pickup uses the saved Shop address when available. Customer drop-off uses the saved order address, ward, phone, and instructions. Rider responses always include `dropoff.coordinates: { latitude, longitude } | null` and `locationAvailable`, true only for valid saved coordinates. Coordinates and instructions are returned only to the assigned approved rider in rider delivery endpoints, and the admin delivery dashboard shows pin availability to admins. Customer order history does not expose coordinates. No address or coordinates are fabricated.

## Status and concurrency

Statuses progress `ready → assigned → accepted → picked_up → out_for_delivery → delivered`. Only an admin assigns/reassigns; reassignment is allowed through `accepted` and blocked at pickup. Each mutation compares `version` and current status atomically, increments version, and appends an event with actor and server time. A stale update returns `409 VERSION_CONFLICT`; invalid transitions return `409 INVALID_TRANSITION`; an order that ceases to qualify returns `409 ORDER_NOT_ELIGIBLE` for admin resolution. A repeated accept returns the already accepted state; repeating an advance with an old version conflicts and cannot duplicate an event. Assignment history retains each rider and assigning admin. Rider list/detail/mutations always query by the currently assigned User `_id`; reassignment makes old rider requests return `404 NOT_FOUND`.

## Endpoints

### `GET /api/admin/deliveries?status=awaiting&page=1&limit=20`

Requires a web session cookie and a current MongoDB admin role. `status` is `all`, `awaiting`, `active`, or `completed`; page defaults to 1, limit to 20, maximum 50. The response includes approved riders in `riders` for the assignment selector and paginated delivery rows.

```json
{ "success": true, "data": [{ "deliveryId": "DELIVERY_ID", "orderId": "ORDER_OBJECT_ID", "orderNumber": "ORD-123", "status": "ready", "version": 0, "locationAvailable": false, "shop": { "id": "SHOP_ID", "name": "Market" }, "customer": { "name": "Aye Aye", "phone": "09123456789" }, "address": "Customer address", "ward": "Ward", "items": [{ "name": "Rice", "image": null, "quantity": 2 }], "currentRider": null, "assignments": [], "events": [], "createdAt": "2026-10-20T00:00:00.000Z", "updatedAt": "2026-10-20T00:00:00.000Z" }], "riders": [{ "userId": "USER_ID", "name": "Rider", "phone": "09123456789" }], "pagination": { "page": 1, "limit": 20, "total": 1, "totalPages": 1, "hasNextPage": false } }
```

### `PATCH /api/admin/deliveries`

Requires current admin authorization and same-origin `Origin`. Assign or reassign with `{ "deliveryId": "DELIVERY_ID", "riderUserId": "USER_ID", "version": 0 }`.

```json
{ "success": true, "data": { "deliveryId": "DELIVERY_ID", "orderId": "ORDER_OBJECT_ID", "assignedRiderId": "USER_ID", "status": "assigned", "version": 1, "assignedAt": "2026-10-20T00:00:00.000Z" } }
```

The target account must exist and have an approved RiderProfile. Invalid IDs/payloads return `400`; missing delivery `404`; unapproved rider, ineligible order, or stale version `409`.

### `GET /api/rider/deliveries?filter=active&page=1&limit=20`

Requires rider mobile Bearer access token and current-database approved-rider status. `filter` is `active` (default), `history`, or `all`; pagination defaults/maximum match admin list. Rows are scoped to the currently assigned rider.

```json
{ "success": true, "data": [{ "deliveryId": "DELIVERY_ID", "orderId": "ORDER_OBJECT_ID", "orderNumber": "ORD-123", "status": "assigned", "version": 1, "locationAvailable": true, "pickup": { "address": "" }, "dropoff": { "address": "Customer address", "ward": "Ward", "phone": "09123456789", "coordinates": { "latitude": 25.3833, "longitude": 97.4 }, "landmarkInstructions": "Blue gate beside the tea shop" }, "shop": { "id": "SHOP_ID", "name": "Market" }, "assignedAt": "2026-10-20T00:00:00.000Z", "updatedAt": "2026-10-20T00:00:00.000Z", "deliveredAt": null, "payment": { "type": "prepaid", "collectionRequired": false, "amountToCollect": 0, "currency": "MMK" } }], "pagination": { "page": 1, "limit": 20, "total": 1, "totalPages": 1, "hasNextPage": false } }
```

Without a pin, the same fields are returned as `"locationAvailable": false`, `"coordinates": null`, and `"landmarkInstructions": ""` when no instructions were supplied. Detail responses retain this exact drop-off shape and include customer/item detail under the existing assigned-rider authorization.

### `GET /api/rider/deliveries/{deliveryId}`

Returns the same fulfillment fields plus only customer name/phone and item snapshots: product name, thumbnail, quantity, and selected wholesale tier options when present. No receipt, bank data, vendor cost, internal note, or unrelated customer details are returned.

The server emits one structured timing log per request with authentication, current-database rider approval, MongoDB connection, the assignment-scoped delivery/order/shop aggregation, response preparation, total duration, and HTTP status. These logs contain no delivery identifiers, tokens, customer data, or connection strings. Compare repeated measurements from the server logs with client request duration; they do not include network transit or Flutter frame rendering.

```json
{ "success": true, "data": { "deliveryId": "DELIVERY_ID", "orderId": "ORDER_OBJECT_ID", "orderNumber": "ORD-123", "status": "assigned", "version": 1, "locationAvailable": true, "pickup": { "address": "Shop address" }, "dropoff": { "address": "Customer address", "ward": "Ward", "phone": "09123456789", "coordinates": { "latitude": 25.3833, "longitude": 97.4 }, "landmarkInstructions": "Blue gate beside the tea shop" }, "shop": { "id": "SHOP_ID", "name": "Market" }, "customer": { "name": "Aye Aye", "phone": "09123456789" }, "items": [{ "productName": "Rice", "thumbnail": "/images/rice.jpg", "quantity": 2, "selectedOptions": {} }], "assignedAt": "2026-10-20T00:00:00.000Z", "updatedAt": "2026-10-20T00:00:00.000Z", "deliveredAt": null, "payment": { "type": "prepaid", "collectionRequired": false, "amountToCollect": 0, "currency": "MMK" } } }
```

### `PATCH /api/rider/deliveries/{deliveryId}`

Requires current approved rider and current assignment. Accept: `{ "action": "accept", "version": 1 }`. Advance: `{ "action": "advance", "version": 2 }`; advance is sequential from the current state. Responses return deliveryId, status, version, and updatedAt. It is not possible to accept another rider's delivery, update after reassignment, or skip a transition.

### `GET /api/orders?page=1&limit=20`

Authenticated customer order history, scoped to the authenticated order owner. Existing order fields are returned with a `delivery` property (`null` for non-delivery/uncreated records), containing only `status`, `updatedAt`, and `deliveredAt`. This is the customer-safe timeline contract; the current repository has no dedicated customer order detail page/API to update. The customer UI can render those timestamps as the six status steps without exposing rider identity or coordinates.

```json
{ "success": true, "data": [{ "_id": "ORDER_OBJECT_ID", "orderId": "ORD-123", "serviceType": "shopping", "orderStatus": "confirmed", "vendorStatus": "accepted", "paymentStatus": "paid", "totalAmount": 12000, "createdAt": "2026-10-20T00:00:00.000Z", "items": [], "delivery": { "status": "out_for_delivery", "updatedAt": "2026-10-20T00:30:00.000Z", "deliveredAt": null } }], "pagination": { "page": 1, "limit": 20, "total": 1, "totalPages": 1, "hasNextPage": false } }
```

## Indexes

Mongoose declares a unique index on `deliveries.orderId` (duplicate prevention), plus `assignedRiderId/status/updatedAt` and `status/updatedAt` query indexes. Ensure these exist when automatic index creation is disabled. Existing indexes remain required for Order and RiderProfile.

## Map provider and rollout limits

The web checkout loads Leaflet client-side from unpkg and uses `https://tile.openstreetmap.org/{z}/{x}/{y}.png` with visible attribution. No provider key or environment variable is required. The current [OpenStreetMap tile usage policy](https://operations.osmfoundation.org/policies/tiles/) requires visible attribution, browser referrer, normal HTTP caching, and interactive requests only; it prohibits bulk/offline downloads and warns that the community tile service has no SLA and may block access. The initial Myitkyina view is for browsing only and is never submitted as a selection. There is no address search, public geocoding, background location collection, rider location, or live tracking. GPS is requested only after the customer taps its button. Pins are optional; map or GPS failures do not block written-address checkout. Flutter is a separate repository and is not implemented here.

## Manual verification

Use a disposable MongoDB database and the app's configured existing `MONGODB_URI`/`JWT_SECRET`; do not use production records. On a mobile browser, add an item, complete name/phone/address/ward, choose and confirm a map pin (or submit without one), provide instructions if useful, upload the existing payment receipt, and submit. Confirm the order stores only the confirmed coordinates and all shop orders share the destination. Approve payment and vendor acceptance, then load admin Deliveries and confirm pin availability. Assign an approved rider, verify the assigned rider sees the same `dropoff.coordinates` and instructions in list/detail, and verify another rider gets no delivery data. Continue with the existing delivery lifecycle checks. Orders without stored coordinates continue with address/phone and `coordinates: null`.

## Flutter integration contract

Flutter is maintained in another repository and is not modified or connected here. Use phase-one rider login/refresh for Bearer tokens; call rider delivery list/detail/status endpoints above, replace the local version with each successful response, and send the current version on every write. Store rotated refresh tokens using phase-one guidance. Treat `409 VERSION_CONFLICT`, `ORDER_NOT_ELIGIBLE`, and `INVALID_TRANSITION` as reload/admin-resolution outcomes. This V1 API has no COD delivery, saved coordinates, live tracking, or cancellation/return behavior.
