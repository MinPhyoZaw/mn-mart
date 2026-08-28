import { NextResponse } from "next/server";
import mongoose from "mongoose";

import connectDB from "../../../lib/mongodb";
import { requireAuth } from "../../../lib/routeAuth";
import Order from "../../../models/Order";
import Vendor from "../../../models/Vendor";

const NO_STORE_HEADERS = {
  "Cache-Control": "private, no-store, must-revalidate",
};

const NOTIFICATION_FIELDS = [
  "_id",
  "orderId",
  "orderStatus",
  "vendorStatus",
  "serviceType",
  "customerName",
  "customerPhone",
  "items",
  "transportationDetails",
  "createdAt",
].join(" ");

const toNotification = (order) => {
  if (order.role === "admin") {
    return {
      type: "new-order",
      text: `New order ${order.orderId} from ${
        order.customerName || "customer"
      } is waiting for admin review.`,
    };
  }

  if (order.role === "vendor") {
    return {
      type: "new-order",
      text: `New order ${order.orderId} is ready for vendor action.`,
    };
  }

  if (
    order.orderStatus === "confirmed" &&
    order.vendorStatus === "accepted" &&
    order.serviceType === "hotel"
  ) {
    return {
      type: "confirmed",
      text: "Your room booking is confirmed. Thank you for using MN-Mart.",
    };
  }

  if (
    order.orderStatus === "confirmed" &&
    order.serviceType === "transportation" &&
    order.vendorStatus === "accepted"
  ) {
    return {
      type: "confirmed",
      text: "Your ticket purchase was successful.",
      thankYouMessage:
        "Please download your ticket and show it to the vendor on ride day.",

      ticketDetails: {
        customerName: order.customerName,
        customerPhone: order.customerPhone,

        ticketName:
          order.items?.[0]?.name ||
          "Transportation Ticket",

        fromCity:
          order.transportationDetails?.fromCity ||
          "-",

        toCity:
          order.transportationDetails?.toCity ||
          "-",

        departureDate:
          order.transportationDetails?.departureDate ||
          "-",

        departureTime:
          order.transportationDetails?.departureTime ||
          "-",

        paidDeposit: Number(
          order.transportationDetails?.depositAmount ||
            0
        ),

        leftToPay: Number(
          order.transportationDetails?.leftToPayAmount ||
            0
        ),

        orderId: order.orderId,
      },
    };
  }

  if (order.orderStatus === "confirmed") {
    return {
      type: "confirmed",
      text: "Your order is confirmed.",
      thankYouMessage:
        "Thank you for using MN Mart.",
    };
  }

  if (order.orderStatus === "rejected") {
    return {
      type: "rejected",
      text:
        "Your payment was rejected. Please contact support or submit a new receipt.",
    };
  }

  return {
    type: "pending",
    text:
      "Your order has been placed. Please wait for confirmation.",
  };
};

/*
 * ==================================================
 * GET /api/orders/notifications
 * ==================================================
 */
export async function GET(req) {
  try {
    const auth = requireAuth(req, [
      "customer",
      "admin",
      "vendor",
    ]);

    if (!auth.ok) {
      return auth.response;
    }

    await connectDB();

    let orders = [];

    /*
     * ------------------------------------------------
     * Customer notifications
     * ------------------------------------------------
     */
    if (auth.user.role === "customer") {
      orders = await Order.find({
        customerId: auth.user.userId,

        customerNotificationRead: {
          $ne: true,
        },
      })
        .select(NOTIFICATION_FIELDS)
        .sort({
          createdAt: -1,
        })
        .limit(20)
        .lean();
    }

    /*
     * ------------------------------------------------
     * Admin notifications
     * ------------------------------------------------
     */
    if (auth.user.role === "admin") {
      orders = await Order.find({
        orderStatus: "pending",

        serviceType: {
          $ne: "transportation",
        },

        adminNotificationRead: {
          $ne: true,
        },
      })
        .select(NOTIFICATION_FIELDS)
        .sort({
          createdAt: -1,
        })
        .limit(20)
        .lean();

      orders = orders.map((order) => ({
        ...order,
        role: "admin",
      }));
    }

    /*
     * ------------------------------------------------
     * Vendor notifications
     * ------------------------------------------------
     */
    if (auth.user.role === "vendor") {
      /*
       * We only need the Vendor _id.
       */
      const vendor = await Vendor.findOne({
        userId: auth.user.userId,
      })
        .select("_id")
        .lean();

      if (!vendor) {
        return NextResponse.json(
          {
            success: true,
            data: [],
          },
          {
            status: 200,
            headers: NO_STORE_HEADERS,
          }
        );
      }

      orders = await Order.find({
        vendorId: vendor._id,

        orderStatus: "pending",

        vendorNotificationRead: {
          $ne: true,
        },
      })
        .select(NOTIFICATION_FIELDS)
        .sort({
          createdAt: -1,
        })
        .limit(20)
        .lean();

      orders = orders.map((order) => ({
        ...order,
        role: "vendor",
      }));
    }

    /*
     * Convert Order documents into the smaller
     * notification response expected by frontend.
     */
    const notifications = orders.map(
      (order) => ({
        _id: order._id,
        orderId: order.orderId,
        status: order.orderStatus,
        createdAt: order.createdAt,

        ...toNotification(order),
      })
    );

    return NextResponse.json(
      {
        success: true,
        data: notifications,
      },
      {
        status: 200,
        headers: NO_STORE_HEADERS,
      }
    );
  } catch (error) {
    console.error(
      "GET /api/orders/notifications error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Server error",
      },
      {
        status: 500,
        headers: NO_STORE_HEADERS,
      }
    );
  }
}

/*
 * ==================================================
 * PATCH /api/orders/notifications
 *
 * Mark one notification as read.
 * ==================================================
 */
export async function PATCH(req) {
  try {
    const auth = requireAuth(req, [
      "customer",
      "admin",
      "vendor",
    ]);

    if (!auth.ok) {
      return auth.response;
    }

    const body = await req.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "orderId is required.",
        },
        {
          status: 400,
          headers: NO_STORE_HEADERS,
        }
      );
    }

    /*
     * Frontend currently sends the MongoDB Order _id,
     * despite the request field being called orderId.
     */
    if (
      !mongoose.Types.ObjectId.isValid(
        orderId
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid order ID.",
        },
        {
          status: 400,
          headers: NO_STORE_HEADERS,
        }
      );
    }

    await connectDB();

    let query = {};
    let update = {};

    /*
     * ------------------------------------------------
     * Customer
     * ------------------------------------------------
     */
    if (auth.user.role === "customer") {
      query = {
        _id: orderId,
        customerId:
          auth.user.userId,
      };

      update = {
        $set: {
          customerNotificationRead:
            true,
        },
      };
    }

    /*
     * ------------------------------------------------
     * Admin
     * ------------------------------------------------
     */
    else if (auth.user.role === "admin") {
      query = {
        _id: orderId,
      };

      update = {
        $set: {
          adminNotificationRead:
            true,
        },
      };
    }

    /*
     * ------------------------------------------------
     * Vendor
     * ------------------------------------------------
     */
    else if (auth.user.role === "vendor") {
      const vendor =
        await Vendor.findOne({
          userId:
            auth.user.userId,
        })
          .select("_id")
          .lean();

      if (!vendor) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Vendor profile not found.",
          },
          {
            status: 404,
            headers:
              NO_STORE_HEADERS,
          }
        );
      }

      query = {
        _id: orderId,
        vendorId: vendor._id,
      };

      update = {
        $set: {
          vendorNotificationRead:
            true,
        },
      };
    }

    /*
     * We only need to know whether a document
     * matched and was updated, so returning the
     * entire Order document is unnecessary.
     */
    const result =
      await Order.updateOne(
        query,
        update
      );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Notification not found.",
        },
        {
          status: 404,
          headers: NO_STORE_HEADERS,
        }
      );
    }

    return NextResponse.json(
      {
        success: true,
      },
      {
        status: 200,
        headers: NO_STORE_HEADERS,
      }
    );
  } catch (error) {
    console.error(
      "PATCH /api/orders/notifications error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Server error",
      },
      {
        status: 500,
        headers: NO_STORE_HEADERS,
      }
    );
  }
}