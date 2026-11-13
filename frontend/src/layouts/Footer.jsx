import React, { useEffect, useState } from "react";
import { Link } from "react-router";
import {
  FiMail,
  FiPhone,
  FiMapPin,
  FiArrowRight,
  FiGithub,
  FiLinkedin,
  FiInstagram,
  FiGlobe,
  FiCheck,
  FiShield,
} from "react-icons/fi";
import apiClient from "../Services/api-client";
import {
  DEFAULT_FOOTER_CONFIG,
  normalizeFooterConfig,
} from "../data/defaultFooterConfig";
import { useDeferredValidation } from "../hooks/useDeferredValidation";

const FooterNavLink = ({ item }) => {
  const dest = String(item?.to || "/").trim();
  const isExternal = /^(https?:|mailto:|tel:)/i.test(dest);

  if (isExternal) {
    return (
      <a
        href={dest}
        target={dest.startsWith("http") ? "_blank" : undefined}
        rel={dest.startsWith("http") ? "noreferrer" : undefined}
        className="hover:text-[#E5C77A] transition-colors"
      >
        {item.label}
      </a>
    );
  }

  return (
    <Link to={dest || "/"} className="hover:text-[#E5C77A] transition-colors">
      {item.label}
    </Link>
  );
};

const Footer = () => {
  const [config, setConfig] = useState(DEFAULT_FOOTER_CONFIG);
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [subscribeMsg, setSubscribeMsg] = useState("");
  const [subscribeErr, setSubscribeErr] = useState("");
  const [subscribing, setSubscribing] = useState(false);
  const { fieldErrors, getFieldProps, validateFormOnSubmit, resetValidation } =
    useDeferredValidation();

  useEffect(() => {
    let active = true;
    apiClient
      .get("/footer-settings/")
      .then((res) => {
        if (active && res.data) {
          setConfig(normalizeFooterConfig(res.data));
        }
      })
      .catch(() => {});

    const onFooterUpdated = (event) => {
      if (event.detail) {
        setConfig(normalizeFooterConfig(event.detail));
      }
    };
    window.addEventListener("bazaro:footer-updated", onFooterUpdated);

    return () => {
      active = false;
      window.removeEventListener("bazaro:footer-updated", onFooterUpdated);
    };
  }, []);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!validateFormOnSubmit(e.currentTarget)) return;

    const targetEmail = email.trim();
    if (!targetEmail || !targetEmail.includes("@")) return;

    setSubscribing(true);
    setSubscribeErr("");
    setSubscribeMsg("");
    try {
      const res = await apiClient.post("/newsletter/", {
        email: targetEmail,
        source: "footer",
      });
      setSubscribed(true);
      setSubscribeMsg(res.data?.detail || "Welcome to the Royal Dispatch.");
      setEmail("");
      resetValidation();
      setTimeout(() => setSubscribed(false), 5000);
    } catch (err) {
      const errMsg =
        err.response?.data?.email?.[0] ||
        err.response?.data?.detail ||
        "Could not subscribe right now. Please check your email.";
      setSubscribeErr(String(errMsg));
    } finally {
      setSubscribing(false);
    }
  };

  const socialItems = [
    { url: config.github_url, label: "GitHub", icon: <FiGithub className="text-base" /> },
    { url: config.linkedin_url, label: "LinkedIn", icon: <FiLinkedin className="text-base" /> },
    { url: config.instagram_url, label: "Instagram", icon: <FiInstagram className="text-base" /> },
    { url: config.facebook_url, label: "Website or Social", icon: <FiGlobe className="text-base" /> },
  ].filter((item) => Boolean(item.url && item.url.trim()));

  return (
    <footer
      data-surface="dark"
      className="w-full bg-[#0D0A08] text-[#EFE7DA] border-t border-[#C59B4B]/25 relative overflow-hidden"
    >
      {/* Subtle Top Royal Gold Shimmer Line */}
      <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[#C59B4B] to-transparent opacity-65" />

      <div className="max-w-7xl mx-auto px-6 sm:px-10 md:px-14 pt-16 pb-10">
        {/* Top Multi-Column Footer Content */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-10 pb-12 border-b border-[#C59B4B]/15">
          {/* Column 1: Royal Monogram & Heritage Summary */}
          <div className="lg:col-span-4 space-y-5">
            <Link to="/" className="inline-flex items-center gap-3 group">
              <div className="w-11 h-11 rounded-full bg-[#FAF5EB] p-1.5 border border-[#C59B4B]/60 flex items-center justify-center shadow-lg">
                <img
                  src={config.logo_url || "/bazaro-icon.png"}
                  alt={config.brand_name || "BAZARO"}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = "/bazaro-icon.png";
                  }}
                  className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                />
              </div>
              <div>
                <span className="font-serif-luxury text-2xl font-bold tracking-[0.22em] text-[#FAF5EB] block leading-none">
                  {config.brand_name}
                </span>
                <span className="text-[9px] uppercase tracking-[0.28em] text-[#C59B4B] font-bold mt-1 block">
                  {config.brand_tagline}
                </span>
              </div>
            </Link>

            <p className="text-xs sm:text-sm text-[#9C7E54] leading-relaxed max-w-sm">
              {config.description}
            </p>

            {/* Social Links & Verification Badge */}
            <div className="flex items-center gap-2.5 flex-wrap pt-1">
              {socialItems.map((item) => (
                <a
                  key={item.label}
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="w-9 h-9 rounded-full bg-[#1A1410] border border-[#C59B4B]/25 hover:border-[#E5C77A] hover:bg-[#C59B4B] text-[#E5C77A] hover:text-[#0D0A08] flex items-center justify-center transition-all"
                  aria-label={item.label}
                >
                  {item.icon}
                </a>
              ))}

              {config.authenticity_badge && (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#C59B4B] px-3 py-1 rounded-full bg-[#1A1410] border border-[#C59B4B]/20">
                  <FiShield className="text-xs text-[#E5C77A]" />
                  {config.authenticity_badge}
                </span>
              )}
            </div>
          </div>

          {/* Column 2: Quick Explore / Collections */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="font-serif-luxury text-sm font-bold tracking-wider text-[#FAF5EB] uppercase">
              {config.collections_title}
            </h4>
            <ul className="space-y-2.5 text-xs text-[#9C7E54]">
              {config.collections_links.map((item, idx) => (
                <li key={`${item.label}-${idx}`}>
                  <FooterNavLink item={item} />
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Patron Care */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="font-serif-luxury text-sm font-bold tracking-wider text-[#FAF5EB] uppercase">
              {config.patron_care_title}
            </h4>
            <ul className="space-y-2.5 text-xs text-[#9C7E54]">
              {config.patron_care_links.map((item, idx) => (
                <li key={`${item.label}-${idx}`}>
                  <FooterNavLink item={item} />
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Private Dispatch & Newsletter */}
          <div className="lg:col-span-4 space-y-4">
            <h4 className="font-serif-luxury text-sm font-bold tracking-wider text-[#FAF5EB] uppercase">
              {config.dispatch_title}
            </h4>
            <div className="space-y-2 text-xs text-[#9C7E54]">
              {config.address && (
                <p className="flex items-center gap-2">
                  <FiMapPin className="text-[#C59B4B] shrink-0" />
                  <span>{config.address}</span>
                </p>
              )}
              {config.phone && (
                <p className="flex items-center gap-2">
                  <FiPhone className="text-[#C59B4B] shrink-0" />
                  <span>{config.phone}</span>
                </p>
              )}
              {config.email && (
                <p className="flex items-center gap-2">
                  <FiMail className="text-[#C59B4B] shrink-0" />
                  <span>{config.email}</span>
                </p>
              )}
            </div>

            <form onSubmit={handleSubscribe} noValidate className="pt-2 space-y-1.5">
              <p id="footer-newsletter-hint" className="text-[11px] font-medium text-[#C59B4B]">
                {config.newsletter_hint}
              </p>

              <div className="bazaro-field-group">
                <div className="flex items-center gap-1.5">
                  <input
                    type="email"
                    name="newsletter_email"
                    required
                    aria-label="Newsletter email address"
                    placeholder={config.newsletter_placeholder || "you@example.com"}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    {...getFieldProps("footerEmail", {
                      hintId: "footer-newsletter-hint",
                      errorId: "footer-newsletter-error",
                    })}
                    className="bazaro-field-input w-full min-w-0 px-3.5 py-2.5 rounded-xl bg-[#1A1410] border border-[#C59B4B]/30 text-xs text-[#FAF5EB] placeholder-[#9C7E54] focus:outline-none focus:border-[#E5C77A]"
                  />
                  <button
                    type="submit"
                    disabled={subscribing}
                    aria-label="Subscribe to newsletter"
                    className="bazaro-gold-btn p-2.5 rounded-xl cursor-pointer shrink-0 disabled:opacity-60"
                  >
                    <FiArrowRight className="text-base" />
                  </button>
                </div>
                {fieldErrors.footerEmail && (
                  <p id="footer-newsletter-error" className="bazaro-field-error" data-visible="true">
                    {fieldErrors.footerEmail}
                  </p>
                )}
              </div>

              {subscribed && (
                <p role="status" className="text-[11px] text-[#E5C77A] font-semibold flex items-center gap-1 pt-1">
                  <FiCheck className="text-xs shrink-0" /> {subscribeMsg || "Welcome to the Royal Dispatch."}
                </p>
              )}
              {subscribeErr && (
                <p role="alert" className="text-[11px] text-amber-300 font-semibold pt-1">
                  {subscribeErr}
                </p>
              )}
            </form>
          </div>
        </div>

        {/* Bottom Legal & Payment Badges Bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[#9C7E54]">
          <p className="text-center sm:text-left">
            © {new Date().getFullYear()} <strong className="text-[#FAF5EB]">{config.brand_name}</strong> —{" "}
            {config.copyright_text}
          </p>

          <div className="flex items-center gap-2 flex-wrap justify-center">
            {config.settlement_label && (
              <span className="text-[10px] text-[#9C7E54] mr-1">
                {config.settlement_label}
              </span>
            )}
            {config.payment_badges.map((badge, idx) => (
              <span
                key={`${badge}-${idx}`}
                className={`px-2.5 py-1 rounded-md bg-[#1A1410] border border-[#C59B4B]/25 font-bold ${
                  idx < 2 ? "text-[#E5C77A]" : "text-[#FAF5EB]"
                }`}
              >
                {badge}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
