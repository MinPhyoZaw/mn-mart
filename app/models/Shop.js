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

  phone: {
    type: String,
    default: null
  },

  address: {
    type: String,
    default: null
  },

  description: {
    type: String,
    default: null
  },

  // ✅ Main Image (single)
  image: {
    type: String,
    default: null // IMPORTANT: avoid ""
  },

  // ✅ Optional: Multiple Images (for future gallery feature)
  // images: {
  //   type: [String],
  //   default: []
  // },

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