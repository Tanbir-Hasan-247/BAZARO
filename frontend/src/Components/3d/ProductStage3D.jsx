import React, { useRef } from "react";
import { Link, useNavigate } from "react-router";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import {
  FiArrowUpRight,
  FiCheck,
  FiChevronLeft,
  FiChevronRight,
  FiPause,
  FiPlay,
  FiShoppingBag,
} from "react-icons/fi";
import defaultProductImg from "../../assets/default-product.png";
import { navigateWithTransition } from "../../utils/viewTransition";

const ProductStage3D = ({
  products = [],
  activeIndex = 0,
  onSelectIndex,
  onAddToCart,
  addedId = null,
  isPaused = false,
  onTogglePause,
}) => {
  const navigate = useNavigate();
  const stageRef = useRef(null);
  const showcaseImgRef = useRef(null);
  const prefersReduced = useReducedMotion();

  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);

  const springConfig = { stiffness: 190, damping: 24, mass: 0.6 };
  const rotateY = useSpring(
    useTransform(pointerX, [-0.5, 0.5], [-13, 13]),
    springConfig
  );
  const rotateX = useSpring(
    useTransform(pointerY, [-0.5, 0.5], [10, -10]),
    springConfig
  );

  if (!products.length) return null;

  const safeIndex = ((activeIndex % products.length) + products.length) % products.length;
  const activeProduct = products[safeIndex];

  const prevIndex = (safeIndex - 1 + products.length) % products.length;
  const nextIndex = (safeIndex + 1) % products.length;

  const handlePointerMove = (e) => {
    const el = stageRef.current;
    if (!el || prefersReduced) return;
    const rect = el.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width - 0.5;
    const ny = (e.clientY - rect.top) / rect.height - 0.5;
    pointerX.set(nx);
    pointerY.set(ny);
    el.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
    el.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
  };

  const handlePointerLeave = () => {
    pointerX.set(0);
    pointerY.set(0);
  };

  const handlePrev = () => onSelectIndex(prevIndex);
  const handleNext = () => onSelectIndex(nextIndex);

  return (
    <div
      ref={stageRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className="relative z-20 flex flex-col justify-between h-full w-full p-4 sm:p-6 select-none"
    >
      {/* Top Studio Controls Bar: Atelier Stage Label + Accessible Pause/Play Control */}
      <div className="flex items-center justify-between gap-2 z-30">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0D0A08]/80 border border-[#C59B4B]/30 backdrop-blur-md">
          <span className="w-1.5 h-1.5 rotate-45 bg-[#E5C77A]" aria-hidden="true" />
          <span className="text-[10px] font-semibold tracking-[0.22em] uppercase text-[#E5C77A]">
            Interactive Studio Stage
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Previous featured product"
            className="w-8 h-8 rounded-full bg-[#0D0A08]/85 border border-[#C59B4B]/40 hover:border-[#E5C77A] hover:bg-[#C59B4B]/20 text-[#FAF5EB] flex items-center justify-center transition-all cursor-pointer"
          >
            <FiChevronLeft className="text-sm" />
          </button>

          <button
            type="button"
            onClick={onTogglePause}
            aria-label={isPaused ? "Play 3D showcase orbit" : "Pause 3D showcase orbit"}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0D0A08]/85 border border-[#C59B4B]/40 hover:border-[#E5C77A] hover:bg-[#C59B4B]/20 text-[#E5C77A] text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer"
          >
            {isPaused ? (
              <>
                <FiPlay className="text-xs" />
                <span>Play</span>
              </>
            ) : (
              <>
                <FiPause className="text-xs" />
                <span>Pause</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleNext}
            aria-label="Next featured product"
            className="w-8 h-8 rounded-full bg-[#0D0A08]/85 border border-[#C59B4B]/40 hover:border-[#E5C77A] hover:bg-[#C59B4B]/20 text-[#FAF5EB] flex items-center justify-center transition-all cursor-pointer"
          >
            <FiChevronRight className="text-sm" />
          </button>
        </div>
      </div>

      {/* CENTER: 3D Depth Floating Real Product Pedestal Card */}
      <div className="bazaro-3d-stage relative flex-1 flex items-center justify-center my-3 sm:my-4">
        {/* Background Left Orbit Card (3D angled side preview) */}
        {products.length > 2 && (
          <button
            type="button"
            onClick={handlePrev}
            aria-label={`Select ${products[prevIndex].name}`}
            className="hidden sm:flex flex-col items-center justify-center absolute left-1 lg:left-2 w-24 h-32 rounded-2xl border border-[#C59B4B]/30 bg-[#140E0A]/75 backdrop-blur-md p-2 opacity-70 hover:opacity-100 hover:border-[#E5C77A]/70 transition-all duration-300 cursor-pointer z-10"
            style={{
              transform: "perspective(1100px) rotateY(26deg) translateZ(-65px) scale(0.88)",
            }}
          >
            <img
              src={products[prevIndex].image || defaultProductImg}
              alt={products[prevIndex].name}
              loading="lazy"
              fetchPriority="low"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = defaultProductImg;
              }}
              className="w-16 h-16 object-contain rounded-lg"
            />
            <span className="mt-1.5 text-[9px] font-bold text-[#E5C77A] line-clamp-1 w-full text-center">
              ${(parseFloat(products[prevIndex].price) || 0).toFixed(0)}
            </span>
          </button>
        )}

        {/* Flagship Active 3D Depth Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeProduct.id}
            initial={
              prefersReduced
                ? false
                : { opacity: 0, scale: 0.9, rotateY: -18 }
            }
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            exit={
              prefersReduced
                ? { opacity: 0 }
                : { opacity: 0, scale: 0.9, rotateY: 18 }
            }
            transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
            style={
              prefersReduced
                ? undefined
                : {
                    rotateX,
                    rotateY,
                    transformStyle: "preserve-3d",
                  }
            }
            drag={prefersReduced ? false : "x"}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.18}
            onDragEnd={(_, info) => {
              if (info.offset.x < -45) handleNext();
              else if (info.offset.x > 45) handlePrev();
            }}
            className="bazaro-3d-preserve bazaro-spotlight-stage group relative w-[min(82vw,285px)] sm:w-[285px] lg:w-[300px] rounded-t-[130px] rounded-b-3xl border border-[#E5C77A]/45 bg-gradient-to-b from-[#231912]/90 via-[#16100C]/92 to-[#0D0A08]/95 p-4 pt-6 shadow-[0_30px_70px_rgba(0,0,0,0.75)] cursor-grab active:cursor-grabbing z-20"
          >
            {/* Reveal Layer (interactive-content-reveal) */}
            <div
              aria-hidden="true"
              className="reveal-layer pointer-events-none absolute inset-0 rounded-[inherit] z-10"
            />

            {/* Depth Layer 0: Subtle Gold Inner Arch Backdrop */}
            <div
              aria-hidden="true"
              className="bazaro-3d-layer-back pointer-events-none absolute inset-3 rounded-t-[120px] rounded-b-2xl border border-[#C59B4B]/20 bg-[radial-gradient(circle_at_50%_40%,_rgba(229,199,122,0.18),_transparent_70%)]"
            />

            {/* Depth Layer 2: Floating 3D Category & Price Jewels */}
            <div
              className="bazaro-3d-layer-front relative z-30 flex items-center justify-between px-1 mb-2"
            >
              <span className="px-2.5 py-1 rounded-full bg-[#0D0A08]/85 border border-[#C59B4B]/38 text-[9px] font-semibold tracking-[0.18em] uppercase text-[#E5C77A]">
                {activeProduct.categoryName || "BAZARO"}
              </span>

              <span className="px-3 py-1 rounded-full bg-gradient-to-r from-[#C59B4B] to-[#E5C77A] text-[#140E0A] text-xs font-bold bazaro-tabular">
                ${(parseFloat(activeProduct.price) || 0).toFixed(2)}
              </span>
            </div>

            {/* Depth Layer 1: High-Priority Floating Real Product Photo */}
            <button
              type="button"
              onClick={() =>
                navigateWithTransition(navigate, `/product/${activeProduct.id}`, {
                  previewProduct: activeProduct,
                  imageElement: showcaseImgRef.current,
                })
              }
              aria-label={`Inspect ${activeProduct.name}`}
              className="bazaro-3d-layer-mid relative z-20 flex items-center justify-center w-full h-40 sm:h-48 my-1 rounded-2xl bg-gradient-to-b from-[#FAF5EB] to-[#F3EAD8] p-3 shadow-[0_18px_38px_rgba(0,0,0,0.45)] border border-[#E5C77A]/30 overflow-hidden cursor-pointer"
            >
              <img
                ref={showcaseImgRef}
                src={activeProduct.image || defaultProductImg}
                alt={activeProduct.name}
                fetchPriority="high"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = defaultProductImg;
                }}
                className="w-full h-full object-contain drop-shadow-[0_14px_20px_rgba(20,14,10,0.3)] group-hover:scale-105 transition-transform duration-500 ease-out"
              />
            </button>

            {/* Depth Layer 2: Product Name & Actions Plaque */}
            <div className="bazaro-3d-layer-front relative z-30 mt-3 text-center">
              <button
                type="button"
                onClick={() =>
                  navigateWithTransition(navigate, `/product/${activeProduct.id}`, {
                    previewProduct: activeProduct,
                    imageElement: showcaseImgRef.current,
                  })
                }
                className="font-serif-editorial block w-full text-center text-base sm:text-lg font-semibold text-[#FAF5EB] hover:text-[#E5C77A] transition-colors line-clamp-1 cursor-pointer"
              >
                {activeProduct.name}
              </button>
              <p className="text-[11px] text-[#FAF5EB]/65 line-clamp-1 mt-0.5 px-1">
                {activeProduct.description || "Verified BAZARO Masterpiece"}
              </p>

              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onAddToCart(activeProduct)}
                  className={`bazaro-editorial-btn flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-full text-[11px] font-semibold uppercase tracking-[0.12em] transition-all cursor-pointer ${
                    addedId === activeProduct.id
                      ? "bg-[#C59B4B] text-[#140E0A]"
                      : "bg-gradient-to-r from-[#C59B4B] to-[#E5C77A] text-[#140E0A] hover:brightness-110 shadow-md"
                  }`}
                >
                  {addedId === activeProduct.id ? (
                    <>
                      <FiCheck className="text-xs" />
                      <span>Added to Bag</span>
                    </>
                  ) : (
                    <>
                      <FiShoppingBag className="text-xs" />
                      <span>Acquire</span>
                    </>
                  )}
                </button>

                <Link
                  to={`/product/${activeProduct.id}`}
                  state={{ previewProduct: activeProduct }}
                  aria-label={`Inspect ${activeProduct.name}`}
                  className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-[#C59B4B]/45 bg-[#1A1410] hover:bg-[#E5C77A] text-[#E5C77A] hover:text-[#140E0A] transition-colors"
                >
                  <FiArrowUpRight className="text-sm" />
                </Link>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Background Right Orbit Card (3D angled side preview) */}
        {products.length > 1 && (
          <button
            type="button"
            onClick={handleNext}
            aria-label={`Select ${products[nextIndex].name}`}
            className="hidden sm:flex flex-col items-center justify-center absolute right-1 lg:right-2 w-24 h-32 rounded-2xl border border-[#C59B4B]/30 bg-[#140E0A]/75 backdrop-blur-md p-2 opacity-70 hover:opacity-100 hover:border-[#E5C77A]/70 transition-all duration-300 cursor-pointer z-10"
            style={{
              transform: "perspective(1100px) rotateY(-26deg) translateZ(-65px) scale(0.88)",
            }}
          >
            <img
              src={products[nextIndex].image || defaultProductImg}
              alt={products[nextIndex].name}
              loading="lazy"
              fetchPriority="low"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = defaultProductImg;
              }}
              className="w-16 h-16 object-contain rounded-lg"
            />
            <span className="mt-1.5 text-[9px] font-bold text-[#E5C77A] line-clamp-1 w-full text-center">
              ${(parseFloat(products[nextIndex].price) || 0).toFixed(0)}
            </span>
          </button>
        )}
      </div>

      {/* BOTTOM: 3D Orbital Product Dock Selector Strip */}
      <div className="relative z-30 flex items-center justify-center gap-2 overflow-x-auto pb-1 touch-pan-x [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {products.slice(0, 6).map((item, idx) => {
          const isActive = idx === safeIndex;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectIndex(idx)}
              aria-label={`Showcase ${item.name}`}
              className={`group relative flex items-center gap-2 px-2 py-1.5 rounded-xl border transition-all cursor-pointer shrink-0 ${
                isActive
                  ? "bg-[#E5C77A]/15 border-[#E5C77A] shadow-[0_0_20px_rgba(229,199,122,0.25)] scale-105"
                  : "bg-[#120D0A]/80 border-[#C59B4B]/25 opacity-70 hover:opacity-100 hover:border-[#C59B4B]/60"
              }`}
            >
              <img
                src={item.image || defaultProductImg}
                alt=""
                loading="lazy"
                fetchPriority="low"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = defaultProductImg;
                }}
                className="w-7 h-7 rounded-lg object-cover bg-[#FAF5EB]"
              />
              <span className="hidden md:inline text-[10px] font-semibold text-[#FAF5EB] max-w-[82px] truncate">
                {item.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ProductStage3D;
