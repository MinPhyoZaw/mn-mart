"use client";

import Image from "next/image";
import { useCart } from "../context/CartContext";
import { useState } from "react";

const AMENITY_META = {
  wifi: { label: "WiFi" },
  swimmingPool: { label: "Swimming Pool" },
  aircon: { label: "Aircon" },
  breakfast: { label: "Breakfast" },
  extraBed: { label: "Extra Bed" },
};

const HOTEL_BOOKING_TEXT = "Hotel booking တင်ရန်အတွက် အခန်းခကျသင့်ငွေမှ 5000MMK (၅ထောင်ကျပ်)အား အောက်တွင်ဖော်ပြထားသော အကောင့်ထဲသို လွှပေးပါခင်ဗျာ။";

export default function ShopDetailClient({ shop, items }) {
  const { addToCart, openCart } = useCart();
  const [activeBookingItemId, setActiveBookingItemId] = useState(null);
  const [bookingForm, setBookingForm] = useState({ customerName: "", customerPhone: "", extraBedAmount: "0", guestCount: "1", note: "", receiptImage: "" });
  const [bookingMessage, setBookingMessage] = useState("");
  const [bookingSubmitting, setBookingSubmitting] = useState(false);

  const sanitizedPhone = shop?.phone ? String(shop.phone).replace(/[^\d+]/g, "") : "";

  const handleAddToCart = (item) => {
    addToCart({ ...item, shopId: shop?._id, shopName: shop?.name, vendorId: shop?.vendorId, vendorName: shop?.vendorName });
    openCart();
  };

  const handleReceiptUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setBookingForm((prev) => ({ ...prev, receiptImage: String(reader.result || "") }));
    reader.readAsDataURL(file);
  };

  const submitHotelBooking = async (item) => {
    if (!bookingForm.customerName || !bookingForm.customerPhone || !bookingForm.receiptImage) {
      setBookingMessage("Please fill required fields and upload receipt.");
      return;
    }
    setBookingSubmitting(true);
    setBookingMessage("");
    try {
      const res = await fetch("/api/hotel-booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomItemId: item._id,
          shopId: shop?._id,
          customerName: bookingForm.customerName,
          customerPhone: bookingForm.customerPhone,
          extraBedAmount: Number(bookingForm.extraBedAmount) || 0,
          guestCount: Number(bookingForm.guestCount) || 1,
          note: bookingForm.note,
          receiptImage: bookingForm.receiptImage,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setBookingMessage(data.message || "Booking failed.");
      } else {
        setBookingMessage("Booking submitted successfully.");
        setActiveBookingItemId(null);
      }
    } catch {
      setBookingMessage("Server error while booking.");
    } finally {
      setBookingSubmitting(false);
    }
  };

  const isRoom = (item) => item.type === "room";
  const isHotel = shop?.category === "hotel";
  const isTransportation = shop?.category === "transportation";
  const isSpa = shop?.category === "spa";
  const supportsCart = shop?.category === "shopping";

  const getAmenityList = (item) => Object.entries(item?.extra?.amenities || {}).filter(([, enabled]) => Boolean(enabled)).map(([key]) => AMENITY_META[key] || { label: key });

  const sectionTitle = isHotel ? "Available Room" : isSpa ? "Available Service" : isTransportation ? "Available Routes" : "Available Products";

  return <div className="max-w-6xl mx-auto px-4 py-5 sm:p-6">{/* trimmed */}
    <div className="relative w-full h-64 md:h-96 rounded-xl overflow-hidden shadow-lg"><Image src={shop.image || "/images/default-shop.png"} alt={shop.name} fill className="object-cover" /></div>
    <div className="mt-6"><h1 className="text-2xl sm:text-3xl font-bold text-yellow-600 break-words">{shop.name}</h1>
      <p className="text-gray-600 mt-2 break-words">{shop.description || "No description available"}</p>
      <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="rounded-xl border border-gray-200 bg-white p-4"><p className="text-xs uppercase tracking-wide text-gray-500">Phone</p><p className="mt-1 font-medium text-gray-800 break-all">{shop.phone || "N/A"}</p></div>
        <div className="rounded-xl border border-gray-200 bg-white p-4"><p className="text-xs uppercase tracking-wide text-gray-500">Address</p><p className="mt-1 font-medium text-gray-800 break-words">{shop.address || "N/A"}</p></div>
      </div>
      <div className="mt-8"><h2 className="text-xl font-semibold mb-3">{sectionTitle}</h2>
        {bookingMessage && <p className="mb-3 text-sm text-blue-700">{bookingMessage}</p>}
        {items?.length ? <div className={`grid ${supportsCart ? "grid-cols-2 lg:grid-cols-5" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"} gap-4`}>
          {items.map((item) => <div key={item._id} className="overflow-hidden h-full flex flex-col border bg-white rounded-xl shadow-sm"><div className="relative w-full bg-white h-40">{item.image && <Image src={item.image} alt={item.name} fill className="object-cover" />}</div>
            <div className="flex flex-col flex-1 p-3"><h3 className="font-semibold">{item.name}</h3>
              {isRoom(item) && <div className="mt-2"><span className="font-semibold text-yellow-600">{Number(item.price || 0).toLocaleString()} MMK</span></div>}
              <div className="mt-3 flex items-center justify-between gap-2 mt-auto">
                {!supportsCart ? <button type="button" onClick={() => setActiveBookingItemId(activeBookingItemId === item._id ? null : item._id)} className="text-xs sm:text-sm px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-md whitespace-nowrap">Book Now</button> : <button onClick={() => handleAddToCart(item)} className="text-xs sm:text-sm px-3 py-1.5 border border-[#318616] text-[#318616] bg-[#f7fff2] hover:bg-[#ecf9e2] rounded-md font-semibold whitespace-nowrap">Add to cart</button>}
              </div>
              {isHotel && activeBookingItemId === item._id && <div className="mt-4 space-y-2 border rounded-lg p-3 bg-gray-50">
                <input placeholder="Name" className="w-full border rounded px-3 py-2" value={bookingForm.customerName} onChange={(e) => setBookingForm((p) => ({ ...p, customerName: e.target.value }))} />
                <input placeholder="Phone Number" className="w-full border rounded px-3 py-2" value={bookingForm.customerPhone} onChange={(e) => setBookingForm((p) => ({ ...p, customerPhone: e.target.value }))} />
                <input type="number" min="0" placeholder="Amount of Extra bed" className="w-full border rounded px-3 py-2" value={bookingForm.extraBedAmount} onChange={(e) => setBookingForm((p) => ({ ...p, extraBedAmount: e.target.value }))} />
                <input type="number" min="1" placeholder="Number of guest" className="w-full border rounded px-3 py-2" value={bookingForm.guestCount} onChange={(e) => setBookingForm((p) => ({ ...p, guestCount: e.target.value }))} />
                <textarea placeholder="Description" className="w-full border rounded px-3 py-2" value={bookingForm.note} onChange={(e) => setBookingForm((p) => ({ ...p, note: e.target.value }))} />
                <textarea className="w-full border rounded px-3 py-2 text-sm" value={HOTEL_BOOKING_TEXT} readOnly />
                <div className="relative h-36 w-36 overflow-hidden border rounded"><Image src="/images/logo.png" alt="Online banking QR" fill className="object-cover" /></div>
                <input type="file" accept="image/*" onChange={handleReceiptUpload} className="w-full border rounded px-3 py-2" />
                <button type="button" onClick={() => submitHotelBooking(item)} disabled={bookingSubmitting} className="w-full bg-yellow-500 hover:bg-yellow-600 text-white rounded px-3 py-2">{bookingSubmitting ? "Submitting..." : "Confirm Order"}</button>
              </div>}
            </div></div>)}
        </div> : <div className="bg-gray-100 p-4 rounded-lg text-gray-500">No items yet.</div>}
      </div></div></div>;
}
