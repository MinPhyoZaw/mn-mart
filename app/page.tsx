export const revalidate = 60;

import PromoBanner from './components/PromoBanner';
import Categories from './components/Categories';
import ProductColumn from './components/ProductColumn';

import TicketAdsSection from './components/TicketAdsSection';
import ShoppingCategoryShowcase from './components/ShoppingCategoryShowcase';

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

      

    </div>
  );
}
