import mongoose from "mongoose";

const SHOPPING_CATEGORIES = [
  "electronics",
  "fashion",
  "food & beverage",
  "DIY",
  "hardware",
  "furniture",
  "Media",
  "Beauty & personal care",
  "Tobacco products",
  "Toy and hobbies",
];

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

    retailPrice: {
      type: Number,
      min: 0,
      default: null,
    },

    wholesaleTiers: {
      type: [{
        minQty: { type: Number, min: 2, required: true },
        price: { type: Number, min: 0, required: true },
      }],
      default: [],
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
      validate: {
        validator(value) {
          if (this.type !== "product") return value === null || value === undefined || value === "";
          return SHOPPING_CATEGORIES.includes(value);
        },
        message: "Category is required and must be a valid shopping category for product items",
      },
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
