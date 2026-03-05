import connectDB from "../lib/mongodb";
import Shop from "../models/Shop";
import Vendor from "../models/Vendor";
import Product from "../models/Product";
import VendorRequest from "../models/VendorRequest";
import AdminVendorRequests from "../components/AdminVendorRequests";
import { ShoppingCartIcon, UserGroupIcon, CubeIcon, BellIcon } from "@heroicons/react/24/outline";

export default async function AdminDashboardPage() {
  await connectDB();

  const [shops, vendors, products, vendorRequestsRaw] = await Promise.all([
    Shop.find({}).lean(),
    Vendor.find({}).lean(),
    Product.find({}).lean(),
    VendorRequest.find({}).lean(),
  ]);

  // serialize for client component
  const vendorRequests = vendorRequestsRaw.map((r) => ({
    ...r,
    _id: String(r._id),
    createdAt: r.createdAt ? r.createdAt.toISOString() : null,
  }));

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <header className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        {/* Notification */}
        <div className="flex items-center space-x-2 cursor-pointer">
          <BellIcon className="w-6 h-6 text-gray-700" />
          <span className="text-gray-700 font-medium">{vendorRequests.length} Vendor Requests</span>
        </div>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        {/* Shops */}
        <div className="flex items-center p-6 bg-white rounded-lg shadow hover:shadow-lg transition">
          <ShoppingCartIcon className="w-10 h-10 text-red-500 mr-4" />
          <div>
            <p className="text-gray-500 text-sm">Shops</p>
            <p className="text-2xl font-bold">{shops.length}</p>
          </div>
        </div>

        {/* Vendors */}
        <div className="flex items-center p-6 bg-white rounded-lg shadow hover:shadow-lg transition">
          <UserGroupIcon className="w-10 h-10 text-blue-500 mr-4" />
          <div>
            <p className="text-gray-500 text-sm">Vendors</p>
            <p className="text-2xl font-bold">{vendors.length}</p>
          </div>
        </div>

        {/* Products */}
        <div className="flex items-center p-6 bg-white rounded-lg shadow hover:shadow-lg transition">
          <CubeIcon className="w-10 h-10 text-green-500 mr-4" />
          <div>
            <p className="text-gray-500 text-sm">Products</p>
            <p className="text-2xl font-bold">{products.length}</p>
          </div>
        </div>

        {/* Vendor Requests */}
        <div className="flex items-center p-6 bg-white rounded-lg shadow hover:shadow-lg transition">
          <BellIcon className="w-10 h-10 text-yellow-500 mr-4" />
          <div>
            <p className="text-gray-500 text-sm">Pending Requests</p>
            <p className="text-2xl font-bold">{vendorRequests.length}</p>
          </div>
        </div>
      </div>

      {/* Optional Detailed Section */}
      <section>
        <h2 className="text-xl font-semibold mb-3">Recent Shops</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {shops.slice(0, 6).map((s) => (
            <div key={s._id} className="p-4 bg-white rounded-lg shadow hover:shadow-md transition">
              <h3 className="font-semibold">{s.name}</h3>
              <p className="text-sm text-gray-500">{s.category}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Vendor Requests List (client) */}
      <section className="mt-8">
        <h2 className="text-xl font-semibold mb-3">Vendor Requests</h2>
        {/* AdminVendorRequests is a client component to handle actions */}
        <div>
          {/* eslint-disable-next-line @next/next/no-async-client-component */}
          <AdminVendorRequests initialRequests={vendorRequests} />
        </div>
      </section>
    </div>
  );
}