"use client";

import { useEffect, useMemo, useState } from "react";

const formatPrice = (value) => {
  if (value === undefined || value === null || value === "") return "Not available";
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return "Not available";
  return `${parsed.toLocaleString()} MMK`;
};

export default function CreatedTicketsSection() {
  const [tickets, setTickets] = useState([]);
  const [isFetchingTickets, setIsFetchingTickets] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadTickets = async () => {
      try {
        setIsFetchingTickets(true);
        const res = await fetch("/api/items?shopCategory=transportation", { cache: "no-store" });
        const data = await res.json();
        if (!mounted) return;
        const transportTickets = (data?.data || []).filter((item) => item?.type === "transport");
        setTickets(transportTickets);
      } catch (fetchError) {
        console.error("Failed to fetch transportation tickets:", fetchError);
      } finally {
        if (mounted) setIsFetchingTickets(false);
      }
    };

    loadTickets();

    return () => {
      mounted = false;
    };
  }, []);

  const availableTickets = useMemo(
    () => tickets.filter((ticket) => Number(ticket?.extra?.availableSeats || 0) > 0),
    [tickets]
  );

  return (
    <section className="px-4 md:px-10 pb-12">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center text-2xl font-bold mb-2">Available Tickets</h2>
        <p className="text-center text-sm text-gray-600 mb-6">All available tickets</p>

        {isFetchingTickets ? (
          <p className="text-sm text-gray-500">Loading tickets...</p>
        ) : availableTickets.length === 0 ? (
          <p className="rounded-lg bg-gray-100 px-4 py-3 text-sm text-gray-600">No available tickets right now.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {availableTickets.map((ticket) => {
              const fromCity = ticket?.extra?.fromCity || ticket?.extra?.from || "-";
              const toCity = ticket?.extra?.toCity || ticket?.extra?.to || "-";
              const routeName = ticket?.route || `${fromCity} - ${toCity}`;
              const callPhone = ticket?.extra?.driverPhone || ticket?.phone;

              return (
                <article
                  key={ticket._id}
                  className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
                >
                  <p className="text-base font-semibold text-gray-900">{routeName}</p>
                  <p className="mt-1 text-sm text-gray-600">Vehicle: {ticket?.extra?.vehicleType || "Not specified"}</p>
                  <p className="mt-1 text-sm text-gray-600">Departure Date: {ticket?.extra?.departureDate || "TBA"}</p>
                  <p className="mt-1 text-sm text-gray-600">Departure Time: {ticket?.extra?.departureTime || "TBA"}</p>
                  <p className="mt-1 text-sm text-gray-600">Available Seats: {ticket?.extra?.availableSeats ?? "N/A"}</p>
                  <p className="mt-1 text-sm text-gray-600">Price: {formatPrice(ticket?.price)}</p>
                  <p className="mt-1 text-sm text-gray-600">Vendor Phone: {callPhone || "Not available"}</p>

                  {callPhone ? (
                    <a
                      href={`tel:${callPhone}`}
                      className="mt-3 inline-flex w-full items-center justify-center rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800"
                    >
                      📞 Call to Book
                    </a>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
