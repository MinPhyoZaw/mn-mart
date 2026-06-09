import ShopCard from "./ShopCard";

export default function ShopsGrid({ shops, isTransportation, ctaLabel, category }) {
  const isSpa = category === "spa";

  const gridClasses = isTransportation
    ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-5"
    : isSpa
    ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
    : "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6";

  return (
    <div className={gridClasses}>
      {shops.map((shop) => (
        <ShopCard key={shop._id} shop={shop} isTransportation={isTransportation} ctaLabel={ctaLabel} />
      ))}
    </div>
  );
}
