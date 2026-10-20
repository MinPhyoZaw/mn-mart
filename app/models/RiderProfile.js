import mongoose from "mongoose";

const riderProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
    index: true,
  },
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected", "suspended"],
    default: "pending",
    required: true,
    index: true,
  },
  appliedAt: { type: Date, default: Date.now, required: true },
  reviewerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  reviewedAt: { type: Date, default: null },
  reason: { type: String, trim: true, default: "" },
}, { timestamps: true });

export default mongoose.models.RiderProfile || mongoose.model("RiderProfile", riderProfileSchema);
