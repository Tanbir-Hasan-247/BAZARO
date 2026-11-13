import AtelierLookbook from "../Components/Home/AtelierLookbook";
import Categories from "../Components/Category/Categories";
import FlashSale from "../Components/Discount/FlashSale";
import Features from "../Components/Features";
import OllaHero from "../Components/Hero/OllaHero";
import Product from "../Components/Products/Product";
import BrandMarquee from "../Components/ui/BrandMarquee";

const Home = () => {
  return (
    <div className="w-full bg-[#FAF5EB] text-[#1F1916]">
      <OllaHero />
      <BrandMarquee />
      <div className="bazaro-view-reveal">
        <Features />
      </div>
      <div className="bazaro-view-reveal">
        <FlashSale />
      </div>
      <div className="bazaro-view-reveal">
        <AtelierLookbook />
      </div>
      <div className="bazaro-view-reveal">
        <Categories />
      </div>
      <div className="bazaro-view-reveal">
        <Product />
      </div>
    </div>
  );
};

export default Home;
