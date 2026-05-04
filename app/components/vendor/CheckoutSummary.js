"use client";

export default function CheckoutSummary({ vendor, shop, checkoutSummary, serviceType }) {
  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">Vendor Dashboard</h1>
      <p className="text-gray-600 mb-6">
        {vendor?.vendorName} • {serviceType}
      </p>

      <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-yellow-200 rounded-xl p-5 mb-6">
        <h2 className="text-lg font-semibold text-yellow-800">Today Payment Notice</h2>
        <p className="text-sm text-gray-700 mt-2">
          Vendor profit (both-side approved) today: <span className="font-semibold">{Number(checkoutSummary?.todaySalesAmount || 0).toLocaleString()} MMK</span>
        </p>
        <p className="text-sm text-gray-700 mt-1">
          Admin profit (1.5%): <span className="font-semibold">{Number(checkoutSummary?.todayAmountToAdmin || 0).toLocaleString()} MMK</span>
        </p>
        <p className="text-xs text-gray-500 mt-1">Total orders today: {checkoutSummary?.todayOrderCount || 0}</p>
        <p className="text-xs text-gray-500 mt-1">
          Shop approved order qty: {Number(shop?.approvedOrderQty || 0).toLocaleString()} • Shop income: {Number(shop?.approvedIncome || 0).toLocaleString()} MMK
        </p>
      </div>
    </div>
  );
}
