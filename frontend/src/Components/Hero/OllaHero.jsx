import React, { Suspense, lazy, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import {
  FiArrowRight,
  FiArrowUpRight,
  FiAward,
  FiCheck,
  FiShoppingBag,
  FiStar,
} from "react-icons/fi";
import apiClient from "../../Services/api-client";
import { useCart } from "../../context/CartContext";
import {
  FALLBACK_FEATURED_PRODUCTS,
  normalizeHeroProduct,
} from "../../data/heroFeaturedProducts";
import defaultProductImg from "../../assets/default-product.png";
import ProductStage3D from "../3d/ProductStage3D";
import { navigateWithTransition } from "../../utils/viewTransition";

const HeroScene3D = lazy(() => import("../3d/HeroScene3D"));

const OllaHero = () => {
  const navigate = useNavigate();
  const stageRef = useRef(null);
  const showcaseRef = useRef(null);
  const prefersReduced = useReducedMotion();
  const { addToCart } = useCart();

  const [allProducts, setAllProducts] = useState(FALLBACK_FEATURED_PRODUCTS);
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(Boolean(prefersReduced));
  const [isStageHovered, setIsStageHovered] = useState(false);
  const [addedId, setAddedId] = useState(null);

  // Sync live Django API categories & products seamlessly
  useEffect(() => {
    let mounted = true;

    Promise.allSettled([
      apiClient.get("/categories/"),
      apiClient.get("/products/"),
    ]).then(([catRes, prodRes]) => {
      if (!mounted) return;

      const catMap = {};
      if (catRes.status === "fulfilled") {
        const catData = Array.isArray(catRes.value.data)
          ? catRes.value.data
          : catRes.value.data?.results || [];
        catData.forEach((c) => {
          catMap[c.id] = c.name;
        });
      }

      if (prodRes.status === "fulfilled") {
        const prodData = Array.isArray(prodRes.value.data)
          ? prodRes.value.data
          : prodRes.value.data?.results || [];
        if (prodData.length > 0) {
          setAllProducts(prodData.map((p) => normalizeHeroProduct(p, catMap)));
        }
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  // Derive available department tabs from live products
  const filterTabs = useMemo(() => {
    const names = Array.from(
      new Set(allProducts.map((p) => p.categoryName).filter(Boolean))
    );
    return ["All", ...names.slice(0, 4)];
  }, [allProducts]);

  // Filter products shown on 3D hero pedestal
  const filteredStageProducts = useMemo(() => {
    if (categoryFilter === "All") return allProducts;
    const matched = allProducts.filter(
      (p) => p.categoryName?.toLowerCase() === categoryFilter.toLowerCase()
    );
    return matched.length > 0 ? matched : allProducts;
  }, [allProducts, categoryFilter]);

  // Reset active index cleanly when filter changes
  useEffect(() => {
    setActiveIndex(0);
  }, [categoryFilter]);

  // Auto-orbit showcase timer (stops cleanly when paused or hovered or reduced-motion)
  useEffect(() => {
    if (isPaused || isStageHovered || prefersReduced || filteredStageProducts.length <= 1) {
      return;
    }
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % filteredStageProducts.length);
    }, 4800);
    return () => clearInterval(timer);
  }, [isPaused, isStageHovered, prefersReduced, filteredStageProducts.length]);

  // Pick 3 signature real products across distinct categories for Stage 2 Arch Vault
  const archVaultProducts = useMemo(() => {
    const picked = [];
    const seenCats = new Set();

    for (const prod of allProducts) {
      if (!seenCats.has(prod.categoryName)) {
        picked.push(prod);
        seenCats.add(prod.categoryName);
      }
      if (picked.length === 3) break;
    }

    for (const prod of allProducts) {
      if (picked.length >= 3) break;
      if (!picked.some((p) => p.id === prod.id)) {
        picked.push(prod);
      }
    }

    return picked;
  }, [allProducts]);

  const safeIndex =
    filteredStageProducts.length > 0
      ? ((activeIndex % filteredStageProducts.length) +
          filteredStageProducts.length) %
        filteredStageProducts.length
      : 0;
  const activeStageProduct = filteredStageProducts[safeIndex] || allProducts[0];

  const { scrollYProgress } = useScroll({
    target: showcaseRef,
    offset: ["start end", "end start"],
  });

  const leftArchY = useTransform(scrollYProgress, [0, 1], [34, -34]);
  const centerArchY = useTransform(scrollYProgress, [0, 1], [-14, 18]);
  const rightArchY = useTransform(scrollYProgress, [0, 1], [42, -42]);

  const handleStagePointerMove = (e) => {
    const el = stageRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
    el.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
  };

  const handleQuickAdd = (product) => {
    if (!product) return;
    addToCart(product, 1);
    setAddedId(product.id);
    setTimeout(() => setAddedId(null), 1600);
  };

  const scrollToSection = (id) => {
    const target = document.getElementById(id);
    if (target) {
      target.scrollIntoView({ behavior: prefersReduced ? "auto" : "smooth" });
    }
  };

  return (
    <div className="w-full bg-[#0D0A08] text-[#FAF5EB]">
      {/* =========================================================
          STAGE 1: REAL-PRODUCT 3D PEDESTAL & SPOTLIGHT HERO
          ========================================================= */}
      <section
        ref={stageRef}
        data-surface="dark"
        onPointerMove={handleStagePointerMove}
        className="bazaro-spotlight-stage bazaro-grain relative w-full min-h-[88dvh] pt-28 sm:pt-32 lg:pt-36 pb-14 sm:pb-20 overflow-hidden bg-[radial-gradient(ellipse_at_top_right,_#261B13_0%,_#120D0A_50%,_#0D0A08_100%)]"
      >
        {/* Architectural Gold Arch Linework */}
        <svg
          aria-hidden="true"
          viewBox="0 0 1200 800"
          fill="none"
          className="pointer-events-none absolute inset-0 w-full h-full opacity-20"
          preserveAspectRatio="xMidYMid slice"
        >
          <path
            d="M320 800 V360 C320 210 470 110 600 48 C730 110 880 210 880 360 V800"
            stroke="#C59B4B"
            strokeWidth="1"
            strokeOpacity="0.45"
          />
          <path
            d="M370 800 V375 C370 245 495 160 600 105 C705 160 830 245 830 375 V800"
            stroke="#E5C77A"
            strokeWidth="0.75"
            strokeDasharray="6 8"
            strokeOpacity="0.35"
          />
        </svg>

        {/* Ambient Warm Gold Glows */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-28 -left-24 w-[440px] h-[440px] rounded-full bg-[#C59B4B]/12 blur-[120px]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 right-0 w-[520px] h-[520px] rounded-full bg-[#E5C77A]/10 blur-[140px]"
        />

        {/* Interactive Content Reveal Layer */}
        <div
          aria-hidden="true"
          className="reveal-layer pointer-events-none absolute inset-0 z-10"
        />

        {/* Hero Grid */}
        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          {/* LEFT COLUMN: Editorial Headline + Category Filter + Active Product Status */}
          <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
            <motion.div
              initial={prefersReduced ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55 }}
              className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-[#C59B4B]/32 bg-[#17120E]/80 backdrop-blur-md text-[10px] font-semibold tracking-[0.26em] uppercase text-[#E5C77A]"
            >
              <span className="w-1.5 h-1.5 rotate-45 bg-[#E5C77A]" aria-hidden="true" />
              <span>Apnar Desher Bazaar &bull; Digital Flagship</span>
            </motion.div>

            <motion.h1
              initial={prefersReduced ? false : { opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.08 }}
              className="font-serif-editorial text-[clamp(2.45rem,4.7vw,4.25rem)] font-semibold tracking-[-0.02em] leading-[1.04] text-[#FDF9F1]"
            >
              Curated{" "}
              <span className="text-liquid-gold italic font-normal">
                Real Treasures
              </span>
              <span className="block">In Royal Depth.</span>
            </motion.h1>

            <motion.p
              initial={prefersReduced ? false : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.16 }}
              className="text-sm sm:text-base text-[#FAF5EB]/72 leading-relaxed max-w-xl mx-auto lg:mx-0"
            >
              Inspect signature horology, extrait perfumery, acoustic instruments,
              and bespoke objects live inside our interactive obsidian studio.
            </motion.p>

            {/* Hairline Architectural Department Filter Tabs */}
            <motion.div
              initial={prefersReduced ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.2 }}
              className="flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-2 border-b border-[#C59B4B]/18 pb-1"
            >
              {filterTabs.map((tab) => {
                const selected = categoryFilter === tab;
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setCategoryFilter(tab)}
                    className={`pb-2 text-[11px] font-semibold tracking-[0.18em] uppercase border-b-2 transition-colors cursor-pointer ${
                      selected
                        ? "border-[#E5C77A] text-[#F6E3B4]"
                        : "border-transparent text-[#A99B87] hover:text-[#FAF5EB]"
                    }`}
                  >
                    {tab === "All" ? "All Royal Picks" : tab}
                  </button>
                );
              })}
            </motion.div>

            {/* Primary & Secondary CTAs */}
            <motion.div
              initial={prefersReduced ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.25 }}
              className="flex flex-wrap items-center justify-center lg:justify-start gap-3.5 pt-1"
            >
              <Link
                to="/shop"
                className="bazaro-editorial-btn group inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full bg-gradient-to-r from-[#C59B4B] via-[#E5C77A] to-[#C59B4B] text-[#140E0A] font-semibold text-xs uppercase tracking-[0.16em] shadow-[0_12px_35px_rgba(197,155,75,0.28)] hover:shadow-[0_16px_42px_rgba(229,199,122,0.42)] transition-all duration-300"
              >
                <span>Explore Full Bazaar</span>
                <FiArrowRight className="text-base transition-transform duration-300 group-hover:translate-x-1" />
              </Link>

              <button
                type="button"
                onClick={() => scrollToSection("flash-sale")}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full border border-[#C59B4B]/38 bg-transparent hover:bg-[#C59B4B]/12 text-[#FAF5EB] text-xs uppercase tracking-[0.16em] font-semibold transition-colors duration-300 cursor-pointer"
              >
                <FiStar className="text-[#E5C77A]" />
                <span>Royal Vault Deals</span>
              </button>
            </motion.div>

            {/* Live Active Pedestal Item Readout Bar */}
            {activeStageProduct && (
              <motion.div
                initial={prefersReduced ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.32 }}
                className="pt-4 border-t border-[#C59B4B]/20 flex flex-wrap items-center justify-between gap-4 max-w-lg mx-auto lg:mx-0"
              >
                <div className="text-left">
                  <span className="text-[10px] uppercase tracking-[0.22em] text-[#C59B4B] font-bold block">
                    Now On 3D Turntable • {safeIndex + 1}/{filteredStageProducts.length}
                  </span>
                  <p className="font-serif-luxury text-base font-bold text-[#FAF5EB] truncate max-w-[240px]">
                    {activeStageProduct.name}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[10px] uppercase tracking-wider text-[#FAF5EB]/55 block">
                      Vault Price
                    </span>
                    <span className="font-serif-luxury text-xl font-bold text-[#E5C77A]">
                      ${(parseFloat(activeStageProduct.price) || 0).toFixed(2)}
                    </span>
                  </div>
                  <Link
                    to={`/product/${activeStageProduct.id}`}
                    className="px-3.5 py-2 rounded-xl border border-[#C59B4B]/40 bg-[#1A1410] hover:bg-[#C59B4B] text-[#E5C77A] hover:text-[#140E0A] text-xs font-bold transition-all"
                  >
                    Details
                  </Link>
                </div>
              </motion.div>
            )}
          </div>

          {/* RIGHT COLUMN: Seamless Obsidian Three.js Pedestal + Interactive 3D Product Vitrine */}
          <div
            className="lg:col-span-6 relative"
            onMouseEnter={() => setIsStageHovered(true)}
            onMouseLeave={() => setIsStageHovered(false)}
          >
            <div className="relative w-full h-[460px] sm:h-[520px] lg:h-[550px] rounded-[2rem] overflow-hidden">
              {/* Hairline architectural radial vignette framing the crystal pedestal */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-6 rounded-t-full rounded-b-3xl border border-[#C59B4B]/12"
              />

              {/* Lazy-loaded WebGL Three.js Studio Turntable Pedestal */}
              <Suspense fallback={null}>
                <HeroScene3D
                  activeCategory={activeStageProduct?.categoryName || "Electronics"}
                  activeIndex={safeIndex}
                  isPaused={isPaused || Boolean(prefersReduced)}
                />
              </Suspense>

              {/* Layered Depth-3D Interactive Real Product Carousel */}
              <ProductStage3D
                products={filteredStageProducts}
                activeIndex={safeIndex}
                onSelectIndex={(idx) => setActiveIndex(idx)}
                onAddToCart={handleQuickAdd}
                addedId={addedId}
                isPaused={isPaused}
                onTogglePause={() => setIsPaused((p) => !p)}
              />
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          STAGE 2: THE 3D ROYAL ARCH VAULT — REAL PRODUCT GALLERY
          (parallax-scroll-effects with overflow: clip)
          ========================================================= */}
      <section
        id="curated-showcase"
        ref={showcaseRef}
        className="parallax-clip-wrapper relative w-full py-16 sm:py-24 bg-[#FAF5EB] text-[#1F1916]"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 sm:mb-16">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-[#C59B4B]/32 bg-[#C59B4B]/8 text-[#8E6A28] text-[10px] font-semibold uppercase tracking-[0.24em] mb-3">
                <FiAward className="text-xs" aria-hidden="true" />
                <span>Signature Exhibition</span>
              </div>
              <h2 className="font-serif-editorial text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-[-0.015em] text-[#1A1410] leading-tight">
                Handpicked{" "}
                <span className="italic font-normal text-[#8E6A28]">
                  Real Flagship Editions
                </span>
              </h2>
            </div>

            <p className="text-xs sm:text-sm text-[#1F1916]/72 max-w-md leading-relaxed">
              Presented inside BAZARO&rsquo;s three architectural arches &mdash; inspect
              material provenance or reserve directly for priority dispatch.
            </p>
          </div>

          {/* 3 Parallax Real-Product Arch Pedestal Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-start">
            {archVaultProducts.map((prod, idx) => {
              const yMotion = prefersReduced
                ? 0
                : idx === 0
                ? leftArchY
                : idx === 1
                ? centerArchY
                : rightArchY;

              const imgSrc = prod.image || defaultProductImg;
              const secondaryImgSrc =
                prod?.images?.[1]?.image_url || prod?.images?.[1]?.image || null;
              const roman = idx === 0 ? "I" : idx === 1 ? "II" : "III";

              return (
                <motion.div
                  key={prod.id || idx}
                  style={{ y: yMotion }}
                  className={idx === 1 ? "md:mt-6" : ""}
                >
                  <article
                    data-surface="dark"
                    className="group rounded-t-[170px] rounded-b-3xl border border-[#C59B4B]/30 hover:border-[#C59B4B]/60 transition-colors bg-gradient-to-b from-[#1D1611] via-[#140F0C] to-[#0D0A08] text-[#FAF5EB] p-6 sm:p-7 pt-10 flex flex-col justify-between shadow-[0_24px_55px_-20px_rgba(20,14,10,0.45)]"
                  >
                    {/* Header Roman Numeral + Category Tag */}
                    <div className="flex items-center justify-between mb-5 px-2">
                      <span className="font-serif-editorial italic text-2xl font-semibold text-[#E5C77A]/85 bazaro-tabular">
                        {roman}
                      </span>
                      <span className="px-3 py-1 rounded-full bg-[#C59B4B]/12 border border-[#C59B4B]/35 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#E5C77A]">
                        {prod.categoryName || "Atelier Pick"}
                      </span>
                    </div>

                    {/* Clean Studio Product Arch (Zero sticker overlap over image) */}
                    <button
                      type="button"
                      onClick={(e) => {
                        const imgEl = e.currentTarget.querySelector("img[data-arch-primary]");
                        navigateWithTransition(navigate, `/product/${prod.id}`, {
                          previewProduct: prod,
                          imageElement: imgEl,
                        });
                      }}
                      aria-label={`Inspect ${prod.name}`}
                      className="relative w-full h-56 sm:h-60 rounded-t-[130px] rounded-b-2xl bg-gradient-to-b from-[#FAF5EB] via-[#F4ECE0] to-[#EAE0CE] p-5 flex items-center justify-center overflow-hidden border border-[#E5C77A]/28 cursor-pointer"
                    >
                      <img
                        data-arch-primary
                        src={imgSrc}
                        alt={prod.name}
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = defaultProductImg;
                        }}
                        className="w-full h-full object-contain drop-shadow-[0_18px_22px_rgba(20,14,10,0.28)] group-hover:scale-[1.06] group-hover:-translate-y-1 transition-transform duration-500 ease-out"
                      />
                      {secondaryImgSrc && (
                        <img
                          src={secondaryImgSrc}
                          alt=""
                          aria-hidden="true"
                          loading="lazy"
                          className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-500 ease-out group-hover:opacity-100"
                        />
                      )}
                    </button>

                    {/* Real Product Title, Description & Tabular Price */}
                    <div className="mt-6">
                      <div className="flex items-baseline justify-between gap-3">
                        <Link
                          to={`/product/${prod.id}`}
                          state={{ previewProduct: prod }}
                          className="font-serif-editorial text-xl font-semibold text-[#FAF5EB] hover:text-[#E5C77A] transition-colors line-clamp-1"
                        >
                          {prod.name}
                        </Link>
                        <span className="font-serif-editorial text-xl font-semibold text-[#E5C77A] bazaro-tabular shrink-0">
                          ${(parseFloat(prod.price) || 0).toFixed(2)}
                        </span>
                      </div>
                      <p className="mt-1.5 text-xs text-[#FAF5EB]/68 leading-relaxed line-clamp-2">
                        {prod.description}
                      </p>
                    </div>

                    {/* Actions Row */}
                    <div className="pt-5 mt-5 border-t border-[#C59B4B]/20 flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => handleQuickAdd(prod)}
                        className={`bazaro-editorial-btn flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-full text-[11px] font-semibold uppercase tracking-[0.15em] transition-all cursor-pointer ${
                          addedId === prod.id
                            ? "bg-[#C59B4B] text-[#140E0A]"
                            : "bg-gradient-to-r from-[#C59B4B] to-[#E5C77A] text-[#140E0A] hover:brightness-110 shadow-md"
                        }`}
                      >
                        {addedId === prod.id ? (
                          <>
                            <FiCheck className="text-sm" />
                            <span>In Bag</span>
                          </>
                        ) : (
                          <>
                            <FiShoppingBag className="text-sm" />
                            <span>Acquire</span>
                          </>
                        )}
                      </button>

                      <Link
                        to={`/product/${prod.id}`}
                        state={{ previewProduct: prod }}
                        aria-label={`View details for ${prod.name}`}
                        className="inline-flex items-center gap-1 px-4 py-2.5 rounded-full border border-[#C59B4B]/40 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#E5C77A] hover:bg-[#C59B4B]/18 transition-colors"
                      >
                        <span>Inspect</span>
                        <FiArrowUpRight className="text-sm" />
                      </Link>
                    </div>
                  </article>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
};

export default OllaHero;
