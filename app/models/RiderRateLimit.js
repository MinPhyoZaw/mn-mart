import mongoose from "mongoose";

const riderRateLimitSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  count: { type: Number, default: 0 },
  expiresAt: { type: Date, required: true },
}, { versionKey: false });

riderRateLimitSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.RiderRateLimit || mongoose.model("RiderRateLimit", riderRateLimitSchema);
