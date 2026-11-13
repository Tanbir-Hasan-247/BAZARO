import React, { useEffect, useState, useCallback } from "react";
import { useParams, useLocation, Link } from "react-router";
import apiClient from "../Services/api-client";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useWishlist } from "../context/WishlistContext";
import { useDeferredValidation } from "../hooks/useDeferredValidation";
import defaultProductImg from "../assets/default-product.png";
import {
  FiShoppingBag,
  FiCheck,
  FiMinus,
  FiPlus,
  FiStar,
  FiTruck,
  FiShield,
  FiArrowLeft,
  FiUser,
  FiMessageSquare,
  FiAward,
  FiRotateCcw,
  FiAlertCircle,
  FiHeart,
  FiZoomIn,
} from "react-icons/fi";

const ProductDetail = () => {
  const { id } = useParams();
  const location = useLocation();
  const previewProduct =
    location.state?.previewProduct &&
    String(location.state.previewProduct.id) === String(id)
      ? location.state.previewProduct
      : null;

  const { addToCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const { user } = useAuth();

  const [product, setProduct] = useState(previewProduct);
  const [reviews, setReviews] = useState([]);
  const [categoryName, setCategoryName] = useState(
    previewProduct?.category_name || "Signature"
  );
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [selectedColor, setSelectedColor] = useState(
    Array.isArray(previewProduct?.available_colors) &&
      previewProduct.available_colors.length > 0
      ? previewProduct.available_colors[0]
      : ""
  );
  const [selectedSize, setSelectedSize] = useState(
    Array.isArray(previewProduct?.available_sizes) &&
      previewProduct.available_sizes.length > 0
      ? previewProduct.available_sizes[0]
      : ""
  );
  const [loading, setLoading] = useState(!previewProduct);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [loupeEnabled, setLoupeEnabled] = useState(false);
  const [loupePos, setLoupePos] = useState({ active: false, x: 50, y: 50 });

  const [comment, setComment] = useState("");
  const [rating, setRating] = useState(5);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewMsg, setReviewMsg] = useState("");
  const [reviewErr, setReviewErr] = useState("");

  const { fieldErrors, getFieldProps, validateFormOnSubmit, resetValidation } =
    useDeferredValidation();

  const loadProductAndReviews = useCallback(() => {
    if (!previewProduct) {
      setLoading(true);
    }
    setReviewMsg("");
    setReviewErr("");
    setSelectedImageIdx(0);

    Promise.allSettled([
      apiClient.get(`/products/${id}/`),
      apiClient.get(`/products/${id}/reviews/`),
      apiClient.get("/categories/"),
    ])
      .then(([prodRes, revRes, catRes]) => {
        if (prodRes.status === "fulfilled" && prodRes.value.data) {
          const prodData = prodRes.value.data;
          setProduct(prodData);
          setSelectedColor(
            Array.isArray(prodData.available_colors) && prodData.available_colors.length > 0
              ? prodData.available_colors[0]
              : ""
          );
          setSelectedSize(
            Array.isArray(prodData.available_sizes) && prodData.available_sizes.length > 0
              ? prodData.available_sizes[0]
              : ""
          );

          if (prodData.category_name) {
            setCategoryName(prodData.category_name);
          } else if (catRes.status === "fulfilled") {
            const cats = Array.isArray(catRes.value.data)
              ? catRes.value.data
              : catRes.value.data?.results || [];
            const match = cats.find((c) => c.id === prodData.category);
            if (match) setCategoryName(match.name);
          }
        }

        if (revRes.status === "fulfilled") {
          const d = revRes.value.data;
          setReviews(Array.isArray(d) ? d : d?.results || []);
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    loadProductAndReviews();
  }, [loadProductAndReviews]);

  const handleAddToCart = () => {
    if (!product || (product.stock || 0) <= 0) return;
    const dbImage = product.images?.[selectedImageIdx]?.image || product.images?.[0]?.image || product.image;
    const finalImage = dbImage || defaultProductImg;
    const chosenVariant = [selectedColor, selectedSize].filter(Boolean).join(" / ");
    addToCart({ ...product, image: finalImage, categoryName }, quantity, chosenVariant);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleAddReview = async (e) => {
    e.preventDefault();
    setReviewMsg("");
    setReviewErr("");

    if (!validateFormOnSubmit(e.currentTarget)) return;

    setReviewLoading(true);
    try {
      const res = await apiClient.post(`/products/${id}/reviews/`, {
        ratings: rating,
        comment: comment.trim(),
      });
      if (res.data) {
        setReviews((prev) => [res.data, ...prev]);
        setComment("");
        setRating(5);
        resetValidation();
        setReviewMsg("Your verified review has been inscribed in the collection ledger.");
      }
    } catch (err) {
      const serverMsg =
        err.response?.data?.detail ||
        (Array.isArray(err.response?.data?.non_field_errors)
          ? err.response.data.non_field_errors[0]
          : null) ||
        "Could not submit review. Please sign in or check if you already reviewed this piece.";
      setReviewErr(serverMsg);
    } finally {
      setReviewLoading(false);
    }
  };

  if (loading) {
    return (
      <div
        data-surface="light"
        className="w-full min-h-screen bg-[#FAF5EB] pt-32 pb-20 px-4 sm:px-8 md:px-12 lg:px-16"
      >
        <div className="max-w-6xl mx-auto bg-[#FDF9F1] rounded-[32px] p-6 sm:p-10 border border-[#C59B4B]/20 grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-6 h-[420px] rounded-3xl bazaro-shimmer" />
          <div className="lg:col-span-6 space-y-5 py-4">
            <div className="h-4 w-28 rounded-full bazaro-shimmer" />
            <div className="h-10 w-4/5 rounded-xl bazaro-shimmer" />
            <div className="h-8 w-36 rounded-xl bazaro-shimmer" />
            <div className="h-28 w-full rounded-2xl bazaro-shimmer" />
            <div className="h-12 w-full rounded-full bazaro-shimmer" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div
        data-surface="light"
        className="w-full min-h-[70vh] bg-[#FAF5EB] pt-36 pb-20 px-4 text-center flex flex-col items-center justify-center"
      >
        <h2 className="font-serif-editorial text-3xl font-semibold text-[#1F1916]">
          Piece Not Found in Vault
        </h2>
        <p className="text-xs sm:text-sm text-[#6E5C4F] mt-2 max-w-md">
          The requested item is unavailable or may have been archived from the collection.
        </p>
        <Link to="/shop" className="bazaro-gold-btn mt-6 px-7 py-3 rounded-full text-xs">
          Return to BAZARO Catalog
        </Link>
      </div>
    );
  }

  const gallery =
    product.images && product.images.length > 0
      ? product.images.map((im) => im.image_url || im.image).filter(Boolean)
      : [product.image || defaultProductImg];

  const activeImageSrc = gallery[selectedImageIdx] || defaultProductImg;
  const price = parseFloat(product.price) || 0;
  const priceWithTax = product.price_with_tax || (price * 1.1).toFixed(2);
  const stock = product.stock ?? 0;
  const avgRating =
    Number(product.average_rating) ||
    (reviews.length > 0
      ? reviews.reduce((s, r) => s + (r.ratings || 5), 0) / reviews.length
      : 0);

  const handleLoupeMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    setLoupePos({ active: true, x, y });
  };

  return (
    <div
      data-surface="light"
      className="w-full min-h-screen bg-[#FAF5EB] text-[#1F1916] pt-32 pb-20 px-4 sm:px-8 md:px-12 lg:px-16"
    >
      <div className="max-w-6xl mx-auto">
        {/* Back Breadcrumb */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#6E5C4F] hover:text-[#1F1916] transition-colors"
          >
            <FiArrowLeft className="text-[#C59B4B]" />
            <span>Back to Collections</span>
          </Link>
          <span className="text-[11px] font-mono bazaro-tabular text-[#8E6A28]">
            Vault SKU #{product.id}
          </span>
        </div>

        {/* Main Studio Showcase Grid */}
        <div className="bg-[#FDF9F1] rounded-[32px] border border-[#C59B4B]/24 shadow-[0_24px_64px_-24px_rgba(13,10,8,0.16)] p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left: Obsidian Vault Visual Stage + 2.2x Macro Loupe */}
          <div className="lg:col-span-6 space-y-4">
            <div
              data-surface="dark"
              onMouseMove={handleLoupeMove}
              onMouseLeave={() => setLoupePos((prev) => ({ ...prev, active: false }))}
              className="group relative bg-[#0D0A08] bazaro-grain rounded-3xl border border-[#C59B4B]/32 p-8 min-h-[380px] sm:min-h-[450px] flex items-center justify-center overflow-hidden cursor-zoom-in"
            >
              {/* Subtle Arch + Radial Studio Lighting */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-4 rounded-t-[180px] rounded-b-2xl border border-[#C59B4B]/18"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute w-72 h-72 rounded-full bg-[#C59B4B]/14 blur-[90px]"
              />

              <img
                src={activeImageSrc}
                alt={product.name}
                style={{
                  ...(selectedImageIdx === 0
                    ? { viewTransitionName: "bazaro-product-hero" }
                    : undefined),
                  transformOrigin: `${loupePos.x}% ${loupePos.y}%`,
                  transform:
                    loupeEnabled || loupePos.active ? "scale(2.15)" : "scale(1)",
                }}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = defaultProductImg;
                }}
                className="relative z-10 max-h-[350px] w-full object-contain drop-shadow-[0_22px_36px_rgba(0,0,0,0.65)] transition-transform duration-200 ease-out"
              />

              <button
                type="button"
                onClick={() => setLoupeEnabled((v) => !v)}
                aria-pressed={loupeEnabled}
                aria-label={loupeEnabled ? "Disable macro zoom" : "Toggle 2.2x macro loupe"}
                className="bazaro-touch-control absolute bottom-4 right-4 z-20 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#16110D]/85 border border-[#C59B4B]/35 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#E5C77A] backdrop-blur-md hover:border-[#E5C77A] transition-colors"
              >
                <FiZoomIn className="w-3.5 h-3.5" />
                <span>{loupeEnabled ? "Macro 2.2x On" : "Inspect Grain"}</span>
              </button>

              {stock <= 0 ? (
                <span className="absolute top-4 left-4 z-20 bg-neutral-900/95 border border-white/20 text-white text-[10px] font-bold uppercase tracking-[0.16em] px-3 py-1 rounded-full">
                  Sold Out
                </span>
              ) : stock <= 5 ? (
                <span className="absolute top-4 left-4 z-20 bg-[#C59B4B] text-[#0D0A08] text-[10px] font-bold uppercase tracking-[0.16em] px-3 py-1 rounded-full shadow-sm bazaro-tabular">
                  Scarce Vault: {stock} Left
                </span>
              ) : (
                <span className="absolute top-4 left-4 z-20 bg-[#1A1410]/90 border border-[#C59B4B]/38 text-[#E5C77A] text-[10px] font-semibold uppercase tracking-[0.16em] px-3 py-1 rounded-full flex items-center gap-1.5">
                  <FiAward className="text-xs" /> Authenticity Sealed
                </span>
              )}
            </div>

            {/* Thumbnail Strip */}
            {gallery.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-1">
                {gallery.map((src, idx) => (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => setSelectedImageIdx(idx)}
                    aria-label={`View image ${idx + 1} of ${product.name}`}
                    className={`w-20 h-20 rounded-2xl p-1.5 bg-[#0D0A08] border transition-all cursor-pointer shrink-0 ${
                      selectedImageIdx === idx
                        ? "border-[#C59B4B] ring-2 ring-[#C59B4B]/30"
                        : "border-[#C59B4B]/20 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={src}
                      alt=""
                      className="w-full h-full object-contain"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Editorial Details & Purchase Action */}
          <div className="lg:col-span-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center flex-wrap gap-3 mb-3">
                <span className="px-3.5 py-1 rounded-full bg-[#0D0A08] text-[#E5C77A] border border-[#C59B4B]/40 text-[10px] font-bold uppercase tracking-[0.2em]">
                  {categoryName}
                </span>

                {avgRating > 0 && (
                  <a
                    href="#reviews"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1F1916] hover:text-[#9C7E54] transition-colors"
                  >
                    <div className="flex items-center text-[#C59B4B]">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <FiStar
                          key={i}
                          className={`text-xs ${
                            i < Math.round(avgRating) ? "fill-[#C59B4B]" : "text-[#D4C7B8]"
                          }`}
                        />
                      ))}
                    </div>
                    <span>{avgRating.toFixed(1)}</span>
                    <span className="text-[#7A6656] font-normal">
                      ({reviews.length} reviews)
                    </span>
                  </a>
                )}
              </div>

              <h1
                id="product-detail-heading"
                tabIndex={-1}
                className="font-serif-editorial text-3xl sm:text-4xl lg:text-[2.65rem] font-semibold text-[#1F1916] leading-[1.08] tracking-[-0.015em] focus:outline-none"
              >
                {product.name}
              </h1>

              <div className="flex items-baseline gap-3 mt-4">
                <span className="font-serif-editorial text-3xl sm:text-4xl font-semibold text-[#1F1916] bazaro-tabular">
                  ${price.toFixed(2)}
                </span>
                <span className="text-xs text-[#7A6656] font-medium bazaro-tabular">
                  (Tax-Incl. Value: ${Number(priceWithTax).toFixed(2)})
                </span>
              </div>

              <p className="text-xs sm:text-sm text-[#524336] leading-relaxed border-y border-[#C59B4B]/20 py-5 my-5">
                {product.description ||
                  "Curated authentic product from BAZARO with insured nationwide delivery."}
              </p>

              {/* Availability Status */}
              <div className="flex items-center gap-2 text-xs font-bold mb-6">
                <span className="text-[#7A6656] uppercase tracking-wider">Availability:</span>
                <span
                  className={`px-2.5 py-0.5 rounded-full ${
                    stock > 0
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      : "bg-red-50 text-red-700 border border-red-200"
                  }`}
                >
                  {stock > 0 ? `${stock} units ready for dispatch` : "Currently Out of Stock"}
                </span>
              </div>

              {/* Variant Selector Pickers (Finish/Color & Size/Edition) */}
              {Array.isArray(product.available_colors) && product.available_colors.length > 0 && (
                <fieldset className="mb-5">
                  <legend className="text-[11px] font-extrabold uppercase tracking-wider text-[#6E5C4F] mb-2">
                    Finish / Edition:{" "}
                    <span className="text-[#1F1916]">{selectedColor || product.available_colors[0]}</span>
                  </legend>
                  <div className="flex flex-wrap gap-2">
                    {product.available_colors.map((color) => {
                      const active = selectedColor === color;
                      return (
                        <button
                          key={color}
                          type="button"
                          aria-pressed={active}
                          onClick={() => setSelectedColor(color)}
                          className={`bazaro-touch-control px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                            active
                              ? "bg-[#0D0A08] text-[#E5C77A] border-[#C59B4B] shadow-sm"
                              : "bg-[#FAF5EB] text-[#524336] border-[#C59B4B]/25 hover:border-[#C59B4B]"
                          }`}
                        >
                          {color}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
              )}

              {Array.isArray(product.available_sizes) && product.available_sizes.length > 0 && (
                <fieldset className="mb-6">
                  <legend className="text-[11px] font-extrabold uppercase tracking-wider text-[#6E5C4F] mb-2">
                    Size / Fit:{" "}
                    <span className="text-[#1F1916]">{selectedSize || product.available_sizes[0]}</span>
                  </legend>
                  <div className="flex flex-wrap gap-2">
                    {product.available_sizes.map((size) => {
                      const active = selectedSize === size;
                      return (
                        <button
                          key={size}
                          type="button"
                          aria-pressed={active}
                          onClick={() => setSelectedSize(size)}
                          className={`bazaro-touch-control px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                            active
                              ? "bg-[#0D0A08] text-[#E5C77A] border-[#C59B4B] shadow-sm"
                              : "bg-[#FAF5EB] text-[#524336] border-[#C59B4B]/25 hover:border-[#C59B4B]"
                          }`}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
              )}

              {/* Quantity Stepper, Gold Add-to-Bag CTA & Wishlist Button */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="inline-flex items-center justify-between border border-[#C59B4B]/35 rounded-full bg-[#FAF5EB] p-1">
                  <button
                    type="button"
                    aria-label="Decrease quantity"
                    disabled={stock <= 0}
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white text-[#1F1916] transition-colors cursor-pointer disabled:opacity-40"
                  >
                    <FiMinus />
                  </button>
                  <span className="w-12 text-center text-sm font-black text-[#1F1916]">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    aria-label="Increase quantity"
                    disabled={stock <= 0 || quantity >= stock}
                    onClick={() => setQuantity((q) => Math.min(stock || 1, q + 1))}
                    className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white text-[#1F1916] transition-colors cursor-pointer disabled:opacity-40"
                  >
                    <FiPlus />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={stock <= 0}
                  className={`flex-1 py-4 px-6 rounded-full font-extrabold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    added
                      ? "bg-emerald-700 text-white"
                      : stock <= 0
                        ? "bg-stone-300 text-stone-500 cursor-not-allowed"
                        : "bazaro-gold-btn"
                  }`}
                >
                  {added ? (
                    <>
                      <FiCheck className="text-base" />
                      <span>Added to Royal Bag</span>
                    </>
                  ) : stock <= 0 ? (
                    <span>Out of Stock</span>
                  ) : (
                    <>
                      <FiShoppingBag className="text-base" />
                      <span>Add to Bag • ${(price * quantity).toFixed(2)}</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    toggleWishlist({
                      ...product,
                      image: activeImageSrc,
                      categoryName,
                    })
                  }
                  aria-pressed={isWishlisted(product.id)}
                  aria-label={
                    isWishlisted(product.id)
                      ? `Remove ${product.name} from wishlist`
                      : `Save ${product.name} to wishlist`
                  }
                  className={`bazaro-touch-control py-3.5 px-5 rounded-full border font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    isWishlisted(product.id)
                      ? "bg-[#0D0A08] border-[#C59B4B] text-rose-400"
                      : "bg-[#FAF5EB] border-[#C59B4B]/40 text-[#1F1916] hover:border-[#C59B4B]"
                  }`}
                >
                  <FiHeart
                    className={`text-base ${
                      isWishlisted(product.id) ? "fill-rose-400 text-rose-400" : ""
                    }`}
                  />
                  <span>{isWishlisted(product.id) ? "Saved" : "Save"}</span>
                </button>
              </div>
            </div>

            {/* Luxury Trust Pillars Grid */}
            <div className="grid grid-cols-2 gap-3 pt-6 mt-8 border-t border-[#C59B4B]/20 text-[11px] text-[#524336] font-semibold">
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#FAF5EB]">
                <FiTruck className="text-[#9C7E54] text-base shrink-0" />
                <span>Insured Express Delivery</span>
              </div>
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#FAF5EB]">
                <FiShield className="text-[#9C7E54] text-base shrink-0" />
                <span>100% Genuine Warranty</span>
              </div>
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#FAF5EB]">
                <FiAward className="text-[#9C7E54] text-base shrink-0" />
                <span>Atelier Inspected Seal</span>
              </div>
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#FAF5EB]">
                <FiRotateCcw className="text-[#9C7E54] text-base shrink-0" />
                <span>7-Day Concierge Return</span>
              </div>
            </div>

            {/* Native Architectural Provenance & Protocol Accordions */}
            <div className="mt-6 border-t border-[#C59B4B]/20 divide-y divide-[#C59B4B]/18">
              <details className="group py-3.5" open>
                <summary className="list-none flex items-center justify-between gap-3 cursor-pointer text-xs font-semibold uppercase tracking-[0.18em] text-[#1F1916] hover:text-[#8E6A28] transition-colors">
                  <span>Maison Provenance & Materials</span>
                  <span className="font-serif-editorial text-lg text-[#9C7E54] transition-transform duration-200 group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-2.5 text-xs sm:text-[13px] text-[#5C4E41] leading-relaxed">
                  Authenticated by BAZARO&rsquo;s Banani atelier specialists. Dispatched in
                  tamper-sealed collector packaging with serialized provenance records
                  for guaranteed origin verification.
                </p>
              </details>

              <details className="group py-3.5">
                <summary className="list-none flex items-center justify-between gap-3 cursor-pointer text-xs font-semibold uppercase tracking-[0.18em] text-[#1F1916] hover:text-[#8E6A28] transition-colors">
                  <span>Insured Dispatch & Settlement Protocol</span>
                  <span className="font-serif-editorial text-lg text-[#9C7E54] transition-transform duration-200 group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-2.5 text-xs sm:text-[13px] text-[#5C4E41] leading-relaxed">
                  Complimentary insured delivery on qualifying acquisitions. Supports
                  bKash, Nagad, VISA, and Mastercard settlement, plus 7-day white-glove
                  concierge return assistance.
                </p>
              </details>
            </div>
          </div>
        </div>

        {/* Patron Reviews Section */}
        <section
          id="reviews"
          className="mt-12 bg-white rounded-[32px] border border-[#C59B4B]/25 shadow-sm p-6 sm:p-10 bazaro-surface-light"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-5 border-b border-[#C59B4B]/20">
            <div>
              <span className="text-[10px] uppercase tracking-[0.22em] text-[#9C7E54] font-bold block mb-1">
                Verified Impressions
              </span>
              <h2 className="font-serif-luxury text-2xl sm:text-3xl font-bold text-[#1F1916]">
                Patron Reviews ({reviews.length})
              </h2>
            </div>

            {avgRating > 0 && (
              <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-[#0D0A08] text-[#FAF5EB] border border-[#C59B4B]/40">
                <span className="font-serif-luxury text-2xl font-bold text-[#E5C77A]">
                  {avgRating.toFixed(1)}
                </span>
                <div className="flex flex-col">
                  <div className="flex items-center text-[#E5C77A] text-xs">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <FiStar
                        key={i}
                        className={i < Math.round(avgRating) ? "fill-[#E5C77A]" : "text-white/25"}
                      />
                    ))}
                  </div>
                  <span className="text-[10px] text-[#9C7E54] uppercase tracking-wider font-semibold">
                    Average Rating
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Review Submission Form */}
          <form
            onSubmit={handleAddReview}
            noValidate
            className="bg-[#FAF5EB] rounded-2xl p-6 mb-8 border border-[#C59B4B]/25 space-y-4"
          >
            <h3 className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#1F1916] flex items-center gap-2">
              <FiMessageSquare className="text-[#C59B4B]" />
              <span>Share Your Review</span>
            </h3>

            {reviewMsg && (
              <div
                role="status"
                className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold"
              >
                {reviewMsg}
              </div>
            )}

            {reviewErr && (
              <div
                role="alert"
                className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-bold flex items-center gap-2"
              >
                <FiAlertCircle className="shrink-0" />
                <span>{reviewErr}</span>
              </div>
            )}

            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-[#1F1916]">Your Rating:</span>
              <div className="flex items-center gap-1" role="group" aria-label="Select star rating">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    aria-label={`Rate ${star} out of 5 stars`}
                    aria-pressed={rating === star}
                    onClick={() => setRating(star)}
                    className="p-1 cursor-pointer transition-transform hover:scale-110"
                  >
                    <FiStar
                      className={`text-lg ${
                        star <= rating ? "text-[#C59B4B] fill-[#C59B4B]" : "text-[#D4C7B8]"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="bazaro-field-group">
              <p id="review-comment-hint" className="text-[11px] text-[#7A6656] mb-1.5">
                Describe craftsmanship, build quality, or delivery experience (min 6 characters).
              </p>
              <textarea
                required
                minLength={6}
                rows={3}
                aria-label="Review comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={
                  user
                    ? "Write your impressions of this BAZARO piece..."
                    : "Please sign in as a Patron to post a review."
                }
                disabled={!user}
                {...getFieldProps("comment", {
                  hintId: "review-comment-hint",
                  errorId: "review-comment-error",
                })}
                className="bazaro-field-input w-full p-3.5 bg-white border border-[#C59B4B]/30 rounded-xl text-xs sm:text-sm text-[#1F1916] placeholder-[#B0A191] focus:outline-none focus:border-[#C59B4B] disabled:bg-stone-100"
              />
              {fieldErrors.comment && (
                <p id="review-comment-error" className="bazaro-field-error" data-visible="true">
                  {fieldErrors.comment}
                </p>
              )}
            </div>

            <div className="flex flex-wrap justify-between items-center gap-3">
              {!user ? (
                <span className="text-xs text-[#6E5C4F]">
                  <Link
                    to="/login"
                    className="text-[#9C7E54] font-bold underline decoration-[#C59B4B]/60 underline-offset-4 hover:text-[#1F1916]"
                  >
                    Sign in
                  </Link>{" "}
                  to submit a verified review.
                </span>
              ) : (
                <span className="text-[11px] text-[#7A6656]">
                  Posting as <strong className="text-[#1F1916]">{user.first_name || user.email}</strong>
                </span>
              )}

              <button
                type="submit"
                disabled={reviewLoading || !user}
                className="bazaro-gold-btn px-6 py-2.5 rounded-full text-[11px] cursor-pointer"
              >
                {reviewLoading ? "Publishing..." : "Publish Review"}
              </button>
            </div>
          </form>

          {/* Reviews List */}
          {reviews.length === 0 ? (
            <div className="text-center py-10 text-[#7A6656] text-xs font-medium">
              No reviews yet for this masterpiece. Be the first patron to leave an impression.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reviews.map((rev) => (
                <article
                  key={rev.id}
                  className="p-5 rounded-2xl bg-[#FDFBF7] border border-[#C59B4B]/20 space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-[#0D0A08] border border-[#C59B4B]/45 text-[#E5C77A] font-bold text-xs flex items-center justify-center">
                        <FiUser />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-[#1F1916] block">
                          {rev.user?.name || rev.user?.first_name || "Verified Patron"}
                        </span>
                        {rev.created_at && (
                          <span className="text-[10px] text-[#9C7E54]">
                            {new Date(rev.created_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center text-[#C59B4B] text-xs">
                      {Array.from({ length: rev.ratings || 5 }).map((_, i) => (
                        <FiStar key={i} className="fill-[#C59B4B]" />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-[#524336] leading-relaxed">{rev.comment}</p>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default ProductDetail;
