import React from "react";
import { Link } from "react-router";
import {
  FiX,
  FiShoppingBag,
  FiTrash2,
  FiPlus,
  FiMinus,
  FiArrowRight,
  FiTruck,
} from "react-icons/fi";
import { useCart } from "../../context/CartContext";
import { useAccessibleDialog } from "../../hooks/useAccessibleDialog";
import defaultProductImg from "../../assets/default-product.png";

const CartDrawer = ({ isOpen, onClose }) => {
  const { cart, cartCount, totalAmount, updateQuantity, removeFromCart } = useCart();
  const { dialogRef, contentRef } = useAccessibleDialog(isOpen, onClose);

  const items = Array.isArray(cart) ? cart : cart?.items || [];
  const freeShippingThreshold = 50;
  const safeTotal = Number(totalAmount) || 0;
  const shippingProgress = Math.min(100, Math.round((safeTotal / freeShippingThreshold) * 100));
  const remainingForFree = Math.max(0, freeShippingThreshold - safeTotal);

  return (
    <dialog
      ref={dialogRef}
      closedby="any"
      aria-labelledby="cart-drawer-title"
      className="bazaro-dialog bazaro-dialog-drawer"
    >
      <div
        ref={contentRef}
        data-surface="dark"
        className="h-full w-full bg-[#0D0A08] text-[#FAF5EB] border-l border-[#C59B4B]/30 flex flex-col shadow-2xl"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#C59B4B]/20 flex items-center justify-between bg-[#140F0C]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#C59B4B]/15 border border-[#C59B4B]/35 flex items-center justify-center text-[#E5C77A]">
              <FiShoppingBag className="text-lg" />
            </div>
            <div>
              <h2
                id="cart-drawer-title"
                className="font-serif-luxury text-lg font-bold tracking-wide text-[#FAF5EB]"
              >
                Your Royal Bag
              </h2>
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#C59B4B] font-semibold">
                {cartCount} curated {cartCount === 1 ? "item" : "items"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close shopping bag"
            className="w-9 h-9 rounded-full border border-[#C59B4B]/30 bg-white/5 hover:bg-[#C59B4B]/20 text-[#E5C77A] flex items-center justify-center transition-colors cursor-pointer"
          >
            <FiX className="text-base" />
          </button>
        </div>

        {/* Complimentary Shipping Progress */}
        <div className="px-6 py-3.5 bg-[#1A1410] border-b border-[#C59B4B]/15">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="flex items-center gap-1.5 text-[#EFE7DA] font-medium">
              <FiTruck className="text-[#E5C77A]" />
              {remainingForFree === 0
                ? "Complimentary Royal Express unlocked"
                : `$${remainingForFree.toFixed(2)} away from complimentary delivery`}
            </span>
            <span className="text-[#E5C77A] font-bold">{shippingProgress}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#A67E33] via-[#C59B4B] to-[#E5C77A] transition-all duration-300"
              style={{ width: `${shippingProgress}%` }}
            />
          </div>
        </div>

        {/* Cart Items Scroll Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 bazaro-scroll-contain">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12">
              <div className="w-16 h-16 rounded-full border border-[#C59B4B]/30 bg-[#1A1410] flex items-center justify-center text-[#C59B4B] mb-4">
                <FiShoppingBag className="text-2xl" />
              </div>
              <p className="font-serif-luxury text-xl font-bold text-[#FAF5EB] mb-1">
                Your Vault Is Empty
              </p>
              <p className="text-xs text-[#9C7E54] max-w-xs mb-6 leading-relaxed">
                Explore authentic artisan selections and royal daily essentials across BAZARO.
              </p>
              <Link
                to="/shop"
                onClick={onClose}
                className="bazaro-gold-btn px-6 py-3 rounded-full text-xs inline-flex items-center gap-2"
              >
                <span>Explore Collection</span>
                <FiArrowRight />
              </Link>
            </div>
          ) : (
            items.map((item) => {
              const product = item.product || {};
              const imgUrl =
                product?.images?.[0]?.image_url ||
                product?.images?.[0]?.image ||
                product?.image ||
                defaultProductImg;
              const price = parseFloat(product?.price) || 0;
              const itemKey =
                item.cartKey ||
                (item.selected_variant
                  ? `${product.id}::${item.selected_variant}`
                  : product.id);

              return (
                <div
                  key={itemKey}
                  className="flex gap-3.5 p-3.5 rounded-2xl bg-[#1A1410]/90 border border-[#C59B4B]/20 hover:border-[#C59B4B]/45 transition-colors"
                >
                  <Link
                    to={`/product/${product.id}`}
                    state={{ previewProduct: product }}
                    onClick={onClose}
                    className="w-20 h-20 rounded-xl bg-[#FAF5EB] p-1.5 shrink-0 overflow-hidden"
                  >
                    <img
                      src={imgUrl}
                      alt={product.name}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = defaultProductImg;
                      }}
                      className="w-full h-full object-contain"
                    />
                  </Link>

                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <Link
                        to={`/product/${product.id}`}
                        state={{ previewProduct: product }}
                        onClick={onClose}
                        className="font-serif-editorial text-base font-semibold text-[#FAF5EB] hover:text-[#E5C77A] transition-colors line-clamp-1"
                      >
                        {product.name}
                      </Link>
                      {item.selected_variant && (
                        <p className="text-[10px] uppercase tracking-[0.14em] text-[#B8AB98] mt-0.5 truncate">
                          {item.selected_variant}
                        </p>
                      )}
                      <p className="text-xs text-[#E5C77A] font-semibold bazaro-tabular mt-0.5">
                        ${price.toFixed(2)}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <div className="inline-flex items-center rounded-full border border-[#C59B4B]/30 bg-[#0D0A08] px-1.5 py-0.5">
                        <button
                          type="button"
                          onClick={() => updateQuantity(itemKey, item.quantity - 1)}
                          aria-label={`Decrease quantity of ${product.name}`}
                          className="p-1 text-[#EFE7DA] hover:text-[#E5C77A] cursor-pointer"
                        >
                          <FiMinus className="text-xs" />
                        </button>
                        <span className="px-2.5 text-xs font-bold text-[#FAF5EB] bazaro-tabular">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(itemKey, item.quantity + 1)}
                          aria-label={`Increase quantity of ${product.name}`}
                          className="p-1 text-[#EFE7DA] hover:text-[#E5C77A] cursor-pointer"
                        >
                          <FiPlus className="text-xs" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeFromCart(itemKey)}
                        aria-label={`Remove ${product.name}`}
                        className="p-1.5 text-[#9C7E54] hover:text-amber-400 transition-colors cursor-pointer"
                      >
                        <FiTrash2 className="text-sm" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Actions */}
        {items.length > 0 && (
          <div className="px-6 py-5 border-t border-[#C59B4B]/20 bg-[#140F0C] space-y-3.5">
            <p className="text-[10px] uppercase tracking-[0.18em] text-[#A99B87] text-center">
              Patron Privilege: Use code{" "}
              <strong className="text-[#E5C77A] tracking-[0.2em]">BAZARO20</strong>{" "}
              at checkout
            </p>
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-[0.2em] text-[#9C7E54] font-semibold">
                Estimated Subtotal
              </span>
              <span className="font-serif-editorial text-2xl font-semibold text-[#E5C77A] bazaro-tabular">
                ${safeTotal.toFixed(2)}
              </span>
            </div>

            <Link
              to="/cart"
              onClick={onClose}
              className="bazaro-gold-btn w-full py-3.5 rounded-full text-xs flex items-center justify-center gap-2"
            >
              <span>Proceed to Royal Checkout</span>
              <FiArrowRight />
            </Link>
          </div>
        )}
      </div>
    </dialog>
  );
};

export default CartDrawer;
