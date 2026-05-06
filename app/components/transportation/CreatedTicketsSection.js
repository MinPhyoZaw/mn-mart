"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CalendarDays, Clock3, MapPin, Phone, Users } from "lucide-react";

const formatPrice = (value) => {
  if (value === undefined || value === null || value === "") return "Not available";
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return "Not available";
  return `${parsed.toLocaleString()} MMK`;
};

const normalizePhone = (value) => (value ? String(value).replace(/\s+/g, "") : "");

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

  const allTickets = useMemo(() => tickets, [tickets]);

  return (
    <section className="px-4 md:px-10 pb-12">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Available Car Tickets</h2>
            <p className="text-sm text-gray-600">Choose your preferred trip</p>
          </div>
        </div>

        {isFetchingTickets ? (
          <p className="text-sm text-gray-500">Loading tickets...</p>
        ) : allTickets.length === 0 ? (
          <p className="rounded-lg bg-gray-100 px-4 py-3 text-sm text-gray-600">No available tickets right now.</p>
        ) : (
          <div className="space-y-4">
            {allTickets.map((ticket) => {
              const fromCity = ticket?.extra?.fromCity || ticket?.extra?.from || "-";
              const toCity = ticket?.extra?.toCity || ticket?.extra?.to || "-";
              const routeName = ticket?.route || `${fromCity} - ${toCity}`;
              const vehicleType = ticket?.extra?.vehicleType || "Not specified";
              const departureDate = ticket?.extra?.departureDate || "TBA";
              const departureTime = ticket?.extra?.departureTime || "TBA";
              const seats = ticket?.extra?.availableSeats ?? "N/A";
              const phone = normalizePhone(ticket?.extra?.driverPhone || ticket?.phone);

              return (
                <article
                  key={ticket._id}
                  className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:p-6"
                >
                  <div className="grid gap-4 md:grid-cols-[1.2fr_1.5fr_auto] md:gap-6">
                    <div className="space-y-3 md:border-r md:border-dashed md:pr-6">
                      <span className="inline-flex rounded-lg bg-green-50 px-3 py-1 text-sm font-semibold text-[#318616]">
                        {routeName}
                      </span>
                      <p className="text-lg font-semibold text-gray-900">{vehicleType}</p>
                      <p className="inline-flex items-center gap-2 text-sm text-gray-700">
                        <Users size={16} className="text-[#318616]" />
                        {seats} Seats Available
                      </p>
                    </div>

                    <div className="space-y-3 md:border-r md:border-dashed md:pr-6">
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase text-gray-500">From</p>
                          <p className="text-2xl font-bold text-gray-900">{fromCity}</p>
                        </div>
                        <ArrowRight className="text-[#318616]" />
                        <div>
                          <p className="text-xs font-semibold uppercase text-gray-500">To</p>
                          <p className="text-2xl font-bold text-gray-900">{toCity}</p>
                        </div>
                      </div>

                      <div className="grid gap-2 text-sm text-gray-700 sm:grid-cols-2">
                        <p className="inline-flex items-center gap-2">
                          <Clock3 size={16} className="text-[#318616]" />
                          {departureTime}
                        </p>
                        <p className="inline-flex items-center gap-2">
                          <CalendarDays size={16} className="text-[#318616]" />
                          {departureDate}
                        </p>
                      </div>

                      <p className="inline-flex items-center gap-2 text-sm text-gray-700">
                        <MapPin size={16} className="text-[#318616]" />
                        Route: {fromCity} → {toCity}
                      </p>
                    </div>

                    <div className="flex min-w-[220px] flex-col justify-between gap-3">
                      <div>
                        <p className="text-sm text-gray-600">Price</p>
                        <p className="text-4xl font-bold text-[#318616]">{formatPrice(ticket?.price)}</p>
                      </div>

                      <Link
                        href={`/transportation/${ticket?.shop?._id}`}
                        className="inline-flex w-full items-center justify-center rounded-xl border border-[#0c8c3a] px-4 py-2 text-sm font-semibold text-[#0c8c3a] transition hover:bg-green-50"
                      >
                        View Ticket Details
                      </Link>

                      {phone ? (
                        <a
                          href={`tel:${phone}`}
                          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0c8c3a] px-4 py-3 text-lg font-semibold text-white transition hover:bg-[#0a7c32]"
                        >
                          <Phone size={18} />
                          Call to Book
                        </a>
                      ) : (
                        <button
                          type="button"
                          disabled
                          className="w-full cursor-not-allowed rounded-xl bg-gray-200 px-4 py-3 text-lg font-semibold text-gray-500"
                        >
                          Phone not available
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
