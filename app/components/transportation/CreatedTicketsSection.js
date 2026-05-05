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

  const grouped = useMemo(() => {
    const map = new Map();

    tickets.forEach((ticket) => {
      const shopId = ticket?.shop?._id || ticket?.shopId;
      if (!shopId) return;

      if (!map.has(shopId)) {
        map.set(shopId, {
          shopId,
          shopName: ticket?.shop?.name || "Transportation",
          count: 0,
          latestTicket: ticket,
        });
      }

      const entry = map.get(shopId);
      entry.count += 1;
    });

    return Array.from(map.values());
  }, [tickets]);

  return (
    <section className="px-4 md:px-10 pb-12">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-center text-2xl font-bold mb-6">Created Tickets</h2>

        {isLoading ? (
          <p className="text-center text-gray-500">Loading created tickets...</p>
        ) : grouped.length === 0 ? (
          <p className="text-center text-gray-500">No tickets created yet.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {grouped.map((shop) => (
              <Link
                key={shop.shopId}
                href={`/transportation/${shop.shopId}`}
                className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <p className="text-lg font-semibold text-gray-900">{shop.shopName}</p>
                <p className="mt-2 text-sm text-gray-600">{shop.count} ticket(s) created</p>
                <p className="mt-3 text-sm text-green-700 font-medium">View tickets →</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}