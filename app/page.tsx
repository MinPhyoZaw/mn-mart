export const dynamic = "force-dynamic";

import PromoBanner from './components/PromoBanner';
import Categories from './components/Categories';
import ProductColumn from './components/ProductColumn';
import Advertisement from "./components/Advertisement";
import TicketAdsSection from './components/TicketAdsSection'; // Import the TicketAdsSection

export default function HomePage() {
  return (
    <div className='w-[90%] mx-auto'>
       <ProductColumn tagName="NewArrival" title="New Arrival" />
      <PromoBanner/>
      <Categories/>
      {/* <Advertisement/> */}
     
      <ProductColumn tagName="BestSellers" title="Best Sellers" />
      <ProductColumn tagName="TopPicks" title="Top Picks" />
      <TicketAdsSection />
      <ProductColumn tagName="RecomendedForYou" title="Recommended For You" />

      

    </div>
  );
}
