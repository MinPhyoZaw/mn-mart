import mongoose from "mongoose";

const pushDeviceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    token: {
      type: String,
      required: true,
      trim: true,
      maxlength: 4096,
    },
    platform: {
      type: String,
      enum: ["web", "pwa", "twa"],
      default: "web",
    },
    lastSeenAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

pushDeviceSchema.index({ token: 1 }, { unique: true });
pushDeviceSchema.index({ userId: 1, updatedAt: -1 });

export default mongoose.models.PushDevice ||
  mongoose.model("PushDevice", pushDeviceSchema);
