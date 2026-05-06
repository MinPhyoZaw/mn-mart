"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

export default function CreatedTicketsSection() {
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);

  useEffect(() => {
    let mounted = true;

    const loadTickets = async () => {
      try {
        setIsLoading(true);
        const res = await fetch("/api/items?shopCategory=transportation", { cache: "no-store" });
        const data = await res.json();

        if (!mounted) return;

        const transportTickets = (data?.data || []).filter((item) => item?.type === "transport");
        setTickets(transportTickets);
      } catch (error) {
        console.error("Failed to fetch transportation tickets:", error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadTickets();

    return () => {
      mounted = false;
    };
  }, []);

  const availableTickets = useMemo(() => {
    return tickets.map((ticket) => ({
      id: ticket?._id,
      routeName: `${ticket?.extra?.fromCity || ticket?.extra?.from || "-"} - ${ticket?.extra?.toCity || ticket?.extra?.to || "-"}`,
      from: ticket?.extra?.fromCity || ticket?.extra?.from || "-",
      to: ticket?.extra?.toCity || ticket?.extra?.to || "-",
      departureDate: ticket?.extra?.departureDate,
      departureTime: ticket?.extra?.departureTime,
      availableSeats: ticket?.extra?.availableSeats,
      price: Number(ticket?.price || 0),
      image: ticket?.image || "/images/promo-2.png",
      shopId: ticket?.shop?._id || ticket?.shopId,
    }));
  }, [tickets]);

  return (
    <section className="px-4 md:px-10 pb-12">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-center text-2xl font-bold mb-6">Available Tickets</h2>

        {isLoading ? (
          <p className="text-center text-gray-500">Loading available tickets...</p>
        ) : availableTickets.length === 0 ? (
          <p className="text-center text-gray-500">No tickets available right now.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {availableTickets.map((ticket) => (
              <article
                key={ticket.id}
                className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <img
                  src={ticket.image}
                  alt={ticket.routeName}
                  className="h-32 w-full rounded-lg object-cover"
                />
                <p className="mt-3 text-lg font-semibold text-gray-900">{ticket.routeName}</p>
                <p className="mt-1 text-sm text-gray-600">
                  {ticket.departureDate || "Date TBA"} {ticket.departureTime ? `• ${ticket.departureTime}` : ""}
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  Seats: {ticket.availableSeats ?? "N/A"}
                </p>
                <p className="mt-2 text-base font-semibold text-green-700">
                  {ticket.price.toLocaleString()} MMK
                </p>
                <button
                  type="button"
                  onClick={() => setSelectedTicket(ticket)}
                  className="mt-2 text-sm text-green-700 font-medium"
                >
                  View details →
                </button>
              </article>
            ))}
          </div>
        )}
      </div>

      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-xl font-bold text-gray-900">{selectedTicket.routeName}</h3>
              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                className="rounded-md border border-gray-300 px-2 py-0.5 text-sm font-semibold text-gray-700 hover:bg-gray-100"
              >
                ✕
              </button>
            </div>
            <img
              src={selectedTicket.image}
              alt={selectedTicket.routeName}
              className="mt-3 h-40 w-full rounded-lg object-cover"
            />
            <div className="mt-4 space-y-2 text-sm text-gray-700">
              <p><span className="font-semibold">Route:</span> {selectedTicket.from} - {selectedTicket.to}</p>
              <p><span className="font-semibold">Departure Date:</span> {selectedTicket.departureDate || "Date TBA"}</p>
              <p><span className="font-semibold">Departure Time:</span> {selectedTicket.departureTime || "Time TBA"}</p>
              <p><span className="font-semibold">Available Seats:</span> {selectedTicket.availableSeats ?? "N/A"}</p>
              <p><span className="font-semibold">Price:</span> {selectedTicket.price.toLocaleString()} MMK</p>
            </div>
            <Link
              href={`/checkout?transport=${selectedTicket.shopId}&ticket=${selectedTicket.id}`}
              className="mt-5 inline-flex w-full items-center justify-center rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800"
            >
              Book Now
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
