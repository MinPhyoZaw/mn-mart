"use client";

import { useEffect, useMemo, useState } from "react";

export default function CreatedTicketsSection() {
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadTickets = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(
          "/api/items?shopCategory=transportation",
          { cache: "no-store" }
        );
        const data = await res.json();

        if (!mounted) return;

        const transportTickets = (data?.data || []).filter(
          (item) => item?.type === "transport"
        );

        setTickets(transportTickets);
      } catch (error) {
        console.error("Failed to fetch tickets:", error);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    loadTickets();
    return () => (mounted = false);
  }, []);

  const availableTickets = useMemo(() => {
    return tickets.map((ticket) => ({
      id: ticket?._id,
      name: ticket?.name || "Transportation Ticket",
      from: ticket?.extra?.fromCity || ticket?.extra?.from || "-",
      to: ticket?.extra?.toCity || ticket?.extra?.to || "-",
      departureDate: ticket?.extra?.departureDate,
      departureTime: ticket?.extra?.departureTime,
      availableSeats: ticket?.extra?.availableSeats,
      price: Number(ticket?.price || 0),
      image: ticket?.image || "/images/promo-2.png",
      fromTerminal: ticket?.extra?.fromTerminal,
      toTerminal: ticket?.extra?.toTerminal,
      shopId: ticket?.shop?._id || ticket?.shopId,
    }));
  }, [tickets]);

  return (
    <section className="px-4 md:px-10 pb-12">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center text-2xl font-bold mb-6">
          Available Tickets
        </h2>

        {isLoading ? (
          <p className="text-center text-gray-500">Loading...</p>
        ) : availableTickets.length === 0 ? (
          <p className="text-center text-gray-500">
            No tickets available right now.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {availableTickets.map((ticket) => (
              <div
                key={ticket.id}
                className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
              >
                {/* IMAGE */}
                <img
                  src={ticket.image}
                  alt={ticket.name}
                  className="h-32 w-full rounded-lg object-cover"
                />

                {/* TITLE */}
                <p className="mt-3 text-lg font-semibold text-gray-900">
                  {ticket.name}
                </p>

                {/* ROUTE */}
                <p className="text-sm text-gray-600">
                  {ticket.from} → {ticket.to}
                </p>

                {/* PRICE */}
                <p className="mt-1 text-base font-bold text-green-700">
                  {ticket.price.toLocaleString()} MMK
                </p>

                {/* FULL DETAILS ALWAYS VISIBLE */}
                <div className="mt-3 space-y-1 border-t pt-3 text-sm text-gray-600">

                  <p>
                    📅 ကားထွက်မည့်ရက်:{" "}
                    <span className="text-gray-800 font-medium">
                      {ticket.departureDate || "TBA"}
                    </span>
                  </p>

                  <p>
                    🕒 ကားထွက်မည့်အချိန်:{" "}
                    <span className="text-gray-800 font-medium">
                      {ticket.departureTime || "TBA"}
                    </span>
                  </p>

                  <p>
                    🟢 ဂိတ်စ:{" "}
                    <span className="text-gray-800 font-medium">
                      {ticket.fromTerminal || "-"}
                    </span>
                  </p>

                  <p>
                    🔴 ဂိတ်ဆုံး:{" "}
                    <span className="text-gray-800 font-medium">
                      {ticket.toTerminal || "-"}
                    </span>
                  </p>

                  <p>
                    🎟 Seats:{" "}
                    <span className="text-gray-800 font-medium">
                      {ticket.availableSeats ?? "N/A"}
                    </span>
                  </p>
                </div>

                {/* ACTION BUTTONS */}
                <div className="mt-4 flex gap-2">
                  <a
                    href="tel:+959000000000"
                    className="flex-1 rounded-lg bg-green-700 px-3 py-2 text-center text-sm font-semibold text-white"
                  >
                    Call
                  </a>

                  <button className="flex-1 rounded-lg border border-green-700 px-3 py-2 text-sm font-semibold text-green-700">
                    Book
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}