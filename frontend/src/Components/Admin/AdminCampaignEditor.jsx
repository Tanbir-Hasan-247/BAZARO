import React, { useCallback, useEffect, useState } from "react";
import { FiCheck, FiMail, FiRefreshCw, FiRotateCcw, FiTrash2, FiZap } from "react-icons/fi";
import apiClient from "../../Services/api-client";
import {
  DEFAULT_CAMPAIGN_CONFIG,
  normalizeCampaignConfig,
} from "../../data/defaultCampaignConfig";

const AdminCampaignEditor = ({ onNotify }) => {
  const [form, setForm] = useState(DEFAULT_CAMPAIGN_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [subscribers, setSubscribers] = useState([]);
  const [subLoading, setSubLoading] = useState(true);

  const fetchCampaign = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/campaign-settings/");
      if (res.data) {
        const normalized = normalizeCampaignConfig(res.data);
        setForm({
          ...normalized,
          flash_ends_at: normalized.flash_ends_at
            ? String(normalized.flash_ends_at).slice(0, 16)
            : "",
        });
      }
    } catch {
      onNotify?.("error", "Could not fetch campaign settings.");
    } finally {
      setLoading(false);
    }
  }, [onNotify]);

  const fetchSubscribers = useCallback(async () => {
    setSubLoading(true);
    try {
      const res = await apiClient.get("/newsletter/");
      const rows = Array.isArray(res.data) ? res.data : res.data?.results || [];
      setSubscribers(rows);
    } catch {
      setSubscribers([]);
    } finally {
      setSubLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCampaign();
    fetchSubscribers();
  }, [fetchCampaign, fetchSubscribers]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        flash_ends_at: form.flash_ends_at
          ? new Date(form.flash_ends_at).toISOString()
          : null,
      };
      const res = await apiClient.patch("/campaign-settings/", payload);
      const updated = normalizeCampaignConfig(res.data);
      setForm({
        ...updated,
        flash_ends_at: updated.flash_ends_at
          ? String(updated.flash_ends_at).slice(0, 16)
          : "",
      });
      window.dispatchEvent(
        new CustomEvent("bazaro:campaign-updated", { detail: updated })
      );
      onNotify?.("success", "Announcement bar & flash sale campaign updated live.");
    } catch (err) {
      onNotify?.(
        "error",
        err.response?.data?.detail || "Failed to update campaign settings."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setForm({ ...DEFAULT_CAMPAIGN_CONFIG, flash_ends_at: "" });
  };

  const handleRemoveSubscriber = async (id) => {
    try {
      await apiClient.delete(`/newsletter/${id}/`);
      setSubscribers((prev) => prev.filter((s) => s.id !== id));
      onNotify?.("success", "Subscriber removed from Royal Dispatch list.");
    } catch {
      onNotify?.("error", "Could not remove subscriber.");
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
      {/* Left: Top Bar + Flash Sale CMS */}
      <form
        onSubmit={handleSave}
        className="xl:col-span-7 bg-[#140F0C] p-6 sm:p-7 rounded-3xl border border-[#C59B4B]/25 space-y-6 text-xs"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#C59B4B]/20">
          <div className="flex items-center gap-2">
            <FiZap className="text-[#E5C77A]" />
            <div>
              <h2 className="font-serif-editorial text-xl font-bold text-[#FAF5EB]">
                Top Bar & Flash Sale CMS
              </h2>
              <p className="text-[11px] text-[#9C7E54]">
                Changes immediately sync to the header ribbon & home flash vault.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleReset}
            className="px-3.5 py-2 rounded-full border border-[#C59B4B]/30 text-[#EFE7DA] hover:bg-white/5 inline-flex items-center gap-1.5 cursor-pointer"
          >
            <FiRotateCcw className="text-xs" />
            <span>Defaults</span>
          </button>
        </div>

        {loading ? (
          <p className="py-10 text-center text-[#9C7E54]">Loading campaign configuration...</p>
        ) : (
          <>
            {/* Top Announcement Ribbon Section */}
            <fieldset className="p-4 rounded-2xl bg-[#0D0A08] border border-[#C59B4B]/20 space-y-3">
              <legend className="px-2 text-[11px] font-bold uppercase tracking-wider text-[#E5C77A]">
                1. Top Announcement Bar
              </legend>

              <label className="flex items-center gap-2 text-[#EFE7DA] cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.top_bar_enabled}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, top_bar_enabled: e.target.checked }))
                  }
                  className="w-4 h-4 accent-[#C59B4B] rounded cursor-pointer"
                />
                <span className="font-semibold">Display Announcement Ribbon Sitewide</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="tb-badge" className="text-[#9C7E54] block mb-1">
                    Ribbon Badge
                  </label>
                  <input
                    id="tb-badge"
                    type="text"
                    value={form.top_bar_badge}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, top_bar_badge: e.target.value }))
                    }
                    className="w-full px-3 py-2 bg-[#140F0C] rounded-xl border border-[#C59B4B]/30 text-[#FAF5EB]"
                  />
                </div>
                <div>
                  <label htmlFor="tb-code" className="text-[#9C7E54] block mb-1">
                    Highlight Code Pill
                  </label>
                  <input
                    id="tb-code"
                    type="text"
                    value={form.top_bar_code}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, top_bar_code: e.target.value.toUpperCase() }))
                    }
                    className="w-full px-3 py-2 bg-[#140F0C] rounded-xl border border-[#C59B4B]/30 font-mono text-[#E5C77A]"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="tb-msg" className="text-[#9C7E54] block mb-1">
                  Ribbon Announcement Copy
                </label>
                <input
                  id="tb-msg"
                  type="text"
                  value={form.top_bar_message}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, top_bar_message: e.target.value }))
                  }
                  className="w-full px-3 py-2 bg-[#140F0C] rounded-xl border border-[#C59B4B]/30 text-[#FAF5EB]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="tb-cta-label" className="text-[#9C7E54] block mb-1">
                    CTA Link Text
                  </label>
                  <input
                    id="tb-cta-label"
                    type="text"
                    value={form.top_bar_cta_label}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, top_bar_cta_label: e.target.value }))
                    }
                    className="w-full px-3 py-2 bg-[#140F0C] rounded-xl border border-[#C59B4B]/30 text-[#FAF5EB]"
                  />
                </div>
                <div>
                  <label htmlFor="tb-cta-to" className="text-[#9C7E54] block mb-1">
                    CTA Destination (/path or https://)
                  </label>
                  <input
                    id="tb-cta-to"
                    type="text"
                    value={form.top_bar_cta_to}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, top_bar_cta_to: e.target.value }))
                    }
                    className="w-full px-3 py-2 bg-[#140F0C] rounded-xl border border-[#C59B4B]/30 text-[#FAF5EB]"
                  />
                </div>
              </div>
            </fieldset>

            {/* Flash Sale Spotlight Section */}
            <fieldset className="p-4 rounded-2xl bg-[#0D0A08] border border-[#C59B4B]/20 space-y-3">
              <legend className="px-2 text-[11px] font-bold uppercase tracking-wider text-[#E5C77A]">
                2. Home Flash Sale Vault
              </legend>

              <label className="flex items-center gap-2 text-[#EFE7DA] cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.flash_enabled}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, flash_enabled: e.target.checked }))
                  }
                  className="w-4 h-4 accent-[#C59B4B] rounded cursor-pointer"
                />
                <span className="font-semibold">Display Flash Sale Section on Home Page</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="fs-badge" className="text-[#9C7E54] block mb-1">
                    Vault Eyebrow Badge
                  </label>
                  <input
                    id="fs-badge"
                    type="text"
                    value={form.flash_badge}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, flash_badge: e.target.value }))
                    }
                    className="w-full px-3 py-2 bg-[#140F0C] rounded-xl border border-[#C59B4B]/30 text-[#FAF5EB]"
                  />
                </div>
                <div>
                  <label htmlFor="fs-code" className="text-[#9C7E54] block mb-1">
                    Vault Coupon Code
                  </label>
                  <input
                    id="fs-code"
                    type="text"
                    value={form.flash_coupon_code}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        flash_coupon_code: e.target.value.toUpperCase(),
                      }))
                    }
                    className="w-full px-3 py-2 bg-[#140F0C] rounded-xl border border-[#C59B4B]/30 font-mono text-[#E5C77A]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="fs-title" className="text-[#9C7E54] block mb-1">
                    Headline Prefix
                  </label>
                  <input
                    id="fs-title"
                    type="text"
                    value={form.flash_title}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, flash_title: e.target.value }))
                    }
                    className="w-full px-3 py-2 bg-[#140F0C] rounded-xl border border-[#C59B4B]/30 text-[#FAF5EB]"
                  />
                </div>
                <div>
                  <label htmlFor="fs-highlight" className="text-[#9C7E54] block mb-1">
                    Gold Highlight Text
                  </label>
                  <input
                    id="fs-highlight"
                    type="text"
                    value={form.flash_highlight}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, flash_highlight: e.target.value }))
                    }
                    className="w-full px-3 py-2 bg-[#140F0C] rounded-xl border border-[#C59B4B]/30 text-[#E5C77A] font-bold"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="fs-desc" className="text-[#9C7E54] block mb-1">
                  Description Copy
                </label>
                <textarea
                  id="fs-desc"
                  rows={2}
                  value={form.flash_description}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, flash_description: e.target.value }))
                  }
                  className="w-full px-3 py-2 bg-[#140F0C] rounded-xl border border-[#C59B4B]/30 text-[#FAF5EB]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label htmlFor="fs-cta-label" className="text-[#9C7E54] block mb-1">
                    Button Text
                  </label>
                  <input
                    id="fs-cta-label"
                    type="text"
                    value={form.flash_cta_label}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, flash_cta_label: e.target.value }))
                    }
                    className="w-full px-3 py-2 bg-[#140F0C] rounded-xl border border-[#C59B4B]/30 text-[#FAF5EB]"
                  />
                </div>
                <div>
                  <label htmlFor="fs-cta-to" className="text-[#9C7E54] block mb-1">
                    Button Target
                  </label>
                  <input
                    id="fs-cta-to"
                    type="text"
                    value={form.flash_cta_to}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, flash_cta_to: e.target.value }))
                    }
                    className="w-full px-3 py-2 bg-[#140F0C] rounded-xl border border-[#C59B4B]/30 text-[#FAF5EB]"
                  />
                </div>
                <div>
                  <label htmlFor="fs-end" className="text-[#9C7E54] block mb-1">
                    Real Countdown End
                  </label>
                  <input
                    id="fs-end"
                    type="datetime-local"
                    value={form.flash_ends_at}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, flash_ends_at: e.target.value }))
                    }
                    className="w-full px-3 py-2 bg-[#140F0C] rounded-xl border border-[#C59B4B]/30 text-[#FAF5EB]"
                  />
                </div>
              </div>
            </fieldset>

            <button
              type="submit"
              disabled={saving}
              className="bazaro-editorial-btn px-7 py-3 rounded-full text-xs inline-flex items-center gap-2 cursor-pointer"
            >
              <FiCheck />
              <span>{saving ? "Publishing..." : "Publish Campaign Changes"}</span>
            </button>
          </>
        )}
      </form>

      {/* Right: Newsletter Subscribers Viewer */}
      <div className="xl:col-span-5 bg-[#140F0C] p-6 sm:p-7 rounded-3xl border border-[#C59B4B]/25 space-y-4">
        <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#C59B4B]/20">
          <div className="flex items-center gap-2">
            <FiMail className="text-[#E5C77A]" />
            <div>
              <h2 className="font-serif-editorial text-xl font-bold text-[#FAF5EB]">
                Dispatch Subscribers ({subscribers.length})
              </h2>
              <p className="text-[11px] text-[#9C7E54]">
                Captured live from the storefront Royal Dispatch form.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={fetchSubscribers}
            aria-label="Refresh subscriber list"
            className="p-2 rounded-full border border-[#C59B4B]/30 text-[#E5C77A] hover:bg-white/5 cursor-pointer"
          >
            <FiRefreshCw className={`text-xs ${subLoading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {subLoading ? (
          <p className="py-10 text-center text-xs text-[#9C7E54]">Loading subscribers...</p>
        ) : subscribers.length === 0 ? (
          <p className="py-10 text-center text-xs text-[#9C7E54]">
            No newsletter subscribers recorded yet. Test the footer form to verify live sync!
          </p>
        ) : (
          <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
            {subscribers.map((sub) => (
              <div
                key={sub.id}
                className="p-3.5 rounded-2xl bg-[#0D0A08] border border-[#C59B4B]/20 flex items-center justify-between gap-3 text-xs"
              >
                <div className="min-w-0">
                  <p className="font-bold text-[#FAF5EB] truncate">{sub.email}</p>
                  <span className="text-[10px] text-[#9C7E54]">
                    {sub.source || "footer"} •{" "}
                    {new Date(sub.subscribed_at || Date.now()).toLocaleDateString()}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveSubscriber(sub.id)}
                  aria-label={`Remove subscriber ${sub.email}`}
                  className="p-2 rounded-xl border border-red-400/25 text-red-400 hover:bg-red-500/15 cursor-pointer shrink-0"
                >
                  <FiTrash2 className="text-xs" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCampaignEditor;
