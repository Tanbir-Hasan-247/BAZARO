export const DEFAULT_FOOTER_CONFIG = {
  brand_name: "BAZARO",
  brand_tagline: "Apnar Desher Bazaar",
  logo_url: "/bazaro-icon.png",
  description:
    "Bangladesh's flagship luxury commerce maison — uniting curated electronics, heritage artisans, insured nationwide dispatch, and effortless digital checkout.",
  github_url: "https://github.com/ashrafulx",
  linkedin_url: "https://www.linkedin.com/in/ashrafulx",
  instagram_url: "",
  facebook_url: "",
  authenticity_badge: "Verified Authenticity",
  collections_title: "Collections",
  collections_links: [
    { label: "All Masterpieces", to: "/shop" },
    { label: "Electronics", to: "/shop?category=electronics" },
    { label: "Watches & Horology", to: "/shop?category=watches%20%26%20horology" },
    { label: "Vault Flash Deals", to: "/shop?filter=deals" },
    { label: "Checkout Bag", to: "/cart" },
  ],
  patron_care_title: "Patron Care",
  patron_care_links: [
    { label: "Order Tracking", to: "/track-order" },
    { label: "Patron Portal", to: "/dashboard" },
    { label: "Member Sign In", to: "/login" },
    { label: "Join BAZARO", to: "/register" },
    { label: "Admin Console", to: "/admin-dashboard" },
  ],
  dispatch_title: "The Royal Dispatch",
  address: "Road 11, Banani Atelier, Dhaka 1213, Bangladesh",
  phone: "+880 1800-BAZARO (229276)",
  email: "concierge@bazaro.com.bd",
  newsletter_hint:
    "Receive private releases and vault coupon codes (e.g. name@domain.com)",
  newsletter_placeholder: "you@example.com",
  copyright_text: "Apnar Desher Bazaar. All rights reserved.",
  settlement_label: "Trusted Settlement:",
  payment_badges: ["bKash", "Nagad", "VISA", "Mastercard"],
};

export const normalizeFooterConfig = (raw = {}) => {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_FOOTER_CONFIG };
  return {
    ...DEFAULT_FOOTER_CONFIG,
    ...raw,
    collections_links: Array.isArray(raw.collections_links)
      ? raw.collections_links
      : DEFAULT_FOOTER_CONFIG.collections_links,
    patron_care_links: Array.isArray(raw.patron_care_links)
      ? raw.patron_care_links
      : DEFAULT_FOOTER_CONFIG.patron_care_links,
    payment_badges: Array.isArray(raw.payment_badges)
      ? raw.payment_badges
      : DEFAULT_FOOTER_CONFIG.payment_badges,
  };
};
