import { Suspense } from "react";
import ShoppingCategoryContent from "./ShoppingCategoryContent";

function ShoppingPageLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto w-[92%] max-w-7xl py-8 md:w-[90%] md:py-10">
        <div className="rounded-xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
          Loading products...
        </div>
      </div>
    </div>
  );
}

export default function ShoppingPage() {
  return (
    <Suspense fallback={<ShoppingPageLoading />}>
      <ShoppingCategoryContent />
    </Suspense>
  );
}