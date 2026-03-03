import dynamic from 'next/dynamic';
import PromoBanner from './components/PromoBanner';
import Categories from './components/Categories';

const TopShops = dynamic(() => import('./components/TopShops'));
const ImageGridComponent = dynamic(() => import('./components/ImageGridComponent'));

export default function HomePage() {
  return (
     <div className='w-[90%] mx-auto'>
      <PromoBanner/>
      <TopShops/>
      <Categories/>
      <ImageGridComponent/> 
    </div>
  );
}
