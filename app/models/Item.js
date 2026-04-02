import mongoose from "mongoose";

const itemSchema = new mongoose.Schema(
  {
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      default: null,
    },
    image: {
      type: String,
      default: null,
    },
    type: {
      type: String,
      enum: ["food", "product", "service", "room", "transport"],
      required: true,
    },
    category: {
      type: String,
      default: null,
    },
    extra: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Item || mongoose.model("Item", itemSchema);
