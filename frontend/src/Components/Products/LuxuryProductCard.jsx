import { useRef } from "react";
import { useNavigate } from "react-router";
import { FiCheck, FiEye, FiHeart, FiShoppingBag, FiStar } from "react-icons/fi";
import defaultProductImg from "../../assets/default-product.png";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";
import { navigateWithTransition } from "../../utils/viewTransition";

/**
 * Editorial Museum Gallery Card:
 * Clean 4:5 studio frame with zero sticker clutter, dual-angle hover reveal,
 * whisper-quiet provenance metadata, hairline divider, and tabular-nums pricing.
 */
const LuxuryProductCard = ({
  product,
  onQuickView,
  onAcquire,
  isRecentlyAdded = false,
  variant = "cream",
  badgeLabel = "",
}) => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const primaryImgRef = useRef(null);

  if (!product) return null;

  const isObsidian = variant === "obsidian";
  const primaryImg =
    product?.images?.[0]?.image_url ||
    product?.images?.[0]?.image ||
    product?.image ||
    defaultProductImg;
  const secondaryImg =
    product?.images?.[1]?.image_url || product?.images?.[1]?.image || null;

  const price = parseFloat(product.price) || 0;
  const stock = Number(product.stock) || 0;
  const inStock = stock > 0;
  const wishlisted = isWishlisted(product.id);
  const rating = parseFloat(product.average_rating) || 0;
  const reviewCount = Number(product.review_count) || 0;

  const colorCount = Array.isArray(product.available_colors)
    ? product.available_colors.filter(Boolean).length
    : 0;
  const sizeCount = Array.isArray(product.available_sizes)
    ? product.available_sizes.filter(Boolean).length
    : 0;

  const variantHint = [
    colorCount > 0 ? `${colorCount} ${colorCount === 1 ? "Finish" : "Finishes"}` : "",
    sizeCount > 0 ? `${sizeCount} ${sizeCount === 1 ? "Edition" : "Editions"}` : "",
  ]
    .filter(Boolean)
    .join(" · ");

  const openDetail = () => {
    navigateWithTransition(navigate, `/product/${product.id}`, {
      previewProduct: product,
      imageElement: primaryImgRef.current,
    });
  };

  const handleAcquireClick = (e) => {
    e.stopPropagation();
    if (!inStock) return;
    if (onAcquire) {
      onAcquire(product);
    } else {
      addToCart(product, 1);
    }
  };

  return (
    <article
      className={`group flex flex-col rounded-[22px] p-3.5 sm:p-4 transition-colors duration-300 border ${
        isObsidian
          ? "bg-[#15110E] border-[#C59B4B]/20 hover:border-[#C59B4B]/45 text-[#F6EFE2]"
          : "bg-[#FDF9F1] border-[#C59B4B]/18 hover:border-[#C59B4B]/42 text-[#1F1916]"
      }`}
    >
      {/* Clean 4:5 Studio Frame */}
      <div
        onClick={openDetail}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openDetail();
          }
        }}
        aria-label={`Inspect ${product.name}`}
        className={`relative aspect-[4/5] w-full overflow-hidden rounded-[16px] cursor-pointer focus-visible:outline-2 focus-visible:outline-[#C59B4B] ${
          isObsidian ? "bg-[#0F0C09]" : "bg-[#F3ECE0]"
        }`}
      >
        <img
          ref={primaryImgRef}
          src={primaryImg}
          alt={product.name}
          loading="lazy"
          decoding="async"
          onError={(e) => {
            e.currentTarget.src = defaultProductImg;
          }}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
        />

        {/* Dual-angle soft crossfade when 2nd gallery image is uploaded */}
        {secondaryImg && (
          <img
            src={secondaryImg}
            alt={`${product.name} alternate angle`}
            loading="lazy"
            decoding="async"
            aria-hidden="true"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
            className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-500 ease-out group-hover:opacity-100"
          />
        )}

        {/* Whisper-quiet status (only when sold out or custom curated label) */}
        {(!inStock || badgeLabel) && (
          <span
            className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-[9px] font-semibold uppercase tracking-[0.18em] backdrop-blur-md ${
              !inStock
                ? "bg-[#14100D]/80 text-[#F6E3B4]"
                : "bg-[#FDF9F1]/90 text-[#1F1916] border border-[#C59B4B]/25"
            }`}
          >
            {!inStock ? "Sold Out" : badgeLabel}
          </span>
        )}

        {/* Minimalist Wishlist Heart */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(product);
          }}
          aria-label={
            wishlisted
              ? `Remove ${product.name} from wishlist`
              : `Save ${product.name} to wishlist`
          }
          className={`bazaro-touch-control absolute top-2.5 right-2.5 inline-flex items-center justify-center rounded-full border backdrop-blur-md transition-all ${
            wishlisted
              ? "bg-[#1A1512]/90 border-[#C59B4B] text-[#E5C77A] opacity-100"
              : "bg-[#FAF5EB]/80 border-[#C59B4B]/25 text-[#2C231D] opacity-90 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 hover:border-[#C59B4B]"
          }`}
        >
          <FiHeart
            className={`w-3.5 h-3.5 ${wishlisted ? "fill-[#E5C77A]" : ""}`}
          />
        </button>

        {/* Bottom Studio Quick Inspect Bar (Desktop hover/focus + accessible trigger) */}
        {onQuickView && (
          <div className="pointer-events-none absolute inset-x-3 bottom-3 flex justify-center sm:opacity-0 sm:translate-y-1.5 sm:group-hover:opacity-100 sm:group-hover:translate-y-0 sm:group-focus-within:opacity-100 transition-all duration-300">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onQuickView(product);
              }}
              className="pointer-events-auto inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#14100D]/85 hover:bg-[#14100D] text-[#F6EFE2] border border-[#C59B4B]/35 text-[10px] font-semibold uppercase tracking-[0.16em] backdrop-blur-md shadow-lg transition-colors"
            >
              <FiEye className="w-3 h-3 text-[#E5C77A]" />
              Quick Inspect
            </button>
          </div>
        )}
      </div>

      {/* Typographic Editorial Legend */}
      <div className="pt-4 px-1 flex-1 flex flex-col">
        <div className="flex items-center justify-between gap-2 text-[10px] uppercase tracking-[0.18em]">
          <span className={isObsidian ? "text-[#C59B4B]" : "text-[#8E6A28] font-semibold"}>
            {product.category_name || "Atelier Edition"}
          </span>
          {inStock && stock <= 5 && (
            <span className={isObsidian ? "text-[#A99B87]" : "text-[#7A6B5C]"}>
              Only {stock} left
            </span>
          )}
        </div>

        <h3 className="mt-1.5">
          <button
            type="button"
            onClick={openDetail}
            className={`text-left font-serif-editorial text-xl font-semibold leading-snug line-clamp-2 transition-colors ${
              isObsidian
                ? "text-[#FDF9F1] hover:text-[#E5C77A]"
                : "text-[#1F1916] hover:text-[#8E6A28]"
            }`}
          >
            {product.name}
          </button>
        </h3>

        {variantHint ? (
          <p
            className={`mt-1 mb-4 text-[11px] tracking-[0.04em] ${
              isObsidian ? "text-[#9A8C78]" : "text-[#7A6B5C]"
            }`}
          >
            {variantHint}
          </p>
        ) : (
          <p
            className={`mt-1 mb-4 text-xs line-clamp-1 ${
              isObsidian ? "text-[#9A8C78]" : "text-[#6E5F50]"
            }`}
          >
            {product.description || "Signature house craftsmanship"}
          </p>
        )}

        {/* Hairline Price & Acquire Ledger */}
        <div
          className={`mt-auto pt-3.5 border-t flex items-center justify-between gap-3 ${
            isObsidian ? "border-[#C59B4B]/20" : "border-[#C59B4B]/18"
          }`}
        >
          <div className="flex items-baseline gap-2.5">
            <span
              className={`font-serif-editorial text-xl font-semibold bazaro-tabular ${
                isObsidian ? "text-[#F6E3B4]" : "text-[#1F1916]"
              }`}
            >
              ${price.toFixed(2)}
            </span>
            {reviewCount > 0 && (
              <span
                className={`inline-flex items-center gap-1 text-[11px] bazaro-tabular ${
                  isObsidian ? "text-[#A99B87]" : "text-[#6E5F50]"
                }`}
              >
                <FiStar className="w-3 h-3 text-[#C59B4B] fill-[#C59B4B]" />
                {rating.toFixed(1)}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleAcquireClick}
            disabled={!inStock}
            className={`bazaro-editorial-btn inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[11px] font-semibold uppercase tracking-[0.14em] border transition-all disabled:opacity-40 ${
              isRecentlyAdded
                ? "bg-[#C59B4B] text-[#14100D] border-[#C59B4B]"
                : isObsidian
                  ? "bg-transparent text-[#F6E3B4] border-[#C59B4B]/40 hover:bg-[#C59B4B] hover:text-[#14100D]"
                  : "bg-[#1A1512] text-[#F6E3B4] border-[#1A1512] hover:bg-[#332922]"
            }`}
          >
            {isRecentlyAdded ? (
              <>
                <FiCheck className="w-3.5 h-3.5" />
                In Bag
              </>
            ) : (
              <>
                <FiShoppingBag className="w-3.5 h-3.5" />
                {inStock ? "Acquire" : "Sold"}
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  );
};

export default LuxuryProductCard;
