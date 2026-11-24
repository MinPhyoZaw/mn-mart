import mongoose from "mongoose";

const schema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  senderRole: { type: String, enum: ["customer", "admin"], required: true },
  requestId: { type: String, required: true },
  body: { type: String, required: true, maxlength: 2000 },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now, required: true },
}, { collection: "support_messages" });

schema.index({ customerId: 1, createdAt: -1, _id: -1 });
schema.index({ customerId: 1, senderRole: 1, read: 1 });
schema.index({ senderId: 1, requestId: 1 }, { unique: true });

export default mongoose.models.SupportMessage || mongoose.model("SupportMessage", schema);
