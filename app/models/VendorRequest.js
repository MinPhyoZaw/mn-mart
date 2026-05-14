import mongoose from "mongoose";

const vendorRequestSchema = new mongoose.Schema(
  {
    vendorName: { type: String, required: true, trim: true },
    businessName: { type: String, required: true, trim: true },
    vendorType: { type: String, enum: ["shopping", "transportation", "hotel", "spa"] },
    phone: String,
    address: String,
    description: String,
    shopImage: String,
    contactPerson: String,
    kbzPayNumber: { type: String, default: "" },
    wavePayNumber: { type: String, default: "" },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    decidedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    reviewedAt: Date,
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  },
  { timestamps: true }
);

export default mongoose.models.VendorRequest || mongoose.model("VendorRequest", vendorRequestSchema);
