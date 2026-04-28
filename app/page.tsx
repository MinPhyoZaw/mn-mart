import PromoBanner from './components/PromoBanner';
import Categories from './components/Categories';
import ProductColumn from './components/ProductColumn';

export default function HomePage() {
  return (
    <div className='w-[90%] mx-auto'>
      <PromoBanner/>
      <Categories/>

      <ProductColumn tagName="NewArrival" title="New Arrival" />
      <ProductColumn tagName="BestSellers" title="Best Sellers" />
      <ProductColumn tagName="TopPicks" title="Top Picks" />
      <ProductColumn tagName="RecomendedForYou" title="Recommended For You" />
    </div>
  );
}
