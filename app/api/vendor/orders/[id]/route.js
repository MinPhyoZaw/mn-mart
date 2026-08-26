import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "../../../../lib/mongodb";
import { requireVendorAuth } from "../../../../lib/routeAuth";
import Vendor from "../../../../models/Vendor";
import Order from "../../../../models/Order";
import Shop from "../../../../models/Shop";

export async function PATCH(req, { params }) {
  try {
    const auth = await requireVendorAuth(req);
    if (!auth.ok) return auth.response;

    const { id } = params;
    const { action } = await req.json();

    if (!["accepted", "rejected"].includes(action)) {
      return NextResponse.json({ success: false, message: "Invalid action" }, { status: 400 });
    }

    await connectDB();

    const vendor = await Vendor.findOne({ userId: auth.user.userId }).lean();
    if (!vendor) {
      return NextResponse.json({ success: false, message: "Vendor profile not found" }, { status: 404 });
    }

    const session = await mongoose.startSession();
    let order;

    try {
      await session.withTransaction(async () => {
        const existingOrder = await Order.findOne({
          _id: id,
          vendorId: vendor._id,
        })
          .session(session)
          .lean();

        if (!existingOrder) {
          throw Object.assign(new Error("Order not found"), {
            status: 404,
          });
        }

        if (existingOrder.orderStatus !== "confirmed") {
          throw Object.assign(
            new Error("You can only respond after admin approval."),
            { status: 400 }
          );
        }

        if (action === "accepted") {
          const claimedOrder = await Order.findOneAndUpdate(
            {
              _id: id,
              vendorId: vendor._id,
              orderStatus: "confirmed",
              settlementStatus: { $ne: "settled" },
            },
            {
              $set: {
                vendorStatus: "accepted",
                settlementStatus: "settled",
              },
            },
            { new: true, session }
          ).lean();

          if (claimedOrder) {
            const approvedQty = (claimedOrder.items || []).reduce(
              (sum, item) => sum + (Number(item.quantity) || 0),
              0
            );

            const updatedShop = await Shop.findByIdAndUpdate(
              claimedOrder.shopId,
              {
                $inc: {
                  approvedOrderQty: approvedQty,
                  approvedIncome: Number(claimedOrder.vendorEarning) || 0,
                },
              },
              { new: true, session }
            ).lean();

            if (!updatedShop) {
              throw new Error("Shop not found while settling order.");
            }

            order = claimedOrder;
          } else {
            order = await Order.findOneAndUpdate(
              { _id: id, vendorId: vendor._id },
              { $set: { vendorStatus: action } },
              { new: true, session }
            ).lean();
          }
        } else {
          order = await Order.findOneAndUpdate(
            { _id: id, vendorId: vendor._id },
            { $set: { vendorStatus: action } },
            { new: true, session }
          ).lean();
        }
      });
    } finally {
      await session.endSession();
    }

    if (!order) {
      return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: order });
  } catch (error) {
    if (error?.status) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: error.status }
      );
    }

    console.error("PATCH /api/vendor/orders/[id] error:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
