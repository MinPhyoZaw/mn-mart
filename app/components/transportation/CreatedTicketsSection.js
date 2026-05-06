"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

export default function CreatedTicketsSection() {
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

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
      name: ticket?.name || "Transportation Ticket",
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
              <Link
                key={ticket.id}
                href={`/transportation/${ticket.shopId}?ticket=${ticket.id}`}
                className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <img
                  src={ticket.image}
                  alt={ticket.name}
                  className="h-32 w-full rounded-lg object-cover"
                />
                <p className="mt-3 text-lg font-semibold text-gray-900">{ticket.name}</p>
                <p className="mt-1 text-sm text-gray-600">{ticket.from} → {ticket.to}</p>
                <p className="mt-1 text-sm text-gray-600">
                  {ticket.departureDate || "Date TBA"} {ticket.departureTime ? `• ${ticket.departureTime}` : ""}
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  Seats: {ticket.availableSeats ?? "N/A"}
                </p>
                <p className="mt-2 text-base font-semibold text-green-700">
                  {ticket.price.toLocaleString()} MMK
                </p>
                <p className="mt-2 text-sm text-green-700 font-medium">View details →</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
