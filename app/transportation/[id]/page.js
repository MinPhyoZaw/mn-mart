import Link from "next/link";
import { ArrowRight, CalendarDays, CheckCircle2, MapPin, Snowflake, Sofa, Users } from "lucide-react";

const tickets = [
  {
    id: "shwe-mandalar-express",
    company: "Shwe Mandalar Express",
    carType: "VIP (24 Seats)",
    from: "Myitkyina",
    to: "Mandalay",
    time: "08:00 AM",
    date: "25 May 2026, Monday",
    fromTerminal: "Myitkyina Bus Terminal",
    toTerminal: "Mandalay Bus Terminal",
    price: "25,000",
    seats: 24,
    image: "/images/mdy.png",
    features: ["Air Conditioned", "Comfort Seats"],
  },
  {
    id: "kachin-star-travels",
    company: "Kachin Star Travels",
    carType: "Standard (20 Seats)",
    from: "Myitkyina",
    to: "Mandalay",
    time: "10:30 AM",
    date: "25 May 2026, Monday",
    fromTerminal: "Myitkyina Bus Terminal",
    toTerminal: "Mandalay Bus Terminal",
    price: "20,000",
    seats: 8,
    image: "/images/pk.jpg",
    features: ["Air Conditioned", "USB Charging"],
  },
];

export default function TransportationTicketPage({ params }) {
  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 md:px-10">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-3xl font-bold text-gray-900">Available Car Tickets</h1>
        <p className="mt-2 text-lg text-gray-600">Choose your preferred trip</p>

        <div className="mt-8 space-y-5">
          {tickets.map((ticket) => (
            <article
              key={ticket.id}
              className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:p-6"
            >
              <div className="grid gap-4 md:grid-cols-[250px_1fr_280px]">
                <div className="rounded-xl bg-gray-100 p-3">
                  <img src={ticket.image} alt={ticket.company} className="h-44 w-full rounded-lg object-cover" />
                </div>

                <div className="border-gray-200 md:border-x md:px-6">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-green-100 px-4 py-1.5 text-base font-semibold text-green-700">
                      {ticket.company}
                    </span>
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
                        {feature === "Air Conditioned" ? <Snowflake className="mr-1 inline h-4 w-4 text-green-600" /> : <Sofa className="mr-1 inline h-4 w-4 text-green-600" />}
                        {feature}
                      </span>
                    ))}
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t pt-4 text-gray-800">
                    <p className="flex items-center gap-2"><Users className="h-4 w-4 text-green-600" />{ticket.seats} Seats Available</p>
                    <p className="flex items-center gap-2 text-green-700"><CheckCircle2 className="h-4 w-4" />Instant Confirm</p>
                  </div>
                </div>

                <div className="flex flex-col justify-center gap-3">
                  <div>
                    <p className="text-lg text-gray-600">Price</p>
                    <p className="text-5xl font-bold text-green-700">{ticket.price}<span className="ml-1 text-2xl">MMK</span></p>
                  </div>
                  <Link
                    href={`/checkout?transport=${params.id}&ticket=${ticket.id}`}
                    className="inline-flex items-center justify-center rounded-xl bg-green-700 px-6 py-3 text-xl font-semibold text-white hover:bg-green-800"
                  >
                    Book Now
                  </Link>
                  <Link
                    href={`/transportation/${params.id}?ticket=${ticket.id}`}
                    className="inline-flex items-center justify-center rounded-xl border border-green-700 px-6 py-3 text-lg font-semibold text-green-700 hover:bg-green-50"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
