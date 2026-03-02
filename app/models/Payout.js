// models/Payout.js
import mongoose from "mongoose";

const payoutSchema = new mongoose.Schema({

  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Vendor",
    required: true
  },

  totalOrders: Number,
  totalSales: Number,
  totalCommission: Number,
  totalPayable: Number,

  date: {
    type: Date,
    required: true
  },

  isPaid: {
    type: Boolean,
    default: false
  },

  paidAt: Date

}, { timestamps: true });

export default mongoose.models.Payout || mongoose.model("Payout", payoutSchema);