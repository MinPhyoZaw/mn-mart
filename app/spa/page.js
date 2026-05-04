import CategoryShopsPage from "../components/CategoryShopsPage";
// Pass serializable icon keys from server component; actual icon components
// will be resolved inside the client `CategoryShopsPage` component.
const spaServiceCategories = [
  { name: "Massage", icon: "Hand" },
  { name: "Facial", icon: "Flower2" },
  { name: "Body Treatment", icon: "Waves" },
  { name: "Foot & Hand Care", icon: "Footprints" },
  { name: "Special Packages", icon: "Gift" },
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