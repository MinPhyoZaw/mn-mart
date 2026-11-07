import mongoose from "mongoose";

const hotelBlockSchema = new mongoose.Schema(
  {
    roomItemId: { type: mongoose.Schema.Types.ObjectId, ref: "Item", required: true },
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true },
    checkIn: { type: String, required: true },
    checkOut: { type: String, required: true },
    reason: { type: String, trim: true, maxlength: 200, default: "" },
    kind: { type: String, enum: ["maintenance", "external"], required: true },
  },
  { timestamps: true },
);

hotelBlockSchema.index({ roomItemId: 1, checkIn: 1, checkOut: 1 });
export default mongoose.models.HotelBlock || mongoose.model("HotelBlock", hotelBlockSchema);
