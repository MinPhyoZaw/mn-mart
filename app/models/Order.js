import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      unique: true,
      required: true,
    },

    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      required: true,
    },

    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
    },

    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    customerName: { type: String, required: true },
    customerPhone: { type: String, required: true },
    customerAddress: { type: String, required: true },
    bookingDetails: {
      guestCount: { type: Number, default: null },
      extraBedAmount: { type: Number, default: null },
      note: { type: String, default: "" },
    },

    serviceType: {
      type: String,
      enum: ["shopping", "transportation", "hotel", "spa"],
      required: true,
    },

    items: [
      {
        itemId: { type: mongoose.Schema.Types.ObjectId, ref: "Item", required: true },
        name: { type: String, required: true },
        image: { type: String, default: null },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true },
        lineTotal: { type: Number, required: true },
      },
    ],

    receiptImage: {
      type: String,
      required: true,
    },

    paymentProvider: {
      type: String,
      enum: ["kbzpay", "wave"],
      required: true,
    },

    totalAmount: {
      type: Number,
      required: true,
    },

    commissionRate: {
      type: Number,
      required: true,
      default: 1.5,
    },

    commissionAmount: {
      type: Number,
      required: true,
    },

    vendorEarning: {
      type: Number,
      required: true,
    },

    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "rejected"],
      default: "pending",
    },

    orderStatus: {
      type: String,
      enum: ["pending", "confirmed", "rejected"],
      default: "pending",
    },

    vendorStatus: {
      type: String,
      enum: ["new", "accepted", "rejected", "preparing"],
      default: "new",
    },

    settlementStatus: {
      type: String,
      enum: ["unsettled", "settled"],
      default: "unsettled",
    },

    customerNotificationRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Order || mongoose.model("Order", orderSchema);
