import mongoose from "mongoose";

import { ALL_VALID_SHOPPING_CATEGORIES } from "../lib/shoppingCategories";

const itemSchema = new mongoose.Schema(
  {
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    retailPrice: {
      type: Number,
      min: 0,
      default: null,
    },

    wholesaleTiers: {
      type: [
        {
          minQty: {
            type: Number,
            min: 2,
            required: true,
          },

          price: {
            type: Number,
            min: 0,
            required: true,
          },
        },
      ],
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
      enum: [
        "food",
        "product",
        "service",
        "room",
        "transport",
      ],
      required: true,
      index: true,
    },

    category: {
      type: String,
      default: null,

      validate: {
        validator(value) {
          if (this.type !== "product") {
            return (
              value === null ||
              value === undefined ||
              value === ""
            );
          }

          return ALL_VALID_SHOPPING_CATEGORIES.includes(
            value
          );
        },

        message:
          "Category is required and must be a valid shopping category for product items",
      },
    },

    tagName: {
      type: String,
      enum: [
        "NewArrival",
        "BestSellers",
        "TopPicks",
        "RecomendedForYou",
      ],
      default: "NewArrival",
      index: true,
    },

    extra: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

/*
 * ==================================================
 * Query indexes
 * ==================================================
 */

/*
 * Shop detail / vendor item listing:
 *
 * Item.find({ shopId })
 *   .sort({ createdAt: -1 })
 */
itemSchema.index({
  shopId: 1,
  createdAt: -1,
});

/*
 * Homepage tagged products:
 *
 * Item.find({
 *   type: "product",
 *   isAvailable: true,
 *   tagName: ...
 * })
 * .sort({ createdAt: -1 })
 */
itemSchema.index({
  type: 1,
  isAvailable: 1,
  tagName: 1,
  createdAt: -1,
});

/*
 * Shopping category pages:
 *
 * Item.find({
 *   type: "product",
 *   category: ...
 * })
 * .sort({ createdAt: -1 })
 */
itemSchema.index({
  type: 1,
  category: 1,
  createdAt: -1,
});

export default mongoose.models.Item ||
  mongoose.model("Item", itemSchema);