import React, { useState } from "react";
import { useNavigate } from "react-router";
import { useAccessibleDialog } from "../../hooks/useAccessibleDialog";
import {
  FiX,
  FiCreditCard,
  FiSmartphone,
  FiDollarSign,
  FiShield,
  FiCheckCircle,
  FiLock,
  FiZap,
  FiPrinter,
  FiMail,
  FiArrowRight,
  FiExternalLink,
} from "react-icons/fi";

const FakePaymentModal = ({
  isOpen,
  onClose,
  totalAmount = 0,
  shippingDetails = {},
  onPaymentSuccess,
  onGatewayCheckout,
  onOpenInvoice,
  receiptOrderId,
}) => {
  const navigate = useNavigate();
  const { dialogRef, contentRef } = useAccessibleDialog(isOpen, onClose);

  const [activeTab, setActiveTab] = useState("card"); // 'card' | 'mfs' | 'cod'
  const [processing, setProcessing] = useState(false);
  const [gatewayLoading, setGatewayLoading] = useState("");
  const [gatewayNotice, setGatewayNotice] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const [formErr, setFormErr] = useState("");

  // Card inputs
  const [cardNumber, setCardNumber] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");

  // MFS inputs
  const [mfsProvider, setMfsProvider] = useState("bKash");
  const [mfsPhone, setMfsPhone] = useState("");
  const [mfsOtp, setMfsOtp] = useState("");
  const [mfsPin, setMfsPin] = useState("");

  const fillDemoCard = () => {
    setFormErr("");
    setCardNumber("4242 4242 4242 4242");
    setCardHolder(shippingDetails?.recipient || "BAZARO Patron");
    setExpiry("12/28");
    setCvv("888");
  };

  const fillDemoMfs = () => {
    setFormErr("");
    setMfsPhone("01712345678");
    setMfsOtp("123456");
    setMfsPin("20260");
  };

  const handlePayNow = () => {
    setFormErr("");
    if (activeTab === "card" && (!cardNumber.trim() || !cardHolder.trim())) {
      setFormErr("Please enter card details or click Auto-fill test card.");
      return;
    }
    if (activeTab === "mfs" && !mfsPhone.trim()) {
      setFormErr(`Please enter your ${mfsProvider} wallet number or click Auto-fill.`);
      return;
    }

    setProcessing(true);
    setTimeout(async () => {
      const txnId = `BAZ-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Date.now()
        .toString()
        .slice(-4)}`;
      const methodLabel =
        activeTab === "card"
          ? "Visa / Mastercard"
          : activeTab === "mfs"
            ? `${mfsProvider} MFS`
            : "Cash on Delivery";

      const paymentInfo = {
        method: methodLabel,
        txnId,
        amount: Number(totalAmount) || 0,
        status: activeTab === "cod" ? "Pending" : "Paid",
      };

      setReceipt({
        ...paymentInfo,
        timestamp: new Date().toLocaleString(),
      });
      setProcessing(false);

      if (onPaymentSuccess) {
        await onPaymentSuccess(paymentInfo);
      }
    }, 850);
  };

  const handleResetAndClose = (goTrack = false) => {
    setReceipt(null);
    setFormErr("");
    setGatewayNotice(null);
    onClose?.();
    if (goTrack) {
      navigate(
        receiptOrderId
          ? `/track-order?order_id=${encodeURIComponent(receiptOrderId)}`
          : "/track-order"
      );
    }
  };

  const handleLaunchGateway = async (provider) => {
    if (!onGatewayCheckout) return;
    setFormErr("");
    setGatewayNotice(null);
    setGatewayLoading(provider);
    try {
      const outcome = await onGatewayCheckout(provider);
      if (outcome?.error) {
        setFormErr(outcome.error);
      } else if (outcome?.mode === "sandbox_ready") {
        setGatewayNotice({
          provider: outcome.provider || provider,
          detail:
            outcome.detail ||
            "External gateway credentials are not set in .env. Complete immediate settlement via the built-in Sandbox below.",
        });
      }
    } catch (err) {
      setFormErr(
        err?.response?.data?.detail || "Unable to connect with the selected payment gateway."
      );
    } finally {
      setGatewayLoading("");
    }
  };

  return (
    <dialog
      ref={dialogRef}
      closedby="any"
      aria-labelledby="payment-vault-title"
      className="bazaro-dialog bazaro-dialog-sm"
    >
      <div
        ref={contentRef}
        data-surface="dark"
        className="w-full rounded-[28px] bg-[#0D0A08] text-[#FAF5EB] border border-[#C59B4B]/40 shadow-[0_32px_80px_rgba(0,0,0,0.85)] overflow-hidden"
      >
        {/* Top Vault Header */}
        <div className="bazaro-grain px-6 py-5 bg-[#140F0C] border-b border-[#C59B4B]/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#C59B4B]/15 border border-[#C59B4B]/40 text-[#E5C77A] flex items-center justify-center">
              <FiShield className="text-lg" />
            </div>
            <div>
              <h2
                id="payment-vault-title"
                className="font-serif-editorial text-xl font-semibold text-[#FAF5EB]"
              >
                BAZARO Settlement Vault
              </h2>
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#C59B4B] font-bold">
                Dual-Mode Gateway • Sandbox & Live
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleResetAndClose(false)}
            aria-label="Close payment modal"
            className="w-9 h-9 rounded-full border border-[#C59B4B]/25 bg-white/5 hover:bg-[#C59B4B]/20 text-[#E5C77A] flex items-center justify-center transition-colors cursor-pointer"
          >
            <FiX />
          </button>
        </div>

        {/* Receipt View OR Payment Form */}
        {receipt ? (
          <div className="p-6 sm:p-8 text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-400/40 text-emerald-300 flex items-center justify-center mx-auto">
              <FiCheckCircle className="text-3xl" />
            </div>

            <div>
              <span className="text-[10px] uppercase tracking-[0.22em] text-[#C59B4B] font-bold">
                Order Authenticated
              </span>
              <h3 className="font-serif-editorial text-2xl sm:text-3xl font-semibold text-[#FAF5EB] mt-1">
                Settlement Confirmed
              </h3>
              <p className="text-xs text-[#9C7E54] mt-1">
                Thank you for shopping with BAZARO. Your order has been recorded.
              </p>
            </div>

            <div className="bg-[#1A1410] border border-[#C59B4B]/25 rounded-2xl p-4 text-left space-y-2.5 text-xs bazaro-tabular">
              <div className="flex justify-between">
                <span className="text-[#9C7E54]">Transaction Ref:</span>
                <span className="font-mono font-bold text-[#E5C77A]">{receipt.txnId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#9C7E54]">Payment Channel:</span>
                <span className="font-bold text-[#FAF5EB]">{receipt.method}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#9C7E54]">Amount Settled:</span>
                <span className="font-black text-[#E5C77A] text-sm">
                  ${receipt.amount.toFixed(2)}
                </span>
              </div>
              {shippingDetails?.address && (
                <div className="pt-2 border-t border-[#C59B4B]/15">
                  <span className="text-[#9C7E54] block mb-0.5">Dispatch Destination:</span>
                  <span className="text-[#EFE7DA] font-medium line-clamp-2">
                    {shippingDetails.recipient ? `${shippingDetails.recipient} — ` : ""}
                    {shippingDetails.address}
                  </span>
                </div>
              )}
              <div className="pt-2 border-t border-[#C59B4B]/15 flex items-center gap-2 text-[11px] text-emerald-300">
                <FiMail className="shrink-0" />
                <span className="truncate">
                  Demo Confirmation Dispatched ({shippingDetails?.email || "Patron Vault Email"})
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {onOpenInvoice ? (
                <button
                  type="button"
                  autofocus
                  onClick={() => {
                    onClose?.();
                    onOpenInvoice();
                  }}
                  className="py-3 px-4 rounded-full border border-[#C59B4B]/45 bg-[#1A1410] text-xs font-bold text-[#E5C77A] hover:bg-[#C59B4B]/15 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <FiPrinter className="text-xs" />
                  <span>Print / PDF Invoice</span>
                </button>
              ) : (
                <button
                  type="button"
                  autofocus
                  onClick={() => handleResetAndClose(false)}
                  className="py-3 rounded-full border border-[#C59B4B]/35 text-xs font-bold text-[#EFE7DA] hover:bg-white/5 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Done</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => handleResetAndClose(true)}
                className="bazaro-editorial-btn py-3 px-4 rounded-full text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Track Order</span>
                <FiArrowRight className="text-xs" />
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-5">
            {/* Amount Summary Strip */}
            <div className="p-4 rounded-2xl bg-[#1A1410] border border-[#C59B4B]/25 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-[#9C7E54] font-bold block">
                  Total Payable
                </span>
                <span className="text-xs text-[#EFE7DA]">
                  {shippingDetails?.recipient || "Valued Patron"}
                </span>
              </div>
              <span className="font-serif-editorial bazaro-tabular text-2xl font-semibold text-[#E5C77A]">
                ${(parseFloat(totalAmount) || 0).toFixed(2)}
              </span>
            </div>

            {/* Channel Selector Tabs */}
            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-[#1A1410] border border-[#C59B4B]/20">
              {[
                { id: "card", label: "Card", icon: <FiCreditCard /> },
                { id: "mfs", label: "Mobile Pay", icon: <FiSmartphone /> },
                { id: "cod", label: "COD", icon: <FiDollarSign /> },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(t.id);
                    setFormErr("");
                  }}
                  className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === t.id
                      ? "bg-gradient-to-r from-[#E5C77A] to-[#C59B4B] text-[#0D0A08] shadow-sm"
                      : "text-[#9C7E54] hover:text-[#FAF5EB]"
                  }`}
                >
                  {t.icon}
                  <span>{t.label}</span>
                </button>
              ))}
            </div>

            {formErr && (
              <p
                role="alert"
                className="p-3 rounded-xl bg-amber-950/70 border border-amber-500/40 text-amber-200 text-xs font-semibold"
              >
                {formErr}
              </p>
            )}

            {/* Tab 1: Card */}
            {activeTab === "card" && (
              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#EFE7DA]">Card Particulars</span>
                  <button
                    type="button"
                    onClick={fillDemoCard}
                    className="text-xs text-[#E5C77A] hover:underline font-bold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <FiZap className="text-xs" />
                    <span>Auto-fill test card</span>
                  </button>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-[#9C7E54] block mb-1">
                    Card Number
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="4242 4242 4242 4242"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full pl-3.5 pr-20 py-2.5 bg-[#1A1410] rounded-xl border border-[#C59B4B]/30 text-xs sm:text-sm font-mono text-[#FAF5EB] placeholder-[#6E5C4F] focus:outline-none focus:border-[#E5C77A]"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none">
                      <span className="text-[9px] font-bold text-[#E5C77A] bg-[#0D0A08] border border-[#C59B4B]/35 px-1.5 py-0.5 rounded">
                        VISA
                      </span>
                      <span className="text-[9px] font-bold text-[#EFE7DA] bg-[#0D0A08] border border-[#C59B4B]/35 px-1.5 py-0.5 rounded">
                        MC
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-[#9C7E54] block mb-1">
                    Cardholder Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Tanbir Hasan"
                    value={cardHolder}
                    onChange={(e) => setCardHolder(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#1A1410] rounded-xl border border-[#C59B4B]/30 text-xs sm:text-sm text-[#FAF5EB] placeholder-[#6E5C4F] focus:outline-none focus:border-[#E5C77A]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-medium text-[#9C7E54] block mb-1">
                      Expires (MM/YY)
                    </label>
                    <input
                      type="text"
                      placeholder="12/28"
                      value={expiry}
                      onChange={(e) => setExpiry(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#1A1410] rounded-xl border border-[#C59B4B]/30 text-xs sm:text-sm font-mono text-[#FAF5EB] placeholder-[#6E5C4F] focus:outline-none focus:border-[#E5C77A]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-[#9C7E54] block mb-1">
                      CVC / CVV
                    </label>
                    <input
                      type="password"
                      maxLength={4}
                      placeholder="888"
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#1A1410] rounded-xl border border-[#C59B4B]/30 text-xs sm:text-sm font-mono text-[#FAF5EB] placeholder-[#6E5C4F] focus:outline-none focus:border-[#E5C77A]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: MFS */}
            {activeTab === "mfs" && (
              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#EFE7DA]">Select Provider</span>
                  <button
                    type="button"
                    onClick={fillDemoMfs}
                    className="text-xs text-[#E5C77A] hover:underline font-bold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <FiZap className="text-xs" />
                    <span>Auto-fill test wallet</span>
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {["bKash", "Nagad", "Rocket"].map((prov) => (
                    <button
                      key={prov}
                      type="button"
                      onClick={() => setMfsProvider(prov)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        mfsProvider === prov
                          ? "border-[#E5C77A] bg-[#C59B4B]/20 text-[#E5C77A]"
                          : "border-[#C59B4B]/25 bg-[#1A1410] text-[#9C7E54] hover:text-[#FAF5EB]"
                      }`}
                    >
                      {prov}
                    </button>
                  ))}
                </div>

                <div>
                  <label className="text-[11px] font-medium text-[#9C7E54] block mb-1">
                    {mfsProvider} Mobile Number
                  </label>
                  <input
                    type="text"
                    placeholder="017XXXXXXXX"
                    value={mfsPhone}
                    onChange={(e) => setMfsPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#1A1410] rounded-xl border border-[#C59B4B]/30 text-xs sm:text-sm font-mono text-[#FAF5EB] placeholder-[#6E5C4F] focus:outline-none focus:border-[#E5C77A]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-medium text-[#9C7E54] block mb-1">
                      Demo OTP
                    </label>
                    <input
                      type="text"
                      placeholder="123456"
                      value={mfsOtp}
                      onChange={(e) => setMfsOtp(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#1A1410] rounded-xl border border-[#C59B4B]/30 text-xs sm:text-sm font-mono text-[#FAF5EB] placeholder-[#6E5C4F] focus:outline-none focus:border-[#E5C77A]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-[#9C7E54] block mb-1">
                      Demo PIN
                    </label>
                    <input
                      type="password"
                      placeholder="•••••"
                      value={mfsPin}
                      onChange={(e) => setMfsPin(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#1A1410] rounded-xl border border-[#C59B4B]/30 text-xs sm:text-sm font-mono text-[#FAF5EB] placeholder-[#6E5C4F] focus:outline-none focus:border-[#E5C77A]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: COD */}
            {activeTab === "cod" && (
              <div className="py-4 px-4.5 rounded-2xl bg-[#1A1410] border border-[#C59B4B]/25 space-y-2">
                <div className="flex items-center gap-2 text-[#FAF5EB] font-bold text-sm">
                  <FiDollarSign className="text-base text-[#E5C77A]" />
                  <span>Pay Cash on Courier Arrival</span>
                </div>
                <p className="text-xs text-[#9C7E54] leading-relaxed">
                  No upfront payment required. Inspect the sealed parcel upon delivery and settle in cash directly with our BAZARO courier.
                </p>
                <div className="pt-1 text-[11px] text-[#C59B4B] font-semibold">
                  Insured dispatch: 1-3 business days across Bangladesh.
                </div>
              </div>
            )}

            {/* Live Gateway Redirect Option (SSLCommerz / Stripe Sandbox) */}
            {onGatewayCheckout && (
              <div className="rounded-2xl bg-[#1A1410] border border-[#C59B4B]/25 p-4 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] uppercase tracking-[0.18em] font-bold text-[#C59B4B]">
                    External Gateway Redirect
                  </span>
                  <span className="text-[10px] text-[#9C7E54]">
                    SSLCommerz BD & Stripe Test
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={Boolean(gatewayLoading) || processing}
                    onClick={() => handleLaunchGateway("sslcommerz")}
                    className="px-3.5 py-2.5 rounded-xl bg-[#0D0A08] border border-[#C59B4B]/35 hover:border-[#E5C77A] text-[#FAF5EB] text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors disabled:opacity-60"
                  >
                    <FiExternalLink className="text-[#E5C77A]" />
                    <span>
                      {gatewayLoading === "sslcommerz"
                        ? "Connecting SSLCommerz..."
                        : "SSLCommerz Sandbox"}
                    </span>
                  </button>
                  <button
                    type="button"
                    disabled={Boolean(gatewayLoading) || processing}
                    onClick={() => handleLaunchGateway("stripe")}
                    className="px-3.5 py-2.5 rounded-xl bg-[#0D0A08] border border-[#C59B4B]/35 hover:border-[#E5C77A] text-[#FAF5EB] text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors disabled:opacity-60"
                  >
                    <FiExternalLink className="text-[#E5C77A]" />
                    <span>
                      {gatewayLoading === "stripe"
                        ? "Connecting Stripe..."
                        : "Stripe Test Checkout"}
                    </span>
                  </button>
                </div>

                {gatewayNotice && (
                  <p className="text-[11px] text-[#E5C77A] bg-[#0D0A08] border border-[#C59B4B]/30 rounded-xl px-3 py-2 leading-relaxed">
                    {gatewayNotice.detail}
                  </p>
                )}
              </div>
            )}

            {/* Footer Controls */}
            <div className="pt-4 border-t border-[#C59B4B]/20 flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 text-[11px] text-[#9C7E54]">
                <FiLock className="text-xs text-[#E5C77A]" />
                <span>256-bit SSL Sandbox</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleResetAndClose(false)}
                  className="px-4 py-2.5 rounded-full border border-[#C59B4B]/30 text-xs font-semibold text-[#EFE7DA] hover:bg-white/5 transition-all cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={processing || Boolean(gatewayLoading)}
                  onClick={handlePayNow}
                  className="bazaro-editorial-btn px-5 sm:px-6 py-2.5 rounded-full text-xs cursor-pointer flex items-center gap-2"
                >
                  {processing ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-[#0D0A08] border-t-transparent rounded-full animate-spin" />
                      <span>Authorizing...</span>
                    </>
                  ) : (
                    <span>
                      {activeTab === "cod"
                        ? "Confirm COD Order"
                        : `Pay $${(parseFloat(totalAmount) || 0).toFixed(2)}`}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </dialog>
  );
};

export default FakePaymentModal;
