import mongoose from "mongoose";
import { NextResponse } from "next/server";
import connectDB from "../../../lib/mongodb";
import { requireCurrentAdmin, errorResponse } from "../../../lib/riderSecurity";
import Order from "../../../models/Order";
import Delivery from "../../../models/Delivery";
import "../../../models/Shop";
import RiderProfile from "../../../models/RiderProfile";
import User from "../../../models/User";
import { deliveryLocation, isApprovedRiderAccount, isEligibleShoppingOrder, matchesDeliveryVersion } from "../../../lib/delivery";

export async function GET(req) {
  try {
    const auth = await requireCurrentAdmin(req);
    if (!auth.ok) return auth.response;
    await connectDB();
    const url = new URL(req.url);
    const page = Math.max(1, Number.parseInt(url.searchParams.get("page") || "1", 10) || 1);
    const limit = Math.min(50, Math.max(1, Number.parseInt(url.searchParams.get("limit") || "20", 10) || 20));
    const filter = url.searchParams.get("status") || "all";
    const eligibleOrders = await Order.find({ serviceType: "shopping", orderStatus: "confirmed", paymentStatus: "paid", vendorStatus: "accepted" }).select("_id shopId customerAddress customerPhone ward customerCoordinates").lean();
    for (const order of eligibleOrders) {
      try {
        const location = deliveryLocation(order);
        await Delivery.updateOne({ orderId: order._id }, { $setOnInsert: { orderId: order._id, status: "ready", pickup: { shopId: order.shopId, address: "" }, dropoff: { address: order.customerAddress || "", ward: order.ward || "", phone: order.customerPhone || "", ...(location.coordinates ? { coordinates: location.coordinates } : {}) }, locationAvailable: location.available } }, { upsert: true });
      } catch (error) {
        // Concurrent admin list requests may race the unique orderId index; the winner created the row.
        if (error?.code !== 11000) throw error;
      }
    }
    const deliveryFilter = filter === "all" ? {} : filter === "awaiting" ? { status: "ready" } : filter === "active" ? { status: { $in: ["assigned", "accepted", "picked_up", "out_for_delivery"] } } : filter === "completed" ? { status: "delivered" } : null;
    if (!deliveryFilter) return errorResponse(400, "VALIDATION_ERROR", "status must be all, awaiting, active, or completed.");
    const [rows, total, riders] = await Promise.all([
      Delivery.find(deliveryFilter).populate("assignedRiderId", "name").sort({ updatedAt: -1, _id: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Delivery.countDocuments(deliveryFilter),
      RiderProfile.find({ status: "approved" }).select("userId name phone").populate({ path: "userId", select: "_id name role", match: { role: { $in: ["customer", "vendor"] } } }).lean(),
    ]);
    const orders = await Order.find({ _id: { $in: rows.map((row) => row.orderId) } }).select("_id orderId shopId customerName customerPhone customerAddress customerCoordinates deliveryInstructions ward serviceType orderStatus paymentStatus vendorStatus items totalAmount paymentProvider createdAt updatedAt").populate("shopId", "name address").lean();
    const byId = new Map(orders.map((order) => [String(order._id), order]));
    const data = rows.flatMap((delivery) => { const order = byId.get(String(delivery.orderId)); const location = deliveryLocation(order); return order && isEligibleShoppingOrder(order) ? [{ deliveryId: String(delivery._id), orderId: String(order._id), orderNumber: order.orderId, status: delivery.status, version: delivery.version, locationAvailable: location.available, shop: { id: String(order.shopId?._id || ""), name: order.shopId?.name || "", address: order.shopId?.address || "" }, customer: { name: order.customerName, phone: order.customerPhone }, address: order.customerAddress, ward: order.ward || "", landmarkInstructions: order.deliveryInstructions || "", items: (order.items || []).map(({ name, image, quantity }) => ({ name, image, quantity })), currentRider: delivery.assignedRiderId?._id ? { userId: String(delivery.assignedRiderId._id), name: delivery.assignedRiderId.name || "" } : null, assignments: delivery.assignments, events: delivery.events, createdAt: order.createdAt, updatedAt: delivery.updatedAt }] : []; });
    const approvedRiders = riders.filter((row) => row.userId).map((row) => ({ userId: String(row.userId._id), name: row.name, phone: row.phone }));
    return NextResponse.json({ success: true, data, riders: approvedRiders, pagination: { page, limit, total, totalPages: Math.ceil(total / limit), hasNextPage: page * limit < total } });
  } catch (error) {
    console.error("GET /api/admin/deliveries error:", error?.message);
    return errorResponse(500, "SERVER_ERROR", "Unable to load deliveries.");
  }
}

export async function PATCH(req) {
  try {
    const auth = await requireCurrentAdmin(req);
    if (!auth.ok) return auth.response;
    const { requireSameOrigin } = await import("../../../lib/riderSecurity");
    const originError = requireSameOrigin(req);
    if (originError) return originError;
    const body = await req.json();
    if (!mongoose.Types.ObjectId.isValid(body.deliveryId || "") || !mongoose.Types.ObjectId.isValid(body.riderUserId || "")) return errorResponse(400, "VALIDATION_ERROR", "Valid deliveryId and riderUserId are required.");
    const expectedVersion = Number(body.version);
    if (!Number.isInteger(expectedVersion) || expectedVersion < 0) return errorResponse(400, "VALIDATION_ERROR", "A non-negative version is required.");
    await connectDB();
    const [rider, user] = await Promise.all([RiderProfile.findOne({ userId: body.riderUserId, status: "approved" }).select("_id status").lean(), User.findById(body.riderUserId).select("_id role").lean()]);
    if (!isApprovedRiderAccount(user, rider)) return errorResponse(409, "RIDER_NOT_APPROVED", "The selected account is not an existing approved rider.");
    const current = await Delivery.findById(body.deliveryId).lean();
    if (!current) return errorResponse(404, "NOT_FOUND", "Delivery not found.");
    if (!["ready", "assigned", "accepted"].includes(current.status)) return errorResponse(409, "INVALID_TRANSITION", "A delivery can only be assigned or reassigned before pickup.");
    const order = await Order.findById(current.orderId).select("serviceType orderStatus paymentStatus vendorStatus").lean();
    if (!isEligibleShoppingOrder(order)) return errorResponse(409, "ORDER_NOT_ELIGIBLE", "The linked order is no longer eligible. Admin resolution is required.");
    if (!matchesDeliveryVersion(current, expectedVersion)) return errorResponse(409, "VERSION_CONFLICT", "The delivery changed. Reload before assigning.");
    const now = new Date();
    const assignments = [...(current.assignments || []).map((entry) => ({ ...entry, endedAt: entry.endedAt || now })), { riderId: body.riderUserId, assignedBy: auth.user._id, assignedAt: now }];
    const updated = await Delivery.findOneAndUpdate({ _id: current._id, version: expectedVersion, status: current.status }, { $set: { assignedRiderId: body.riderUserId, status: "assigned", assignments, updatedBy: auth.user._id }, $inc: { version: 1 }, $push: { events: { status: "assigned", actorId: auth.user._id, actorRole: "admin", at: now } } }, { new: true }).lean();
    if (!updated) return errorResponse(409, "VERSION_CONFLICT", "The delivery changed. Reload before assigning.");
    return NextResponse.json({ success: true, data: { deliveryId: String(updated._id), orderId: String(updated.orderId), assignedRiderId: String(updated.assignedRiderId), status: updated.status, version: updated.version, assignedAt: now } });
  } catch (error) {
    console.error("PATCH /api/admin/deliveries error:", error?.message);
    return errorResponse(500, "SERVER_ERROR", "Unable to assign rider.");
  }
}
