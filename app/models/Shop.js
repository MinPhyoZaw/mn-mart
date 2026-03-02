// models/Shop.js
import mongoose from "mongoose";

const shopSchema = new mongoose.Schema({

  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Vendor",
    required: true
  },

  name: { type: String, required: true },

  category: {
    type: String,
    enum: ["shopping", "transportation", "hotel", "spa"],
    required: true
  },

  phone: String,
  address: String,
  description: String,

  isActive: {
    type: Boolean,
    default: true
  }

}, { timestamps: true });

export default mongoose.models.Shop || mongoose.model("Shop", shopSchema);