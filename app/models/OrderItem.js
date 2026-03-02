// models/OrderItem.js
import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({

  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
    required: true
  },

  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product"
  },

  productName: String,
  price: Number,
  quantity: Number,
  subTotal: Number

}, { timestamps: true });

export default mongoose.models.OrderItem || mongoose.model("OrderItem", orderItemSchema);