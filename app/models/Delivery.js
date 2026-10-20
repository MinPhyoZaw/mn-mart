import mongoose from "mongoose";

const eventSchema = new mongoose.Schema({
  status: { type: String, required: true },
  actorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  actorRole: { type: String, enum: ["admin", "rider"], required: true },
  at: { type: Date, default: Date.now, required: true },
}, { _id: false });

const assignmentSchema = new mongoose.Schema({
  riderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  assignedAt: { type: Date, default: Date.now, required: true },
  endedAt: { type: Date, default: null },
}, { _id: false });

const deliverySchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true, unique: true },
  assignedRiderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
  status: { type: String, enum: ["ready", "assigned", "accepted", "picked_up", "out_for_delivery", "delivered"], default: "ready", required: true, index: true },
  pickup: { shopId: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", default: null }, address: { type: String, default: "" } },
  dropoff: { address: { type: String, default: "" }, ward: { type: String, default: "" }, phone: { type: String, default: "" }, coordinates: { latitude: Number, longitude: Number } },
  locationAvailable: { type: Boolean, default: false },
  version: { type: Number, default: 0, required: true },
  assignments: { type: [assignmentSchema], default: [] },
  events: { type: [eventSchema], default: [] },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
}, { timestamps: true });

deliverySchema.index({ status: 1, updatedAt: -1 });
deliverySchema.index({ assignedRiderId: 1, status: 1, updatedAt: -1 });

export default mongoose.models.Delivery || mongoose.model("Delivery", deliverySchema);
