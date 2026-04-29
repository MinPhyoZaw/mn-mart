import PromoBanner from './components/PromoBanner';
import Categories from './components/Categories';
import ProductColumn from './components/ProductColumn';
import Advertisement from "./components/Advertisement";

export default function HomePage() {
  return (
    <div className='w-[90%] mx-auto'>
       <ProductColumn tagName="NewArrival" title="New Arrival" />
      <PromoBanner/>
      <Categories/>
      {/* <Advertisement/> */}
     
      <ProductColumn tagName="BestSellers" title="Best Sellers" />
      <ProductColumn tagName="TopPicks" title="Top Picks" />
      <ProductColumn tagName="RecomendedForYou" title="Recommended For You" />
    </div>
  );
}
