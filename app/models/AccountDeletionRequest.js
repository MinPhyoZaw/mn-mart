import mongoose from "mongoose";

const accountDeletionRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      immutable: true,
    },
    role: {
      type: String,
      enum: ["customer", "vendor"],
      required: true,
      immutable: true,
    },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "rejected", "cancelled"],
      default: "pending",
      required: true,
    },
    requestedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
    processedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.models.AccountDeletionRequest ||
  mongoose.model("AccountDeletionRequest", accountDeletionRequestSchema);
