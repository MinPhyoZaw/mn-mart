import mongoose from "mongoose";

const transportationRouteSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      required: true,
      index: true,
    },
    companyName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    fromCity: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    toCity: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    boardingPoints: {
      type: [String],
      default: [],
    },
    droppingPoints: {
      type: [String],
      default: [],
    },
    duration: {
      type: String,
      required: true,
      trim: true,
      maxlength: 60,
    },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

export default mongoose.models.TransportationRoute || mongoose.model("TransportationRoute", transportationRouteSchema);
