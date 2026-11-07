import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "../../../lib/mongodb";
import { requireAuth } from "../../../lib/routeAuth";
import Order from "../../../models/Order";
import { nextHotelReference } from "../../../lib/hotelReference";

// Existing booking references are assigned on an explicit authenticated write.
export async function POST(req) {
  try {
    const auth = requireAuth(req, ["customer"]);
    if (!auth.ok) return auth.response;
    const { orderIds } = await req.json();
    if (
      !Array.isArray(orderIds) ||
      orderIds.length < 1 ||
      orderIds.length > 20 ||
      !orderIds.every((id) => typeof id === "string" && mongoose.Types.ObjectId.isValid(id))
    ) {
      return NextResponse.json(
        { success: false, message: "Choose up to 20 hotel bookings." },
        { status: 400 },
      );
    }
    await connectDB();
    const owner = { customerId: auth.user.userId, serviceType: "hotel", _id: { $in: orderIds } };
    const orders = await Order.find(owner).select("_id hotelReference").lean();
    if (orders.length !== new Set(orderIds).size) {
      return NextResponse.json({ success: false, message: "Booking not found." }, { status: 404 });
    }
    const data = [];
    for (const order of orders) {
      let reference = order.hotelReference;
      if (!reference) {
        const candidate = await nextHotelReference();
        const updated = await Order.findOneAndUpdate(
          {
            _id: order._id,
            customerId: auth.user.userId,
            $or: [{ hotelReference: null }, { hotelReference: "" }],
          },
          { $set: { hotelReference: candidate } },
          { returnDocument: "after" },
        )
          .select("hotelReference")
          .lean();
        reference =
          updated?.hotelReference ||
          (
            await Order.findOne({ ...owner, _id: order._id })
              .select("hotelReference")
              .lean()
          )?.hotelReference;
      }
      data.push({ _id: order._id, hotelReference: reference });
    }
    return NextResponse.json({ success: true, data }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Hotel reference assignment error:", error.message);
    return NextResponse.json(
      { success: false, message: "Unable to prepare booking references. Please retry." },
      { status: 500 },
    );
  }
}
