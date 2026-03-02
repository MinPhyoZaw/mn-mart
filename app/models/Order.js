// models/Order.js
import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({

  orderId: {
    type: String,
    unique: true,
    required: true
  },

  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Vendor",
    required: true
  },

  shopId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Shop",
    required: true
  },

  customerName: { type: String, required: true },
  customerPhone: { type: String, required: true },

  serviceType: {
    type: String,
    enum: ["shopping", "transportation", "hotel", "spa"],
    required: true
  },

  totalAmount: {
    type: Number,
    required: true
  },

  commissionRate: {
    type: Number,
    required: true
  },

  commissionAmount: {
    type: Number,
    required: true
  },

  vendorEarning: {
    type: Number,
    required: true
  },

  paymentStatus: {
    type: String,
    enum: ["pending", "paid"],
    default: "pending"
  },

  settlementStatus: {
    type: String,
    enum: ["unsettled", "settled"],
    default: "unsettled"
  }

}, { timestamps: true });

export default mongoose.models.Order || mongoose.model("Order", orderSchema);