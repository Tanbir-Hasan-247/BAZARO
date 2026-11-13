import React, { useEffect, useRef, useState } from "react";
import { FiCheck, FiPlus, FiRotateCcw, FiTrash2, FiSave } from "react-icons/fi";
import apiClient from "../../Services/api-client";
import {
  DEFAULT_FOOTER_CONFIG,
  normalizeFooterConfig,
} from "../../data/defaultFooterConfig";

const inputClass =
  "bazaro-field-input w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-[#1A1410] border border-[#C59B4B]/30 text-sm text-[#FAF5EB] placeholder-[#9C7E54]/70 focus:outline-none focus:border-[#E5C77A]";

const labelClass =
  "block text-[11px] font-bold uppercase tracking-wider text-[#C59B4B] mb-1.5";

const fieldsetClass =
  "bg-[#140F0C] rounded-[24px] p-5 sm:p-6 border border-[#C59B4B]/25 space-y-4";

const legendClass =
  "font-serif-editorial text-base sm:text-lg font-bold text-[#E5C77A] px-2";

const LinkColumnEditor = ({
  idPrefix,
  headingLabel,
  titleValue,
  onTitleChange,
  links,
  onLinksChange,
}) => {
  const handleRowChange = (idx, key, val) => {
    const next = links.map((row, i) =>
      i === idx ? { ...row, [key]: val } : row
    );
    onLinksChange(next);
  };

  const handleAddRow = () => {
    if (links.length >= 12) return;
    onLinksChange([...links, { label: "New Link", to: "/shop" }]);
  };

  const handleRemoveRow = (idx) => {
    onLinksChange(links.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-4 bg-[#1A1410]/45 rounded-2xl p-4 border border-[#C59B4B]/20">
      <div>
        <label htmlFor={`${idPrefix}-title`} className={labelClass}>
          {headingLabel}
        </label>
        <input
          id={`${idPrefix}-title`}
          name={`${idPrefix}_title`}
          type="text"
          required
          value={titleValue}
          onChange={(e) => onTitleChange(e.target.value)}
          className={inputClass}
        />
      </div>

      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#9C7E54]">
            Links ({links.length}/12)
          </span>
          <button
            type="button"
            onClick={handleAddRow}
            disabled={links.length >= 12}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#C59B4B]/15 hover:bg-[#C59B4B]/30 border border-[#C59B4B]/35 text-[11px] font-bold text-[#E5C77A] transition-colors cursor-pointer disabled:opacity-45"
          >
            <FiPlus className="text-xs" />
            <span>Add Link</span>
          </button>
        </div>

        {links.map((item, idx) => (
          <div
            key={`${idPrefix}-row-${idx}`}
            className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end bg-[#140F0C] p-2.5 rounded-xl border border-[#C59B4B]/15"
          >
            <div className="sm:col-span-5">
              <label
                htmlFor={`${idPrefix}-label-${idx}`}
                className="block text-[10px] font-semibold text-[#9C7E54] mb-1"
              >
                Label #{idx + 1}
              </label>
              <input
                id={`${idPrefix}-label-${idx}`}
                name={`${idPrefix}_label_${idx}`}
                type="text"
                required
                value={item.label}
                onChange={(e) => handleRowChange(idx, "label", e.target.value)}
                placeholder="Link title"
                className="w-full min-h-[40px] px-3 py-1.5 rounded-lg bg-[#1A1410] border border-[#C59B4B]/25 text-xs text-[#FAF5EB] focus:outline-none focus:border-[#E5C77A]"
              />
            </div>

            <div className="sm:col-span-6">
              <label
                htmlFor={`${idPrefix}-to-${idx}`}
                className="block text-[10px] font-semibold text-[#9C7E54] mb-1"
              >
                Destination Route or URL
              </label>
              <input
                id={`${idPrefix}-to-${idx}`}
                name={`${idPrefix}_to_${idx}`}
                type="text"
                required
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
                value={item.to}
                onChange={(e) => handleRowChange(idx, "to", e.target.value)}
                placeholder="/shop or https://..."
                className="w-full min-h-[40px] px-3 py-1.5 rounded-lg bg-[#1A1410] border border-[#C59B4B]/25 text-xs font-mono text-[#EFE7DA] focus:outline-none focus:border-[#E5C77A]"
              />
            </div>

            <div className="sm:col-span-1 flex justify-end">
              <button
                type="button"
                onClick={() => handleRemoveRow(idx)}
                aria-label={`Remove link ${item.label || idx + 1}`}
                className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg text-amber-300/80 hover:text-red-300 hover:bg-red-950/50 transition-colors cursor-pointer"
              >
                <FiTrash2 className="text-sm" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const AdminFooterEditor = ({ onNotifySuccess, onNotifyError }) => {
  const [form, setForm] = useState(DEFAULT_FOOTER_CONFIG);
  const [newBadge, setNewBadge] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const notifyErrorRef = useRef(onNotifyError);

  useEffect(() => {
    notifyErrorRef.current = onNotifyError;
  }, [onNotifyError]);

  useEffect(() => {
    let active = true;
    apiClient
      .get("/footer-settings/")
      .then((res) => {
        if (active && res.data) {
          setForm(normalizeFooterConfig(res.data));
        }
      })
      .catch(() => {
        if (active) {
          notifyErrorRef.current?.(
            "Could not fetch footer settings; loaded defaults."
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const setField = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const handleAddBadge = () => {
    const trimmed = newBadge.trim();
    if (!trimmed || form.payment_badges.length >= 10) return;
    setForm((prev) => ({
      ...prev,
      payment_badges: [...prev.payment_badges, trimmed],
    }));
    setNewBadge("");
  };

  const handleRemoveBadge = (idx) => {
    setForm((prev) => ({
      ...prev,
      payment_badges: prev.payment_badges.filter((_, i) => i !== idx),
    }));
  };

  const handleRestoreDefaults = () => {
    setForm({ ...DEFAULT_FOOTER_CONFIG });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formEl = e.currentTarget;
    if (!formEl.checkValidity()) {
      const firstInvalid = formEl.querySelector(":invalid");
      if (firstInvalid) firstInvalid.focus();
      formEl.reportValidity();
      onNotifyError?.("Please review highlighted footer fields before saving.");
      return;
    }

    setSaving(true);
    try {
      const res = await apiClient.put("/footer-settings/", form);
      const updated = normalizeFooterConfig(res.data);
      setForm(updated);
      window.dispatchEvent(
        new CustomEvent("bazaro:footer-updated", { detail: updated })
      );
      onNotifySuccess("Live storefront footer updated and published.");
    } catch (err) {
      const data = err.response?.data;
      const msg =
        (typeof data === "object" && Object.values(data).flat()[0]) ||
        data?.detail ||
        "Could not save footer settings.";
      onNotifyError(String(msg));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-[#140F0C] rounded-[28px] p-8 border border-[#C59B4B]/25 text-center text-xs text-[#9C7E54]">
        Loading Footer CMS configuration...
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      aria-labelledby="footer-cms-heading"
      noValidate
      className="space-y-6"
    >
      {/* Top Action Banner */}
      <div className="bg-[#140F0C] rounded-[28px] p-6 sm:p-8 border border-[#C59B4B]/25 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2
            id="footer-cms-heading"
            className="font-serif-editorial text-xl font-bold text-[#FAF5EB]"
          >
            Footer CMS — Full Live Storefront Editor
          </h2>
          <p className="text-xs text-[#9C7E54] mt-1">
            Customize brand copy, social profiles, navigation columns, contact dispatch details, copyright & payment badges.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleRestoreDefaults}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full border border-[#C59B4B]/35 text-xs font-bold text-[#EFE7DA] hover:bg-white/5 transition-colors cursor-pointer"
          >
            <FiRotateCcw className="text-xs" />
            <span>Restore Defaults</span>
          </button>

          <button
            type="submit"
            disabled={saving}
            className="bazaro-editorial-btn inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-xs cursor-pointer"
          >
            {saving ? (
              <span>Publishing...</span>
            ) : (
              <>
                <FiSave className="text-sm" />
                <span>Save Footer Settings</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Fieldset 1: Brand Identity */}
      <fieldset className={fieldsetClass}>
        <legend className={legendClass}>Brand Identity &amp; Story</legend>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="footer-brand-name" className={labelClass}>
              Brand Name *
            </label>
            <input
              id="footer-brand-name"
              name="brand_name"
              type="text"
              required
              maxLength={80}
              value={form.brand_name}
              onChange={setField("brand_name")}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="footer-brand-tagline" className={labelClass}>
              Brand Tagline *
            </label>
            <input
              id="footer-brand-tagline"
              name="brand_tagline"
              type="text"
              required
              maxLength={120}
              value={form.brand_tagline}
              onChange={setField("brand_tagline")}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="footer-logo-url" className={labelClass}>
              Emblem Logo Path / URL *
            </label>
            <input
              id="footer-logo-url"
              name="logo_url"
              type="text"
              required
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              value={form.logo_url}
              onChange={setField("logo_url")}
              className={`${inputClass} font-mono`}
            />
          </div>

          <div>
            <label htmlFor="footer-auth-badge" className={labelClass}>
              Authenticity Pill Label
            </label>
            <input
              id="footer-auth-badge"
              name="authenticity_badge"
              type="text"
              maxLength={80}
              value={form.authenticity_badge}
              onChange={setField("authenticity_badge")}
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label htmlFor="footer-description" className={labelClass}>
            Maison Story Description *
          </label>
          <textarea
            id="footer-description"
            name="description"
            rows={3}
            required
            value={form.description}
            onChange={setField("description")}
            className={`${inputClass} resize-y`}
          />
        </div>
      </fieldset>

      {/* Fieldset 2: Social Channels */}
      <fieldset className={fieldsetClass}>
        <legend className={legendClass}>Social Links</legend>
        <p className="text-xs text-[#9C7E54]">
          Leave any field blank to hide that social icon in the public footer.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { id: "footer-github", name: "github_url", label: "GitHub URL" },
            { id: "footer-linkedin", name: "linkedin_url", label: "LinkedIn URL" },
            { id: "footer-instagram", name: "instagram_url", label: "Instagram URL" },
            { id: "footer-facebook", name: "facebook_url", label: "Facebook / Website URL" },
          ].map((soc) => (
            <div key={soc.name}>
              <label htmlFor={soc.id} className={labelClass}>
                {soc.label}
              </label>
              <input
                id={soc.id}
                name={soc.name}
                type="url"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
                placeholder="https://..."
                value={form[soc.name] || ""}
                onChange={setField(soc.name)}
                className={`${inputClass} font-mono`}
              />
            </div>
          ))}
        </div>
      </fieldset>

      {/* Fieldset 3: Two Link Columns */}
      <fieldset className={fieldsetClass}>
        <legend className={legendClass}>Navigation Columns</legend>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          <LinkColumnEditor
            idPrefix="collections"
            headingLabel="Column 1 Heading *"
            titleValue={form.collections_title}
            onTitleChange={(val) =>
              setForm((prev) => ({ ...prev, collections_title: val }))
            }
            links={form.collections_links}
            onLinksChange={(next) =>
              setForm((prev) => ({ ...prev, collections_links: next }))
            }
          />

          <LinkColumnEditor
            idPrefix="patron"
            headingLabel="Column 2 Heading *"
            titleValue={form.patron_care_title}
            onTitleChange={(val) =>
              setForm((prev) => ({ ...prev, patron_care_title: val }))
            }
            links={form.patron_care_links}
            onLinksChange={(next) =>
              setForm((prev) => ({ ...prev, patron_care_links: next }))
            }
          />
        </div>
      </fieldset>

      {/* Fieldset 4: The Royal Dispatch & Newsletter */}
      <fieldset className={fieldsetClass}>
        <legend className={legendClass}>Contact Dispatch &amp; Newsletter</legend>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="footer-dispatch-title" className={labelClass}>
              Dispatch Column Title *
            </label>
            <input
              id="footer-dispatch-title"
              name="dispatch_title"
              type="text"
              required
              value={form.dispatch_title}
              onChange={setField("dispatch_title")}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="footer-email" className={labelClass}>
              Concierge Email *
            </label>
            <input
              id="footer-email"
              name="email"
              type="email"
              required
              autoComplete="email"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              value={form.email}
              onChange={setField("email")}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="footer-phone" className={labelClass}>
              Concierge Phone *
            </label>
            <input
              id="footer-phone"
              name="phone"
              type="text"
              required
              inputMode="tel"
              autoComplete="tel"
              value={form.phone}
              onChange={setField("phone")}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="footer-newsletter-ph" className={labelClass}>
              Newsletter Placeholder
            </label>
            <input
              id="footer-newsletter-ph"
              name="newsletter_placeholder"
              type="text"
              value={form.newsletter_placeholder}
              onChange={setField("newsletter_placeholder")}
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label htmlFor="footer-address" className={labelClass}>
            Atelier / Showroom Address *
          </label>
          <textarea
            id="footer-address"
            name="address"
            rows={2}
            required
            autoComplete="street-address"
            value={form.address}
            onChange={setField("address")}
            className={`${inputClass} resize-y`}
          />
        </div>

        <div>
          <label htmlFor="footer-newsletter-hint" className={labelClass}>
            Newsletter Helper Hint
          </label>
          <input
            id="footer-newsletter-hint"
            name="newsletter_hint"
            type="text"
            value={form.newsletter_hint}
            onChange={setField("newsletter_hint")}
            className={inputClass}
          />
        </div>
      </fieldset>

      {/* Fieldset 5: Copyright & Payment Settlement */}
      <fieldset className={fieldsetClass}>
        <legend className={legendClass}>Legal Notice &amp; Payment Badges</legend>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="footer-copyright" className={labelClass}>
              Copyright Notice (after © Year Brand) *
            </label>
            <input
              id="footer-copyright"
              name="copyright_text"
              type="text"
              required
              value={form.copyright_text}
              onChange={setField("copyright_text")}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="footer-settlement-label" className={labelClass}>
              Settlement Prefix Label
            </label>
            <input
              id="footer-settlement-label"
              name="settlement_label"
              type="text"
              value={form.settlement_label}
              onChange={setField("settlement_label")}
              className={inputClass}
            />
          </div>
        </div>

        <div className="space-y-3 pt-1">
          <span className={labelClass}>Payment Method Badges</span>
          <div className="flex flex-wrap gap-2">
            {form.payment_badges.map((badge, idx) => (
              <span
                key={`${badge}-${idx}`}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#1A1410] border border-[#C59B4B]/35 text-xs font-bold text-[#E5C77A]"
              >
                <span>{badge}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveBadge(idx)}
                  aria-label={`Remove ${badge} badge`}
                  className="text-[#9C7E54] hover:text-red-300 transition-colors cursor-pointer"
                >
                  ×
                </button>
              </span>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-2 max-w-md">
            <label htmlFor="footer-new-badge" className="visually-hidden">
              Add payment badge name
            </label>
            <input
              id="footer-new-badge"
              name="new_payment_badge"
              type="text"
              value={newBadge}
              onChange={(e) => setNewBadge(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  handleAddBadge();
                }
              }}
              placeholder="e.g. Rocket, AMEX, Apple Pay"
              className={inputClass}
            />
            <button
              type="button"
              onClick={handleAddBadge}
              className="px-4 py-2.5 rounded-xl bg-[#C59B4B]/20 hover:bg-[#C59B4B]/35 border border-[#C59B4B]/40 text-xs font-bold text-[#E5C77A] whitespace-nowrap cursor-pointer"
            >
              + Add Badge
            </button>
          </div>
        </div>

        {/* Sticky Bottom Save CTA */}
        <div className="pt-4 border-t border-[#C59B4B]/20 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="bazaro-editorial-btn inline-flex items-center gap-2 px-7 py-3 rounded-full text-xs cursor-pointer"
          >
            {saving ? (
              <span>Publishing Changes...</span>
            ) : (
              <>
                <FiCheck className="text-sm" />
                <span>Save &amp; Publish Footer</span>
              </>
            )}
          </button>
        </div>
      </fieldset>
    </form>
  );
};

export default AdminFooterEditor;
