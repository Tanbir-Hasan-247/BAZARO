import React, { useCallback, useEffect, useState } from "react";
import { FiCheck, FiPlus, FiTag, FiTrash2, FiEdit2 } from "react-icons/fi";
import apiClient from "../../Services/api-client";

const AdminCouponsTab = ({ onNotify }) => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [code, setCode] = useState("");
  const [discountPercent, setDiscountPercent] = useState("20");
  const [minOrder, setMinOrder] = useState("0");
  const [maxDiscount, setMaxDiscount] = useState("");
  const [usageLimit, setUsageLimit] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const loadCoupons = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/coupons/");
      const rows = Array.isArray(res.data) ? res.data : res.data?.results || [];
      setCoupons(rows);
    } catch {
      onNotify?.("error", "Could not load promo coupons.");
    } finally {
      setLoading(false);
    }
  }, [onNotify]);

  useEffect(() => {
    loadCoupons();
  }, [loadCoupons]);

  const resetForm = () => {
    setEditingId(null);
    setCode("");
    setDiscountPercent("20");
    setMinOrder("0");
    setMaxDiscount("");
    setUsageLimit("");
    setValidUntil("");
    setIsActive(true);
  };

  const handleEdit = (coupon) => {
    setEditingId(coupon.id);
    setCode(coupon.code || "");
    setDiscountPercent(String(coupon.discount_percent ?? 20));
    setMinOrder(String(coupon.min_order_amount ?? 0));
    setMaxDiscount(
      coupon.max_discount_amount != null ? String(coupon.max_discount_amount) : ""
    );
    setUsageLimit(coupon.usage_limit != null ? String(coupon.usage_limit) : "");
    setValidUntil(
      coupon.valid_until ? String(coupon.valid_until).slice(0, 16) : ""
    );
    setIsActive(Boolean(coupon.is_active));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) return;

    setSaving(true);
    try {
      const payload = {
        code: cleanCode,
        discount_percent: Number(discountPercent) || 10,
        min_order_amount: Number(minOrder) || 0,
        max_discount_amount: maxDiscount === "" ? null : Number(maxDiscount),
        usage_limit: usageLimit === "" ? null : Number(usageLimit),
        valid_until: validUntil ? new Date(validUntil).toISOString() : null,
        is_active: isActive,
      };

      if (editingId) {
        const res = await apiClient.patch(`/coupons/${editingId}/`, payload);
        setCoupons((prev) =>
          prev.map((c) => (c.id === editingId ? res.data : c))
        );
        onNotify?.("success", `Updated coupon "${cleanCode}".`);
      } else {
        const res = await apiClient.post("/coupons/", payload);
        setCoupons((prev) => [res.data, ...prev]);
        onNotify?.("success", `Created coupon "${cleanCode}".`);
      }
      resetForm();
    } catch (err) {
      const msg =
        err.response?.data?.code?.[0] ||
        err.response?.data?.detail ||
        "Could not save promo coupon.";
      onNotify?.("error", String(msg));
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (coupon) => {
    try {
      const res = await apiClient.patch(`/coupons/${coupon.id}/`, {
        is_active: !coupon.is_active,
      });
      setCoupons((prev) => prev.map((c) => (c.id === coupon.id ? res.data : c)));
      onNotify?.(
        "success",
        `Coupon "${coupon.code}" ${res.data.is_active ? "activated" : "paused"}.`
      );
    } catch {
      onNotify?.("error", "Failed to toggle coupon state.");
    }
  };

  const handleDelete = async (id) => {
    try {
      await apiClient.delete(`/coupons/${id}/`);
      setCoupons((prev) => prev.filter((c) => c.id !== id));
      setConfirmDeleteId(null);
      onNotify?.("success", "Coupon permanently removed.");
    } catch {
      onNotify?.("error", "Could not delete coupon.");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Coupon Creator / Editor Form */}
      <form
        onSubmit={handleSave}
        className="lg:col-span-5 bg-[#140F0C] p-6 rounded-3xl border border-[#C59B4B]/25 space-y-4 text-xs"
      >
        <div className="flex items-center justify-between pb-3 border-b border-[#C59B4B]/20">
          <div className="flex items-center gap-2">
            <FiTag className="text-[#E5C77A]" />
            <h2 className="font-serif-editorial text-lg font-bold text-[#FAF5EB]">
              {editingId ? "Edit Promo Voucher" : "Create Promo Voucher"}
            </h2>
          </div>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="text-[11px] font-bold text-[#C59B4B] hover:underline cursor-pointer"
            >
              Cancel Edit
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="coupon-code-input" className="text-[#EFE7DA] font-bold block mb-1">
              Voucher Code *
            </label>
            <input
              id="coupon-code-input"
              type="text"
              required
              placeholder="ROYAL25"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="w-full px-3.5 py-2.5 bg-[#0D0A08] rounded-xl border border-[#C59B4B]/30 font-mono uppercase text-[#FAF5EB] focus:outline-none focus:border-[#E5C77A]"
            />
          </div>

          <div>
            <label htmlFor="coupon-pct-input" className="text-[#EFE7DA] font-bold block mb-1">
              Discount (%) *
            </label>
            <input
              id="coupon-pct-input"
              type="number"
              min="1"
              max="90"
              required
              value={discountPercent}
              onChange={(e) => setDiscountPercent(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#0D0A08] rounded-xl border border-[#C59B4B]/30 text-[#FAF5EB] focus:outline-none focus:border-[#E5C77A]"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label htmlFor="coupon-min-input" className="text-[#EFE7DA] font-bold block mb-1">
              Min Order ($)
            </label>
            <input
              id="coupon-min-input"
              type="number"
              min="0"
              step="0.01"
              value={minOrder}
              onChange={(e) => setMinOrder(e.target.value)}
              className="w-full px-3 py-2.5 bg-[#0D0A08] rounded-xl border border-[#C59B4B]/30 text-[#FAF5EB] focus:outline-none focus:border-[#E5C77A]"
            />
          </div>

          <div>
            <label htmlFor="coupon-cap-input" className="text-[#EFE7DA] font-bold block mb-1">
              Max Off ($)
            </label>
            <input
              id="coupon-cap-input"
              type="number"
              min="1"
              step="0.01"
              placeholder="Unlimited"
              value={maxDiscount}
              onChange={(e) => setMaxDiscount(e.target.value)}
              className="w-full px-3 py-2.5 bg-[#0D0A08] rounded-xl border border-[#C59B4B]/30 text-[#FAF5EB] focus:outline-none focus:border-[#E5C77A]"
            />
          </div>

          <div>
            <label htmlFor="coupon-limit-input" className="text-[#EFE7DA] font-bold block mb-1">
              Max Uses
            </label>
            <input
              id="coupon-limit-input"
              type="number"
              min="1"
              placeholder="∞"
              value={usageLimit}
              onChange={(e) => setUsageLimit(e.target.value)}
              className="w-full px-3 py-2.5 bg-[#0D0A08] rounded-xl border border-[#C59B4B]/30 text-[#FAF5EB] focus:outline-none focus:border-[#E5C77A]"
            />
          </div>
        </div>

        <div>
          <label htmlFor="coupon-exp-input" className="text-[#EFE7DA] font-bold block mb-1">
            Valid Until (Optional)
          </label>
          <input
            id="coupon-exp-input"
            type="datetime-local"
            value={validUntil}
            onChange={(e) => setValidUntil(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-[#0D0A08] rounded-xl border border-[#C59B4B]/30 text-[#FAF5EB] focus:outline-none focus:border-[#E5C77A]"
          />
        </div>

        <label className="flex items-center gap-2.5 text-[#EFE7DA] cursor-pointer pt-1">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="w-4 h-4 accent-[#C59B4B] rounded cursor-pointer"
          />
          <span className="font-semibold">Voucher Active Immediately</span>
        </label>

        <button
          type="submit"
          disabled={saving}
          className="bazaro-editorial-btn w-full py-3 rounded-full text-xs flex items-center justify-center gap-2 cursor-pointer"
        >
          {editingId ? <FiCheck /> : <FiPlus />}
          <span>{saving ? "Saving..." : editingId ? "Update Voucher" : "Publish Voucher"}</span>
        </button>
      </form>

      {/* Active Coupons Table */}
      <div className="lg:col-span-7 bg-[#140F0C] p-6 rounded-3xl border border-[#C59B4B]/25">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-serif-editorial text-xl font-bold text-[#FAF5EB]">
              Vault Coupons ({coupons.length})
            </h2>
            <p className="text-xs text-[#9C7E54]">
              Toggle promo vouchers on or off in real time during campaigns.
            </p>
          </div>
        </div>

        {loading ? (
          <p className="py-10 text-center text-xs text-[#9C7E54]">Loading coupons...</p>
        ) : coupons.length === 0 ? (
          <p className="py-10 text-center text-xs text-[#9C7E54]">
            No promo codes configured yet. Create your first code on the left.
          </p>
        ) : (
          <div className="space-y-3">
            {coupons.map((c) => (
              <div
                key={c.id}
                className="p-4 rounded-2xl bg-[#0D0A08] border border-[#C59B4B]/20 flex flex-wrap items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-sm font-black text-[#E5C77A] px-2.5 py-0.5 rounded-lg bg-[#C59B4B]/15 border border-[#C59B4B]/35">
                      {c.code}
                    </span>
                    <span className="text-xs font-bold text-[#FAF5EB]">
                      {c.discount_percent}% OFF
                    </span>
                    <button
                      type="button"
                      onClick={() => handleToggleActive(c)}
                      className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border cursor-pointer ${
                        c.is_active
                          ? "bg-emerald-950/60 text-emerald-300 border-emerald-500/40"
                          : "bg-stone-800 text-stone-300 border-stone-600"
                      }`}
                    >
                      {c.is_active ? "Active" : "Paused"}
                    </button>
                  </div>
                  <p className="text-[11px] text-[#9C7E54]">
                    Min: ${Number(c.min_order_amount || 0).toFixed(2)} • Used: {c.used_count || 0}
                    {c.usage_limit ? `/${c.usage_limit}` : " (unlimited)"}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-label={`Edit coupon ${c.code}`}
                    onClick={() => handleEdit(c)}
                    className="p-2 rounded-xl border border-[#C59B4B]/30 text-[#E5C77A] hover:bg-[#C59B4B]/15 cursor-pointer"
                  >
                    <FiEdit2 className="text-xs" />
                  </button>

                  {confirmDeleteId === c.id ? (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleDelete(c.id)}
                        className="px-2.5 py-1 rounded-full bg-red-600 text-white text-[10px] font-bold cursor-pointer"
                      >
                        Confirm
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-2 py-1 rounded-full border border-[#C59B4B]/30 text-[10px] text-[#EFE7DA] cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      aria-label={`Delete coupon ${c.code}`}
                      onClick={() => setConfirmDeleteId(c.id)}
                      className="p-2 rounded-xl border border-red-400/25 text-red-400 hover:bg-red-500/15 cursor-pointer"
                    >
                      <FiTrash2 className="text-xs" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCouponsTab;
