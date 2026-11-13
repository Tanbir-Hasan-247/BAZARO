import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import {
  FiChevronLeft,
  FiChevronRight,
  FiSearch,
  FiSliders,
  FiX,
} from "react-icons/fi";
import apiClient from "../Services/api-client";
import {
  DEFAULT_CATEGORIES,
  DEFAULT_PRODUCTS,
} from "../Services/default-data";
import { useCart } from "../context/CartContext";
import LuxuryProductCard from "../Components/Products/LuxuryProductCard";
import QuickViewModal from "../Components/Products/QuickViewModal";

const Shop = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get("category") || "all";
  const initialSearch = searchParams.get("search") || "";
  const filterParam = searchParams.get("filter") || "";

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [ordering, setOrdering] = useState("");
  const [addedId, setAddedId] = useState(null);
  const [quickViewProduct, setQuickViewProduct] = useState(null);

  const { addToCart } = useCart();

  useEffect(() => {
    const urlCat = searchParams.get("category") || "all";
    const urlSearch = searchParams.get("search") || "";
    setSelectedCategory(urlCat);
    setSearchQuery(urlSearch);
    setCurrentPage(1);
  }, [searchParams]);

  useEffect(() => {
    apiClient
      .get("/categories/")
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : res.data?.results || [];
        setCategories(list.length > 0 ? list : DEFAULT_CATEGORIES);
      })
      .catch(() => {
        setCategories(DEFAULT_CATEGORIES);
      });
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: currentPage };

      if (selectedCategory && selectedCategory !== "all") {
        const catMatch = categories.find(
          (c) => c.name?.toLowerCase() === selectedCategory.toLowerCase()
        );
        if (catMatch) {
          params.category_id = catMatch.id;
        } else {
          params.search = selectedCategory;
        }
      }

      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      if (inStockOnly) {
        params.in_stock = "true";
      }

      if (ordering) {
        params.ordering = ordering;
      }

      const res = await apiClient.get("/products/", { params });
      const data = res.data;

      if (Array.isArray(data)) {
        setProducts(data);
        setTotalCount(data.length);
        setTotalPages(1);
      } else if (data?.results) {
        setProducts(data.results);
        const count = data.count ?? data.results.length;
        setTotalCount(count);
        const pageSize = data.next ? data.results.length || 12 : 12;
        setTotalPages(Math.max(1, Math.ceil(count / pageSize)));
      } else {
        setProducts(DEFAULT_PRODUCTS);
        setTotalCount(DEFAULT_PRODUCTS.length);
        setTotalPages(1);
      }
    } catch {
      const filtered = DEFAULT_PRODUCTS.filter((p) => {
        const catOk =
          selectedCategory === "all" ||
          (p.category_name || p.category?.name || "").toLowerCase() ===
            selectedCategory.toLowerCase();
        const searchOk =
          !searchQuery.trim() ||
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.description || "").toLowerCase().includes(searchQuery.toLowerCase());
        const stockOk = !inStockOnly || (Number(p.stock) || 0) > 0;
        return catOk && searchOk && stockOk;
      });
      setProducts(filtered);
      setTotalCount(filtered.length);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [currentPage, selectedCategory, searchQuery, inStockOnly, ordering, categories]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleCategoryChange = (catSlug) => {
    setSelectedCategory(catSlug);
    setCurrentPage(1);
    const nextParams = new URLSearchParams(searchParams);
    if (catSlug === "all") {
      nextParams.delete("category");
    } else {
      nextParams.set("category", catSlug);
    }
    setSearchParams(nextParams);
  };

  const resetAllFilters = () => {
    setSelectedCategory("all");
    setSearchQuery("");
    setInStockOnly(false);
    setOrdering("");
    setCurrentPage(1);
    setSearchParams({});
  };

  const handleAcquire = (product) => {
    addToCart(product, 1);
    setAddedId(product.id);
    setTimeout(() => {
      setAddedId((curr) => (curr === product.id ? null : curr));
    }, 1500);
  };

  const handlePageSelect = (pageNum) => {
    setCurrentPage(pageNum);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-[#FAF5EB] text-[#1F1916]">
      {/* Obsidian Atelier Masthead */}
      <section className="relative overflow-hidden bg-[#0D0A08] bazaro-grain text-[#FAF5EB] pt-28 sm:pt-32 pb-14 px-4 sm:px-6 lg:px-8 border-b border-[#C59B4B]/20">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 right-0 w-[460px] h-[360px] rounded-full blur-[120px] opacity-20"
          style={{ background: "radial-gradient(circle, #C59B4B, transparent 70%)" }}
        />

        <div className="relative z-10 max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.26em] text-[#C59B4B]">
              <Link to="/" className="hover:text-[#F6E3B4] transition-colors">
                BAZARO
              </Link>
              <span aria-hidden="true">/</span>
              <span>
                {filterParam === "deals"
                  ? "Royal Vault Offers • Up to 20% Off"
                  : "Atelier Curated Collection"}
              </span>
            </div>

            <h1 className="mt-3 font-serif-editorial text-4xl sm:text-5xl lg:text-6xl font-semibold text-[#FDF9F1] tracking-[-0.02em] leading-[1.04]">
              {selectedCategory !== "all"
                ? selectedCategory
                : filterParam === "deals"
                  ? "Private Vault Privilege"
                  : "The House Catalogue"}
            </h1>

            <p className="mt-3 max-w-2xl text-sm sm:text-base text-[#B8AB98] leading-relaxed">
              Every piece is inspected for authenticity, craftsmanship, and insured
              priority dispatch across Bangladesh.
            </p>
          </div>

          <div className="flex items-center gap-4 self-start lg:self-auto px-5 py-3 rounded-full border border-[#C59B4B]/28 bg-[#16120E]/80 backdrop-blur-md">
            <span className="text-[10px] uppercase tracking-[0.2em] text-[#A99B87]">
              Exhibiting
            </span>
            <span className="font-serif-editorial text-2xl font-semibold text-[#E5C77A] bazaro-tabular">
              {totalCount}
            </span>
            <span className="text-[10px] uppercase tracking-[0.2em] text-[#A99B87]">
              {totalCount === 1 ? "Edition" : "Editions"}
            </span>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div
        id="shop-catalog-grid"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12"
      >
        {/* Editorial Filter & Search Bar */}
        <div className="rounded-[22px] bg-[#FDF9F1] border border-[#C59B4B]/22 p-4 sm:p-5 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center gap-3.5 justify-between">
            {/* Search Input */}
            <div className="relative flex-1 min-w-0 max-w-xl">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8E6A28]" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search watches, fragrances, acoustic audio, leather..."
                aria-label="Search BAZARO collection"
                className="w-full pl-11 pr-10 py-2.5 rounded-full bg-[#FAF5EB] border border-[#C59B4B]/26 text-sm text-[#1F1916] placeholder-[#8C7D6B] focus:outline-none focus:border-[#C59B4B]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setCurrentPage(1);
                  }}
                  aria-label="Clear search query"
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#6E5F50] hover:text-[#1F1916]"
                >
                  <FiX className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Sort & Stock Controls */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setInStockOnly((v) => !v);
                  setCurrentPage(1);
                }}
                aria-pressed={inStockOnly}
                className={`px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-[0.14em] border transition-colors ${
                  inStockOnly
                    ? "bg-[#1A1512] text-[#F6E3B4] border-[#1A1512]"
                    : "bg-[#FAF5EB] text-[#4F4337] border-[#C59B4B]/28 hover:border-[#C59B4B]"
                }`}
              >
                In Vault Only
              </button>

              <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#FAF5EB] border border-[#C59B4B]/28">
                <FiSliders className="w-3.5 h-3.5 text-[#8E6A28]" />
                <label htmlFor="shop-sort-select" className="sr-only">
                  Sort Editions
                </label>
                <select
                  id="shop-sort-select"
                  value={ordering}
                  onChange={(e) => {
                    setOrdering(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="bg-transparent text-xs font-semibold text-[#1F1916] focus:outline-none cursor-pointer pr-1"
                >
                  <option value="">Featured Order</option>
                  <option value="price">Price: Low to High</option>
                  <option value="-price">Price: High to Low</option>
                  <option value="-stock">Availability: Highest Stock</option>
                </select>
              </div>
            </div>
          </div>

          {/* Editorial Underline Department Tabs */}
          <div className="flex items-center gap-5 sm:gap-7 overflow-x-auto pt-1 border-t border-[#C59B4B]/14">
            <button
              type="button"
              onClick={() => handleCategoryChange("all")}
              className={`shrink-0 py-2.5 text-xs font-semibold uppercase tracking-[0.16em] border-b-2 transition-colors ${
                selectedCategory === "all"
                  ? "border-[#1A1512] text-[#1F1916]"
                  : "border-transparent text-[#6E5F50] hover:text-[#1F1916]"
              }`}
            >
              All Departments
            </button>

            {categories.map((cat) => {
              const isSelected =
                selectedCategory.toLowerCase() === cat.name?.toLowerCase();
              return (
                <button
                  key={cat.id || cat.name}
                  type="button"
                  onClick={() => handleCategoryChange(cat.name)}
                  className={`shrink-0 py-2.5 text-xs font-semibold uppercase tracking-[0.16em] border-b-2 transition-colors ${
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
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
        ) : products.length === 0 ? (
          <div className="mt-10 rounded-[24px] bg-[#FDF9F1] border border-[#C59B4B]/22 py-16 px-6 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-[#8E6A28]">
              Archive Result
            </p>
            <h2 className="mt-2 font-serif-editorial text-3xl font-semibold text-[#1F1916]">
              No Matching Editions Found
            </h2>
            <p className="mt-2 text-sm text-[#6E5F50] max-w-md mx-auto">
              Adjust your search terms or browse all bespoke departments inside the
              BAZARO atelier.
            </p>
            <button
              type="button"
              onClick={resetAllFilters}
              className="mt-6 px-6 py-2.5 rounded-full bg-[#1A1512] text-[#F6E3B4] text-xs font-semibold uppercase tracking-[0.18em] hover:bg-[#2F251D] transition-colors"
            >
              Reset Curated Filters
            </button>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <LuxuryProductCard
                key={product.id}
                product={product}
                onQuickView={setQuickViewProduct}
                onAcquire={handleAcquire}
                isRecentlyAdded={addedId === product.id}
                badgeLabel={filterParam === "deals" ? "Vault Offer" : ""}
              />
            ))}
          </div>
        )}

        {/* Architectural Pagination */}
        {totalPages > 1 && (
          <nav
            aria-label="Catalogue pagination"
            className="mt-12 flex items-center justify-center gap-2"
          >
            <button
              type="button"
              onClick={() => handlePageSelect(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              aria-label="Previous catalogue page"
              className="bazaro-touch-control inline-flex items-center justify-center rounded-full border border-[#C59B4B]/30 bg-[#FDF9F1] text-[#1F1916] hover:border-[#C59B4B] disabled:opacity-35 transition-colors"
            >
              <FiChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                type="button"
                onClick={() => handlePageSelect(pageNum)}
                aria-current={currentPage === pageNum ? "page" : undefined}
                className={`min-w-[40px] h-10 px-3 rounded-full text-xs font-semibold bazaro-tabular border transition-colors ${
                  currentPage === pageNum
                    ? "bg-[#1A1512] text-[#F6E3B4] border-[#1A1512]"
                    : "bg-[#FDF9F1] text-[#4F4337] border-[#C59B4B]/24 hover:border-[#C59B4B]"
                }`}
              >
                {pageNum}
              </button>
            ))}

            <button
              type="button"
              onClick={() =>
                handlePageSelect(Math.min(totalPages, currentPage + 1))
              }
              disabled={currentPage === totalPages}
              aria-label="Next catalogue page"
              className="bazaro-touch-control inline-flex items-center justify-center rounded-full border border-[#C59B4B]/30 bg-[#FDF9F1] text-[#1F1916] hover:border-[#C59B4B] disabled:opacity-35 transition-colors"
            >
              <FiChevronRight className="w-4 h-4" />
            </button>
          </nav>
        )}
      </div>

      <QuickViewModal
        product={quickViewProduct}
        isOpen={Boolean(quickViewProduct)}
        onClose={() => setQuickViewProduct(null)}
      />
    </div>
  );
};

export default Shop;
