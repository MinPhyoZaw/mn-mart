export const revalidate = 60;

import PromoBanner from './components/PromoBanner';
import Categories from './components/Categories';
import ProductColumn from './components/ProductColumn';
import SeptemberVendorPromotion from './components/SeptemberVendorPromotion';

import TicketAdsSection from './components/TicketAdsSection';
import ShoppingCategoryShowcase from './components/ShoppingCategoryShowcase';
import IOSInstallGuide from "./components/IOSInstallGuide";

export default function HomePage() {
  return (
    <div className='w-[90%] mx-auto'>
      <ShoppingCategoryShowcase />
       {/* <ProductColumn tagName="NewArrival" title="New Arrival" /> */}
      <PromoBanner/>
      <Categories/>
      
      {/* <Advertisement/> */}
     
     
      <TicketAdsSection />
      <ProductColumn tagName="RecomendedForYou" title="Recommended For You" />
      <div className="mx-auto flex w-[96%] flex-col gap-5 py-8 lg:flex-row lg:items-stretch">
  <IOSInstallGuide />
  
</div>
      <SeptemberVendorPromotion />
      

    </div>
  );
}
