import CategoryShopsPage from "../components/CategoryShopsPage";
import {
  Hand,
  Flower2,
  Waves,
  Footprints,
  Gift,
} from "lucide-react";

const spaServiceCategories = [
  { name: "Massage", icon: Hand },
  { name: "Facial", icon: Flower2 },
  { name: "Body Treatment", icon: Waves },
  { name: "Foot & Hand Care", icon: Footprints },
  { name: "Special Packages", icon: Gift },
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
