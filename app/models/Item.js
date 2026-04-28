import mongoose from "mongoose";

const itemSchema = new mongoose.Schema(
  {
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
      index: true, // 🔥 faster queries
    },

    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100, // 🔥 prevent long text
    },

    price: {
      type: Number,
      required: true,
      min: 0, // 🔥 prevent negative price
    },

    description: {
      type: String,
      default: null,
      maxlength: 500,
    },

    image: {
      type: String,
      default: null,
    },

    type: {
      type: String,
      enum: ["food", "product", "service", "room", "transport"],
      required: true,
      index: true, // 🔥 useful for filtering
    },

    category: {
      type: String,
      default: null,
    },

    tagName: {
      type: String,
      enum: ["NewArrival", "BestSellers", "TopPicks", "RecomendedForYou"],
      default: "NewArrival",
      index: true,
    },

    // 🔥 IMPORTANT FIX
    extra: {
      type: mongoose.Schema.Types.Mixed,
      default: {}, // ✅ always object
    },

    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Item || mongoose.model("Item", itemSchema);
