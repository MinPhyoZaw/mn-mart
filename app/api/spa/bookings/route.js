import { NextResponse } from "next/server";
import connectDB from "../../../lib/mongodb";
import { requireAuth } from "../../../lib/routeAuth";
import SpaService from "../../../models/SpaService";
import SpaBooking from "../../../models/SpaBooking";

export async function POST(req) {
  const auth = requireAuth(req, ["customer"]);
  if (!auth.ok) return auth.response;

  const body = await req.json();
  const { serviceId, customerName, phoneNumber, selectedDate, selectedTimeSlot, receiptImage } = body;
  if (!serviceId || !customerName || !phoneNumber || !selectedDate || !selectedTimeSlot?.start || !selectedTimeSlot?.end || !receiptImage) {
    return NextResponse.json({ success: false, message: "Missing booking fields." }, { status: 400 });
  }

  await connectDB();
  const service = await SpaService.findById(serviceId).lean();
  if (!service || !service.isActive) return NextResponse.json({ success: false, message: "Spa service not found." }, { status: 404 });

  const slotExists = (service.availableSlots || []).some((slot) => slot.start === selectedTimeSlot.start && slot.end === selectedTimeSlot.end);
  if (!slotExists) return NextResponse.json({ success: false, message: "Selected time slot is not available." }, { status: 400 });

  const booking = await SpaBooking.create({
    serviceId: service._id,
    vendorId: service.vendorId,
    customerId: auth.user.userId,
    customerName,
    phoneNumber,
    selectedDate,
    selectedTimeSlot,
    receiptImage,
    orderStatus: "PENDING_ADMIN",
    paymentStatus: "WAITING_VERIFICATION",
    notifications: [{ message: "Booking submitted and pending admin verification." }],
  });

  return NextResponse.json({ success: true, data: booking }, { status: 201 });
}

export async function GET(req) {
  const auth = requireAuth(req, ["customer", "admin"]);
  if (!auth.ok) return auth.response;
  await connectDB();

  const query = auth.user.role === "customer" ? { customerId: auth.user.userId } : {};
  const bookings = await SpaBooking.find(query).sort({ createdAt: -1 }).populate("serviceId", "serviceName priceMMK durationMinutes").lean();
  return NextResponse.json({ success: true, data: bookings });
}
