import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { FiArrowRight, FiCheck, FiShoppingBag } from "react-icons/fi";
import defaultProductImg from "../../assets/default-product.png";
import { useCart } from "../../context/CartContext";
import apiClient from "../../Services/api-client";
import { DEFAULT_PRODUCTS } from "../../Services/default-data";
import { navigateWithTransition } from "../../utils/viewTransition";

const AtelierLookbook = () => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const showcaseImgRef = useRef(null);

  const [editions, setEditions] = useState(DEFAULT_PRODUCTS.slice(0, 4));
  const [activeIndex, setActiveIndex] = useState(0);
  const [addedFeedback, setAddedFeedback] = useState(false);

  useEffect(() => {
    let active = true;
    apiClient
      .get("/products/")
      .then((res) => {
        if (!active) return;
        const list = Array.isArray(res.data)
          ? res.data
          : res.data?.results || [];
        if (list.length > 0) {
          // Pick up to 4 signature editions, prioritizing higher-priced atelier pieces with images
          const withMedia = list.filter(
            (p) => p?.images?.length > 0 || p?.image
          );
          const source = withMedia.length >= 4 ? withMedia : list;
          const sorted = [...source].sort(
            (a, b) => (parseFloat(b.price) || 0) - (parseFloat(a.price) || 0)
          );
          setEditions(sorted.slice(0, 4));
        }
      })
      .catch(() => {
        // Retain fallback DEFAULT_PRODUCTS silently
      });

    return () => {
      active = false;
    };
  }, []);

  const activeItem = editions[activeIndex] || editions[0] || DEFAULT_PRODUCTS[0];
  const imgUrl =
    activeItem?.images?.[0]?.image_url ||
    activeItem?.images?.[0]?.image ||
    activeItem?.image ||
    defaultProductImg;
  const secondaryUrl =
    activeItem?.images?.[1]?.image_url || activeItem?.images?.[1]?.image || null;
  const price = parseFloat(activeItem?.price) || 0;
  const inStock = (Number(activeItem?.stock) || 0) > 0;

  const handleInspect = () => {
    if (!activeItem?.id) return;
    navigateWithTransition(navigate, `/product/${activeItem.id}`, {
      previewProduct: activeItem,
      imageElement: showcaseImgRef.current,
    });
  };

  const handleAcquire = () => {
    if (!inStock) return;
    addToCart(activeItem, 1);
    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 1600);
  };

  return (
    <section
      aria-label="Maison Atelier Lookbook"
      className="relative overflow-hidden bg-[#0D0A08] bazaro-grain text-[#FAF5EB] py-16 sm:py-24 px-4 sm:px-6 lg:px-8 border-y border-[#C59B4B]/20"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 left-1/4 w-[520px] h-[360px] rounded-full blur-[130px] opacity-15"
        style={{ background: "radial-gradient(circle, #C59B4B, transparent 70%)" }}
      />

      <div className="relative z-10 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
        {/* Left: Editorial Folio Narrative & Selector */}
        <div className="lg:col-span-6 space-y-8">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#C59B4B]">
              Atelier Lookbook &bull; House Dossier
            </p>
            <h2 className="mt-3 font-serif-editorial text-3xl sm:text-5xl font-semibold text-[#FDF9F1] leading-[1.06] tracking-[-0.015em]">
              Objects Crafted for{" "}
              <span className="italic font-normal text-[#E5C77A]">
                Quiet Permanence.
              </span>
            </h2>
            <p className="mt-4 text-sm sm:text-base text-[#B8AB98] leading-relaxed max-w-xl">
              An intimate study of our highest-grade vault acquisitions &mdash; from
              sapphire-crystal horology to extrait de parfum aged in oak.
            </p>
          </div>

          {/* Curated Edition Index Tabs */}
          <div className="border-y border-[#C59B4B]/20 divide-y divide-[#C59B4B]/15">
            {editions.map((edition, idx) => {
              const isSelected = idx === activeIndex;
              return (
                <button
                  key={edition.id || idx}
                  type="button"
                  onClick={() => {
                    setActiveIndex(idx);
                    setAddedFeedback(false);
                  }}
                  aria-current={isSelected ? "true" : undefined}
                  className={`w-full py-4 px-3 -mx-3 rounded-xl text-left flex items-center justify-between gap-4 transition-colors ${
                    isSelected
                      ? "bg-[#1A1410] text-[#FDF9F1]"
                      : "text-[#A99B87] hover:text-[#FDF9F1] hover:bg-[#14100C]"
                  }`}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <span className="font-serif-editorial italic text-xl text-[#C59B4B] bazaro-tabular w-7 shrink-0">
                      0{idx + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="font-serif-editorial text-lg sm:text-xl font-semibold truncate">
                        {edition.name}
                      </p>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-[#9A8C78] truncate">
                        {edition.category_name ||
                          edition.category?.name ||
                          "Private Edition"}
                      </p>
                    </div>
                  </div>
                  <span className="font-serif-editorial text-lg font-semibold text-[#E5C77A] bazaro-tabular shrink-0">
                    ${(parseFloat(edition.price) || 0).toFixed(2)}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active Piece Actions */}
          <div className="flex flex-wrap items-center gap-3.5">
            <button
              type="button"
              onClick={handleInspect}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#C59B4B] hover:bg-[#E5C77A] text-[#14100D] text-xs font-semibold uppercase tracking-[0.18em] transition-colors"
            >
              Inspect Dossier
              <FiArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={handleAcquire}
              disabled={!inStock}
              className="bazaro-editorial-btn inline-flex items-center gap-2 px-6 py-3 rounded-full border border-[#C59B4B]/40 text-[#F6E3B4] hover:bg-[#1C1611] disabled:opacity-45 text-xs font-semibold uppercase tracking-[0.18em] transition-colors"
            >
              {addedFeedback ? (
                <>
                  <FiCheck className="w-3.5 h-3.5 text-[#E5C77A]" />
                  Reserved in Bag
                </>
              ) : (
                <>
                  <FiShoppingBag className="w-3.5 h-3.5 text-[#E5C77A]" />
                  {inStock ? "Acquire Edition" : "Allocated"}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right: Asymmetric Museum Exhibition Frame */}
        <div className="lg:col-span-6">
          <div className="relative rounded-[26px] border border-[#C59B4B]/24 bg-[#15110E] p-4 sm:p-6">
            <div
              onClick={handleInspect}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleInspect();
                }
              }}
              aria-label={`View ${activeItem?.name}`}
              className="group relative aspect-[4/5] w-full overflow-hidden rounded-[18px] bg-[#0B0907] cursor-pointer"
            >
              <img
                ref={showcaseImgRef}
                src={imgUrl}
                alt={activeItem?.name || "Atelier edition"}
                onError={(e) => {
                  e.currentTarget.src = defaultProductImg;
                }}
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.035]"
              />
              {secondaryUrl && (
                <img
                  src={secondaryUrl}
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-500 ease-out group-hover:opacity-100"
                />
              )}

              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#0D0A08]/85 via-[#0D0A08]/25 to-transparent"
              />

              <div className="absolute inset-x-5 bottom-5 flex items-end justify-between gap-4">
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#E5C77A]">
                    No. 0{activeIndex + 1} &bull;{" "}
                    {activeItem?.category_name ||
                      activeItem?.category?.name ||
                      "Atelier"}
                  </span>
                  <h3 className="mt-0.5 font-serif-editorial text-2xl sm:text-3xl font-semibold text-[#FDF9F1]">
                    {activeItem?.name}
                  </h3>
                </div>
                <span className="font-serif-editorial text-2xl font-semibold text-[#E5C77A] bazaro-tabular shrink-0">
                  ${price.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AtelierLookbook;
