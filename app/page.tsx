import PromoBanner from './components/PromoBanner';
import Catgories from './components/Categories';
import TopShops from './components/TopShops';
import Categories from './components/Categories';
import ImageGridComponent from './components/ImageGridComponent';
import MobileBottomBar from './components/MobileBottomBar';
export default function HomePage() {
  return (
     <div className='w-[90%] mx-auto'>
      <PromoBanner/>
      <TopShops/>
      <Categories/>
      <ImageGridComponent/> 
      <MobileBottomBar/>
    </div>
  );
}