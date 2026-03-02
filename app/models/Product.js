// models/Product.js
import mongoose from "mongoose";

const productSchema = new mongoose.Schema({

  shopId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Shop",
    required: true
  },

  name: { type: String, required: true },
  description: String,

  price: {
    type: Number,
    required: true
  },

  isActive: {
    type: Boolean,
    default: true
  }

}, { timestamps: true });

export default mongoose.models.Product || mongoose.model("Product", productSchema);