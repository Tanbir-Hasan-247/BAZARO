import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import apiClient from '../Services/api-client';
import FakePaymentModal from '../Components/Payment/FakePaymentModal';
import OrderInvoiceModal from '../Components/Orders/OrderInvoiceModal';
import defaultProductImg from '../assets/default-product.png';
import { 
  FiTrash2, 
  FiMinus, 
  FiPlus, 
  FiShoppingBag, 
  FiArrowRight, 
  FiShield, 
  FiLock,
  FiTag,
  FiCheck,
  FiMapPin,
  FiPhone,
  FiUser,
  FiCheckCircle,
  FiAlertCircle,
  FiSave
} from 'react-icons/fi';

const Cart = () => {
  const { cart, cartCount, totalAmount, updateQuantity, removeFromCart, clearCart } = useCart();
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponError, setCouponError] = useState('');

  // Shipping & Delivery Address State
  const [addressMode, setAddressMode] = useState(user?.address ? 'saved' : 'new'); // 'saved' | 'new'
  const [recipientName, setRecipientName] = useState(
    user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : ''
  );
  const [contactPhone, setContactPhone] = useState(user?.phone_number || '');
  const [newAddress, setNewAddress] = useState('');
  const [saveToProfile, setSaveToProfile] = useState(true);
  const [addressError, setAddressError] = useState('');

  // Payment & Invoice modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [lastPlacedOrder, setLastPlacedOrder] = useState(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  // Sync state whenever user profile loads/updates from database
  useEffect(() => {
    if (user?.address) {
      setAddressMode('saved');
      if (user.phone_number) setContactPhone(user.phone_number);
      if (user.first_name) setRecipientName(`${user.first_name} ${user.last_name || ''}`.trim());
    } else {
      setAddressMode('new');
      if (user?.phone_number) setContactPhone(user.phone_number);
      if (user?.first_name) setRecipientName(`${user.first_name} ${user.last_name || ''}`.trim());
    }
  }, [user]);

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    setCouponError('');
    const code = couponCode.trim().toUpperCase();
    if (!code) return;

    try {
      const res = await apiClient.post('/orders/validate_coupon/', {
        code,
        subtotal: totalAmount,
      });
      if (res.data?.valid) {
        setDiscountPercent(Number(res.data.discount_percent) || 0);
        setCouponApplied(true);
        return;
      }
    } catch (err) {
      if (err.response?.status === 400) {
        const msg = err.response.data?.coupon_code || err.response.data?.detail || 'Invalid coupon code.';
        setCouponError(Array.isArray(msg) ? msg[0] : String(msg));
        return;
      }
      // Network offline fallback for known demo code
      if (code === 'BAZARO20' || code === 'DOKANLY20') {
        setDiscountPercent(20);
        setCouponApplied(true);
        return;
      }
    }
    setCouponError('Invalid coupon code. Try BAZARO20!');
  };

  const discountAmount = (totalAmount * discountPercent) / 100;
  const shippingFee = totalAmount > 50 || totalAmount === 0 ? 0 : 5.00;
  const finalTotal = Math.max(0, totalAmount - discountAmount + shippingFee);

  // Determine current effective shipping info
  const effectiveAddress = addressMode === 'saved' ? user?.address : newAddress.trim();
  const effectivePhone = contactPhone.trim();
  const effectiveRecipient = recipientName.trim() || (user?.email ? user.email.split('@')[0] : 'Guest Customer');

  const handleProceedToCheckout = () => {
    setAddressError('');

    if (!effectiveAddress) {
      setAddressError('Delivery address is required to place your order.');
      const el = document.getElementById('delivery-address-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    if (!effectivePhone) {
      setAddressError('Contact phone number is required for courier delivery.');
      const el = document.getElementById('delivery-address-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    setShowPaymentModal(true);
  };

  const syncProfileAddressIfNeeded = async () => {
    if (user && ((addressMode === 'new' && saveToProfile) || !user.address)) {
      try {
        await updateProfile({
          address: effectiveAddress,
          phone_number: effectivePhone,
        });
      } catch (err) {
        console.warn('Notice: Could not save address to profile:', err);
      }
    }
  };

  const createBackendOrder = async (paymentMethod, transactionId = '') => {
    if (lastPlacedOrder?.id) {
      return lastPlacedOrder;
    }
    const orderRes = await apiClient.post('/orders/', {
      items: cart
        .filter(item => item.product?.id)
        .map(item => ({
          product_id: item.product.id,
          quantity: item.quantity,
          selected_variant: item.selected_variant || '',
        })),
      shipping_address: effectiveAddress,
      contact_phone: effectivePhone,
      recipient_name: effectiveRecipient,
      payment_method: paymentMethod,
      transaction_id: transactionId,
      coupon_code: couponApplied ? couponCode.trim().toUpperCase() : '',
    });
    return orderRes.data;
  };

  const handlePaymentSuccess = async (paymentInfo) => {
    await syncProfileAddressIfNeeded();

    const localOrder = {
      id: lastPlacedOrder?.id || paymentInfo.orderId || paymentInfo.txnId,
      created_at: new Date().toISOString(),
      total_price: finalTotal,
      status: 'Processing',
      payment_status: paymentInfo.status || 'Paid (Fake Sandbox)',
      payment_method: paymentInfo.method,
      transaction_id: paymentInfo.txnId,
      shipping_address: effectiveAddress,
      contact_phone: effectivePhone,
      recipient_name: effectiveRecipient,
      items: cart.map(item => ({
        id: item.product?.id,
        name: item.product?.name,
        price: item.product?.price,
        quantity: item.quantity,
        selected_variant: item.selected_variant || '',
        image: item.product?.image || defaultProductImg,
      })),
    };

    try {
      const existing = JSON.parse(localStorage.getItem('bazaro_orders') || localStorage.getItem('dokanly_orders') || '[]');
      localStorage.setItem('bazaro_orders', JSON.stringify([localOrder, ...existing]));
    } catch {
      // ignore
    }

    let resolvedOrder = {
      ...localOrder,
      subtotal: totalAmount,
      discount_amount: discountAmount,
      shipping_fee: shippingFee,
      coupon_code: couponApplied ? couponCode.trim().toUpperCase() : '',
    };

    if (user) {
      try {
        const createdOrder = await createBackendOrder(paymentInfo.method, paymentInfo.txnId);
        if (createdOrder?.id) {
          resolvedOrder = createdOrder;
          if (paymentInfo.txnId && paymentInfo.status === 'Paid') {
            const paidRes = await apiClient.post(`/orders/${createdOrder.id}/confirm_payment/`, {
              payment_method: paymentInfo.method,
              transaction_id: paymentInfo.txnId,
            });
            if (paidRes.data) resolvedOrder = paidRes.data;
          }
        }
      } catch (err) {
        console.warn('Backend order post notice:', err.response?.data || err.message);
      }
    }

    setLastPlacedOrder(resolvedOrder);
    clearCart();
  };

  const handleGatewayCheckout = async (provider) => {
    if (!user) {
      return {
        error:
          'Sign in to your BAZARO Patron account to launch SSLCommerz or Stripe Checkout, or complete settlement via the built-in Sandbox below.',
      };
    }

    await syncProfileAddressIfNeeded();
    const methodName = provider === 'stripe' ? 'Stripe' : 'SSLCommerz';
    const targetOrder = await createBackendOrder(methodName);
    if (!targetOrder?.id) {
      return { error: 'Unable to reserve backend order for gateway redirect.' };
    }
    setLastPlacedOrder(targetOrder);

    const initRes = await apiClient.post(`/orders/${targetOrder.id}/initiate_payment/`, {
      provider,
    });
    if (initRes.data?.mode === 'redirect' && initRes.data?.gateway_url) {
      clearCart();
      window.location.href = initRes.data.gateway_url;
      return { mode: 'redirect' };
    }
    return initRes.data;
  };

  const shippingProgress = Math.min(100, Math.round((totalAmount / 50) * 100));
  const remainingForFree = Math.max(0, 50 - totalAmount);

  return (
    <div data-surface="light" className="w-full min-h-screen bg-[#FAF5EB] text-[#1F1916]">
      {cartCount === 0 ? (
        <div className="w-full min-h-[75vh] flex flex-col items-center justify-center pt-32 pb-20 px-4 text-center">
          <div className="w-20 h-20 rounded-full bg-[#0D0A08] border border-[#C59B4B]/50 text-[#E5C77A] flex items-center justify-center mb-5 shadow-lg">
            <FiShoppingBag className="text-3xl" />
          </div>
          <h2 className="font-serif-editorial text-3xl sm:text-4xl font-semibold text-[#1F1916]">
            Your Royal Bag Is Empty
          </h2>
          <p className="text-xs sm:text-sm text-[#6E5C4F] mt-2 max-w-md leading-relaxed">
            Browse curated collections or track your recently completed orders from your Patron Portal.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link to="/shop" className="bazaro-editorial-btn px-7 py-3.5 rounded-full text-xs">
              Explore Collections
            </Link>
            <Link
              to="/dashboard"
              className="px-6 py-3.5 rounded-full border border-[#C59B4B]/40 text-xs font-bold text-[#1F1916] hover:bg-white transition-colors"
            >
              My Orders
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Obsidian Checkout Masthead */}
          <section
            data-surface="dark"
            className="w-full bazaro-grain bg-[#0D0A08] text-[#FAF5EB] pt-32 pb-10 px-4 sm:px-8 md:px-12 lg:px-16 border-b border-[#C59B4B]/25"
          >
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <span className="text-[10px] uppercase tracking-[0.22em] text-[#C59B4B] font-bold block mb-1.5">
                  Atelier Settlement
                </span>
                <h1 className="font-serif-editorial text-3xl sm:text-4xl font-semibold tracking-tight text-[#FAF5EB]">
                  Royal Shopping Bag ({cartCount} {cartCount === 1 ? "item" : "items"})
                </h1>
              </div>

              <div className="w-full md:w-80 bg-[#1A1410] border border-[#C59B4B]/25 rounded-2xl p-3.5">
                <div className="flex items-center justify-between text-[11px] mb-1.5">
                  <span className="text-[#EFE7DA] font-medium">
                    {remainingForFree === 0
                      ? "Complimentary Courier Unlocked"
                      : `$${remainingForFree.toFixed(2)} to Complimentary Shipping`}
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
            </div>
          </section>

          <div className="max-w-7xl mx-auto px-4 sm:px-8 md:px-12 lg:px-16 py-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Items List & Delivery Details */}
              <div className="lg:col-span-8 space-y-6">
                {/* 1. Curated Items Card */}
                <div className="bg-white rounded-[28px] p-6 sm:p-8 border border-[#C59B4B]/25 shadow-sm space-y-6">
                  <div className="flex justify-between items-center pb-4 border-b border-[#C59B4B]/20">
                    <span className="text-xs font-extrabold text-[#9C7E54] uppercase tracking-[0.2em]">
                      Selected Pieces
                    </span>
                    <button
                      type="button"
                      onClick={clearCart}
                      className="text-xs font-semibold text-[#7A6656] hover:text-red-700 transition-colors cursor-pointer"
                    >
                      Clear Bag
                    </button>
                  </div>

                  <div className="divide-y divide-[#C59B4B]/15">
                    {cart.map((item) => {
                      const prod = item.product || {};
                      const itemKey =
                        item.cartKey ||
                        (item.selected_variant
                          ? `${prod.id}::${item.selected_variant}`
                          : String(prod.id));
                      const image = prod.images?.[0]?.image || prod.image || defaultProductImg;
                      const price = parseFloat(prod.price) || 0;

                      return (
                        <div
                          key={itemKey}
                          className="py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                        >
                          <div className="flex items-center gap-4">
                            <Link
                              to={`/product/${prod.id}`}
                              className="w-20 h-20 rounded-2xl bg-[#FAF5EB] p-2 border border-[#C59B4B]/20 shrink-0 flex items-center justify-center"
                            >
                              <img
                                src={image}
                                alt={prod.name}
                                onError={(e) => {
                                  e.currentTarget.onerror = null;
                                  e.currentTarget.src = defaultProductImg;
                                }}
                                className="h-full w-full object-contain"
                              />
                            </Link>

                            <div className="space-y-1">
                              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#9C7E54] block">
                                {prod.category_name ||
                                  prod.categoryName ||
                                  (typeof prod.category === "object" ? prod.category?.name : "Signature")}
                              </span>
                              <Link
                                to={`/product/${prod.id}`}
                                className="font-serif-editorial text-sm sm:text-base font-semibold text-[#1F1916] hover:text-[#9C7E54] transition-colors line-clamp-1"
                              >
                                {prod.name}
                              </Link>
                              {item.selected_variant && (
                                <span className="inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#FAF5EB] border border-[#C59B4B]/30 text-[#6E5C4F]">
                                  {item.selected_variant}
                                </span>
                              )}
                              <span className="text-xs font-extrabold text-[#9C7E54] block">
                                ${price.toFixed(2)} each
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6">
                            <div className="flex items-center border border-[#C59B4B]/30 rounded-full bg-[#FAF5EB] p-0.5">
                              <button
                                type="button"
                                aria-label={`Decrease quantity of ${prod.name}`}
                                onClick={() => updateQuantity(itemKey, item.quantity - 1)}
                                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white text-[#1F1916] transition-colors cursor-pointer"
                              >
                                <FiMinus className="text-xs" />
                              </button>
                              <span className="w-8 text-center text-xs font-bold text-[#1F1916]">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                aria-label={`Increase quantity of ${prod.name}`}
                                onClick={() => updateQuantity(itemKey, item.quantity + 1)}
                                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white text-[#1F1916] transition-colors cursor-pointer"
                              >
                                <FiPlus className="text-xs" />
                              </button>
                            </div>

                            <div className="text-right min-w-[72px]">
                              <span className="text-sm font-black text-[#1F1916] block">
                                ${(price * item.quantity).toFixed(2)}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => removeFromCart(itemKey)}
                              aria-label={`Remove ${prod.name}`}
                              className="p-2 text-[#7A6656] hover:text-red-700 hover:bg-red-50 rounded-full transition-colors cursor-pointer"
                            >
                              <FiTrash2 className="text-sm" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Delivery & Shipping Vault */}
                <div
                  id="delivery-address-section"
                  className="bg-white rounded-[28px] p-6 sm:p-8 border border-[#C59B4B]/25 shadow-sm space-y-5 bazaro-surface-light"
                >
                  <div className="flex items-center justify-between pb-4 border-b border-[#C59B4B]/20">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#0D0A08] border border-[#C59B4B]/40 text-[#E5C77A] flex items-center justify-center text-lg">
                        <FiMapPin />
                      </div>
                      <div>
                        <h3 className="font-serif-editorial text-xl font-semibold text-[#1F1916]">
                          Courier Delivery Destination
                        </h3>
                        <p className="text-[11px] text-[#7A6656]">
                          Required for sealed courier dispatch & VAT invoice
                        </p>
                      </div>
                    </div>

                    <span className="text-[10px] uppercase font-black bg-[#0D0A08] text-[#E5C77A] border border-[#C59B4B]/40 px-3 py-1 rounded-full">
                      Required
                    </span>
                  </div>

                  {addressError && (
                    <div
                      role="alert"
                      className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs font-semibold flex items-center gap-2"
                    >
                      <FiAlertCircle className="text-base shrink-0" />
                      <span>{addressError}</span>
                    </div>
                  )}

                  {user ? (
                    <div className="space-y-4">
                      {user.address ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          <div
                            onClick={() => setAddressMode("saved")}
                            className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                              addressMode === "saved"
                                ? "border-[#C59B4B] bg-[#FAF5EB] ring-2 ring-[#C59B4B]/25"
                                : "border-[#C59B4B]/20 bg-white hover:border-[#C59B4B]/50"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-extrabold text-[#1F1916]">
                                  Saved Address
                                </span>
                                <span className="text-[9px] uppercase font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
                                  Verified
                                </span>
                              </div>
                              <input
                                type="radio"
                                name="addressMode"
                                aria-label="Use saved address"
                                checked={addressMode === "saved"}
                                onChange={() => setAddressMode("saved")}
                                className="accent-[#C59B4B] cursor-pointer"
                              />
                            </div>

                            <p className="text-xs text-[#524336] font-medium leading-relaxed">
                              {user.address}
                            </p>

                            <div className="mt-3 pt-2.5 border-t border-[#C59B4B]/15 flex items-center justify-between text-[11px] text-[#7A6656]">
                              <span>
                                Phone:{" "}
                                <strong className="text-[#1F1916] font-mono">
                                  {user.phone_number || "Not set"}
                                </strong>
                              </span>
                              <span className="truncate ml-2">
                                <strong className="text-[#1F1916]">
                                  {user.first_name
                                    ? `${user.first_name} ${user.last_name || ""}`
                                    : user.email.split("@")[0]}
                                </strong>
                              </span>
                            </div>
                          </div>

                          <div
                            onClick={() => setAddressMode("new")}
                            className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                              addressMode === "new"
                                ? "border-[#C59B4B] bg-[#FAF5EB] ring-2 ring-[#C59B4B]/25"
                                : "border-[#C59B4B]/20 bg-white hover:border-[#C59B4B]/50"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-extrabold text-[#1F1916]">
                                Custom Destination
                              </span>
                              <input
                                type="radio"
                                name="addressMode"
                                aria-label="Ship to a new address"
                                checked={addressMode === "new"}
                                onChange={() => setAddressMode("new")}
                                className="accent-[#C59B4B] cursor-pointer"
                              />
                            </div>

                            <p className="text-xs text-[#6E5C4F] leading-relaxed">
                              Dispatching to an office, gift recipient, or alternate residence? Enter details below.
                            </p>

                            <span className="text-[11px] text-[#9C7E54] font-bold mt-3">
                              Optional profile sync available →
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 rounded-2xl bg-[#FAF5EB] border border-[#C59B4B]/30 text-[#1F1916] text-xs">
                          <strong>No Saved Address Yet:</strong> Provide your shipping destination below.
                        </div>
                      )}

                      {(addressMode === "new" || !user.address) && (
                        <div className="space-y-4 pt-2">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                            <div>
                              <label className="text-xs font-bold text-[#1F1916] block mb-1">
                                Recipient Full Name
                              </label>
                              <div className="relative">
                                <FiUser className="absolute left-3.5 top-3.5 text-[#9C7E54] text-sm pointer-events-none" />
                                <input
                                  type="text"
                                  value={recipientName}
                                  onChange={(e) => setRecipientName(e.target.value)}
                                  placeholder="e.g. Tanbir Hasan"
                                  className="bazaro-field-input w-full pl-10 pr-4 py-2.5 bg-[#FAF5EB]/70 rounded-xl border border-[#C59B4B]/30 text-xs text-[#1F1916] focus:bg-white focus:outline-none focus:border-[#C59B4B]"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="text-xs font-bold text-[#1F1916] block mb-1">
                                Contact Phone Number *
                              </label>
                              <div className="relative">
                                <FiPhone className="absolute left-3.5 top-3.5 text-[#9C7E54] text-sm pointer-events-none" />
                                <input
                                  type="tel"
                                  required
                                  value={contactPhone}
                                  onChange={(e) => setContactPhone(e.target.value)}
                                  placeholder="+880 17XXXXXXXX"
                                  className="bazaro-field-input w-full pl-10 pr-4 py-2.5 bg-[#FAF5EB]/70 rounded-xl border border-[#C59B4B]/30 text-xs text-[#1F1916] focus:bg-white focus:outline-none focus:border-[#C59B4B]"
                                />
                              </div>
                            </div>
                          </div>

                          <div>
                            <label className="text-xs font-bold text-[#1F1916] block mb-1">
                              Full Delivery Address *
                            </label>
                            <textarea
                              required
                              rows={2}
                              value={newAddress}
                              onChange={(e) => setNewAddress(e.target.value)}
                              placeholder="House 42, Road 11, Banani, Dhaka"
                              className="bazaro-field-input w-full p-3 bg-[#FAF5EB]/70 rounded-xl border border-[#C59B4B]/30 text-xs text-[#1F1916] focus:bg-white focus:outline-none focus:border-[#C59B4B] leading-relaxed"
                            />
                          </div>

                          <div className="p-3.5 bg-[#FAF5EB] rounded-2xl border border-[#C59B4B]/25 flex items-center justify-between gap-2">
                            <label className="flex items-center gap-2 text-xs font-semibold text-[#1F1916] cursor-pointer">
                              <input
                                type="checkbox"
                                checked={saveToProfile}
                                onChange={(e) => setSaveToProfile(e.target.checked)}
                                className="w-4 h-4 rounded accent-[#C59B4B] cursor-pointer"
                              />
                              <span>Save address to patron profile for future orders</span>
                            </label>
                            <span className="text-[10px] font-bold uppercase text-[#9C7E54] bg-white px-2.5 py-0.5 rounded-full border border-[#C59B4B]/25">
                              Auto-Sync
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="p-4 rounded-2xl bg-[#0D0A08] text-[#FAF5EB] border border-[#C59B4B]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                        <div>
                          <strong className="text-[#E5C77A]">Have a BAZARO Patron account?</strong>{" "}
                          Sign in to load your verified shipping vault and earn rewards.
                        </div>
                        <Link
                          to="/login"
                          state={{ from: { pathname: "/cart" } }}
                          className="bazaro-editorial-btn px-5 py-2 rounded-full text-[11px] shrink-0"
                        >
                          Sign In Now
                        </Link>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div>
                          <label className="text-xs font-bold text-[#1F1916] block mb-1">
                            Recipient Full Name *
                          </label>
                          <div className="relative">
                            <FiUser className="absolute left-3.5 top-3.5 text-[#9C7E54] text-sm pointer-events-none" />
                            <input
                              type="text"
                              required
                              value={recipientName}
                              onChange={(e) => setRecipientName(e.target.value)}
                              placeholder="Full name"
                              className="bazaro-field-input w-full pl-10 pr-4 py-2.5 bg-[#FAF5EB]/70 rounded-xl border border-[#C59B4B]/30 text-xs text-[#1F1916] focus:bg-white focus:outline-none focus:border-[#C59B4B]"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-xs font-bold text-[#1F1916] block mb-1">
                            Contact Phone Number *
                          </label>
                          <div className="relative">
                            <FiPhone className="absolute left-3.5 top-3.5 text-[#9C7E54] text-sm pointer-events-none" />
                            <input
                              type="tel"
                              required
                              value={contactPhone}
                              onChange={(e) => setContactPhone(e.target.value)}
                              placeholder="+880 1XXXXXXXXX"
                              className="bazaro-field-input w-full pl-10 pr-4 py-2.5 bg-[#FAF5EB]/70 rounded-xl border border-[#C59B4B]/30 text-xs text-[#1F1916] focus:bg-white focus:outline-none focus:border-[#C59B4B]"
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-[#1F1916] block mb-1">
                          Delivery Address *
                        </label>
                        <textarea
                          required
                          rows={2}
                          value={newAddress}
                          onChange={(e) => setNewAddress(e.target.value)}
                          placeholder="House/Apartment #, Road, City, District"
                          className="bazaro-field-input w-full p-3 bg-[#FAF5EB]/70 rounded-xl border border-[#C59B4B]/30 text-xs text-[#1F1916] focus:bg-white focus:outline-none focus:border-[#C59B4B] leading-relaxed"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Obsidian Order Ledger */}
              <aside
                data-surface="dark"
                className="lg:col-span-4 bazaro-grain bg-[#0D0A08] text-[#FAF5EB] rounded-[28px] p-6 sm:p-8 border border-[#C59B4B]/35 shadow-2xl space-y-6 lg:sticky lg:top-28"
              >
                <div className="pb-3 border-b border-[#C59B4B]/20">
                  <span className="text-[10px] uppercase tracking-[0.22em] text-[#C59B4B] font-bold block">
                    Invoice Preview
                  </span>
                  <h3 className="font-serif-editorial text-2xl font-semibold text-[#FAF5EB]">
                    Order Ledger
                  </h3>
                </div>

                <div className="p-3.5 bg-[#1A1410] rounded-2xl border border-[#C59B4B]/20 text-xs space-y-1">
                  <span className="text-[10px] uppercase font-bold text-[#C59B4B] block tracking-wider">
                    Delivering To
                  </span>
                  <p className="font-bold text-[#FAF5EB] truncate">
                    {effectiveRecipient} {effectivePhone ? `(${effectivePhone})` : ""}
                  </p>
                  <p className="text-[#9C7E54] line-clamp-2 text-[11px]">
                    {effectiveAddress || (
                      <span className="text-amber-300 font-semibold italic">
                        Enter delivery destination to unlock settlement
                      </span>
                    )}
                  </p>
                </div>

                {/* Coupon Section */}
                <form onSubmit={handleApplyCoupon} className="space-y-2">
                  <label className="text-xs font-bold text-[#EFE7DA] block">
                    Atelier Promo Voucher
                  </label>
                  <p className="text-[10px] text-[#9C7E54]">
                    Try code <strong className="text-[#E5C77A] font-mono">BAZARO20</strong> for 20% privilege
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="BAZARO20"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="flex-1 px-3.5 py-2.5 bg-[#1A1410] rounded-xl border border-[#C59B4B]/30 text-xs font-mono uppercase text-[#FAF5EB] placeholder-[#6E5C4F] focus:outline-none focus:border-[#E5C77A]"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2.5 rounded-xl bg-[#C59B4B]/20 hover:bg-[#C59B4B] text-[#E5C77A] hover:text-[#0D0A08] border border-[#C59B4B]/40 text-xs font-bold transition-colors cursor-pointer"
                    >
                      Apply
                    </button>
                  </div>
                  {couponApplied && (
                    <p className="text-[11px] font-bold text-emerald-300 flex items-center gap-1">
                      <FiCheck className="text-xs" /> Privilege voucher applied!
                    </p>
                  )}
                  {couponError && (
                    <p className="text-[11px] font-bold text-amber-300">{couponError}</p>
                  )}
                </form>

                {/* Price Breakdown */}
                <div className="space-y-2.5 text-xs text-[#9C7E54] pt-3 border-t border-[#C59B4B]/20">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <strong className="text-[#FAF5EB]">${totalAmount.toFixed(2)}</strong>
                  </div>

                  {discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-300 font-bold">
                      <span>Voucher Savings</span>
                      <span>-${discountAmount.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span>Insured Courier</span>
                    <strong className="text-[#FAF5EB]">
                      {shippingFee === 0 ? (
                        <span className="text-[#E5C77A] font-bold">COMPLIMENTARY</span>
                      ) : (
                        `$${shippingFee.toFixed(2)}`
                      )}
                    </strong>
                  </div>

                  <div className="pt-3 border-t border-[#C59B4B]/20 flex justify-between items-baseline">
                    <span className="text-sm font-bold text-[#FAF5EB]">Total Payable</span>
                    <span className="font-serif-editorial bazaro-tabular text-2xl font-semibold text-[#E5C77A]">
                      ${finalTotal.toFixed(2)}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleProceedToCheckout}
                  className="bazaro-editorial-btn w-full py-3.5 rounded-full text-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Proceed to Settlement</span>
                  <FiArrowRight className="text-base" />
                </button>

                <div className="flex items-center justify-center gap-2 text-[10px] text-[#9C7E54]">
                  <FiLock className="text-[#E5C77A] text-xs" />
                  <span>Safe 256-Bit SSL Sandbox Checkout</span>
                </div>
              </aside>
            </div>
          </div>
        </>
      )}

      {/* Always mounted so transaction receipt renders cleanly after cart clears */}
      <FakePaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        totalAmount={finalTotal}
        shippingDetails={{
          address: effectiveAddress,
          phone: effectivePhone,
          recipient: effectiveRecipient,
          email: user?.email,
          isSaved: addressMode === "saved",
        }}
        onPaymentSuccess={handlePaymentSuccess}
        onGatewayCheckout={handleGatewayCheckout}
        receiptOrderId={lastPlacedOrder?.id}
        onOpenInvoice={
          lastPlacedOrder ? () => setShowInvoiceModal(true) : undefined
        }
      />

      <OrderInvoiceModal
        isOpen={showInvoiceModal}
        onClose={() => setShowInvoiceModal(false)}
        order={lastPlacedOrder}
        patronFallback={{
          name: effectiveRecipient,
          phone: effectivePhone,
          email: user?.email,
          address: effectiveAddress,
        }}
      />
    </div>
  );
};

export default Cart;
