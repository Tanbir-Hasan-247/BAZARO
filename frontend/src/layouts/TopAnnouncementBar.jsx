import React, { useEffect, useState } from "react";
import { Link } from "react-router";
import { FiAward, FiTruck } from "react-icons/fi";
import apiClient from "../Services/api-client";
import {
  DEFAULT_CAMPAIGN_CONFIG,
  normalizeCampaignConfig,
} from "../data/defaultCampaignConfig";

const TopAnnouncementBar = ({ isCompact = false }) => {
  const [campaign, setCampaign] = useState(DEFAULT_CAMPAIGN_CONFIG);

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

  if (!campaign.top_bar_enabled) {
    return null;
  }

  const ctaTo = campaign.top_bar_cta_to || "/shop?filter=deals";
  const isExternal = /^https?:\/\//i.test(ctaTo);

  return (
    <div
      data-surface="dark"
      className={`w-full bg-[#0D0A08]/95 backdrop-blur-md border-b border-[#C59B4B]/20 text-[#EFE7DA] text-[10px] sm:text-xs font-medium px-4 flex items-center justify-center gap-3 relative z-50 transition-all duration-300 ${
        isCompact ? "py-1 opacity-95" : "py-1.5"
      }`}
    >
      <div className="flex items-center gap-1.5 text-[#E5C77A]">
        <FiAward className="text-xs shrink-0" />
        <span className="font-extrabold tracking-[0.22em] uppercase text-[9px] sm:text-[10px]">
          {campaign.top_bar_badge}
        </span>
      </div>

      <span className="text-[#C59B4B]/40 hidden sm:inline">♦</span>

      <p className="text-center tracking-wide text-[#EFE7DA] truncate max-w-[85vw]">
        {campaign.top_bar_message}
        {campaign.top_bar_code && (
          <span className="ml-1.5 px-2 py-0.5 rounded-full bg-gradient-to-r from-[#E5C77A] to-[#C59B4B] text-[#0D0A08] font-black font-mono text-[10px] tracking-wider shadow-xs">
            {campaign.top_bar_code}
          </span>
        )}
      </p>

      {campaign.top_bar_cta_label &&
        (isExternal ? (
          <a
            href={ctaTo}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden lg:inline-flex items-center gap-1 text-[#E5C77A] hover:text-[#FAF5EB] underline decoration-[#C59B4B]/50 underline-offset-4 transition-colors font-semibold ml-1"
          >
            <FiTruck className="text-xs" />
            <span>{campaign.top_bar_cta_label}</span>
          </a>
        ) : (
          <Link
            to={ctaTo}
            className="hidden lg:inline-flex items-center gap-1 text-[#E5C77A] hover:text-[#FAF5EB] underline decoration-[#C59B4B]/50 underline-offset-4 transition-colors font-semibold ml-1"
          >
            <FiTruck className="text-xs" />
            <span>{campaign.top_bar_cta_label}</span>
          </Link>
        ))}
    </div>
  );
};

export default TopAnnouncementBar;
