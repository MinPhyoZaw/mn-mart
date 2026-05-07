"use client";
import { Wifi, BedDouble, Tv, Coffee } from "lucide-react";
import AddToCartButton from "./AddToCartButton";
import Image from "next/image";
import { useState } from "react";

const AMENITY_META = {
  wifi: { label: "WiFi" },
  swimmingPool: { label: "Swimming Pool" },
  aircon: { label: "Aircon" },
  breakfast: { label: "Breakfast" },
  extraBed: { label: "Extra Bed" },
};

const HOTEL_BOOKING_TEXT =
  "Room booking တင်ရန်အတွက် အခန်းခကျသင့်ငွေမှ 5000MMK (၅ထောင်ကျပ်)အား စရံငွေအနေဖြင့် အောက်တွင်ဖော်ပြထားသော အကောင့်ထဲသို ထည့်ပေးပါခင်ဗျာ။";

export default function ShopDetailClient({ shop, items }) {
  const [activeBookingItemId, setActiveBookingItemId] = useState(null);
  const [showQrLarge, setShowQrLarge] = useState(false);

  const [bookingForm, setBookingForm] = useState({
    customerName: "",
    customerPhone: "",
    extraBedAmount: "0",
    guestCount: "1",
    note: "",
    receiptImage: "",
  });

  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [bookingMessage, setBookingMessage] = useState("");

  const activeBookingItem = activeBookingItemId
    ? items.find((i) => i._id === activeBookingItemId)
    : null;

  const isHotel = shop?.category === "hotel";
  const isShopping = shop?.category === "shopping";
  const visibleItems = isHotel ? items.filter((item) => item.isAvailable !== false) : items;

  const getAmenityList = (item) =>
    Object.entries(item?.extra?.amenities || {})
      .filter(([, enabled]) => enabled)
      .map(([key]) => AMENITY_META[key] || { label: key });

  const handleReceiptUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () =>
      setBookingForm((prev) => ({
        ...prev,
        receiptImage: reader.result,
      }));
    reader.readAsDataURL(file);
  };

  const submitHotelBooking = async () => {
    if (
      !bookingForm.customerName ||
      !bookingForm.customerPhone ||
      !bookingForm.receiptImage
    ) {
      setBookingMessage("Please fill all required fields.");
      return;
    }

    setBookingSubmitting(true);

    try {
      await fetch("/api/hotel-booking", {
        method: "POST",
        body: JSON.stringify({
          ...bookingForm,
          roomItemId: activeBookingItem._id,
          shopId: shop._id,
        }),
      });

      setBookingMessage("Booking submitted successfully");
      setActiveBookingItemId(null);
    } catch {
      setBookingMessage("Error submitting booking");
    } finally {
      setBookingSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">

      {/* SHOP IMAGE */}
      <div className="relative w-full h-64 rounded-xl overflow-hidden">
        <Image src={shop.image} alt={shop.name} fill className="object-cover" />
      </div>

      <h1 className="text-2xl font-bold mt-4">{shop.name}</h1>

      {/* ITEMS */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 ${isShopping ? "lg:grid-cols-5" : "lg:grid-cols-3"} gap-6 mt-6`}>
        {visibleItems.length === 0 ? (
          <p className="text-sm text-gray-500">No available rooms right now.</p>
        ) : null}
        {visibleItems.map((item) => (
          <div
            key={item._id}
            className="border rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition"
          >
            <div className="relative h-52 md:h-56 bg-gray-100">
              {item.image ? (
                <Image src={item.image} alt={item.name} fill className="object-cover" />
              ) : null}
            </div>

            <div className="p-4 flex flex-col">
              <h3 className="font-semibold text-lg line-clamp-2">{item.name}</h3>
              <p className="mt-1 text-sm text-green-700 line-clamp-1">{shop.name}</p>

              <div className="mt-2">
                <span className="text-black font-semibold text-lg">
                  {Number(item.price || 0).toLocaleString()} MMK
                </span>
                {isHotel ? (
                  <span className="text-gray-400 text-sm font-light ml-1">/ night</span>
                ) : null}
              </div>

              {isHotel ? (
                <>
                  <div className="flex items-center gap-3 mt-3 text-gray-600">
                    {item?.extra?.amenities?.wifi && <Wifi size={18} />}
                    {item?.extra?.amenities?.extraBed && <BedDouble size={18} />}
                    {item?.extra?.amenities?.tv && <Tv size={18} />}
                    {item?.extra?.amenities?.breakfast && <Coffee size={18} />}
                  </div>

                  <button
                    onClick={() => setActiveBookingItemId(item._id)}
                    className="mt-4 w-full bg-black text-white py-2 rounded-md hover:bg-gray-800 transition"
                  >
                    Book Now
                  </button>
                </>
              ) : (
                <AddToCartButton
                  product={{
                    _id: item._id,
                    name: item.name,
                    price: Number(item.price) || 0,
                    image: item.image,
                    shopId: shop._id,
                    shopName: shop.name,
                    vendorId: item.vendorId || shop.vendorId,
                  }}
                />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* MODAL */}
      {isHotel && activeBookingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">

          {/* overlay */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setActiveBookingItemId(null)}
          />

          {/* modal */}
          <div className="relative w-full max-w-5xl bg-white rounded-xl shadow-xl flex flex-col md:flex-row overflow-hidden">

            {/* LEFT IMAGE */}
            <div className="md:w-1/2 h-64 md:h-auto relative">
              <Image
                src={activeBookingItem.image}
                alt={activeBookingItem.name}
                fill
                className="object-cover"
              />
            </div>

            {/* RIGHT FORM */}
            <div className="md:w-1/2 p-6 overflow-y-auto">

              <button
                onClick={() => setActiveBookingItemId(null)}
                className="absolute right-4 top-4"
              >
                ✕
              </button>

              <h2 className="text-xl font-semibold mb-2">
                {activeBookingItem.name}
              </h2>

              {/* Amenities */}
              <div className="flex flex-wrap gap-2 mb-3">
                {getAmenityList(activeBookingItem).map((a, i) => (
                  <span key={i} className="text-xs bg-gray-100 px-2 py-1 rounded">
                    {a.label}
                  </span>
                ))}
              </div>

              <div className="space-y-3">

                <input
                  placeholder="Enter name"
                  className="w-full border px-3 py-2 rounded"
                  value={bookingForm.customerName}
                  onChange={(e) =>
                    setBookingForm({ ...bookingForm, customerName: e.target.value })
                  }
                />

                <input
                  placeholder="Enter phone number"
                  className="w-full border px-3 py-2 rounded"
                  value={bookingForm.customerPhone}
                  onChange={(e) =>
                    setBookingForm({ ...bookingForm, customerPhone: e.target.value })
                  }
                />

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="Enter guest number"
                    className="border px-3 py-2 rounded"
                    value={bookingForm.guestCount}
                    onChange={(e) =>
                      setBookingForm({ ...bookingForm, guestCount: e.target.value })
                    }
                  />

                  <input
                    type="number"
                    placeholder="Enter extra bed number"
                    className="border px-3 py-2 rounded"
                    value={bookingForm.extraBedAmount}
                    onChange={(e) =>
                      setBookingForm({
                        ...bookingForm,
                        extraBedAmount: e.target.value,
                      })
                    }
                  />
                </div>

                <textarea
                  placeholder="Note"
                  className="w-full border px-3 py-2 rounded"
                  value={bookingForm.note}
                  onChange={(e) =>
                    setBookingForm({ ...bookingForm, note: e.target.value })
                  }
                />

                <div className="border p-3 bg-gray-50 text-sm">
                  {HOTEL_BOOKING_TEXT}
                </div>

                {/* QR */}
                <div
                  className="h-32 w-32 mx-auto border cursor-pointer relative"
                  onClick={() => setShowQrLarge(true)}
                >
                  <Image src="/images/logo.png" alt="QR" fill />
                </div>

                <input type="file" onChange={handleReceiptUpload} />

                <button
                  onClick={submitHotelBooking}
                  disabled={bookingSubmitting}
                  className="w-full bg-yellow-500 text-white py-2 rounded"
                >
                  {bookingSubmitting ? "Submitting..." : "Confirm Order"}
                </button>

                {bookingMessage && (
                  <p className="text-sm text-blue-600">{bookingMessage}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LARGE QR */}
      {showQrLarge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">

          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => setShowQrLarge(false)}
          />

          <div className="relative z-50 bg-white p-4 rounded">
            <Image
              src="/images/logo.png"
              alt="QR Large"
              width={400}
              height={400}
            />
          </div>
        </div>
      )}
    </div>
  );
}