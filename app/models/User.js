// models/User.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true },
  phone: String,
  password: String,
  profileImage: { type: String, default: "" },

  role: {
    type: String,
    enum: ["admin", "vendor", "customer"],
    default: "customer"
  }

}, { timestamps: true });

export default mongoose.models.User || mongoose.model("User", userSchema);
