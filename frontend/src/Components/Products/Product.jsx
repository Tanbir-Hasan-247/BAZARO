import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { FiArrowRight } from "react-icons/fi";
import apiClient from "../../Services/api-client";
import {
  DEFAULT_CATEGORIES,
  DEFAULT_PRODUCTS,
} from "../../Services/default-data";
import { useCart } from "../../context/CartContext";
import LuxuryProductCard from "./LuxuryProductCard";
import QuickViewModal from "./QuickViewModal";

const Product = () => {
  const { addToCart } = useCart();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [recentlyAddedId, setRecentlyAddedId] = useState(null);
  const [quickViewProduct, setQuickViewProduct] = useState(null);

  useEffect(() => {
    let active = true;
    const loadCatalog = async () => {
      setLoading(true);
      try {
        const [catRes, prodRes] = await Promise.allSettled([
          apiClient.get("/categories/"),
          apiClient.get("/products/"),
        ]);

        if (!active) return;

        if (catRes.status === "fulfilled") {
          const catData = Array.isArray(catRes.value.data)
            ? catRes.value.data
            : catRes.value.data?.results || [];
          setCategories(catData.length > 0 ? catData : DEFAULT_CATEGORIES);
        } else {
          setCategories(DEFAULT_CATEGORIES);
        }

        if (prodRes.status === "fulfilled") {
          const prodData = Array.isArray(prodRes.value.data)
            ? prodRes.value.data
            : prodRes.value.data?.results || [];
          setProducts(prodData.length > 0 ? prodData : DEFAULT_PRODUCTS);
        } else {
          setProducts(DEFAULT_PRODUCTS);
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadCatalog();
    return () => {
      active = false;
    };
  }, []);

  const filteredProducts = useMemo(() => {
    if (selectedCategory === "all") {
      return products.slice(0, 8);
    }
    const target = selectedCategory.toLowerCase();
    return products
      .filter((p) => {
        const catName =
          p.category_name || p.category?.name || String(p.category || "");
        return catName.toLowerCase() === target;
      })
      .slice(0, 8);
  }, [products, selectedCategory]);

  const handleAcquire = (product) => {
    addToCart(product, 1);
    setRecentlyAddedId(product.id);
    setTimeout(() => {
      setRecentlyAddedId((curr) => (curr === product.id ? null : curr));
    }, 1500);
  };

  return (
    <section
      id="featured-gallery"
      className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-[#FAF5EB] text-[#1F1916]"
    >
      <div className="max-w-7xl mx-auto">
        {/* Editorial Section Masthead */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-[#C59B4B]/20">
          <div className="max-w-2xl">
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#8E6A28]">
              Maison Gallery &bull; Curated Release
            </p>
            <h2 className="mt-2 font-serif-editorial text-3xl sm:text-4xl lg:text-[2.85rem] font-semibold text-[#1F1916] leading-[1.08] tracking-[-0.015em]">
              Selected Atelier Editions
            </h2>
            <p className="mt-2.5 text-sm sm:text-base text-[#5C4E41] leading-relaxed">
              Presented in quiet museum lighting &mdash; inspect provenance, tactile
              materials, and live availability across our flagship house departments.
            </p>
          </div>

          <Link
            to="/shop"
            className="self-start md:self-auto inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-[#C59B4B]/40 text-[#1F1916] hover:bg-[#1A1512] hover:text-[#F6E3B4] hover:border-[#1A1512] text-xs font-semibold uppercase tracking-[0.18em] transition-colors"
          >
            Full Collection
            <FiArrowRight className="w-3.5 h-3.5 text-[#C59B4B]" />
          </Link>
        </div>

        {/* Hairline Architectural Filter Tabs */}
        <div
          role="tablist"
          aria-label="Filter curated editions by department"
          className="mt-6 flex items-center gap-5 sm:gap-7 overflow-x-auto pb-2 border-b border-[#C59B4B]/14"
        >
          <button
            type="button"
            role="tab"
            aria-selected={selectedCategory === "all"}
            onClick={() => setSelectedCategory("all")}
            className={`shrink-0 pb-2.5 text-xs font-semibold uppercase tracking-[0.16em] border-b-2 transition-colors ${
              selectedCategory === "all"
                ? "border-[#1A1512] text-[#1F1916]"
                : "border-transparent text-[#6E5F50] hover:text-[#1F1916]"
            }`}
          >
            All Editions
          </button>

          {categories.slice(0, 6).map((cat) => {
            const isSelected = selectedCategory === cat.name;
            return (
              <button
                key={cat.id || cat.name}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => setSelectedCategory(cat.name)}
                className={`shrink-0 pb-2.5 text-xs font-semibold uppercase tracking-[0.16em] border-b-2 transition-colors ${
                  isSelected
                    ? "border-[#1A1512] text-[#1F1916]"
                    : "border-transparent text-[#6E5F50] hover:text-[#1F1916]"
                }`}
              >
                {cat.name}
              </button>
            );
          })}
        </div>

        {/* Gallery Grid */}
        {loading ? (
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-7">
            {Array.from({ length: 8 }).map((_, idx) => (
              <div
                key={idx}
                className="rounded-[22px] p-4 bg-[#FDF9F1] border border-[#C59B4B]/16 space-y-4"
              >
                <div className="aspect-[4/5] rounded-[16px] bazaro-shimmer" />
                <div className="h-3 w-1/3 rounded-full bazaro-shimmer" />
                <div className="h-5 w-4/5 rounded-full bazaro-shimmer" />
                <div className="h-9 w-full rounded-full bazaro-shimmer" />
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="mt-12 rounded-[24px] bg-[#FDF9F1] border border-[#C59B4B]/20 py-16 px-6 text-center">
            <p className="font-serif-editorial text-2xl font-semibold text-[#1F1916]">
              No editions currently exhibited in this chamber
            </p>
            <p className="mt-2 text-sm text-[#6E5F50]">
              Return to all atelier releases or explore our complete digital vault.
            </p>
            <button
              type="button"
              onClick={() => setSelectedCategory("all")}
              className="mt-6 px-6 py-2.5 rounded-full bg-[#1A1512] text-[#F6E3B4] text-xs font-semibold uppercase tracking-[0.18em]"
            >
              Show All Editions
            </button>
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-7">
            {filteredProducts.map((product) => (
              <LuxuryProductCard
                key={product.id}
                product={product}
                onQuickView={setQuickViewProduct}
                onAcquire={handleAcquire}
                isRecentlyAdded={recentlyAddedId === product.id}
              />
            ))}
          </div>
        )}
      </div>

      <QuickViewModal
        product={quickViewProduct}
        isOpen={Boolean(quickViewProduct)}
        onClose={() => setQuickViewProduct(null)}
      />
    </section>
  );
};

export default Product;
