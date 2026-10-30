import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { performance } from "node:perf_hooks";
import connectDB from "../../../../lib/mongodb";
import { requireApprovedRider } from "../../../../lib/riderAuth";
import { errorResponse } from "../../../../lib/riderSecurity";
import { isEligibleShoppingOrder, matchesDeliveryVersion, riderDeliveryQuery, riderDeliveryView, transitionDelivery } from "../../../../lib/delivery";
import Delivery from "../../../../models/Delivery";
import Order from "../../../../models/Order";
import "../../../../models/Shop";

function timedResponse(createResponse, timings, setOutcome) {
  const startedAt = performance.now();
  const response = createResponse();
  timings.responsePreparationMs = (timings.responsePreparationMs || 0) + performance.now() - startedAt;
  setOutcome(response.status);
  return response;
}

export async function GET(req, { params }) {
  const startedAt = performance.now();
  const timings = {};
  let outcome = "unknown";
  const respond = (createResponse) => timedResponse(createResponse, timings, (status) => {
    outcome = status;
  });

  try {
    const auth = await requireApprovedRider(req, {
      onTiming: (phase, durationMs) => {
        timings[phase] = durationMs;
      },
    });
    if (!auth.ok) return respond(() => auth.response);
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) return respond(() => errorResponse(400, "INVALID_DELIVERY_ID", "Delivery ID is invalid."));
    const deliveryQueryStartedAt = performance.now();
    const delivery = await Delivery.findOne(riderDeliveryQuery(auth.user._id, id))
      .select("_id orderId status version pickup dropoff assignments.assignedAt events.status events.at updatedAt")
      .lean();
    timings.deliveryQueryMs = performance.now() - deliveryQueryStartedAt;
    if (!delivery) return respond(() => errorResponse(404, "NOT_FOUND", "Assigned delivery not found."));
    const orderQueryStartedAt = performance.now();
    const order = await Order.findById(delivery.orderId).select("_id orderId serviceType orderStatus paymentStatus vendorStatus customerName customerPhone customerAddress ward deliveryInstructions shopId items customerCoordinates").populate("shopId", "name address").lean();
    timings.orderAndShopQueryMs = performance.now() - orderQueryStartedAt;
    if (!isEligibleShoppingOrder(order)) return respond(() => errorResponse(409, "ORDER_NOT_ELIGIBLE", "The linked order is no longer eligible. Contact an admin."));
    return respond(() => NextResponse.json({ success: true, data: riderDeliveryView(delivery, order, { detail: true }) }));
  } catch (error) {
    console.error("GET /api/rider/deliveries/[id] error:", { name: error?.name, code: error?.code });
    return respond(() => errorResponse(500, "SERVER_ERROR", "Unable to load delivery."));
  } finally {
    timings.totalMs = performance.now() - startedAt;
    const safeTimings = Object.fromEntries(
      Object.entries(timings).map(([name, durationMs]) => [name, Number(durationMs.toFixed(2))])
    );
    console.info("GET /api/rider/deliveries/[id] timing", JSON.stringify({ outcome, ...safeTimings }));
  }
}

export async function PATCH(req, { params }) {
  try {
    const auth = await requireApprovedRider(req);
    if (!auth.ok) return auth.response;
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) return errorResponse(400, "INVALID_DELIVERY_ID", "Delivery ID is invalid.");
    const body = await req.json();
    if (!Number.isInteger(body.version) || body.version < 0) return errorResponse(400, "VALIDATION_ERROR", "A non-negative version is required.");
    await connectDB();
    const current = await Delivery.findOne(riderDeliveryQuery(auth.user._id, id)).lean();
    if (!current) return errorResponse(404, "NOT_FOUND", "Assigned delivery not found.");
    if (body.action === "accept" && current.status === "accepted") return NextResponse.json({ success: true, data: { deliveryId: String(current._id), status: current.status, version: current.version }, message: "Already accepted." });
    if (!matchesDeliveryVersion(current, body.version)) return errorResponse(409, "VERSION_CONFLICT", "The delivery changed. Reload before updating.");
    const nextStatus = transitionDelivery(current.status, body.action);
    if (!nextStatus) return errorResponse(409, "INVALID_TRANSITION", "The requested delivery transition is not allowed.");
    const order = await Order.findById(current.orderId).select("serviceType orderStatus paymentStatus vendorStatus").lean();
    if (!isEligibleShoppingOrder(order)) return errorResponse(409, "ORDER_NOT_ELIGIBLE", "The linked order is no longer eligible. Contact an admin.");
    const now = new Date();
    const updated = await Delivery.findOneAndUpdate({ _id: current._id, assignedRiderId: auth.user._id, version: body.version, status: current.status }, { $set: { status: nextStatus, updatedBy: auth.user._id }, $inc: { version: 1 }, $push: { events: { status: nextStatus, actorId: auth.user._id, actorRole: "rider", at: now } } }, { new: true }).lean();
    if (!updated) return errorResponse(409, "VERSION_CONFLICT", "The delivery changed. Reload before updating.");
    return NextResponse.json({ success: true, data: { deliveryId: String(updated._id), status: updated.status, version: updated.version, updatedAt: updated.updatedAt } });
  } catch (error) {
    console.error("PATCH /api/rider/deliveries/[id] error:", error?.message);
    return errorResponse(500, "SERVER_ERROR", "Unable to update delivery.");
  }
}
