import { Suspense } from "react";
import ShoppingItemsPage from "../components/shops/ShoppingItemsPage";

export default function ShopsPage() {
  return (
    <Suspense fallback={<ShopsPageLoading />}>
      <ShoppingItemsPage />
    </Suspense>
  );
}

function ShopsPageLoading() {
  return (
    <div className="min-h-screen bg-gray-50 p-8 text-center text-sm text-gray-500">
      Loading shopping products...
    </div>
  );
}
