"use client";

import { useEffect, useMemo, useState } from "react";

const FROM_OPTIONS = ["Myitkyina", "Shwe Ku"];
const TO_OPTIONS = ["Panwa", "Putao", "Laiza", "Mandalay"];

const normalizeRoute = (value = "") => value.trim().toLowerCase();

const minutesFromTime = (value = "") => {
  const [hours, minutes] = value.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return Number.MAX_SAFE_INTEGER;
  return hours * 60 + minutes;
};

export default function CreatedTicketsSection() {
  const [tickets, setTickets] = useState([]);
  const [isFetchingTickets, setIsFetchingTickets] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [error, setError] = useState("");
  const [results, setResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);

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

  const routeHighlights = useMemo(() => {
    const routeMap = new Map();

    tickets.forEach((ticket) => {
      const ticketRoute = ticket?.route || `${ticket?.extra?.fromCity || ticket?.extra?.from || "-"}-${ticket?.extra?.toCity || ticket?.extra?.to || "-"}`;
      routeMap.set(ticketRoute, (routeMap.get(ticketRoute) || 0) + 1);
    });

    return [...routeMap.entries()].map(([routeName, count]) => ({ routeName, count }));
  }, [tickets]);

  const handleSearch = () => {
    setError("");
    setHasSearched(true);

    if (!from || !to) {
      setResults([]);
      setError("Please select both From and To.");
      return;
    }

    if (from === to) {
      setResults([]);
      setError("From and To cannot be the same.");
      return;
    }

    setIsSearching(true);

    const route = `${from}-${to}`;
    const normalizedRoute = normalizeRoute(route);

    const matched = tickets
      .filter((ticket) => {
        if (ticket?.type !== "transport") return false;
        const ticketRoute = normalizeRoute(ticket?.route || "");
        return ticketRoute === normalizedRoute;
      })
      .sort((a, b) => minutesFromTime(a?.extra?.departureTime || "") - minutesFromTime(b?.extra?.departureTime || ""));

    setTimeout(() => {
      setResults(matched);
      setIsSearching(false);
    }, 250);
  };

  return (
    <section className="px-4 md:px-10 pb-12">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center text-2xl font-bold mb-6">Find Transportation Tickets</h2>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">Available Routes</h3>
            <p className="mt-1 text-sm text-gray-600">Browse route combinations from existing transportation tickets.</p>

            {isFetchingTickets ? (
              <p className="mt-4 text-sm text-gray-500">Loading routes...</p>
            ) : routeHighlights.length === 0 ? (
              <p className="mt-4 text-sm text-gray-500">No transportation routes available yet.</p>
            ) : (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {routeHighlights.map((route) => (
                  <div key={route.routeName} className="rounded-lg bg-gray-50 p-3">
                    <p className="text-sm font-semibold text-gray-800">{route.routeName}</p>
                    <p className="text-xs text-gray-500">{route.count} ticket(s)</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">Search by Route</h3>
            <div className="mt-4 space-y-4">
              <div>
                <label htmlFor="from" className="mb-1 block text-sm font-medium text-gray-700">From</label>
                <select
                  id="from"
                  value={from}
                  onChange={(event) => setFrom(event.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-green-600"
                >
                  <option value="">Select departure</option>
                  {FROM_OPTIONS.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="to" className="mb-1 block text-sm font-medium text-gray-700">To</label>
                <select
                  id="to"
                  value={to}
                  onChange={(event) => setTo(event.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-green-600"
                >
                  <option value="">Select destination</option>
                  {TO_OPTIONS.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>

              {error ? <p className="text-sm text-red-600">{error}</p> : null}

              <button
                type="button"
                onClick={handleSearch}
                className="w-full rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800"
                disabled={isFetchingTickets || isSearching}
              >
                {isSearching ? "Searching..." : "Search"}
              </button>
            </div>
          </div>
        </div>

        {hasSearched && (
          <div className="mt-8">
            <h3 className="mb-4 text-xl font-semibold text-gray-900">Matched Tickets</h3>
            {isSearching ? (
              <p className="text-sm text-gray-500">Searching route tickets...</p>
            ) : results.length === 0 ? (
              <p className="rounded-lg bg-gray-100 px-4 py-3 text-sm text-gray-600">No tickets available for selected route</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {results.map((ticket) => (
                  <article
                    key={ticket._id}
                    className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
                  >
                    <p className="text-base font-semibold text-gray-900">{ticket.route}</p>
                    <p className="mt-1 text-sm text-gray-600">Departure time: {ticket?.extra?.departureTime || "Time TBA"}</p>
                    <p className="mt-1 text-sm text-gray-600">Vehicle: {ticket?.extra?.vehicleType || "Not specified"}</p>
                    <p className="mt-1 text-sm text-gray-600">Price: {ticket?.price ? `${Number(ticket.price).toLocaleString()} MMK` : "Not available"}</p>
                    <p className="mt-1 text-sm text-gray-600">Phone: {ticket?.phone || "Not available"}</p>

                    {ticket?.phone ? (
                      <a
                        href={`tel:${ticket.phone}`}
                        className="mt-3 inline-flex w-full items-center justify-center rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800"
                      >
                        📞 Call Now
                      </a>
                    ) : null}
                  </article>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
