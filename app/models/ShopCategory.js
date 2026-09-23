import mongoose from "mongoose";

const shopCategorySchema = new mongoose.Schema(
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
      maxlength: 60,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

shopCategorySchema.index(
  { shopId: 1, slug: 1 },
  { unique: true }
);
shopCategorySchema.index({ shopId: 1, isActive: 1, sortOrder: 1 });

export default mongoose.models.ShopCategory ||
  mongoose.model("ShopCategory", shopCategorySchema);
