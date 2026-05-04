import CategoryShopsPage from "../components/CategoryShopsPage";
// Pass serializable icon keys from server component; actual icon components
// will be resolved inside the client `CategoryShopsPage` component.

const spaServiceCategories = [
  { name: "Massage" },
  { name: "Facial" },
  { name: "Body Treatment" },
  { name: "Foot & Hand Care" },
  { name: "Special Packages" },
];

export default function SpaPage() {
  return (
    <CategoryShopsPage
      category="spa"
      title="Spa"
      heroImage="/images/nail-spa.jpg"
      ctaLabel="Book Now"
      serviceCategories={spaServiceCategories}
      
    />
  );
}