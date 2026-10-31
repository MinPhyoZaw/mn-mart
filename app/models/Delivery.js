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
  // Absent on legacy rows. Written once by the guarded completion update.
  deliveredAt: { type: Date, immutable: true },
  completedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", immutable: true },
  earning: {
    type: new mongoose.Schema({
      amount: { type: Number, required: true, min: 0, validate: Number.isSafeInteger, immutable: true },
      currency: { type: String, required: true, enum: ["MMK"], immutable: true },
    }, { _id: false }),
    immutable: true,
    default: undefined,
  },
}, { timestamps: true });

deliverySchema.index({ status: 1, updatedAt: -1 });
deliverySchema.index({ assignedRiderId: 1, status: 1, updatedAt: -1 });
// Monthly summary equality/range scans, including the read-only legacy fallback.
deliverySchema.index({ completedBy: 1, deliveredAt: 1 }, { partialFilterExpression: { status: "delivered" } });
deliverySchema.index({ "events.actorId": 1, "events.status": 1, "events.at": 1 }, { partialFilterExpression: { status: "delivered" } });

export default mongoose.models.Delivery || mongoose.model("Delivery", deliverySchema);
