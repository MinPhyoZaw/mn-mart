import CategoryShopsPage from "../components/CategoryShopsPage";

export default function SpaPage() {
  return (
    <CategoryShopsPage
      category="spa"
      title="Spas & Salons"
      heroImage="/images/nail-spa.jpg"
      ctaLabel="View Services"
      serviceCategories={[
        { name: "Massage" },
        { name: "Facial" },
        { name: "Manicure" },
        { name: "Hair" },
      ]}
    />
  );
}
