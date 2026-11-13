import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { motion, useReducedMotion } from "framer-motion";
import apiClient from "../../Services/api-client";
import {
  FiArrowRight,
  FiBookOpen,
  FiBriefcase,
  FiCamera,
  FiChevronLeft,
  FiChevronRight,
  FiCpu,
  FiDroplet,
  FiGrid,
  FiHome,
  FiPause,
  FiPlay,
  FiShoppingBag,
  FiWatch,
} from "react-icons/fi";

const CATEGORY_ICON_RULES = [
  { match: /watch|horology|time/, icon: FiWatch },
  { match: /oud|fragrance|perfume|scent/, icon: FiDroplet },
  { match: /bag|leather|accessor|scarf/, icon: FiBriefcase },
  { match: /studio|camera|gaming|console/, icon: FiCamera },
  { match: /electronic|tech|gadget|audio/, icon: FiCpu },
  { match: /fashion|apparel|shoe|sneaker/, icon: FiShoppingBag },
  { match: /home|appliance|kitchen|coffee/, icon: FiHome },
  { match: /book|stationery|journal/, icon: FiBookOpen },
];

const getCategoryIcon = (name = "") => {
  const lower = String(name).toLowerCase();
  const found = CATEGORY_ICON_RULES.find((rule) => rule.match.test(lower));
  return found ? found.icon : FiGrid;
};

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isInteracting, setIsInteracting] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const prefersReduced = useReducedMotion();

  const trackRef = useRef(null);
  const rafRef = useRef(null);
  const settleTimerRef = useRef(null);
  const pendingTargetRef = useRef(null);
  const userInitiatedRef = useRef(false);
  const lastSettledRef = useRef(0);

  useEffect(() => {
    if (prefersReduced) {
      setIsAutoPlaying(false);
    }
  }, [prefersReduced]);

  useEffect(() => {
    apiClient
      .get("/categories/")
      .then((res) => {
        const data = Array.isArray(res.data)
          ? res.data
          : res.data?.results || [];
        setCategories(data);
      })
      .catch((err) => console.warn("Categories API error:", err))
      .finally(() => setLoading(false));
  }, []);

  const getNearestSlideIndex = useCallback(() => {
    const track = trackRef.current;
    if (!track || !track.children.length) return 0;

    const currentScroll = track.scrollLeft;
    const maxScroll = Math.max(0, track.scrollWidth - track.clientWidth);
    const children = Array.from(track.children);

    if (currentScroll >= maxScroll - 4 && maxScroll > 0) {
      return children.length - 1;
    }

    let closestIdx = 0;
    let minDiff = Infinity;
    children.forEach((child, idx) => {
      const targetPos = Math.min(child.offsetLeft, maxScroll);
      const diff = Math.abs(targetPos - currentScroll);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = idx;
      }
    });
    return closestIdx;
  }, []);

  const scrollToSlide = useCallback(
    (targetIdx, { userInitiated = false } = {}) => {
      const track = trackRef.current;
      if (!track || !track.children.length) return;

      const count = track.children.length;
      const wrapped = ((targetIdx % count) + count) % count;
      const maxScroll = Math.max(0, track.scrollWidth - track.clientWidth);
      const targetChild = track.children[wrapped];
      if (!targetChild) return;

      const nextLeft = Math.min(targetChild.offsetLeft, maxScroll);
      pendingTargetRef.current = wrapped;
      userInitiatedRef.current = userInitiated;
      setActiveIndex(wrapped);

      track.scrollTo({
        left: nextLeft,
        behavior: prefersReduced ? "auto" : "smooth",
      });
    },
    [prefersReduced]
  );

  const handleStep = useCallback(
    (direction, { userInitiated = true } = {}) => {
      const track = trackRef.current;
      if (!track || !track.children.length) return;

      const count = track.children.length;
      const maxScroll = Math.max(0, track.scrollWidth - track.clientWidth);
      const baseIdx =
        pendingTargetRef.current !== null
          ? pendingTargetRef.current
          : getNearestSlideIndex();

      if (direction > 0) {
        const atEnd =
          maxScroll > 0 &&
          track.scrollLeft >= maxScroll - 6 &&
          pendingTargetRef.current === null;
        if (atEnd || baseIdx >= count - 1) {
          scrollToSlide(0, { userInitiated });
          return;
        }
        // Advance past slides already pinned against the far-right scroll limit
        let nextIdx = baseIdx + 1;
        const currentTargetPos = Math.min(
          track.children[baseIdx]?.offsetLeft ?? 0,
          maxScroll
        );
        while (
          nextIdx < count - 1 &&
          Math.abs(
            Math.min(track.children[nextIdx].offsetLeft, maxScroll) -
              currentTargetPos
          ) < 6
        ) {
          nextIdx++;
        }
        if (
          Math.abs(
            Math.min(track.children[nextIdx].offsetLeft, maxScroll) -
              track.scrollLeft
          ) < 6 &&
          nextIdx >= count - 1
        ) {
          scrollToSlide(0, { userInitiated });
        } else {
          scrollToSlide(nextIdx, { userInitiated });
        }
      } else {
        const atStart =
          track.scrollLeft <= 6 && pendingTargetRef.current === null;
        if (atStart || baseIdx <= 0) {
          // Wrap to last meaningful scroll stop cleanly
          let wrapIdx = count - 1;
          while (
            wrapIdx > 0 &&
            Math.abs(
              Math.min(track.children[wrapIdx - 1].offsetLeft, maxScroll) -
                maxScroll
            ) < 6
          ) {
            wrapIdx--;
          }
          scrollToSlide(wrapIdx, { userInitiated });
          return;
        }
        let prevIdx = baseIdx - 1;
        const currentTargetPos = Math.min(
          track.children[baseIdx]?.offsetLeft ?? 0,
          maxScroll
        );
        while (
          prevIdx > 0 &&
          Math.abs(
            Math.min(track.children[prevIdx].offsetLeft, maxScroll) -
              currentTargetPos
          ) < 6
        ) {
          prevIdx--;
        }
        scrollToSlide(prevIdx, { userInitiated });
      }
    },
    [getNearestSlideIndex, scrollToSlide]
  );

  // Sync live markers via rAF + announce settled slide changes on scrollend
  useEffect(() => {
    const track = trackRef.current;
    if (!track || categories.length === 0) return;

    const handleSettled = () => {
      const settledIdx =
        pendingTargetRef.current !== null
          ? pendingTargetRef.current
          : getNearestSlideIndex();
      pendingTargetRef.current = null;

      setActiveIndex(settledIdx);

      if (userInitiatedRef.current && settledIdx !== lastSettledRef.current) {
        const slideTitle = categories[settledIdx]?.name || "Department";
        setStatusMessage(
          `Department ${settledIdx + 1} of ${categories.length}: ${slideTitle}`
        );
      }
      lastSettledRef.current = settledIdx;
      userInitiatedRef.current = false;
    };

    const onScroll = () => {
      if (pendingTargetRef.current === null) {
        if (!rafRef.current) {
          rafRef.current = requestAnimationFrame(() => {
            rafRef.current = null;
            const nearest = getNearestSlideIndex();
            setActiveIndex((prev) => (prev === nearest ? prev : nearest));
          });
        }
      }
      if (!("onscrollend" in window)) {
        clearTimeout(settleTimerRef.current);
        settleTimerRef.current = setTimeout(handleSettled, 130);
      }
    };

    const onScrollEnd = () => {
      handleSettled();
    };

    track.addEventListener("scroll", onScroll, { passive: true });
    if ("onscrollend" in window) {
      track.addEventListener("scrollend", onScrollEnd, { passive: true });
    }

    return () => {
      track.removeEventListener("scroll", onScroll);
      if ("onscrollend" in window) {
        track.removeEventListener("scrollend", onScrollEnd);
      }
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      clearTimeout(settleTimerRef.current);
    };
  }, [categories, getNearestSlideIndex]);

  // Smooth auto-slide timer (pauses on user interaction or prefers-reduced-motion)
  useEffect(() => {
    if (
      !isAutoPlaying ||
      isInteracting ||
      prefersReduced ||
      categories.length <= 1
    ) {
      return;
    }

    const timer = setInterval(() => {
      handleStep(1, { userInitiated: false });
    }, 3600);

    return () => clearInterval(timer);
  }, [isAutoPlaying, isInteracting, prefersReduced, categories.length, handleStep]);

  const handleTrackKeyDown = (e) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      handleStep(1, { userInitiated: true });
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      handleStep(-1, { userInitiated: true });
    }
  };

  return (
    <section
      id="categories"
      className="w-full py-12 sm:py-16 bg-[#FAF5EB] border-b border-[#C59B4B]/20"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12">
        <div
          role="region"
          aria-roledescription="carousel"
          aria-label="Curated departments"
          onMouseEnter={() => setIsInteracting(true)}
          onMouseLeave={() => setIsInteracting(false)}
          onFocus={() => setIsInteracting(true)}
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget)) {
              setIsInteracting(false);
            }
          }}
        >
          {/* Luxury Editorial Header + Native Carousel Controls (Controls before Track in DOM order) */}
          <div className="w-full flex flex-col md:flex-row justify-between items-start md:items-end mb-7 sm:mb-9 gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#1A1410] text-[#E5C77A] border border-[#C59B4B]/32 text-[10px] font-semibold uppercase tracking-[0.22em] mb-2.5">
                <span className="w-1.5 h-1.5 rotate-45 bg-[#E5C77A]" aria-hidden="true" />
                <span>Royal Chambers &bull; {categories.length || 8} Departments</span>
              </div>
              <h2 className="font-serif-editorial text-3xl sm:text-4xl font-semibold text-[#1A1410] tracking-[-0.015em]">
                Explore Curated Departments
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 self-stretch md:self-auto justify-between md:justify-end">
              {!loading && categories.length > 1 && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleStep(-1, { userInitiated: true })}
                    aria-label="Previous department"
                    className="bazaro-touch-control w-10 h-10 rounded-full border border-[#C59B4B]/40 bg-white hover:bg-[#1A1410] text-[#1A1410] hover:text-[#E5C77A] hover:border-[#1A1410] flex items-center justify-center shadow-xs transition-all cursor-pointer active:scale-95"
                  >
                    <FiChevronLeft className="text-lg" aria-hidden="true" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsAutoPlaying((prev) => !prev)}
                    aria-pressed={!isAutoPlaying}
                    aria-label={
                      isAutoPlaying
                        ? "Pause automatic department slider"
                        : "Resume automatic department slider"
                    }
                    className="bazaro-touch-control h-10 px-3.5 rounded-full border border-[#C59B4B]/40 bg-white hover:bg-[#1A1410] text-[#9B742C] hover:text-[#E5C77A] flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider shadow-xs transition-all cursor-pointer"
                  >
                    {isAutoPlaying ? (
                      <>
                        <FiPause className="text-xs" aria-hidden="true" />
                        <span className="hidden sm:inline">Auto</span>
                      </>
                    ) : (
                      <>
                        <FiPlay className="text-xs" aria-hidden="true" />
                        <span className="hidden sm:inline">Paused</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleStep(1, { userInitiated: true })}
                    aria-label="Next department"
                    className="bazaro-touch-control w-10 h-10 rounded-full border border-[#C59B4B]/40 bg-white hover:bg-[#1A1410] text-[#1A1410] hover:text-[#E5C77A] hover:border-[#1A1410] flex items-center justify-center shadow-xs transition-all cursor-pointer active:scale-95"
                  >
                    <FiChevronRight className="text-lg" aria-hidden="true" />
                  </button>
                </div>
              )}

              <Link
                to="/shop"
                className="group inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 rounded-full text-xs sm:text-sm font-bold text-[#140E0A] bg-gradient-to-r from-[#C59B4B] to-[#E5C77A] hover:shadow-[0_12px_28px_rgba(197,155,75,0.35)] transition-all duration-300 hover:-translate-y-0.5 touch-manipulation"
              >
                <span>View All Chambers</span>
                <FiArrowRight
                  className="text-sm transition-transform duration-200 group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </Link>
            </div>
          </div>

          {/* Single-Row Container-Responsive Slider */}
          {loading ? (
            <div className="bazaro-cat-shell">
              <div className="bazaro-cat-track">
                {[1, 2, 3, 4].map((n) => (
                  <div
                    key={n}
                    className="bazaro-cat-slide p-6 rounded-3xl bg-white/70 border border-[#C59B4B]/20 animate-pulse flex flex-col items-center min-h-[224px]"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-[#E5C77A]/20 mb-4" />
                    <div className="h-4 bg-[#E5C77A]/20 rounded w-32 mb-2" />
                    <div className="h-3 bg-[#E5C77A]/15 rounded w-40" />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bazaro-cat-shell">
              <div
                ref={trackRef}
                tabIndex={0}
                role="group"
                aria-label="Department slides"
                onKeyDown={handleTrackKeyDown}
                onPointerDown={() => {
                  userInitiatedRef.current = true;
                  setIsInteracting(true);
                }}
                onPointerUp={() => setIsInteracting(false)}
                onPointerCancel={() => setIsInteracting(false)}
                onTouchEnd={() => setIsInteracting(false)}
                className="bazaro-cat-track rounded-2xl"
              >
                {categories.map((cat, idx) => {
                  const IconComponent = getCategoryIcon(cat.name);
                  const isActive = idx === activeIndex;

                  return (
                    <motion.div
                      key={cat.id || idx}
                      role="group"
                      aria-roledescription="slide"
                      aria-label={`${idx + 1} of ${categories.length}: ${cat.name}`}
                      initial={prefersReduced ? false : { opacity: 0, y: 16 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.2 }}
                      transition={{ duration: 0.4, delay: Math.min(idx, 3) * 0.06 }}
                      className="bazaro-cat-slide"
                    >
                      <div
                        className={`h-full rounded-[24px] bg-[#FDF9F1] border transition-colors duration-300 ${
                          isActive
                            ? "border-[#C59B4B]/65 shadow-[0_14px_34px_-16px_rgba(197,155,75,0.28)]"
                            : "border-[#C59B4B]/22 hover:border-[#C59B4B]/60"
                        }`}
                      >
                        <Link
                          to={`/shop?category=${encodeURIComponent(
                            cat.name?.toLowerCase()
                          )}`}
                          className="p-6 sm:p-7 flex flex-col items-center text-center group h-full justify-between relative"
                        >
                          <span className="absolute top-4 right-5 text-[10px] font-semibold bazaro-tabular tracking-[0.2em] text-[#9B742C]/70">
                            {String(idx + 1).padStart(2, "0")}
                          </span>

                          <div className="w-14 h-14 rounded-2xl bg-[#1A1410] border border-[#C59B4B]/40 flex items-center justify-center text-2xl text-[#E5C77A] mb-3 group-hover:scale-105 transition-transform duration-300">
                            <IconComponent aria-hidden="true" />
                          </div>

                          <div className="flex-grow flex flex-col justify-center">
                            <h3 className="font-serif-editorial text-lg sm:text-xl font-semibold text-[#1A1410] group-hover:text-[#8E6A28] transition-colors capitalize leading-snug">
                              {cat.name}
                            </h3>
                            <p className="text-xs text-[#5C4E41] mt-1.5 line-clamp-2">
                              {cat.description ||
                                `${cat.product_count || 10} royal selections available`}
                            </p>
                          </div>

                          <span className="mt-5 pt-3 border-t border-[#C59B4B]/14 w-full inline-flex items-center justify-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8E6A28] group-hover:text-[#1A1410] transition-colors">
                            <span>Enter Chamber</span>
                            <FiArrowRight
                              className="text-xs transition-transform group-hover:translate-x-1"
                              aria-hidden="true"
                            />
                          </span>
                        </Link>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Screen Reader Live Region */}
              <p className="visually-hidden" role="status" aria-live="polite">
                {statusMessage}
              </p>

              {/* Accessible Slide Marker Pagination Pills */}
              {categories.length > 1 && (
                <nav
                  className="mt-5 flex items-center justify-center gap-2"
                  aria-label="Choose a department slide"
                >
                  {categories.map((cat, idx) => {
                    const isCurrent = idx === activeIndex;
                    return (
                      <button
                        key={cat.id || idx}
                        type="button"
                        onClick={() => scrollToSlide(idx, { userInitiated: true })}
                        aria-label={`Go to ${cat.name} (${idx + 1} of ${categories.length})`}
                        aria-current={isCurrent ? "true" : undefined}
                        className={`bazaro-marker-dot h-2 rounded-full transition-all duration-300 ${
                          isCurrent
                            ? "w-7 bg-[#9B742C]"
                            : "w-2.5 bg-[#C59B4B]/35 hover:bg-[#C59B4B]/70"
                        }`}
                      />
                    );
                  })}
                </nav>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default Categories;
