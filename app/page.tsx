import PromoBanner from './components/PromoBanner';
import Categories from './components/Categories';
import ProductColumn from './components/ProductColumn';

export default function HomePage() {
  return (
    <div className='w-[90%] mx-auto'>
      <PromoBanner/>
      <Categories/>
      <ProductColumn/>
    </div>
  );
}
