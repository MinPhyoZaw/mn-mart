import mongoose from "mongoose";

const spaServiceSchema = new mongoose.Schema({
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor", required: true, index: true },
  serviceName: { type: String, required: true, trim: true },
  description: { type: String, default: "" },
  durationMinutes: { type: Number, required: true, min: 1 },
  priceMMK: { type: Number, required: true, min: 0 },
  availableSlots: [{
    start: { type: String, required: true },
    end: { type: String, required: true },
  }],
  maxCustomersPerSlot: { type: Number, required: true, min: 1, default: 1 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.models.SpaService || mongoose.model("SpaService", spaServiceSchema);
