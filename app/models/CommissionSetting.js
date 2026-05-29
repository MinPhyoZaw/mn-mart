import mongoose from "mongoose";

const commissionSettingSchema = new mongoose.Schema(
  {
    serviceType: {
      type: String,
      enum: ["shopping"],
      required: true,
      unique: true,
      default: "shopping",
    },
    rate: {
      type: Number,
      required: true,
      min: 0,
      default: 1.5,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.models.CommissionSetting || mongoose.model("CommissionSetting", commissionSettingSchema);
