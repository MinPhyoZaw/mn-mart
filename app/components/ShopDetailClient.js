"use client";
import { Wifi, BedDouble, Tv, Coffee } from "lucide-react";
import AddToCartButton from "./AddToCartButton";
import { normalizeWholesaleTiers } from "../lib/pricing";
import Image from "next/image";
import { useMemo, useState } from "react";
import PaymentQrSelector from "./PaymentQrSelector";
import { DEFAULT_PAYMENT_PROVIDER } from "../lib/paymentAccounts";
import { RECEIPT_IMAGE_BUCKET, uploadImageToSupabaseStorage } from "../lib/supabase";

const AMENITY_META = {
  wifi: { label: "WiFi" },
  swimmingPool: { label: "Swimming Pool" },
  aircon: { label: "Aircon" },
  breakfast: { label: "Breakfast" },
  extraBed: { label: "Extra Bed" },
};

const HOTEL_BOOKING_TEXT =
  "Room booking တင်ရန်အတွက် အခန်းခကျသင့်ငွေမှ 5000MMK (၅ထောင်ကျပ်)အား စရံငွေအနေဖြင့် အောက်တွင်ဖော်ပြထားသော အကောင့်ထဲသို ထည့်ပေးပါခင်ဗျာ။";
const SPA_BOOKING_TEXT =
  "Spa Service booking တင်ရန်အတွက် ကျသင့်ငွေမှ 3000MMK (၃ထောင်ကျပ်)အား စရံငွေအနေဖြင့် အောက်တွင်ဖော်ပြထားသော အကောင့်ထဲသို ထည့်ပေးပါခင်ဗျာ။";

function ShoppingWholesaleOptions({ item, selectedWholesaleQty, onSelectWholesaleQty }) {
  const wholesaleTiers = useMemo(
    () => normalizeWholesaleTiers(item.wholesaleTiers ?? item.extra?.wholesaleTiers ?? []),
    [item.wholesaleTiers, item.extra?.wholesaleTiers]
  );

  if (!wholesaleTiers.length) return null;

  return (
    <div className="mt-2 space-y-1 rounded-lg border border-green-100 bg-green-50/70 p-2 text-xs text-green-800">
      {wholesaleTiers.map((tier) => (
        <label key={tier.minQty} className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={selectedWholesaleQty === tier.minQty}
            onChange={(e) => onSelectWholesaleQty(e.target.checked ? tier.minQty : null)}
            className="h-4 w-4 accent-green-600"
          />
          <span>လက်ကားဈေး : {tier.minQty} - {Number(tier.price).toLocaleString()} MMK</span>
        </label>
      ))}
    </div>
  );
}

export default function ShopDetailClient({ shop, items }) {
  const [activeBookingItemId, setActiveBookingItemId] = useState(null);
  const [bookingForm, setBookingForm] = useState({
    customerName: "",
    customerPhone: "",
    extraBedAmount: "0",
    guestCount: "1",
    note: "",
    receiptImage: "",
    orderTime: "",
    paymentProvider: DEFAULT_PAYMENT_PROVIDER,
  });

  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [receiptUploading, setReceiptUploading] = useState(false);
  const [bookingMessage, setBookingMessage] = useState("");
  const [selectedWholesaleQtyByItem, setSelectedWholesaleQtyByItem] = useState({});

  const activeBookingItem = activeBookingItemId
    ? items.find((i) => i._id === activeBookingItemId)
    : null;

  const isHotel = shop?.category === "hotel";
  const isSpa = shop?.category === "spa";
  const isShopping = shop?.category === "shopping";
  const visibleItems = isHotel ? items.filter((item) => item.isAvailable !== false) : items;

  const gridClasses = isSpa
    ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6"
    : isShopping
    ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mt-6"
    : "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 mt-6";

  const setSelectedWholesaleQty = (itemId, quantity) => {
    setSelectedWholesaleQtyByItem((prev) => ({
      ...prev,
      [itemId]: quantity,
    }));
  };

  const getAmenityList = (item) =>
    Object.entries(item?.extra?.amenities || {})
      .filter(([, enabled]) => enabled)
      .map(([key]) => AMENITY_META[key] || { label: key });

  const handleReceiptUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setBookingMessage("Please upload an image file.");
      return;
    }

    setReceiptUploading(true);
    setBookingMessage("Uploading receipt image...");
    setBookingForm((prev) => ({ ...prev, receiptImage: "" }));

    try {
      const receiptImage = await uploadImageToSupabaseStorage(file, {
        bucket: RECEIPT_IMAGE_BUCKET,
        folder: `receipts/${shop?.category || "booking"}/${shop?._id || "shops"}`,
      });
      setBookingForm((prev) => ({ ...prev, receiptImage }));
      setBookingMessage("Receipt image uploaded successfully.");
    } catch (error) {
      setBookingMessage(error.message || "Unable to upload receipt image.");
      e.target.value = "";
    } finally {
      setReceiptUploading(false);
    }
  };

  const submitHotelBooking = async () => {
    if (receiptUploading) {
      setBookingMessage("Please wait for the receipt upload to finish.");
      return;
    }

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
          paymentProvider: bookingForm.paymentProvider,
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

  const submitSpaBooking = async () => {
    if (receiptUploading) {
      setBookingMessage("Please wait for the receipt upload to finish.");
      return;
    }

    if (!bookingForm.customerName || !bookingForm.customerPhone || !bookingForm.orderTime || !bookingForm.receiptImage) {
      setBookingMessage("Please fill all required fields.");
      return;
    }
    setBookingSubmitting(true);
    try {
      await fetch("/api/spa-booking", {
        method: "POST",
        body: JSON.stringify({
          customerName: bookingForm.customerName,
          customerPhone: bookingForm.customerPhone,
          orderTime: bookingForm.orderTime,
          receiptImage: bookingForm.receiptImage,
          paymentProvider: bookingForm.paymentProvider,
          serviceItemId: activeBookingItem._id,
          shopId: shop._id,
        }),
      });
      setBookingMessage("Spa booking submitted successfully");
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
      <div className={gridClasses}>
        {visibleItems.length === 0 ? (
          <p className="text-sm text-gray-500">No available rooms right now.</p>
        ) : null}
        {visibleItems.map((item) => (
          <div
            key={item._id}
            className="border rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition"
          >
            <div className="relative h-44 md:h-48 bg-gray-100">
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
                {isShopping ? (
                  <ShoppingWholesaleOptions
                    item={item}
                    selectedWholesaleQty={selectedWholesaleQtyByItem[item._id] || null}
                    onSelectWholesaleQty={(quantity) => setSelectedWholesaleQty(item._id, quantity)}
                  />
                ) : null}
                {isHotel ? (
                  <span className="text-gray-400 text-sm font-light ml-1">/ night</span>
                ) : null}
              </div>

              {isHotel || isSpa ? (
                <>
                  {isSpa ? <p className="mt-2 text-sm text-gray-600">Duration: {item?.extra?.durationMinutes || "-"} min</p> : null}
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
                    Order Now
                  </button>
                </>
              ) : (() => {
                const wholesaleTiers = normalizeWholesaleTiers(item.wholesaleTiers ?? item.extra?.wholesaleTiers ?? []);
                const selectedWholesaleTier = wholesaleTiers.find((tier) => tier.minQty === selectedWholesaleQtyByItem[item._id]) || null;

                return (
                  <AddToCartButton
                    product={{
                      _id: item._id,
                      name: item.name,
                      price: Number(item.price) || 0,
                      retailPrice: Number(item.retailPrice ?? item.price) || 0,
                      wholesaleTiers,
                      selectedWholesaleTier,
                      image: item.image,
                      shopId: shop._id,
                      shopName: shop.name,
                      vendorId: item.vendorId || shop.vendorId,
                    }}
                  />
                );
              })()}
            </div>
          </div>
        ))}
      </div>

      {/* MODAL */}
      {(isHotel || isSpa) && activeBookingItem && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">

          {/* overlay */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setActiveBookingItemId(null)}
          />

          {/* modal */}
          <div className={`relative w-full ${isSpa ? "max-w-lg max-h-[calc(100dvh-2rem)] overflow-y-auto p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))]" : "max-w-5xl max-h-[80vh] flex flex-col md:flex-row overflow-hidden"} bg-white rounded-2xl shadow-xl`}>

            {/* LEFT IMAGE */}
            {!isSpa ? <div className="relative h-48 flex-none md:h-auto md:w-1/2">
              <Image
                src={activeBookingItem.image}
                alt={activeBookingItem.name}
                fill
                className="object-cover"
              />
            </div> : null}

            {/* RIGHT FORM */}
            <div className={isSpa ? "w-full" : "min-h-0 flex-1 overflow-y-auto p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] md:w-1/2 md:p-6"}>

                ✕
                  <button
                    onClick={() => setActiveBookingItemId(item._id)}
                    className="mt-4 w-full bg-black text-white py-2 rounded-md hover:bg-gray-800 transition"
                  >
                    {isHotel ? "Book Now" : "Order Now"}
                  </button>
              {/* Amenities */}
              {!isSpa ? <div className="flex flex-wrap gap-2 mb-3">
                {getAmenityList(activeBookingItem).map((a, i) => (
                  <span key={i} className="text-xs bg-gray-100 px-2 py-1 rounded">
                    {a.label}
                  </span>
                ))}
              </div> : null}

              <div className="space-y-3">

                <label className="block text-sm font-semibold text-gray-700">Your Name
                <input
                  placeholder="Enter your name"
                  className="mt-1 w-full border px-3 py-2 rounded-lg"
                  value={bookingForm.customerName}
                  onChange={(e) =>
                    setBookingForm({ ...bookingForm, customerName: e.target.value })
                  }
                />
                </label>

                {isHotel ? <input
                  placeholder="Enter phone number"
                  className="w-full border px-3 py-2 rounded"
                  value={bookingForm.customerPhone}
                  onChange={(e) =>
                    setBookingForm({ ...bookingForm, customerPhone: e.target.value })
                  }
                /> : null}
                {isSpa ? <input
                  placeholder="Enter phone number"
                  className="w-full border px-3 py-2 rounded"
                  value={bookingForm.customerPhone}
                  onChange={(e) =>
                    setBookingForm({ ...bookingForm, customerPhone: e.target.value })
                  }
                /> : null}
                {isSpa ? <label className="block text-sm font-semibold text-gray-700">Order တင်လိုသည့်အချိန်
                  <input type="time" className="mt-1 w-full border px-3 py-2 rounded" value={bookingForm.orderTime} onChange={(e) => setBookingForm({ ...bookingForm, orderTime: e.target.value })} />
                </label> : null}

                {isHotel ? <div className="grid grid-cols-2 gap-2">
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
                </div> : null}

                <textarea
                  placeholder="Note"
                  className="w-full border px-3 py-2 rounded"
                  value={bookingForm.note}
                  onChange={(e) =>
                    setBookingForm({ ...bookingForm, note: e.target.value })
                  }
                />

                <div className="border p-3 bg-gray-50 text-sm leading-6">
                  {isSpa ? SPA_BOOKING_TEXT : HOTEL_BOOKING_TEXT}
                </div>

                <PaymentQrSelector
                  value={bookingForm.paymentProvider}
                  onChange={(paymentProvider) => setBookingForm({ ...bookingForm, paymentProvider })}
                />

                <label className="block text-sm font-semibold text-gray-700">Upload the receipt
                  <input type="file" accept="image/*" onChange={handleReceiptUpload} className="mt-1 w-full rounded-lg border border-dashed border-amber-300 bg-amber-50/50 px-3 py-2 file:mr-4 file:rounded-md file:border-0 file:bg-amber-500 file:px-3 file:py-1.5 file:text-white" />
                </label>
                {receiptUploading ? <p className="text-xs text-blue-600">Uploading receipt to Supabase...</p> : null}
                {bookingForm.receiptImage ? <p className="text-xs text-green-700">Receipt uploaded to Supabase ✅</p> : null}

                <button
                  onClick={isSpa ? submitSpaBooking : submitHotelBooking}
                  disabled={bookingSubmitting || receiptUploading}
                  className="w-full bg-yellow-500 text-white py-2 rounded"
                >
                  {bookingSubmitting ? "Submitting..." : receiptUploading ? "Uploading receipt..." : "Submit Order"}
                </button>

                {bookingMessage && (
                  <p className="text-sm text-blue-600">{bookingMessage}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
