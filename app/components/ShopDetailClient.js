"use client";

import { Wifi, BedDouble, Tv, Coffee, MapPin } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import ProductDetailsModal from "./ProductDetailsModal";
import PaymentQrSelector from "./PaymentQrSelector";

import { DEFAULT_PAYMENT_PROVIDER } from "../lib/paymentAccounts";
import {
  RECEIPT_IMAGE_BUCKET,
  uploadImageToSupabaseStorage,
} from "../lib/supabase";

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

export default function ShopDetailClient({ shop, items }) {
  const [activeBookingItemId, setActiveBookingItemId] =
    useState(null);

  const [selectedProduct, setSelectedProduct] = useState(null);

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

  const [bookingSubmitting, setBookingSubmitting] =
    useState(false);

  const [receiptUploading, setReceiptUploading] =
    useState(false);

  const [bookingMessage, setBookingMessage] = useState("");

  const [bookingKey, setBookingKey] = useState(null);

  const activeBookingItem = activeBookingItemId
    ? items.find((item) => item._id === activeBookingItemId)
    : null;

  const isHotel = shop?.category === "hotel";
  const isSpa = shop?.category === "spa";
  const isShopping = shop?.category === "shopping";

  const visibleItems = isHotel
    ? items.filter((item) => item.isAvailable !== false)
    : items;

  const gridClasses = isSpa
    ? "mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
    : isShopping
      ? "mt-6 grid grid-cols-2 gap-x-2.5 gap-y-6 sm:grid-cols-3 md:grid-cols-4 md:gap-x-3 md:gap-y-7 lg:grid-cols-6"
      : "mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3";

  const getAmenityList = (item) =>
    Object.entries(item?.extra?.amenities || {})
      .filter(([, enabled]) => enabled)
      .map(
        ([key]) =>
          AMENITY_META[key] || {
            label: key,
          }
      );

  const openProductDetails = (item) => {
    setSelectedProduct({
      ...item,

      shopId: shop._id,

      shopName: shop.name,

      vendorId:
        item.vendorId ||
        shop.vendorId ||
        shop.vendor?._id ||
        null,

      shop: {
        _id: shop._id,
        name: shop.name,
        category: shop.category,
        vendorId:
          shop.vendorId ||
          shop.vendor?._id ||
          null,
      },
    });
  };

  const openBooking = (item) => {
    setBookingMessage("");

    setBookingKey(crypto.randomUUID());

    setActiveBookingItemId(item._id);
  };

  const closeBooking = () => {
    if (bookingSubmitting || receiptUploading) {
      return;
    }

    setActiveBookingItemId(null);
    setBookingMessage("");
  };

  const handleReceiptUpload = async (e) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setBookingMessage(
        "Please upload an image"
      );

      return;
    }

    setReceiptUploading(true);

    setBookingMessage(
      "Uploading receipt image..."
    );

    setBookingForm((prev) => ({
      ...prev,
      receiptImage: "",
    }));

    try {
      const receiptImage =
        await uploadImageToSupabaseStorage(file, {
          bucket: RECEIPT_IMAGE_BUCKET,

          folder: `receipts/${
            shop?.category || "booking"
          }/${shop?._id || "shops"}`,
        });

      setBookingForm((prev) => ({
        ...prev,
        receiptImage,
      }));

      setBookingMessage(
        "Receipt image uploaded successfully."
      );
    } catch (error) {
      setBookingMessage(
        error?.message ||
          "Unable to upload receipt image."
      );

      e.target.value = "";
    } finally {
      setReceiptUploading(false);
    }
  };

  const submitHotelBooking = async () => {
    if (!activeBookingItem) {
      return;
    }

    if (receiptUploading) {
      setBookingMessage(
        "Please wait for the receipt upload to finish."
      );

      return;
    }

    if (
      !bookingForm.customerName ||
      !bookingForm.customerPhone ||
      !bookingForm.receiptImage
    ) {
      setBookingMessage(
        "Please fill all required fields."
      );

      return;
    }

    setBookingSubmitting(true);
    setBookingMessage("");

    try {
      const res = await fetch(
        "/api/hotel-booking",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            ...bookingForm,

            roomItemId:
              activeBookingItem._id,

            shopId: shop._id,

            paymentProvider:
              bookingForm.paymentProvider,

            bookingKey,
          }),
        }
      );

      const data = await res
        .json()
        .catch(() => null);

      if (!res.ok) {
        throw new Error(
          data?.message ||
            "Unable to submit booking."
        );
      }

      setBookingMessage(
        "Booking submitted successfully"
      );

      setActiveBookingItemId(null);
    } catch (error) {
      setBookingMessage(
        error?.message ||
          "Error submitting booking"
      );
    } finally {
      setBookingSubmitting(false);
    }
  };

  const submitSpaBooking = async () => {
    if (!activeBookingItem) {
      return;
    }

    if (receiptUploading) {
      setBookingMessage(
        "Please wait for the receipt upload to finish."
      );

      return;
    }

    if (
      !bookingForm.customerName ||
      !bookingForm.customerPhone ||
      !bookingForm.orderTime ||
      !bookingForm.receiptImage
    ) {
      setBookingMessage(
        "Please fill all required fields."
      );

      return;
    }

    setBookingSubmitting(true);
    setBookingMessage("");

    try {
      const res = await fetch(
        "/api/spa-booking",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            customerName:
              bookingForm.customerName,

            customerPhone:
              bookingForm.customerPhone,

            orderTime:
              bookingForm.orderTime,

            receiptImage:
              bookingForm.receiptImage,

            paymentProvider:
              bookingForm.paymentProvider,

            serviceItemId:
              activeBookingItem._id,

            shopId: shop._id,

            bookingKey,
          }),
        }
      );

      const data = await res
        .json()
        .catch(() => null);

      if (!res.ok) {
        throw new Error(
          data?.message ||
            "Unable to submit spa booking."
        );
      }

      setBookingMessage(
        "Spa booking submitted successfully"
      );

      setActiveBookingItemId(null);
    } catch (error) {
      setBookingMessage(
        error?.message ||
          "Error submitting booking"
      );
    } finally {
      setBookingSubmitting(false);
    }
  };

  return (
    <>
      <div className="mx-auto w-[94%] max-w-7xl py-5 sm:w-[92%] md:py-8">
        {/* =========================
            SHOP HEADER
        ========================== */}

        <section>
          <div className="relative h-44 w-full overflow-hidden rounded-2xl bg-gray-100 sm:h-56 md:h-72">
            {shop?.image ? (
              <Image
                src={shop.image}
                alt={shop.name || "Shop"}
                fill
                priority
                sizes="(max-width: 768px) 94vw, 1280px"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm text-gray-400">
                No shop image
              </div>
            )}

            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/50 to-transparent" />
          </div>

          <div
            className={
              isHotel
                ? "mt-5 text-center"
                : "mt-4"
            }
          >
            <div
              className={
                isHotel
                  ? "flex flex-col items-center"
                  : "flex flex-col"
              }
            >
              <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-orange-500">
                {isShopping
                  ? "Shopping"
                  : isHotel
                    ? "Hotel"
                    : isSpa
                      ? "Spa"
                      : "MN Mart"}
              </p>

              <h1 className="text-2xl font-bold tracking-tight text-gray-950 md:text-3xl">
                {shop.name}
              </h1>

              {isShopping ? (
                <p className="mt-1 text-sm text-gray-500">
                  Browse products from{" "}
                  {shop.name}
                </p>
              ) : null}
            </div>

            {isHotel && shop.address ? (
              <div className="mx-auto mt-3 flex max-w-2xl items-start justify-center gap-2 rounded-2xl border border-amber-100 bg-amber-50/80 px-4 py-3 text-sm text-gray-700 shadow-sm sm:text-base">
                <MapPin
                  className="mt-0.5 h-5 w-5 flex-none text-amber-600"
                  aria-hidden="true"
                />

                <p className="leading-relaxed">
                  {shop.address}
                </p>
              </div>
            ) : null}
          </div>
        </section>

        {/* =========================
            ITEMS
        ========================== */}

        <section>
          {visibleItems.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-dashed border-gray-200 bg-white px-5 py-10 text-center">
              <p className="text-sm font-medium text-gray-600">
                {isHotel
                  ? "No available rooms right now."
                  : isSpa
                    ? "No services available right now."
                    : "No products available right now."}
              </p>
            </div>
          ) : (
            <div className={gridClasses}>
              {visibleItems.map((item) => {
                /*
                 * =========================
                 * SHOPPING PRODUCT CARD
                 * =========================
                 */

                if (isShopping) {
                  return (
                    <article
                      key={item._id}
                      className="group min-w-0"
                    >
                      {/* PRODUCT IMAGE */}

                      <button
                        type="button"
                        onClick={() =>
                          openProductDetails(
                            item
                          )
                        }
                        className="relative block aspect-square w-full overflow-hidden rounded-xl bg-gray-100 text-left"
                        aria-label={`View ${item.name} details`}
                      >
                        {item.image ? (
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            sizes="(max-width: 640px) 47vw, (max-width: 768px) 31vw, (max-width: 1024px) 23vw, 16vw"
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
                            No image
                          </div>
                        )}
                      </button>

                      {/* PRODUCT INFO */}

                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() =>
                            openProductDetails(
                              item
                            )
                          }
                          className="block w-full text-left"
                        >
                          <h3 className="line-clamp-2 min-h-[38px] text-xs font-medium leading-[19px] text-gray-800 transition-colors hover:text-orange-600 md:text-sm">
                            {item.name}
                          </h3>
                        </button>

                        <p className="mt-1 truncate text-[10px] text-gray-400 md:text-xs">
                          {shop.name}
                        </p>

                        {/* PRICE */}

                        <div className="mt-1.5 flex items-baseline">
                          <span className="mr-1 text-[10px] font-semibold text-orange-600">
                            MMK
                          </span>

                          <span className="truncate text-base font-bold text-orange-600 md:text-lg">
                            {Number(
                              item.price || 0
                            ).toLocaleString()}
                          </span>
                        </div>

                        {/* SEE DETAILS */}

                        <button
                          type="button"
                          onClick={() =>
                            openProductDetails(
                              item
                            )
                          }
                          className="mt-2 flex h-8 w-full items-center justify-center rounded-lg bg-orange-500 px-2 text-[11px] font-medium text-white transition hover:bg-orange-600 active:scale-[0.98] md:text-xs"
                        >
                          See Details
                        </button>
                      </div>
                    </article>
                  );
                }

                /*
                 * =========================
                 * HOTEL / SPA CARD
                 * =========================
                 */

                return (
                  <article
                    key={item._id}
                    className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md"
                  >
                    {/* IMAGE */}

                    <div className="relative h-44 w-full bg-gray-100 md:h-48">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          sizes="(max-width: 640px) 94vw, (max-width: 1024px) 45vw, 33vw"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm text-gray-400">
                          No image
                        </div>
                      )}
                    </div>

                    {/* INFO */}

                    <div className="flex flex-col p-4">
                      <h3 className="line-clamp-2 text-lg font-semibold text-gray-900">
                        {item.name}
                      </h3>

                      <p className="mt-1 line-clamp-1 text-sm text-gray-500">
                        {shop.name}
                      </p>

                      {/* PRICE */}

                      <div className="mt-3">
                        <span className="text-lg font-bold text-gray-950">
                          {Number(
                            item.price || 0
                          ).toLocaleString()}{" "}
                          MMK
                        </span>

                        {isHotel ? (
                          <span className="ml-1 text-sm font-normal text-gray-400">
                            / night
                          </span>
                        ) : null}
                      </div>

                      {/* SPA DURATION */}

                      {isSpa ? (
                        <p className="mt-2 text-sm text-gray-600">
                          Duration:{" "}
                          {item?.extra
                            ?.durationMinutes ||
                            "-"}{" "}
                          min
                        </p>
                      ) : null}

                      {/* AMENITIES */}

                      <div className="mt-3 flex min-h-5 items-center gap-3 text-gray-500">
                        {item?.extra?.amenities
                          ?.wifi ? (
                          <Wifi size={18} />
                        ) : null}

                        {item?.extra?.amenities
                          ?.extraBed ? (
                          <BedDouble
                            size={18}
                          />
                        ) : null}

                        {item?.extra?.amenities
                          ?.tv ? (
                          <Tv size={18} />
                        ) : null}

                        {item?.extra?.amenities
                          ?.breakfast ? (
                          <Coffee size={18} />
                        ) : null}
                      </div>

                      {/* BOOK BUTTON */}

                      <button
                        type="button"
                        onClick={() =>
                          openBooking(item)
                        }
                        className="mt-4 w-full rounded-lg bg-gray-950 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 active:scale-[0.99]"
                      >
                        {isHotel
                          ? "Book Now"
                          : "Order Now"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* =========================
            HOTEL / SPA BOOKING MODAL
        ========================== */}

        {(isHotel || isSpa) &&
        activeBookingItem ? (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
            {/* OVERLAY */}

            <button
              type="button"
              aria-label="Close booking"
              className="absolute inset-0 cursor-default bg-black/50"
              onClick={closeBooking}
            />

            {/* MODAL */}

            <div
              className={`relative w-full bg-white shadow-xl ${
                isSpa
                  ? "max-h-[calc(100dvh-2rem)] max-w-lg overflow-y-auto rounded-2xl p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))]"
                  : "flex max-h-[80vh] max-w-5xl flex-col overflow-hidden rounded-2xl md:flex-row"
              }`}
            >
              {/* CLOSE */}

              <button
                type="button"
                onClick={closeBooking}
                className="absolute right-4 top-4 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow backdrop-blur transition hover:bg-white"
                aria-label="Close booking"
              >
                ✕
              </button>

              {/* HOTEL IMAGE */}

              {!isSpa ? (
                <div className="relative h-48 flex-none bg-gray-100 md:h-auto md:w-1/2">
                  {activeBookingItem.image ? (
                    <Image
                      src={
                        activeBookingItem.image
                      }
                      alt={
                        activeBookingItem.name
                      }
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-gray-400">
                      No image
                    </div>
                  )}
                </div>
              ) : null}

              {/* FORM */}

              <div
                className={
                  isSpa
                    ? "w-full"
                    : "min-h-0 flex-1 overflow-y-auto p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] md:w-1/2 md:p-6"
                }
              >
                <div className="mb-5 pr-10">
                  <p className="text-xs font-semibold uppercase tracking-wider text-amber-600">
                    {isHotel
                      ? "Room Booking"
                      : "Spa Booking"}
                  </p>

                  <h2 className="mt-1 text-xl font-bold text-gray-950">
                    {
                      activeBookingItem.name
                    }
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    {Number(
                      activeBookingItem.price ||
                        0
                    ).toLocaleString()}{" "}
                    MMK
                    {isHotel
                      ? " / night"
                      : ""}
                  </p>
                </div>

                {/* AMENITIES */}

                {!isSpa ? (
                  <div className="mb-4 flex flex-wrap gap-2">
                    {getAmenityList(
                      activeBookingItem
                    ).map((amenity, i) => (
                      <span
                        key={`${amenity.label}-${i}`}
                        className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-600"
                      >
                        {amenity.label}
                      </span>
                    ))}
                  </div>
                ) : null}

                <div className="space-y-3">
                  {/* NAME */}

                  <label className="block text-sm font-semibold text-gray-700">
                    Your Name

                    <input
                      type="text"
                      placeholder="Enter your name"
                      className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2.5 font-normal outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                      value={
                        bookingForm.customerName
                      }
                      onChange={(e) =>
                        setBookingForm(
                          (prev) => ({
                            ...prev,
                            customerName:
                              e.target.value,
                          })
                        )
                      }
                    />
                  </label>

                  {/* PHONE */}

                  <label className="block text-sm font-semibold text-gray-700">
                    Phone Number

                    <input
                      type="tel"
                      placeholder="Enter phone number"
                      className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2.5 font-normal outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                      value={
                        bookingForm.customerPhone
                      }
                      onChange={(e) =>
                        setBookingForm(
                          (prev) => ({
                            ...prev,
                            customerPhone:
                              e.target.value,
                          })
                        )
                      }
                    />
                  </label>

                  {/* SPA TIME */}

                  {isSpa ? (
                    <label className="block text-sm font-semibold text-gray-700">
                      Order တင်လိုသည့်အချိန်

                      <input
                        type="time"
                        className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2.5 font-normal outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                        value={
                          bookingForm.orderTime
                        }
                        onChange={(e) =>
                          setBookingForm(
                            (prev) => ({
                              ...prev,
                              orderTime:
                                e.target
                                  .value,
                            })
                          )
                        }
                      />
                    </label>
                  ) : null}

                  {/* HOTEL GUESTS */}

                  {isHotel ? (
                    <div className="grid grid-cols-2 gap-3">
                      <label className="block text-xs font-semibold text-gray-600">
                        Guests

                        <input
                          type="number"
                          min="1"
                          className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2.5 font-normal outline-none focus:border-amber-400"
                          value={
                            bookingForm.guestCount
                          }
                          onChange={(e) =>
                            setBookingForm(
                              (prev) => ({
                                ...prev,
                                guestCount:
                                  e.target
                                    .value,
                              })
                            )
                          }
                        />
                      </label>

                      <label className="block text-xs font-semibold text-gray-600">
                        Extra Beds

                        <input
                          type="number"
                          min="0"
                          className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2.5 font-normal outline-none focus:border-amber-400"
                          value={
                            bookingForm.extraBedAmount
                          }
                          onChange={(e) =>
                            setBookingForm(
                              (prev) => ({
                                ...prev,
                                extraBedAmount:
                                  e.target
                                    .value,
                              })
                            )
                          }
                        />
                      </label>
                    </div>
                  ) : null}

                  {/* NOTE */}

                  <label className="block text-sm font-semibold text-gray-700">
                    Note

                    <textarea
                      rows={3}
                      placeholder="Optional note"
                      className="mt-1.5 w-full resize-none rounded-lg border border-gray-200 px-3 py-2.5 font-normal outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                      value={bookingForm.note}
                      onChange={(e) =>
                        setBookingForm(
                          (prev) => ({
                            ...prev,
                            note: e.target.value,
                          })
                        )
                      }
                    />
                  </label>

                  {/* PAYMENT INFORMATION */}

                  <div className="rounded-xl border border-amber-100 bg-amber-50/70 p-3 text-sm leading-6 text-gray-700">
                    {isSpa
                      ? SPA_BOOKING_TEXT
                      : HOTEL_BOOKING_TEXT}
                  </div>

                  <PaymentQrSelector
                    value={
                      bookingForm.paymentProvider
                    }
                    onChange={(
                      paymentProvider
                    ) =>
                      setBookingForm(
                        (prev) => ({
                          ...prev,
                          paymentProvider,
                        })
                      )
                    }
                  />

                  {/* RECEIPT */}

                  <label className="block text-sm font-semibold text-gray-700">
                    Upload the receipt

                    <input
                      type="file"
                      accept="image/*"
                      onChange={
                        handleReceiptUpload
                      }
                      disabled={
                        receiptUploading
                      }
                      className="mt-1.5 w-full rounded-lg border border-dashed border-amber-300 bg-amber-50/50 px-3 py-2 file:mr-3 file:rounded-md file:border-0 file:bg-amber-500 file:px-3 file:py-1.5 file:text-sm file:text-white"
                    />
                  </label>

                  {receiptUploading ? (
                    <p className="text-xs font-medium text-blue-600">
                      Uploading the
                      receipt...
                    </p>
                  ) : null}

                  {bookingForm.receiptImage ? (
                    <p className="text-xs font-medium text-green-700">
                      Receipt uploaded
                      successfully ✅
                    </p>
                  ) : null}

                  {/* SUBMIT */}

                  <button
                    type="button"
                    onClick={
                      isSpa
                        ? submitSpaBooking
                        : submitHotelBooking
                    }
                    disabled={
                      bookingSubmitting ||
                      receiptUploading
                    }
                    className="w-full rounded-lg bg-amber-500 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {bookingSubmitting
                      ? "Submitting..."
                      : receiptUploading
                        ? "Uploading receipt..."
                        : "Submit Order"}
                  </button>

                  {bookingMessage ? (
                    <p className="text-sm text-blue-600">
                      {bookingMessage}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* =========================
          SHOPPING PRODUCT DETAILS
      ========================== */}

      {selectedProduct ? (
        <ProductDetailsModal
          product={selectedProduct}
          onClose={() =>
            setSelectedProduct(null)
          }
        />
      ) : null}
    </>
  );
}