import Link from "next/link";
import ShopsHero from "../components/shops/ShopsHero";
import connectDB from "../lib/mongodb";
import SpaService from "../models/SpaService";

async function getSpaServices() {
  await connectDB();
  const services = await SpaService.find({ isActive: true })
    .sort({ createdAt: -1 })
    .lean();

  return services.map((service) => ({
    _id: String(service._id),
    serviceName: service.serviceName,
    description: service.description,
    durationMinutes: service.durationMinutes,
    priceMMK: service.priceMMK,
  }));
}

export default async function SpaPage() {
  const services = await getSpaServices();

  return (
    <div className="min-h-screen bg-gray-50">
      <ShopsHero title="Spa" heroImage="/images/nail-spa.jpg" />

      <div className="max-w-7xl mx-auto px-4 py-10">
        {services.length === 0 ? (
          <p className="text-center text-gray-500">No spa services available</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <article key={service._id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900">{service.serviceName}</h3>
                <p className="mt-2 text-sm text-gray-600 line-clamp-3">{service.description || "-"}</p>
                <div className="mt-4 text-sm text-gray-700 space-y-1">
                  <p><strong>Duration:</strong> {service.durationMinutes} minutes</p>
                  <p><strong>Price:</strong> {Number(service.priceMMK || 0).toLocaleString()} MMK</p>
                </div>

                <Link
                  href={`/spa/${service._id}`}
                  className="mt-5 inline-block bg-[#318616] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#2a7313] transition"
                >
                  Book Now
                </Link>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
