import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import {
  FiArrowRight,
  FiCheck,
  FiHeart,
  FiMinus,
  FiPlus,
  FiShoppingBag,
  FiStar,
  FiX,
} from "react-icons/fi";
import defaultProductImg from "../../assets/default-product.png";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";
import { useAccessibleDialog } from "../../hooks/useAccessibleDialog";
import { navigateWithTransition } from "../../utils/viewTransition";

const QuickViewModal = ({ product, isOpen, onClose }) => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const { dialogRef, contentRef } = useAccessibleDialog(isOpen, onClose);
  const heroImgRef = useRef(null);

  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [addedFeedback, setAddedFeedback] = useState(false);

  const images =
    product?.images?.length > 0
      ? product.images.map((item) => item?.image_url || item?.image).filter(Boolean)
      : product?.image
        ? [product.image]
        : [defaultProductImg];

  const colors = Array.isArray(product?.available_colors)
    ? product.available_colors.filter(Boolean)
    : [];
  const sizes = Array.isArray(product?.available_sizes)
    ? product.available_sizes.filter(Boolean)
    : [];

  useEffect(() => {
    if (!isOpen || !product) return;
    setActiveImageIdx(0);
    setQuantity(1);
    setAddedFeedback(false);
    setSelectedColor(colors[0] || "");
    setSelectedSize(sizes[0] || "");
  }, [isOpen, product?.id]);

  if (!product) {
    return (
      <dialog
        ref={dialogRef}
        closedBy="any"
        aria-hidden="true"
        className="bazaro-dialog"
      />
    );
  }

  const price = parseFloat(product.price) || 0;
  const stock = Number(product.stock) || 0;
  const inStock = stock > 0;
  const wishlisted = isWishlisted(product.id);
  const rating = parseFloat(product.average_rating) || 0;
  const reviewCount = Number(product.review_count) || 0;

  const selectedVariant = [selectedColor, selectedSize]
    .filter(Boolean)
    .join(" · ");

  const handleAcquire = () => {
    if (!inStock) return;
    addToCart(product, quantity, selectedVariant);
    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 1800);
  };

  const handleInspectFull = () => {
    const targetImg = heroImgRef.current;
    onClose?.();
    requestAnimationFrame(() => {
      navigateWithTransition(navigate, `/product/${product.id}`, {
        previewProduct: product,
        imageElement: targetImg,
      });
    });
  };

  return (
    <dialog
      ref={dialogRef}
      closedBy="any"
      aria-labelledby="quick-view-title"
      className="bazaro-dialog w-[min(94vw,860px)] max-h-[90dvh] rounded-[24px] p-0 border border-[#C59B4B]/28 bg-[#FDF9F1] text-[#1F1916] shadow-[0_32px_90px_rgba(13,10,8,0.42)]"
    >
      <div
        ref={contentRef}
        className="relative grid grid-cols-1 md:grid-cols-12 overflow-y-auto max-h-[90dvh]"
      >
        <button
          type="button"
          onClick={() => onClose?.()}
          aria-label="Close quick inspect"
          className="bazaro-touch-control absolute top-3.5 right-3.5 z-20 inline-flex items-center justify-center rounded-full border border-[#C59B4B]/25 bg-[#FDF9F1]/90 text-[#1F1916] hover:border-[#C59B4B]/60 hover:bg-[#1A1512] hover:text-[#F6E3B4] transition-colors backdrop-blur-sm"
        >
          <FiX className="w-4 h-4" />
        </button>

        {/* Left Atelier Studio Stage */}
        <div className="md:col-span-6 bg-[#F4EDE0] p-5 sm:p-7 flex flex-col justify-between border-b md:border-b-0 md:border-r border-[#C59B4B]/18">
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[18px] bg-[#FAF5EB] border border-[#C59B4B]/16">
            <img
              ref={heroImgRef}
              src={images[activeImageIdx] || defaultProductImg}
              alt={product.name}
              onError={(e) => {
                e.currentTarget.src = defaultProductImg;
              }}
              className="w-full h-full object-cover"
            />
            {!inStock && (
              <span className="absolute top-3.5 left-3.5 px-3 py-1 rounded-full bg-[#1A1512]/85 text-[#F6E3B4] text-[10px] font-semibold uppercase tracking-[0.16em]">
                Allocated / Sold Out
              </span>
            )}
          </div>

          {images.length > 1 && (
            <div className="mt-4 flex items-center gap-2.5 overflow-x-auto pb-1">
              {images.map((url, idx) => (
                <button
                  key={`${url}-${idx}`}
                  type="button"
                  onClick={() => setActiveImageIdx(idx)}
                  aria-label={`View angle ${idx + 1}`}
                  className={`w-14 h-16 shrink-0 rounded-xl overflow-hidden border transition-all ${
                    idx === activeImageIdx
                      ? "border-[#C59B4B] ring-1 ring-[#C59B4B]/40 opacity-100"
                      : "border-[#C59B4B]/20 opacity-65 hover:opacity-100"
                  }`}
                >
                  <img
                    src={url}
                    alt={`${product.name} thumbnail ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Editorial Ledger */}
        <div className="md:col-span-6 p-6 sm:p-8 flex flex-col justify-between gap-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2 pr-8">
              <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8E6A28]">
                {product.category_name || "Maison Collection"}
              </span>
              {reviewCount > 0 && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-[#5C4E41] bazaro-tabular">
                  <FiStar className="w-3.5 h-3.5 text-[#C59B4B] fill-[#C59B4B]" />
                  {rating.toFixed(1)} ({reviewCount})
                </span>
              )}
            </div>

            <h2
              id="quick-view-title"
              className="font-serif-editorial text-2xl sm:text-3xl font-semibold text-[#1F1916] leading-tight"
            >
              {product.name}
            </h2>

            <div className="flex items-baseline justify-between gap-3 pt-1 pb-3 border-b border-[#C59B4B]/18">
              <span className="font-serif-editorial text-2xl sm:text-3xl font-semibold text-[#1F1916] bazaro-tabular">
                ${price.toFixed(2)}
              </span>
              <span className="text-[11px] uppercase tracking-[0.16em] text-[#6E5F50] bazaro-tabular">
                {inStock
                  ? stock <= 5
                    ? `Only ${stock} remaining`
                    : "In Atelier Vault"
                  : "Currently Unavailable"}
              </span>
            </div>

            <p className="text-sm text-[#5C4E41] leading-relaxed line-clamp-3">
              {product.description ||
                "Curated by BAZARO artisans for enduring tactile craftsmanship and everyday refinement."}
            </p>

            {/* Variants */}
            {(colors.length > 0 || sizes.length > 0) && (
              <div className="space-y-3 pt-1">
                {colors.length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6E5F50] mb-2">
                      Finish: <span className="text-[#1F1916]">{selectedColor}</span>
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {colors.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setSelectedColor(color)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                            selectedColor === color
                              ? "bg-[#1A1512] text-[#F6E3B4] border-[#1A1512]"
                              : "bg-transparent text-[#3D3127] border-[#C59B4B]/30 hover:border-[#C59B4B]"
                          }`}
                        >
                          {color}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {sizes.length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6E5F50] mb-2">
                      Edition / Size:{" "}
                      <span className="text-[#1F1916]">{selectedSize}</span>
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {sizes.map((size) => (
                        <button
                          key={size}
                          type="button"
                          onClick={() => setSelectedSize(size)}
                          className={`min-w-[40px] px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                            selectedSize === size
                              ? "bg-[#1A1512] text-[#F6E3B4] border-[#1A1512]"
                              : "bg-transparent text-[#3D3127] border-[#C59B4B]/30 hover:border-[#C59B4B]"
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="space-y-3 pt-3 border-t border-[#C59B4B]/18">
            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center rounded-full border border-[#C59B4B]/30 bg-[#FAF5EB]">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={!inStock || quantity <= 1}
                  aria-label="Decrease quantity"
                  className="bazaro-touch-control inline-flex items-center justify-center text-[#1F1916] disabled:opacity-35"
                >
                  <FiMinus className="w-3.5 h-3.5" />
                </button>
                <span className="w-9 text-center text-sm font-semibold bazaro-tabular">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setQuantity((q) => Math.min(Math.max(1, stock), q + 1))
                  }
                  disabled={!inStock || quantity >= stock}
                  aria-label="Increase quantity"
                  className="bazaro-touch-control inline-flex items-center justify-center text-[#1F1916] disabled:opacity-35"
                >
                  <FiPlus className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                type="button"
                onClick={handleAcquire}
                disabled={!inStock}
                className="flex-1 min-w-[165px] py-3 px-5 rounded-full bg-[#1A1512] text-[#F6E3B4] hover:bg-[#2E241C] disabled:opacity-45 text-xs font-semibold uppercase tracking-[0.16em] inline-flex items-center justify-center gap-2 transition-colors"
              >
                {addedFeedback ? (
                  <>
                    <FiCheck className="w-4 h-4 text-[#E5C77A]" />
                    Added to Bag
                  </>
                ) : (
                  <>
                    <FiShoppingBag className="w-4 h-4 text-[#E5C77A]" />
                    {inStock ? "Acquire Edition" : "Allocated"}
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => toggleWishlist(product)}
                aria-label={wishlisted ? "Remove from wishlist" : "Save to wishlist"}
                className={`bazaro-touch-control inline-flex items-center justify-center rounded-full border transition-colors ${
                  wishlisted
                    ? "bg-[#1A1512] border-[#C59B4B] text-[#E5C77A]"
                    : "border-[#C59B4B]/30 text-[#4F4337] hover:border-[#C59B4B]"
                }`}
              >
                <FiHeart
                  className={`w-4 h-4 ${wishlisted ? "fill-[#E5C77A]" : ""}`}
                />
              </button>
            </div>

            <button
              type="button"
              onClick={handleInspectFull}
              className="w-full py-2.5 text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-[#7D5E26] hover:text-[#1F1916] inline-flex items-center justify-center gap-2 transition-colors"
            >
              Inspect Full Masterpiece & Provenance
              <FiArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </dialog>
  );
};

export default QuickViewModal;
