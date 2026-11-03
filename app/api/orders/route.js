import { NextResponse } from "next/server";
import connectDB from "../../lib/mongodb";
import { requireAuth } from "../../lib/routeAuth";
import Order from "../../models/Order";
import Delivery from "../../models/Delivery";
import Shop from "../../models/Shop";
import { customerOrderQuery } from "../../lib/delivery";

export async function GET(req) {
  try {
    const auth = requireAuth(req, ["customer"]);
    if (!auth.ok) return auth.response;
    await connectDB();
    const params = new URL(req.url).searchParams;
    const page = Math.max(1, Number.parseInt(params.get("page") || "1", 10) || 1);
    const limit = Math.min(50, Math.max(1, Number.parseInt(params.get("limit") || "20", 10) || 20));
    const ownerQuery = customerOrderQuery(auth.user.userId);
    const [orders, total] = await Promise.all([Order.find(ownerQuery).select("_id orderId serviceType orderStatus vendorStatus paymentStatus totalAmount createdAt items shopId").sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(), Order.countDocuments(ownerQuery)]);
    const deliveries = await Delivery.find({ orderId: { $in: orders.map((order) => order._id) } }).select("orderId status updatedAt events").lean();
    const deliveryMap = new Map(deliveries.map((delivery) => [String(delivery.orderId), delivery]));
    // Fetch only names for shops belonging to the already owner-scoped page.
    const shops = await Shop.find({ _id: { $in: orders.map((order) => order.shopId).filter(Boolean) } }).select("name").lean();
    const shopNames = new Map(shops.map((shop) => [String(shop._id), shop.name]));
    const data = orders.map((order) => {
      const delivery = deliveryMap.get(String(order._id));
      const { shopId, ...fields } = order;
      return {
        ...fields,
        shopName: shopNames.get(String(shopId)) || null,
        delivery: order.serviceType === "shopping" && delivery
          ? {
              status: delivery.status,
              updatedAt: delivery.updatedAt,
              deliveredAt: delivery.events?.find((event) => event.status === "delivered")?.at || null,
            }
          : null,
      };
    });
    return NextResponse.json({ success: true, data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit), hasNextPage: page * limit < total } });
  } catch (error) {
    console.error("GET /api/orders error:", error?.message);
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Unable to load orders." } }, { status: 500 });
  }
}
