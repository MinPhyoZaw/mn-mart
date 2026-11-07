"use client";

import { useState } from "react";
import { hotelToday } from "../../lib/hotelDates";

export default function RoomCalendar({ room, onUpdated }) {
  const [open, setOpen] = useState(false);
  const [calendar, setCalendar] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [details, setDetails] = useState({
    roomNumber: room.roomNumber || room.name,
    roomType: room.roomType || "",
    maxGuests: room.maxGuests || 2,
    price: room.price,
  });
  const [stay, setStay] = useState({
    checkIn: "",
    checkOut: "",
    kind: "external",
    reason: "",
    orderId: "",
  });
  const endpoint = `/api/vendor/rooms/${room._id}/calendar`;

  async function load(page = 1) {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(`${endpoint}?page=${page}`, { cache: "no-store" });
      const result = await response.json();
      if (!response.ok || !result.success)
        throw new Error(result.message || "Unable to load calendar.");
      setCalendar(result.data);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function mutate(method, body, url = endpoint) {
    if (busy) return;
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || "Unable to save.");
      if (method === "PUT") {
        onUpdated();
      } else {
        setStay((previous) => ({ ...previous, orderId: "", reason: "" }));
        await load();
      }
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  const undated =
    calendar?.bookings.filter(
      (order) => !order.bookingDetails?.checkIn || !order.bookingDetails?.checkOut,
    ) || [];
  return (
    <div className="mt-3 border-t pt-3">
      <button
        type="button"
        className="text-sm font-semibold text-green-800"
        onClick={() => {
          setOpen(!open);
          if (!open) void load();
        }}
      >
        Room details & dates {open ? "−" : "+"}
      </button>
      {open && (
        <div className="mt-3 space-y-3 text-sm">
          <form
            className="space-y-2"
            onSubmit={(event) => {
              event.preventDefault();
              void mutate(
                "PUT",
                {
                  ...details,
                  name: details.roomNumber,
                  maxGuests: Number(details.maxGuests),
                  price: Number(details.price),
                },
                `/api/items/${room._id}`,
              );
            }}
          >
            <p>One listing represents one physical room.</p>
            {[
              ["roomNumber", "Room number/name", "text"],
              ["roomType", "Room type", "text"],
              ["maxGuests", "Maximum guests", "number"],
              ["price", "Price per night (MMK)", "number"],
            ].map(([key, label, type]) => (
              <label key={key} className="block">
                {label}
                <input
                  required
                  disabled={busy}
                  type={type}
                  min={key === "maxGuests" ? 1 : 0}
                  max={key === "maxGuests" ? 30 : undefined}
                  maxLength={key === "roomNumber" ? 40 : 80}
                  value={details[key]}
                  onChange={(event) => setDetails({ ...details, [key]: event.target.value })}
                  className="mt-1 w-full rounded border p-2"
                />
              </label>
            ))}
            <button disabled={busy} className="rounded border px-3 py-2">
              Save room details
            </button>
          </form>
          <p className="font-semibold">Upcoming reservations and blocks</p>
          {calendar?.bookings.map((order) => (
            <p key={order._id}>
              {order.orderId} · {order.bookingDetails?.checkIn || "Dates need review"} →{" "}
              {order.bookingDetails?.checkOut || "?"} · {order.vendorStatus}
            </p>
          ))}
          {calendar?.blocks.map((block) => (
            <div key={block._id} className="rounded bg-gray-50 p-2">
              <p>
                {block.checkIn} → {block.checkOut} ·{" "}
                {block.kind === "external" ? "Phone / walk-in booking" : "Maintenance"}
              </p>
              <p>{block.reason}</p>
              <button
                type="button"
                disabled={busy}
                onClick={() => mutate("DELETE", { blockId: block._id })}
                className="text-red-700"
              >
                Remove block
              </button>
            </div>
          ))}
          {calendar && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={busy || calendar.page === 1}
                onClick={() => load(calendar.page - 1)}
              >
                Previous dates
              </button>
              <span>Page {calendar.page}</span>
              <button
                type="button"
                disabled={busy || !calendar.hasMore}
                onClick={() => load(calendar.page + 1)}
              >
                More dates
              </button>
            </div>
          )}
          {undated.length > 0 && (
            <p className="text-amber-800">
              Older bookings need dates before this room can accept new reservations. Assign each
              booking’s actual dates below. Original prices are retained.
            </p>
          )}
          <form
            className="space-y-2"
            onSubmit={(event) => {
              event.preventDefault();
              void mutate(stay.orderId ? "PATCH" : "POST", stay);
            }}
          >
            <label className="block">
              Calendar action
              <select
                disabled={busy}
                className="mt-1 w-full rounded border p-2"
                value={stay.orderId || stay.kind}
                onChange={(event) => {
                  const value = event.target.value;
                  setStay({
                    ...stay,
                    orderId: ["external", "maintenance"].includes(value) ? "" : value,
                    kind: value === "maintenance" ? value : "external",
                  });
                }}
              >
                <option value="external">Record phone / walk-in booking</option>
                <option value="maintenance">Block for maintenance</option>
                {undated.map((order) => (
                  <option key={order._id} value={order._id}>
                    Assign dates · {order.orderId}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              Check-in / start
              <input
                type="date"
                required
                disabled={busy}
                min={stay.orderId ? undefined : hotelToday()}
                value={stay.checkIn}
                onChange={(event) => setStay({ ...stay, checkIn: event.target.value })}
                className="mt-1 w-full rounded border p-2"
              />
            </label>
            <label className="block">
              Check-out / end
              <input
                type="date"
                required
                disabled={busy}
                min={stay.checkIn}
                value={stay.checkOut}
                onChange={(event) => setStay({ ...stay, checkOut: event.target.value })}
                className="mt-1 w-full rounded border p-2"
              />
            </label>
            {!stay.orderId && (
              <label className="block">
                Note
                <input
                  disabled={busy}
                  maxLength={200}
                  value={stay.reason}
                  onChange={(event) => setStay({ ...stay, reason: event.target.value })}
                  className="mt-1 w-full rounded border p-2"
                />
              </label>
            )}
            <button
              disabled={busy || !calendar}
              className="rounded bg-green-700 px-3 py-2 text-white"
            >
              {busy ? "Saving…" : "Save dates"}
            </button>
          </form>
          {message && (
            <p role="alert" className="text-red-700">
              {message}
            </p>
          )}
          <button type="button" disabled={busy} onClick={() => load()}>
            Refresh calendar
          </button>
        </div>
      )}
    </div>
  );
}
