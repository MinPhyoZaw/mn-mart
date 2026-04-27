import { NextResponse } from "next/server";
import connectDB from "../../lib/mongodb";
import { requireAuth } from "../../lib/routeAuth";
import Vendor from "../../models/Vendor";
import Shop from "../../models/Shop";
import Order from "../../models/Order";

const COMMISSION_RATE = 1.5;

const makeOrderId = () => `ORD-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

export async function POST(req) {
  try {
    const auth = requireAuth(req, ["customer", "vendor", "admin"]);
    if (!auth.ok) return auth.response;

    const body = await req.json();
    const { cartItems, customerName, customerPhone, customerAddress, paymentProvider, receiptImage } = body;

    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      return NextResponse.json({ success: false, message: "Cart is empty." }, { status: 400 });
    }

    if (!customerName || !customerPhone || !customerAddress || !paymentProvider || !receiptImage) {
      return NextResponse.json({ success: false, message: "Missing required checkout fields." }, { status: 400 });
    }

    await connectDB();

    const ordersByShop = new Map();
    for (const item of cartItems) {
      if (!item.shopId || !item.vendorId || !item._id) {
        return NextResponse.json({ success: false, message: "Invalid cart data. Please re-add items." }, { status: 400 });
      }
      const key = String(item.shopId);
      if (!ordersByShop.has(key)) {
        ordersByShop.set(key, []);
      }
      ordersByShop.get(key).push(item);
    }

    const createdOrders = [];

    for (const [shopId, shopItems] of ordersByShop.entries()) {
      const vendorId = shopItems[0].vendorId;
      const [shop, vendor] = await Promise.all([
        Shop.findById(shopId).lean(),
        Vendor.findById(vendorId).lean(),
      ]);

      if (!shop || !vendor) {
        return NextResponse.json(
          { success: false, message: "Shop or vendor not found for one of the items." },
          { status: 404 }
        );
      }

      const normalizedItems = shopItems.map((item) => {
        const qty = Math.max(Number(item.quantity) || 0, 1);
        const price = Number(item.price) || 0;
        return {
          itemId: item._id,
          name: item.name,
          image: item.image || null,
          price,
          quantity: qty,
          lineTotal: price * qty,
        };
      });

      const totalAmount = normalizedItems.reduce((sum, item) => sum + item.lineTotal, 0);
      const commissionAmount = Number(((totalAmount * COMMISSION_RATE) / 100).toFixed(2));
      const vendorEarning = Number((totalAmount - commissionAmount).toFixed(2));

      const order = await Order.create({
        orderId: makeOrderId(),
        vendorId: vendor._id,
        shopId: shop._id,
        customerId: auth.user.userId,
        customerName,
        customerPhone,
        customerAddress,
        serviceType: shop.category,
        items: normalizedItems,
        receiptImage,
        paymentProvider,
        totalAmount,
        commissionRate: COMMISSION_RATE,
        commissionAmount,
        vendorEarning,
      });

      createdOrders.push({
        orderId: order.orderId,
        shopName: shop.name,
        vendorName: vendor.vendorName,
        totalAmount: order.totalAmount,
        commissionAmount: order.commissionAmount,
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: "Checkout submitted successfully.",
        data: {
          orders: createdOrders,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/checkout error:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
