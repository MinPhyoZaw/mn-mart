import { NextResponse } from "next/server";
import connectDB from "../../../lib/mongodb";
import { requireApprovedRider } from "../../../lib/riderAuth";
import { errorResponse } from "../../../lib/riderSecurity";
import Delivery from "../../../models/Delivery";
import Order from "../../../models/Order";
import "../../../models/Shop";
import { isEligibleShoppingOrder, riderDeliveryQuery, riderDeliveryView } from "../../../lib/delivery";

export async function GET(req) {
  try {
    const auth = await requireApprovedRider(req);
    if (!auth.ok) return auth.response;
    await connectDB();
    const params = new URL(req.url).searchParams;
    const page = Math.max(1, Number.parseInt(params.get("page") || "1", 10) || 1);
    const limit = Math.min(50, Math.max(1, Number.parseInt(params.get("limit") || "20", 10) || 20));
    const filter = params.get("filter") || "active";
    if (!["active", "history", "all"].includes(filter)) return errorResponse(400, "VALIDATION_ERROR", "filter must be active, history, or all.");
    const query = { ...riderDeliveryQuery(auth.user._id), ...(filter === "active" ? { status: { $ne: "delivered" } } : filter === "history" ? { status: "delivered" } : {}) };
    const [rows, total] = await Promise.all([Delivery.find(query).sort({ updatedAt: -1, _id: -1 }).skip((page - 1) * limit).limit(limit).lean(), Delivery.countDocuments(query)]);
    const orders = await Order.find({ _id: { $in: rows.map((row) => row.orderId) } }).select("_id orderId serviceType orderStatus paymentStatus vendorStatus customerAddress customerPhone ward deliveryInstructions shopId createdAt customerCoordinates").populate("shopId", "name address").lean();
    const orderMap = new Map(orders.map((order) => [String(order._id), order]));
    const data = rows.flatMap((row) => { const order = orderMap.get(String(row.orderId)); return order && isEligibleShoppingOrder(order) ? [riderDeliveryView(row, order)] : []; });
    return NextResponse.json({ success: true, data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit), hasNextPage: page * limit < total } });
  } catch (error) {
    console.error("GET /api/rider/deliveries error:", error?.message);
    return errorResponse(500, "SERVER_ERROR", "Unable to load deliveries.");
  }
}
