// models/Shop.js
import mongoose from "mongoose";

const shopSchema = new mongoose.Schema({

  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Vendor",
    required: true
  },

  name: { 
    type: String, 
    required: true 
  },

  category: {
    type: String,
    enum: ["shopping", "transportation", "hotel", "spa"],
    required: true
  },

  phone: String,
  address: String,
  description: String,

  // ⭐ Rating System
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },

  totalReviews: {
    type: Number,
    default: 0
  },

  isActive: {
    type: Boolean,
    default: true
  }

}, { timestamps: true });

export default mongoose.models.Shop || mongoose.model("Shop", shopSchema);