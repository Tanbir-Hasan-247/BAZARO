import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { motion, useReducedMotion } from "framer-motion";
import { FiClock, FiTag, FiCheck, FiArrowRight, FiAward } from "react-icons/fi";
import apiClient from "../../Services/api-client";
import {
  DEFAULT_CAMPAIGN_CONFIG,
  normalizeCampaignConfig,
} from "../../data/defaultCampaignConfig";

function computeRemainingFromIso(isoTarget) {
  if (!isoTarget) return null;
  let targetMs;
  if (typeof globalThis.Temporal !== "undefined") {
    try {
      targetMs = Number(
        globalThis.Temporal.Instant.from(isoTarget).epochMilliseconds
      );
    } catch {
      targetMs = Date.parse(isoTarget);
    }
  } else {
    targetMs = Date.parse(isoTarget);
  }
  if (!Number.isFinite(targetMs)) return null;
  const diffSec = Math.max(0, Math.floor((targetMs - Date.now()) / 1000));
  const days = Math.floor(diffSec / 86400);
  const hours = Math.floor((diffSec % 86400) / 3600);
  const minutes = Math.floor((diffSec % 3600) / 60);
  const seconds = diffSec % 60;
  return { days, hours, minutes, seconds, expired: diffSec === 0 };
}

const FlashSale = () => {
  const stageRef = useRef(null);
  const prefersReduced = useReducedMotion();
  const [campaign, setCampaign] = useState(DEFAULT_CAMPAIGN_CONFIG);
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 11,
    minutes: 42,
    seconds: 19,
  });

  useEffect(() => {
    let active = true;
    apiClient
      .get("/campaign-settings/")
      .then((res) => {
        if (active && res.data) {
          setCampaign(normalizeCampaignConfig(res.data));
        }
      })
      .catch(() => {});

    const handleUpdate = (ev) => {
      if (ev?.detail) {
        setCampaign(normalizeCampaignConfig(ev.detail));
      }
    };
    window.addEventListener("bazaro:campaign-updated", handleUpdate);
    return () => {
      active = false;
      window.removeEventListener("bazaro:campaign-updated", handleUpdate);
    };
  }, []);

  useEffect(() => {
    if (campaign.flash_ends_at) {
      const syncRealTarget = () => {
        const computed = computeRemainingFromIso(campaign.flash_ends_at);
        if (computed) {
          setTimeLeft(computed);
        }
      };
      syncRealTarget();
      const timer = setInterval(syncRealTarget, 1000);
      return () => clearInterval(timer);
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: 59, seconds: 59 };
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return { days: 0, hours: 12, minutes: 0, seconds: 0 };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [campaign.flash_ends_at]);

  if (!campaign.flash_enabled) {
    return null;
  }

  const couponText = campaign.flash_coupon_code || "BAZARO20";

  const handleCopy = () => {
    navigator.clipboard?.writeText(couponText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePointerMove = (e) => {
    const el = stageRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
    el.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
  };

  const timeUnits = [
    ...(timeLeft.days > 0
      ? [{ label: "Days", value: timeLeft.days, highlight: false }]
      : []),
    { label: "Hours", value: timeLeft.hours, highlight: false },
    { label: "Mins", value: timeLeft.minutes, highlight: false },
    { label: "Secs", value: timeLeft.seconds, highlight: true },
  ];

  const ctaTo = campaign.flash_cta_to || "/shop?filter=deals";
  const isExternal = /^https?:\/\//i.test(ctaTo);

  return (
    <section
      id="flash-sale"
      className="w-full py-10 sm:py-16 bg-[#FAF5EB] border-b border-[#C59B4B]/20"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12">
        <div
          ref={stageRef}
          data-surface="dark"
          onPointerMove={handlePointerMove}
          className="bazaro-spotlight-stage bazaro-grain relative overflow-hidden rounded-[2rem] border border-[#C59B4B]/32 bg-gradient-to-br from-[#140E0A] via-[#1C1510] to-[#0D0A08] text-[#FAF5EB] p-5 sm:p-11 shadow-[0_25px_70px_-20px_rgba(20,14,10,0.65)]"
        >
          {/* Decorative Royal Corner Filigree */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-[#C59B4B]/50 rounded-tl-xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-[#C59B4B]/50 rounded-br-xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-24 -top-24 w-96 h-96 rounded-full bg-[#C59B4B]/15 blur-3xl"
          />

          {/* Interactive Content Reveal Layer */}
          <div
            aria-hidden="true"
            className="reveal-layer pointer-events-none absolute inset-0 z-0"
          />

          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8 sm:gap-12">
            {/* Left Content */}
            <div className="max-w-xl text-center lg:text-left space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#C59B4B]/12 border border-[#C59B4B]/35 text-[#E5C77A] text-[10px] font-semibold uppercase tracking-[0.24em]">
                <FiAward className="text-xs" aria-hidden="true" />
                <span>{campaign.flash_badge}</span>
              </div>

              <h2 className="font-serif-editorial text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-[-0.015em] leading-[1.08] text-[#FAF5EB]">
                {campaign.flash_title}{" "}
                <span className="text-liquid-gold italic font-normal">
                  {campaign.flash_highlight}
                </span>
              </h2>

              <p className="text-xs sm:text-sm text-[#FAF5EB]/75 leading-relaxed">
                {campaign.flash_description}
              </p>

              {/* Coupon Code Interactive Pill */}
              {couponText && (
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-2">
                  <div className="flex items-center gap-2.5 bg-[#0D0A08]/75 px-4 py-2 rounded-full border border-[#C59B4B]/35 text-xs">
                    <FiTag className="text-[#E5C77A]" aria-hidden="true" />
                    <span className="text-[#FAF5EB]/70 font-medium">
                      Vault Key:
                    </span>
                    <strong className="tracking-[0.2em] font-bold text-[#E5C77A] bazaro-tabular">
                      {couponText}
                    </strong>
                  </div>

                  <button
                    type="button"
                    onClick={handleCopy}
                    className="bazaro-editorial-btn px-4 py-2 rounded-full bg-gradient-to-r from-[#C59B4B] to-[#E5C77A] hover:brightness-110 text-[#140E0A] text-xs font-semibold transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                  >
                    {copied ? (
                      <>
                        <FiCheck className="text-sm" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <span>Copy Vault Key</span>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Right: Live Animated Countdown Vault + CTA */}
            <div className="flex flex-col items-center gap-4 sm:gap-5 bg-[#0D0A08]/68 backdrop-blur-xl p-5 sm:p-7 rounded-3xl border border-[#C59B4B]/30 w-full sm:w-auto shrink-0 shadow-2xl">
              <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#E5C77A] flex items-center gap-2">
                <FiClock className="text-xs" aria-hidden="true" />
                <span>{timeLeft.expired ? "Vault Window Concluded" : "Vault Closes In"}</span>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-3.5">
                {timeUnits.map((unit, i) => (
                  <React.Fragment key={unit.label}>
                    <div className="flex flex-col items-center bg-gradient-to-b from-[#231B15] to-[#140E0A] border border-[#C59B4B]/30 rounded-2xl px-2.5 sm:px-3.5 py-2 sm:py-2.5 min-w-[54px] sm:min-w-[66px]">
                      <span
                        className={`font-serif-editorial text-2xl sm:text-3xl font-semibold leading-none bazaro-tabular ${
                          unit.highlight ? "text-[#E5C77A]" : "text-[#FAF5EB]"
                        }`}
                      >
                        {String(unit.value).padStart(2, "0")}
                      </span>
                      <span className="text-[9px] uppercase tracking-[0.2em] text-[#C59B4B] font-semibold mt-1.5">
                        {unit.label}
                      </span>
                    </div>
                    {i < timeUnits.length - 1 && (
                      <span className="text-xl font-semibold text-[#C59B4B]/70">:</span>
                    )}
                  </React.Fragment>
                ))}
              </div>

              {isExternal ? (
                <a
                  href={ctaTo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group w-full text-center inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[#FAF5EB] hover:bg-[#E5C77A] text-[#140E0A] text-xs sm:text-sm font-bold shadow-lg transition-all hover:-translate-y-0.5 active:translate-y-0"
                >
                  <span>{campaign.flash_cta_label || "Claim Royal Offer"}</span>
                  <FiArrowRight className="text-sm transition-transform duration-300 group-hover:translate-x-1" />
                </a>
              ) : (
                <Link
                  to={ctaTo}
                  className="group w-full text-center inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[#FAF5EB] hover:bg-[#E5C77A] text-[#140E0A] text-xs sm:text-sm font-bold shadow-lg transition-all hover:-translate-y-0.5 active:translate-y-0"
                >
                  <span>{campaign.flash_cta_label || "Claim Royal Offer"}</span>
                  <FiArrowRight className="text-sm transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FlashSale;
