import React from "react";
import { createPortal } from "react-dom";
import { FiPrinter, FiShield, FiX } from "react-icons/fi";
import { useAccessibleDialog } from "../../hooks/useAccessibleDialog";

function InvoiceDocument({ order, patronFallback }) {
  if (!order) return null;

  const shortId = String(order.id || "BAZARO").slice(0, 12).toUpperCase();
  const orderDate = new Date(order.created_at || Date.now()).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const items = Array.isArray(order.items) ? order.items : [];

  const computedSubtotal =
    parseFloat(order.subtotal) ||
    items.reduce(
      (sum, it) => sum + (parseFloat(it.price || it.product?.price || 0) * (it.quantity || 1)),
      0
    );
  const discount = parseFloat(order.discount_amount || 0) || 0;
  const shipping = parseFloat(order.shipping_fee || 0) || 0;
  const tax = parseFloat(order.tax_amount || 0) || 0;
  const grandTotal = parseFloat(order.total_price || order.total || computedSubtotal) || 0;

  return (
    <div className="bg-white text-[#1A1410] p-6 sm:p-8 rounded-2xl border border-[#C59B4B]/30 space-y-6">
      {/* Brand Masthead */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-5 border-b-2 border-[#C59B4B]/40">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#0D0A08] border border-[#C59B4B] flex items-center justify-center shrink-0">
            <img
              src="/bazaro-logo.png"
              alt="BAZARO Crest"
              className="w-9 h-9 object-contain"
            />
          </div>
          <div>
            <span className="font-serif-editorial text-2xl font-bold tracking-[0.14em] text-[#0D0A08] block">
              BAZARO
            </span>
            <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#9C7E54] block">
              Apnar Desher Bazaar • Official Atelier Receipt
            </span>
          </div>
        </div>

        <div className="sm:text-right text-xs space-y-0.5">
          <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#9C7E54] block">
            Tax & Dispatch Invoice
          </span>
          <p className="font-mono font-bold text-sm text-[#0D0A08]">INV-{shortId}</p>
          <p className="text-[#6E5C4F]">{orderDate}</p>
        </div>
      </div>

      {/* Billing, Dispatch & Settlement Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-[#FAF5EB] rounded-2xl p-4 border border-[#C59B4B]/20 text-xs">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#9C7E54] block mb-1">
            Recipient Patron
          </span>
          <p className="font-bold text-[#1A1410]">
            {order.recipient_name || patronFallback?.name || "Verified Patron"}
          </p>
          <p className="text-[#524336]">{order.contact_phone || patronFallback?.phone || "—"}</p>
          {(order.user_email || patronFallback?.email) && (
            <p className="text-[#6E5C4F] text-[11px] truncate">
              {order.user_email || patronFallback?.email}
            </p>
          )}
        </div>

        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#9C7E54] block mb-1">
            Delivery Destination
          </span>
          <p className="text-[#1A1410] font-medium leading-relaxed">
            {order.shipping_address || patronFallback?.address || "BAZARO Courier Dispatch"}
          </p>
        </div>

        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#9C7E54] block mb-1">
            Settlement Status
          </span>
          <p className="font-bold text-[#1A1410]">
            {order.payment_method || "Standard"} • {order.payment_status || "Pending"}
          </p>
          <p className="text-[#524336]">
            Fulfillment: <strong className="text-[#1A1410]">{order.status || "Processing"}</strong>
          </p>
          {order.transaction_id && (
            <p className="font-mono text-[11px] text-[#9C7E54] mt-0.5 break-all">
              Ref: {order.transaction_id}
            </p>
          )}
        </div>
      </div>

      {/* Itemized Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <caption className="sr-only">Order line items for INV-{shortId}</caption>
          <thead>
            <tr className="border-b border-[#C59B4B]/35 text-[10px] font-extrabold uppercase tracking-wider text-[#9C7E54]">
              <th scope="col" className="py-2.5 pr-3">
                Piece Description
              </th>
              <th scope="col" className="py-2.5 px-2 text-center">
                Qty
              </th>
              <th scope="col" className="py-2.5 px-2 text-right">
                Unit Price
              </th>
              <th scope="col" className="py-2.5 pl-2 text-right">
                Line Total
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#C59B4B]/15">
            {items.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-4 text-center text-[#6E5C4F]">
                  Atelier Order Bundle Summary
                </td>
              </tr>
            ) : (
              items.map((item, idx) => {
                const name = item.product?.name || item.name || `Catalog Piece #${idx + 1}`;
                const unitPrice = parseFloat(item.price || item.product?.price || 0) || 0;
                const qty = Number(item.quantity || 1);
                const lineTotal = parseFloat(item.total_price || unitPrice * qty) || 0;
                return (
                  <tr key={item.id || `${name}-${idx}`}>
                    <td className="py-3 pr-3">
                      <span className="font-bold text-[#1A1410] block">{name}</span>
                      {item.selected_variant && (
                        <span className="text-[11px] text-[#9C7E54] font-medium">
                          Variant: {item.selected_variant}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-2 text-center font-semibold">{qty}</td>
                    <td className="py-3 px-2 text-right font-mono">${unitPrice.toFixed(2)}</td>
                    <td className="py-3 pl-2 text-right font-mono font-bold text-[#0D0A08]">
                      ${lineTotal.toFixed(2)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Monetary Totals */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 pt-4 border-t border-[#C59B4B]/30">
        <div className="text-[11px] text-[#6E5C4F] space-y-1 max-w-sm">
          <div className="inline-flex items-center gap-1.5 font-bold text-[#1A1410]">
            <FiShield className="text-[#C59B4B]" />
            <span>Authenticated by BAZARO Royal Dispatch</span>
          </div>
          <p>Road 11, Banani Atelier, Dhaka 1213 • concierge@bazaro.com.bd</p>
        </div>

        <div className="w-full sm:w-64 space-y-1.5 text-xs">
          <div className="flex justify-between text-[#524336]">
            <span>Subtotal</span>
            <span className="font-mono font-semibold">${computedSubtotal.toFixed(2)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-emerald-700 font-semibold">
              <span>Voucher ({order.coupon_code || "PROMO"})</span>
              <span className="font-mono">-${discount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-[#524336]">
            <span>Insured Courier</span>
            <span className="font-mono font-semibold">
              {shipping === 0 ? "COMPLIMENTARY" : `$${shipping.toFixed(2)}`}
            </span>
          </div>
          {tax > 0 && (
            <div className="flex justify-between text-[#524336]">
              <span>VAT / Duties</span>
              <span className="font-mono">${tax.toFixed(2)}</span>
            </div>
          )}
          <div className="pt-2 border-t border-[#C59B4B]/35 flex justify-between items-baseline">
            <span className="font-extrabold uppercase tracking-wider text-[11px] text-[#0D0A08]">
              Grand Total
            </span>
            <span className="font-serif-editorial bazaro-tabular text-2xl font-bold text-[#0D0A08]">
              ${grandTotal.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

const OrderInvoiceModal = ({ isOpen, onClose, order, patronFallback }) => {
  const { dialogRef, contentRef } = useAccessibleDialog(isOpen, onClose);

  const handlePrint = () => {
    document.body.classList.add("bazaro-printing");
    const cleanup = () => {
      document.body.classList.remove("bazaro-printing");
      window.removeEventListener("afterprint", cleanup);
    };
    window.addEventListener("afterprint", cleanup);
    window.print();
    // Safety fallback cleanup for browsers that skip afterprint
    setTimeout(cleanup, 1200);
  };

  return (
    <>
      <dialog
        ref={dialogRef}
        closedby="any"
        aria-labelledby="order-invoice-title"
        className="bazaro-dialog bazaro-dialog-md bazaro-invoice-dialog"
      >
        <div
          ref={contentRef}
          data-surface="dark"
          className="w-full max-w-3xl bg-[#140F0C] rounded-[28px] p-5 sm:p-7 border border-[#C59B4B]/40 text-[#FAF5EB] shadow-2xl space-y-5"
        >
          <div className="flex items-center justify-between gap-3 pb-3 border-b border-[#C59B4B]/25">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#C59B4B] block">
                Ledger Statement
              </span>
              <h2
                id="order-invoice-title"
                className="font-serif-editorial text-xl font-semibold text-[#FAF5EB]"
              >
                BAZARO Official Invoice
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                autofocus
                onClick={handlePrint}
                className="bazaro-editorial-btn bazaro-touch-control px-4 py-2 rounded-full text-xs inline-flex items-center gap-1.5 cursor-pointer"
              >
                <FiPrinter className="text-sm" />
                <span>Print / Save PDF</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close invoice preview"
                className="bazaro-touch-control p-2 rounded-full bg-white/5 hover:bg-[#C59B4B]/20 text-[#E5C77A] cursor-pointer flex items-center justify-center"
              >
                <FiX className="text-base" />
              </button>
            </div>
          </div>

          <div className="max-h-[75dvh] overflow-y-auto pr-1">
            <InvoiceDocument order={order} patronFallback={patronFallback} />
          </div>
        </div>
      </dialog>

      {isOpen &&
        order &&
        typeof document !== "undefined" &&
        createPortal(
          <div id="bazaro-print-root" className="hidden print:block p-4 bg-white">
            <InvoiceDocument order={order} patronFallback={patronFallback} />
          </div>,
          document.body
        )}
    </>
  );
};

export default OrderInvoiceModal;
