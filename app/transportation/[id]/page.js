import Link from "next/link";
import { ArrowRight, CalendarDays, CheckCircle2, MapPin, Snowflake, Sofa, Users } from "lucide-react";
import connectDB from "../../lib/mongodb";
import Item from "../../models/Item";
import Shop from "../../models/Shop";
import TransportationRoute from "../../models/TransportationRoute";

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    weekday: "long",
  });
}

function formatTime(value) {
  if (!value) return "";
  const [hour, minute] = String(value).split(":");
  const normalized = new Date();
  normalized.setHours(Number(hour || 0), Number(minute || 0), 0, 0);
  return normalized.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

async function getTransportationTickets(shopId) {
  await connectDB();

  const [shop, items] = await Promise.all([
    Shop.findById(shopId).lean(),
    Item.find({ shopId, type: "transport" }).sort({ createdAt: -1 }).lean(),
  ]);

  if (!shop) return { shop: null, tickets: [] };

  const routeIds = items
    .map((item) => item?.extra?.routeId)
    .filter(Boolean)
    .map((id) => String(id));

  const routes = routeIds.length
    ? await TransportationRoute.find({ _id: { $in: routeIds } }).lean()
    : [];

  const routeMap = new Map(routes.map((route) => [String(route._id), route]));

  const tickets = items.map((item) => {
    const route = routeMap.get(String(item?.extra?.routeId));
    const amenities = Array.isArray(item?.extra?.amenities) ? item.extra.amenities : [];

    return {
      id: String(item._id),
      company: route?.companyName || shop.name || "Transportation",
      carType: `${item?.extra?.vehicleType || "Standard"} (${item?.extra?.totalSeats || 0} Seats)`,
      from: route?.fromCity || "-",
      to: route?.toCity || "-",
      time: formatTime(item?.extra?.departureTime),
      date: formatDate(item?.extra?.departureDate),
      fromTerminal: route?.boardingPoints?.[0] || "Boarding point not provided",
      toTerminal: route?.droppingPoints?.[0] || "Dropping point not provided",
      price: Number(item.price || 0).toLocaleString(),
      seats: Number(item?.extra?.availableSeats || 0),
      image: item.image || "/images/promo-2.png",
      features: amenities,
      instantConfirm: Boolean(item?.extra?.instantConfirm),
    };
  });

  return { shop, tickets };
}

export default async function TransportationTicketPage({ params }) {
  const { id } = await params;
  const { shop, tickets } = await getTransportationTickets(id);

  if (!shop) {
    return <main className="p-8">Transportation shop not found.</main>;
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 md:px-10">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-3xl font-bold text-gray-900">Available Car Tickets</h1>
        <p className="mt-2 text-lg text-gray-600">Choose your preferred trip</p>

        <div className="mt-8 space-y-5">
          {tickets.map((ticket) => (
            <article key={ticket.id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:p-6">
              <div className="grid gap-4 md:grid-cols-[250px_1fr_280px]">
                <div className="rounded-xl bg-gray-100 p-3">
                  <img src={ticket.image} alt={ticket.company} className="h-44 w-full rounded-lg object-cover" />
                </div>

                <div className="border-gray-200 md:border-x md:px-6">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-green-100 px-4 py-1.5 text-base font-semibold text-green-700">{ticket.company}</span>
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  </div>

                  <p className="mt-3 text-2xl font-bold text-gray-900">
                    {ticket.from}
                    <ArrowRight className="mx-3 inline h-6 w-6 text-green-600" />
                    {ticket.to}
                  </p>
                  <p className="mt-2 text-lg font-medium text-gray-700">{ticket.carType}</p>

                  <div className="mt-3 space-y-2 text-gray-700">
                    <p>{ticket.time}</p>
                    <p className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-green-600" />{ticket.date}</p>
                    <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-green-600" />{ticket.fromTerminal}</p>
                    <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-green-600" />{ticket.toTerminal}</p>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {ticket.features.map((feature) => (
                      <span key={feature} className="rounded-xl bg-gray-100 px-3 py-1.5 text-sm text-gray-700">
                        {feature.toLowerCase().includes("air") ? <Snowflake className="mr-1 inline h-4 w-4 text-green-600" /> : <Sofa className="mr-1 inline h-4 w-4 text-green-600" />}
                        {feature}
                      </span>
                    ))}
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t pt-4 text-gray-800">
                    <p className="flex items-center gap-2"><Users className="h-4 w-4 text-green-600" />{ticket.seats} Seats Available</p>
                    {ticket.instantConfirm && <p className="flex items-center gap-2 text-green-700"><CheckCircle2 className="h-4 w-4" />Instant Confirm</p>}
                  </div>
                </div>

                <div className="flex flex-col justify-center gap-3">
                  <div>
                    <p className="text-lg text-gray-600">Price</p>
                    <p className="text-5xl font-bold text-green-700">{ticket.price}<span className="ml-1 text-2xl">MMK</span></p>
                  </div>
                  <Link href={`/checkout?transport=${id}&ticket=${ticket.id}`} className="inline-flex items-center justify-center rounded-xl bg-green-700 px-6 py-3 text-xl font-semibold text-white hover:bg-green-800">Book Now</Link>
                  <Link href={`/transportation/${id}?ticket=${ticket.id}`} className="inline-flex items-center justify-center rounded-xl border border-green-700 px-6 py-3 text-lg font-semibold text-green-700 hover:bg-green-50">View Details</Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
