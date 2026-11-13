export const DEFAULT_CAMPAIGN_CONFIG = {
  top_bar_enabled: true,
  top_bar_badge: "ROYAL ATELIER OFFER",
  top_bar_message: "Complimentary Delivery above $50 • Unlock 20% off with code",
  top_bar_code: "BAZARO20",
  top_bar_cta_label: "Explore Vault",
  top_bar_cta_to: "/shop",
  flash_enabled: true,
  flash_badge: "PRIVATE VAULT OFFER",
  flash_title: "Atelier Flash Sale —",
  flash_highlight: "Save 20%",
  flash_description:
    "Curated flagship electronics, signature watches & royal fragrances. Apply the vault code at settlement.",
  flash_coupon_code: "BAZARO20",
  flash_cta_label: "Claim 20% Off",
  flash_cta_to: "/shop",
  flash_ends_at: "",
};

export function sanitizeCampaignDestination(raw, fallback = "/shop") {
  const val = String(raw ?? "").trim();
  if (!val) return fallback;
  if (val.startsWith("/") || /^https?:\/\//i.test(val)) return val;
  return fallback;
}

export function normalizeCampaignConfig(raw) {
  if (!raw || typeof raw !== "object") {
    return { ...DEFAULT_CAMPAIGN_CONFIG };
  }
  return {
    ...DEFAULT_CAMPAIGN_CONFIG,
    ...raw,
    top_bar_enabled: raw.top_bar_enabled !== false,
    flash_enabled: raw.flash_enabled !== false,
    top_bar_cta_to: sanitizeCampaignDestination(raw.top_bar_cta_to, "/shop"),
    flash_cta_to: sanitizeCampaignDestination(raw.flash_cta_to, "/shop"),
    flash_ends_at: raw.flash_ends_at || "",
  };
}
