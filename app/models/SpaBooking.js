import mongoose from "mongoose";

const ORDER_STATUS = ["PENDING_ADMIN", "APPROVED_BY_ADMIN", "CONFIRMED", "COMPLETED", "REJECTED", "CANCELLED_BY_VENDOR"];
const PAYMENT_STATUS = ["WAITING_VERIFICATION", "VERIFIED", "REJECTED"];

const spaBookingSchema = new mongoose.Schema({
  serviceId: { type: mongoose.Schema.Types.ObjectId, ref: "SpaService", required: true, index: true },
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor", required: true, index: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  customerName: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  selectedDate: { type: String, required: true },
  selectedTimeSlot: {
    start: { type: String, required: true },
    end: { type: String, required: true },
  },
  bookingFeeMMK: { type: Number, default: 3000 },
  receiptImage: { type: String, required: true },
  paymentStatus: { type: String, enum: PAYMENT_STATUS, default: "WAITING_VERIFICATION" },
  orderStatus: { type: String, enum: ORDER_STATUS, default: "PENDING_ADMIN" },
  notifications: [{ message: String, createdAt: { type: Date, default: Date.now } }],
}, { timestamps: true });

export default mongoose.models.SpaBooking || mongoose.model("SpaBooking", spaBookingSchema);
