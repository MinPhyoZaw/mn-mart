// models/Vendor.js
import mongoose from "mongoose";

const vendorSchema = new mongoose.Schema({

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  businessName: { type: String, required: true },
  phone: { type: String, required: true },

  commissionRate: {
    type: Number,
    default: 10
  },

  isActive: {
    type: Boolean,
    default: true
  }

}, { timestamps: true });

export default mongoose.models.Vendor || mongoose.model("Vendor", vendorSchema);