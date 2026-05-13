"use client";

export default function CheckoutSummary({ vendor, shop, checkoutSummary, serviceType }) {
  const isSpa = serviceType === "spa";
  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">Vendor Dashboard</h1>
      <p className="text-gray-600 mb-6">
        {vendor?.vendorName} • {serviceType}
      </p>

      <div className="relative overflow-hidden bg-white border border-orange-100 rounded-2xl shadow-sm p-5 mb-6">
  {/* Background Decoration */}
  <div className="absolute top-0 right-0 w-32 h-32 bg-orange-100 rounded-full blur-3xl opacity-40"></div>

  {/* Header */}
  <div className="relative flex items-center justify-between mb-5">
    <div>
      <h2 className="text-xl font-bold text-gray-800">
        Today Payment Summary
      </h2>
      <p className="text-sm text-gray-500 mt-1">
        {isSpa ? "Overview of today’s shop earnings and fixed spa admin fee" : "Overview of today’s shop earnings and admin commission"}
      </p>
    </div>

    <div className="bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-xs font-semibold">
      Today
    </div>
  </div>

  {/* Stats Grid */}
  <div className="relative grid grid-cols-1 sm:grid-cols-2 gap-4">
    
    {/* Vendor Profit */}
    <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 rounded-xl p-4 hover:shadow-md transition">
      <p className="text-sm text-gray-500">Vendor Profit</p>
      <h3 className="text-2xl font-bold text-green-600 mt-2">
        {Number(checkoutSummary?.todaySalesAmount || 0).toLocaleString()}
        <span className="text-sm ml-1 font-medium">MMK</span>
      </h3>
    </div>

    {/* Admin Profit */}
    <div className="bg-gradient-to-br from-orange-50 to-yellow-50 border border-orange-100 rounded-xl p-4 hover:shadow-md transition">
      <p className="text-sm text-gray-500">{isSpa ? "Admin Fee" : "Admin Commission"}</p>
      <h3 className="text-2xl font-bold text-orange-600 mt-2">
        {Number(checkoutSummary?.todayAmountToAdmin || 0).toLocaleString()}
        <span className="text-sm ml-1 font-medium">MMK</span>
      </h3>

      <p className="text-xs text-gray-400 mt-1">
        {isSpa ? "Fixed 3000 MMK per approved spa service booking" : "1.5% service fee"}
      </p>
    </div>
  </div>

  {/* Bottom Info */}
  <div className="relative mt-5 border-t border-gray-100 pt-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
    
    <div className="flex items-center gap-2 text-sm text-gray-600">
      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
      Total Orders Today:
      <span className="font-semibold text-gray-800">
        {checkoutSummary?.todayOrderCount || 0}
      </span>
    </div>

    <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
      <span>
        Approved Orders:
        <span className="font-semibold text-gray-800 ml-1">
          {Number(shop?.approvedOrderQty || 0).toLocaleString()}
        </span>
      </span>

      <span className="text-gray-300">•</span>

      <span>
        Shop Income:
        <span className="font-semibold text-green-600 ml-1">
          {Number(shop?.approvedIncome || 0).toLocaleString()} MMK
        </span>
      </span>
    </div>
  </div>
</div>
    </div>
  );
}
