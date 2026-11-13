import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import {
  FiAlertCircle,
  FiArrowRight,
  FiCheckCircle,
  FiClock,
  FiMapPin,
  FiPackage,
  FiPrinter,
  FiSearch,
  FiShield,
} from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import apiClient from "../Services/api-client";
import OrderTimelineStepper from "../Components/Orders/OrderTimelineStepper";
import OrderInvoiceModal from "../Components/Orders/OrderInvoiceModal";

const PAYMENT_ALERTS = {
  success: {
    tone: "bg-[#ECFDF5] border-[#A7F3D0] text-[#065F46]",
    icon: FiCheckCircle,
    title: "Settlement Verified",
    text: "Your digital gateway transaction is confirmed and your acquisition is advancing through our Dhaka Atelier.",
  },
  failed: {
    tone: "bg-[#FFF5F5] border-[#FECACA] text-[#991B1B]",
    icon: FiAlertCircle,
    title: "Gateway Authorization Declined",
    text: "The external gateway did not complete the charge. You may settle again from your Patron Portal or inspect details below.",
  },
  canceled: {
    tone: "bg-[#FEF7E4] border-[#C59B4B]/45 text-[#7A591C]",
    icon: FiClock,
    title: "Gateway Checkout Canceled",
    text: "No funds were captured. Your reservation remains held so you can complete settlement whenever ready.",
  },
};

const TrackOrder = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialOrderId = searchParams.get("order_id") || "";
  const initialContact = searchParams.get("contact") || "";
  const paymentFlag = (searchParams.get("payment") || "").toLowerCase();
  const stripeSessionId = searchParams.get("stripe_session") || "";

  const [orderIdInput, setOrderIdInput] = useState(initialOrderId);
  const [contactInput, setContactInput] = useState(initialContact);
  const [order, setOrder] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [verifyingStripe, setVerifyingStripe] = useState(false);
  const [error, setError] = useState("");
  const [stripeVerifiedBanner, setStripeVerifiedBanner] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  const performLookup = useCallback(async (targetId, targetContact = "") => {
    const cleanedId = String(targetId || "").trim();
    const cleanedContact = String(targetContact || "").trim();
    if (!cleanedId) {
      setError("Enter your Order Reference UUID (or short prefix when signed in).");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const params = { order_id: cleanedId };
      if (cleanedContact) {
        params.contact = cleanedContact;
      }
      const res = await apiClient.get("/orders/track/", { params });
      setOrder(res.data);
    } catch (err) {
      const detail =
        err.response?.data?.detail ||
        "We could not verify that reference. Check your full UUID and matching email or phone.";
      setError(detail);
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load recent orders when signed in for 1-click selection
  useEffect(() => {
    if (!user) {
      setRecentOrders([]);
      return;
    }
    let mounted = true;
    apiClient
      .get("/orders/")
      .then((res) => {
        if (!mounted) return;
        const rows = Array.isArray(res.data) ? res.data : res.data?.results || [];
        setRecentOrders(rows.slice(0, 6));
      })
      .catch(() => {
        if (mounted) setRecentOrders([]);
      });
    return () => {
      mounted = false;
    };
  }, [user]);

  // Verify returning Stripe Checkout Session or auto-track query order_id
  useEffect(() => {
    let active = true;

    const syncInitial = async () => {
      if (initialOrderId && stripeSessionId && user) {
        setVerifyingStripe(true);
        try {
          const res = await apiClient.post(
            `/orders/${encodeURIComponent(initialOrderId)}/verify_stripe/`,
            { session_id: stripeSessionId }
          );
          if (!active) return;
          setOrder(res.data);
          setStripeVerifiedBanner(true);
          const next = new URLSearchParams(searchParams);
          next.delete("stripe_session");
          next.set("payment", "success");
          setSearchParams(next, { replace: true });
          return;
        } catch (err) {
          if (active) {
            setError(
              err.response?.data?.detail ||
                "Stripe session confirmation is still pending. Attempting status lookup..."
            );
          }
        } finally {
          if (active) setVerifyingStripe(false);
        }
      }

      if (initialOrderId && (user || initialContact)) {
        await performLookup(initialOrderId, initialContact);
      }
    };

    syncInitial();
    return () => {
      active = false;
    };
    // Run on URL parameter change or auth state initialization
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialOrderId, stripeSessionId, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanedId = orderIdInput.trim();
    const cleanedContact = contactInput.trim();
    const next = new URLSearchParams();
    if (cleanedId) next.set("order_id", cleanedId);
    if (cleanedContact) next.set("contact", cleanedContact);
    setSearchParams(next, { replace: true });
    await performLookup(cleanedId, cleanedContact);
  };

  const handleSelectRecent = async (ord) => {
    setOrderIdInput(ord.id);
    setError("");
    const next = new URLSearchParams();
    next.set("order_id", ord.id);
    setSearchParams(next, { replace: true });
    await performLookup(ord.id, contactInput);
  };

  const activeAlert = stripeVerifiedBanner
    ? PAYMENT_ALERTS.success
    : PAYMENT_ALERTS[paymentFlag] || null;

  const isFullOwnerView = Boolean(
    order && (order.recipient_name || order.shipping_address || order.user)
  );
  const items = Array.isArray(order?.items) ? order.items : [];

  return (
    <div data-surface="light" className="min-h-screen bg-[#FAF5EB] text-[#1A1410]">
      {/* Quiet Luxury Editorial Masthead */}
      <section
        data-surface="dark"
        className="bazaro-grain bg-[#0D0A08] text-[#FAF5EB] pt-28 sm:pt-32 pb-12 sm:pb-16 border-b border-[#C59B4B]/20"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.26em] text-[#C59B4B] block mb-3">
                BAZARO Atelier Concierge
              </span>
              <h1 className="font-serif-editorial text-4xl sm:text-5xl font-semibold tracking-tight text-[#FAF5EB] leading-[1.08]">
                Track Your Acquisition
              </h1>
              <p className="text-sm text-[#D6C8B0] mt-3 max-w-xl leading-relaxed">
                Follow live atelier preparation, insured courier handoff, and verified settlement
                milestones for any BAZARO reservation.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {user ? (
                <Link
                  to="/dashboard"
                  className="px-5 py-2.5 rounded-full border border-[#C59B4B]/40 text-[#E5C77A] hover:bg-[#C59B4B]/10 text-xs font-semibold uppercase tracking-[0.16em] inline-flex items-center gap-2 transition-colors"
                >
                  Patron Portal
                  <FiArrowRight />
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="px-5 py-2.5 rounded-full border border-[#C59B4B]/40 text-[#E5C77A] hover:bg-[#C59B4B]/10 text-xs font-semibold uppercase tracking-[0.16em] inline-flex items-center gap-2 transition-colors"
                >
                  Sign In for Full Ledger
                  <FiArrowRight />
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8">
        {/* Payment Return Banner */}
        {activeAlert && (
          <div
            role="status"
            className={`rounded-2xl border p-4 sm:p-5 flex items-start gap-3.5 shadow-sm ${activeAlert.tone}`}
          >
            <activeAlert.icon className="text-xl shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold">{activeAlert.title}</p>
              <p className="text-xs opacity-90 mt-0.5">{activeAlert.text}</p>
            </div>
          </div>
        )}

        {verifyingStripe && (
          <div className="rounded-2xl bg-[#1A1512] text-[#E5C77A] px-5 py-4 flex items-center gap-3 text-xs font-semibold tracking-wide">
            <div className="w-4 h-4 rounded-full border-2 border-[#E5C77A] border-t-transparent animate-spin shrink-0" />
            <span>Verifying Stripe settlement with BAZARO vault...</span>
          </div>
        )}

        {/* Signed-in Recent Acquisitions */}
        {user && recentOrders.length > 0 && (
          <div className="bg-white rounded-[24px] p-5 sm:p-6 border border-[#E6DAC2] shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8E6A28]">
                Your Recent Acquisitions
              </span>
              <span className="text-xs text-[#6B5A4E]">Click any order for live telemetry</span>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {recentOrders.map((ord) => {
                const isSelected = order?.id === ord.id;
                return (
                  <button
                    key={ord.id}
                    type="button"
                    onClick={() => handleSelectRecent(ord)}
                    className={`px-4 py-2 rounded-full text-xs border transition-all cursor-pointer flex items-center gap-2 bazaro-tabular ${
                      isSelected
                        ? "bg-[#1A1512] text-[#F6E3B4] border-[#1A1512] shadow-sm"
                        : "bg-[#FAF5EB] text-[#1A1410] border-[#D8C7AE] hover:border-[#8E6A28]"
                    }`}
                  >
                    <span className="font-mono font-bold">
                      #{String(ord.id).slice(0, 8).toUpperCase()}
                    </span>
                    <span className="opacity-60">•</span>
                    <span>{ord.status}</span>
                    <span className="opacity-60">•</span>
                    <span className="font-semibold">
                      ${parseFloat(ord.total_price || 0).toFixed(2)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Search & Verification Console */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-[28px] p-6 sm:p-8 border border-[#E6DAC2] shadow-sm space-y-5"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="font-serif-editorial text-2xl sm:text-3xl font-semibold text-[#1A1410]">
                Dispatch Reference Lookup
              </h2>
              <p className="text-xs text-[#6B5A4E] mt-1">
                {user
                  ? "Enter a full UUID or short 8-character prefix for your account orders, or verify another order with email/phone."
                  : "Enter the full Order UUID alongside your checkout email or phone number."}
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#8E6A28] bg-[#FAF5EB] px-3 py-1.5 rounded-full border border-[#E6DAC2] w-fit">
              <FiShield />
              Privacy Protected
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-6">
              <label
                htmlFor="track-order-id"
                className="block text-[10px] font-bold uppercase tracking-[0.18em] text-[#6B5A4E] mb-1.5"
              >
                Order Reference ID *
              </label>
              <input
                id="track-order-id"
                type="text"
                required
                value={orderIdInput}
                onChange={(e) => setOrderIdInput(e.target.value)}
                placeholder={user ? "e.g. A1B2C3D4 or full UUID" : "Full Order UUID (from confirmation email)"}
                className="w-full px-4 py-3 rounded-xl bg-[#FAF5EB]/70 border border-[#D8C7AE] text-sm font-mono text-[#1A1410] focus:border-[#8E6A28] focus:outline-none"
              />
            </div>

            <div className="md:col-span-4">
              <label
                htmlFor="track-contact"
                className="block text-[10px] font-bold uppercase tracking-[0.18em] text-[#6B5A4E] mb-1.5"
              >
                Email or Phone {user ? "(Optional for own orders)" : "*"}
              </label>
              <input
                id="track-contact"
                type="text"
                required={!user}
                value={contactInput}
                onChange={(e) => setContactInput(e.target.value)}
                placeholder="patron@example.com or 017..."
                className="w-full px-4 py-3 rounded-xl bg-[#FAF5EB]/70 border border-[#D8C7AE] text-sm text-[#1A1410] focus:border-[#8E6A28] focus:outline-none"
              />
            </div>

            <div className="md:col-span-2 flex items-end">
              <button
                type="submit"
                disabled={loading}
                className="bazaro-editorial-btn w-full py-3.5 px-5 rounded-xl bg-[#1A1512] hover:bg-[#2F251D] text-[#F6E3B4] text-xs font-bold uppercase tracking-[0.16em] inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                <FiSearch />
                {loading ? "Locating..." : "Locate"}
              </button>
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-xl bg-[#FFF5F5] border border-[#FECACA] text-[#991B1B] px-4 py-3 text-xs flex items-center gap-2"
            >
              <FiAlertCircle className="shrink-0 text-sm" />
              <span>{error}</span>
            </div>
          )}
        </form>

        {/* Live Tracking Result */}
        {order && (
          <div className="space-y-6">
            {/* Header & Timeline Card */}
            <div className="bg-white rounded-[28px] p-6 sm:p-8 border border-[#E6DAC2] shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#EFE6D4]">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8E6A28] block">
                    Verified Dispatch Record
                  </span>
                  <h3 className="font-serif-editorial text-2xl sm:text-3xl font-semibold text-[#1A1410] mt-1 bazaro-tabular">
                    Order #{String(order.id).slice(0, 8).toUpperCase()}
                  </h3>
                  <p className="text-xs text-[#6B5A4E] mt-1">
                    Recorded{" "}
                    {new Date(order.created_at || Date.now()).toLocaleString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {order.transaction_id ? ` • Ref ${order.transaction_id}` : ""}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <span
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border ${
                      order.payment_status === "Paid"
                        ? "bg-[#ECFDF5] border-[#A7F3D0] text-[#065F46]"
                        : "bg-[#FEF7E4] border-[#C59B4B]/40 text-[#7A591C]"
                    }`}
                  >
                    {order.payment_status} • {order.payment_method || "Settlement"}
                  </span>

                  {isFullOwnerView && (
                    <button
                      type="button"
                      onClick={() => setShowInvoiceModal(true)}
                      className="px-4 py-2 rounded-full bg-[#1A1512] hover:bg-[#2F251D] text-[#F6E3B4] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <FiPrinter />
                      Official Invoice
                    </button>
                  )}
                </div>
              </div>

              <OrderTimelineStepper order={order} />

              {/* Destination & Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                <div className="rounded-2xl bg-[#FAF5EB]/70 border border-[#E6DAC2] p-5 space-y-2">
                  <div className="flex items-center gap-2 text-[#8E6A28] text-[10px] font-bold uppercase tracking-[0.2em]">
                    <FiMapPin />
                    <span>Courier Destination</span>
                  </div>
                  <p className="text-sm font-bold text-[#1A1410]">
                    {order.recipient_name || order.recipient_label || "Verified Patron"}
                  </p>
                  <p className="text-xs text-[#57493F] leading-relaxed">
                    {order.shipping_address ||
                      `Area: ${order.destination_hint || "Courier Destination Verified"}`}
                  </p>
                  {order.contact_phone && (
                    <p className="text-xs text-[#6B5A4E] bazaro-tabular">
                      Contact: {order.contact_phone}
                    </p>
                  )}
                </div>

                <div className="rounded-2xl bg-[#FAF5EB]/70 border border-[#E6DAC2] p-5 space-y-2 bazaro-tabular text-xs">
                  <div className="flex items-center gap-2 text-[#8E6A28] text-[10px] font-bold uppercase tracking-[0.2em]">
                    <FiPackage />
                    <span>Settlement Summary</span>
                  </div>
                  <div className="flex justify-between text-[#57493F]">
                    <span>Subtotal</span>
                    <span className="font-semibold text-[#1A1410]">
                      ${parseFloat(order.subtotal || 0).toFixed(2)}
                    </span>
                  </div>
                  {parseFloat(order.discount_amount || 0) > 0 && (
                    <div className="flex justify-between text-[#065F46]">
                      <span>
                        Coupon Savings{order.coupon_code ? ` (${order.coupon_code})` : ""}
                      </span>
                      <span className="font-semibold">
                        -${parseFloat(order.discount_amount).toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-[#57493F]">
                    <span>Courier & Insurance</span>
                    <span className="font-semibold text-[#1A1410]">
                      {parseFloat(order.shipping_fee || 0) === 0
                        ? "Complimentary"
                        : `$${parseFloat(order.shipping_fee).toFixed(2)}`}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-[#D8C7AE] text-sm font-bold text-[#1A1410]">
                    <span>Total Settled</span>
                    <span>${parseFloat(order.total_price || 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Items List */}
              {items.length > 0 && (
                <div className="space-y-3 pt-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8E6A28] block">
                    Curated Pieces ({items.length})
                  </span>
                  <div className="divide-y divide-[#EFE6D4] border border-[#EFE6D4] rounded-2xl overflow-hidden">
                    {items.map((item, idx) => (
                      <div
                        key={item.id || idx}
                        className="p-4 flex items-center justify-between gap-4 bg-white"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[#1A1410] truncate">
                            {item.product?.name || `Edition Piece #${idx + 1}`}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-[#6B5A4E] bazaro-tabular">
                            <span>Qty: {item.quantity || 1}</span>
                            {item.selected_variant && (
                              <span className="px-2 py-0.5 rounded-full bg-[#FAF5EB] border border-[#E6DAC2] text-[#7A591C] text-[10px] font-semibold">
                                {item.selected_variant}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="text-sm font-bold text-[#1A1410] bazaro-tabular shrink-0">
                          $
                          {(
                            parseFloat(item.price || item.product?.price || 0) *
                            (item.quantity || 1)
                          ).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {isFullOwnerView && (
        <OrderInvoiceModal
          isOpen={showInvoiceModal}
          onClose={() => setShowInvoiceModal(false)}
          order={order}
          patronFallback={user?.email}
        />
      )}
    </div>
  );
};

export default TrackOrder;
