// models/Vendor.js
import mongoose from "mongoose";

const vendorSchema = new mongoose.Schema(
  {
    // Business Info
    vendorName: {
      type: String,
      required: true,
      trim: true,
    },

    serviceType: {
      type: String,
      enum: ["shopping", "transportation", "hotel", "spa"],
      required: true,
    },

    // Contact Info
    contactPerson: {
      type: String,
      required: true,
    },

    phone: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      unique: true,
    },

    address: {
      type: String,
      required: true,
    },

    // Business Settings
    commissionRate: {
      type: Number,
      default: 10,
      min: 0,
      max: 50,
    },

    isActive: {
      type: Boolean,
      default: true,
    }
  },
  { timestamps: true }
);

export default mongoose.models.Vendor ||
  mongoose.model("Vendor", vendorSchema);