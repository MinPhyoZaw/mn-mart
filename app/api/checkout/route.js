import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "../../lib/mongodb";
import { requireAuth } from "../../lib/routeAuth";
import Vendor from "../../models/Vendor";
import Shop from "../../models/Shop";
import Item from "../../models/Item";
import Order from "../../models/Order";
import { getShoppingCommissionRate } from "../../lib/shoppingCommission";
import { getWholesalePrice, normalizeWholesaleTiers } from "../../lib/pricing";

const DEFAULT_COMMISSION_RATE = 1.5;

const makeOrderId = () => `ORD-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
const isIdempotencyDuplicate = (error) =>
  error?.code === 11000 && error?.keyPattern?.idempotencyKey;

export async function POST(req) {
  try {
    const auth = requireAuth(req, ["customer", "vendor", "admin"]);
    if (!auth.ok) return auth.response;

    const body = await req.json();
    const { cartItems, customerName, customerPhone, customerAddress, paymentProvider, receiptImage, checkoutKey } = body;

    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      return NextResponse.json({ success: false, message: "Cart is empty." }, { status: 400 });
    }

    if (!customerName || !customerPhone || !customerAddress || !paymentProvider || !receiptImage) {
      return NextResponse.json({ success: false, message: "Missing required checkout fields." }, { status: 400 });
    }

    if (typeof checkoutKey !== "string" || checkoutKey.length < 16 || checkoutKey.length > 200) {
      return NextResponse.json({ success: false, message: "A valid checkout key is required." }, { status: 400 });
    }

    await connectDB();

    const itemIds = cartItems.map((item) => item?._id);
    if (
      itemIds.some(
        (itemId) =>
          !mongoose.Types.ObjectId.isValid(itemId)
      ) ||
      new Set(itemIds.map(String)).size !== itemIds.length
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid cart data. Please re-add items." },
        { status: 400 }
      );
    }

    const items = await Item.find({
      _id: { $in: itemIds },
      type: "product",
    })
      .select("_id shopId name image price wholesaleTiers isAvailable")
      .lean();

    const itemMap = new Map(items.map((item) => [String(item._id), item]));
    if (itemMap.size !== itemIds.length) {
      return NextResponse.json(
        { success: false, message: "One or more items no longer exist." },
        { status: 404 }
      );
    }

    const shopIds = [...new Set(items.map((item) => String(item.shopId)))];
    const shops = await Shop.find({ _id: { $in: shopIds } })
      .select("_id name category vendorId")
      .lean();
    const shopMap = new Map(shops.map((shop) => [String(shop._id), shop]));

    const vendorIds = [...new Set(shops.map((shop) => String(shop.vendorId)))];
    const vendors = await Vendor.find({ _id: { $in: vendorIds } })
      .select("_id vendorName")
      .lean();
    const vendorMap = new Map(vendors.map((vendor) => [String(vendor._id), vendor]));

    const ordersByShop = new Map();
    for (const cartItem of cartItems) {
      const item = itemMap.get(String(cartItem._id));
      const quantity = Number(cartItem.quantity);

      if (!Number.isInteger(quantity) || quantity < 1 || quantity > 1000) {
        return NextResponse.json(
          { success: false, message: "Quantity must be a whole number between 1 and 1000." },
          { status: 400 }
        );
      }

      if (!item || item.isAvailable === false) {
        return NextResponse.json(
          { success: false, message: "One or more items are unavailable." },
          { status: 409 }
        );
      }

      const shop = shopMap.get(String(item.shopId));
      const vendor = shop ? vendorMap.get(String(shop.vendorId)) : null;
      if (!shop || shop.category !== "shopping" || !vendor) {
        return NextResponse.json(
          { success: false, message: "Invalid shop or vendor for one of the items." },
          { status: 404 }
        );
      }

      const key = String(shop._id);
      if (!ordersByShop.has(key)) {
        ordersByShop.set(key, { shop, vendor, items: [] });
      }

      const wholesaleTiers = normalizeWholesaleTiers(item.wholesaleTiers);
      const unitPrice = getWholesalePrice(item, quantity);
      const selectedTier = wholesaleTiers
        .filter((tier) => quantity >= tier.minQty)
        .at(-1) || null;

      ordersByShop.get(key).items.push({
        itemId: item._id,
        name: item.name,
        image: item.image || null,
        price: unitPrice,
        quantity,
        lineTotal: unitPrice * quantity,
        selectedWholesaleTier: selectedTier,
      });
    }

    const createdOrders = [];
    const shoppingCommissionRate = await getShoppingCommissionRate();

    for (const { shop, vendor, items: normalizedItems } of ordersByShop.values()) {

      const totalAmount = normalizedItems.reduce((sum, item) => sum + item.lineTotal, 0);
      const commissionRate = shop.category === "shopping" ? shoppingCommissionRate : DEFAULT_COMMISSION_RATE;
      const commissionAmount = Number(((totalAmount * commissionRate) / 100).toFixed(2));
      const vendorEarning = Number((totalAmount - commissionAmount).toFixed(2));
      const idempotencyKey = `${checkoutKey}:${shop._id}`;

      let order;
      try {
        order = await Order.create({
          orderId: makeOrderId(),
          idempotencyKey,
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
          commissionRate,
          commissionAmount,
          vendorEarning,
        });
      } catch (error) {
        if (!isIdempotencyDuplicate(error)) throw error;
        order = await Order.findOne({
          idempotencyKey,
          customerId: auth.user.userId,
        }).lean();
        if (!order) throw error;
      }

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
