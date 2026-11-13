import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import OrderInvoiceModal from "../Components/Orders/OrderInvoiceModal";
import OrderTimelineStepper from "../Components/Orders/OrderTimelineStepper";
import defaultProductImg from "../assets/default-product.png";
import apiClient from "../Services/api-client";
import { useDeferredValidation } from "../hooks/useDeferredValidation";
import {
  FiPackage,
  FiUser,
  FiMapPin,
  FiCheckCircle,
  FiAlertCircle,
  FiShoppingBag,
  FiLogOut,
  FiShield,
  FiSave,
  FiArrowRight,
  FiDollarSign,
  FiXCircle,
  FiClock,
  FiTruck,
  FiHeart,
  FiPrinter,
  FiTrash2,
} from "react-icons/fi";

const STATUS_STYLE = {
  "Not Paid": "bg-amber-50 text-amber-800 border-amber-200",
  "Ready To Ship": "bg-sky-50 text-sky-800 border-sky-200",
  Shipped: "bg-indigo-50 text-indigo-800 border-indigo-200",
  Delivered: "bg-emerald-50 text-emerald-800 border-emerald-200",
  Canceled: "bg-stone-100 text-stone-600 border-stone-300",
};

const PAYMENT_STYLE = {
  Paid: "bg-emerald-50 text-emerald-800 border-emerald-200",
  Pending: "bg-amber-50 text-amber-800 border-amber-200",
  Failed: "bg-red-50 text-red-700 border-red-200",
  Refunded: "bg-stone-100 text-stone-700 border-stone-300",
};

const UserDashboard = () => {
  const { user, isAdmin, logout, updateProfile } = useAuth();
  const { cartCount, addToCart } = useCart();
  const { wishlistItems, removeFromWishlist } = useWishlist();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("overview"); // 'overview' | 'orders' | 'wishlist' | 'profile'
  const [orders, setOrders] = useState([]);
  const [invoiceOrder, setInvoiceOrder] = useState(null);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [cancelingId, setCancelingId] = useState(null);
  const [confirmCancelId, setConfirmCancelId] = useState(null);
  const [orderFeedback, setOrderFeedback] = useState({ type: "", text: "" });

  // Profile Form State
  const [firstName, setFirstName] = useState(user?.first_name || "");
  const [lastName, setLastName] = useState(user?.last_name || "");
  const [phone, setPhone] = useState(user?.phone_number || "");
  const [address, setAddress] = useState(user?.address || "");
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);

  const { fieldErrors, getFieldProps, validateFormOnSubmit } = useDeferredValidation();

  useEffect(() => {
    if (user) {
      setFirstName(user.first_name || "");
      setLastName(user.last_name || "");
      setPhone(user.phone_number || "");
      setAddress(user.address || "");
    }
  }, [user]);

  const fetchOrders = useCallback(async () => {
    if (!user) {
      setLoadingOrders(false);
      return;
    }
    setLoadingOrders(true);
    try {
      const res = await apiClient.get("/orders/");
      const backendOrders = Array.isArray(res.data)
        ? res.data
        : res.data?.results || [];
      setOrders(backendOrders);
    } catch {
      setOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  }, [user]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleCancelOrder = async (orderId) => {
    setCancelingId(orderId);
    setOrderFeedback({ type: "", text: "" });
    try {
      const res = await apiClient.post(`/orders/${orderId}/cancel/`);
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? {
                ...o,
                status: res.data?.status || "Canceled",
                payment_status: res.data?.payment_status || o.payment_status,
              }
            : o
        )
      );
      setConfirmCancelId(null);
      setOrderFeedback({
        type: "success",
        text: `Order #${String(orderId).slice(0, 8)} canceled and stock restored.`,
      });
    } catch (err) {
      setOrderFeedback({
        type: "error",
        text:
          err.response?.data?.detail ||
          "This order cannot be canceled at its current fulfillment stage.",
      });
    } finally {
      setCancelingId(null);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setProfileSaved(false);
    setProfileError("");
    if (!validateFormOnSubmit(e.currentTarget)) return;

    setProfileSaving(true);
    try {
      const res = await updateProfile({
        first_name: firstName,
        last_name: lastName,
        phone_number: phone,
        address,
      });
      if (res?.success === false) {
        setProfileError(res.message || "Could not update profile.");
      } else {
        setProfileSaved(true);
        setTimeout(() => setProfileSaved(false), 3500);
      }
    } catch (err) {
      setProfileError(err.response?.data?.detail || "Failed to save profile updates.");
    } finally {
      setProfileSaving(false);
    }
  };

  if (!user) {
    return (
      <div
        data-surface="light"
        className="w-full min-h-[75vh] bg-[#FAF5EB] pt-36 pb-20 px-4 flex flex-col items-center justify-center text-center"
      >
        <div className="w-16 h-16 rounded-full bg-[#0D0A08] border border-[#C59B4B] text-[#E5C77A] flex items-center justify-center mb-4">
          <FiUser className="text-2xl" />
        </div>
        <h2 className="font-serif-editorial text-3xl font-semibold text-[#1F1916]">
          Patron Portal Restricted
        </h2>
        <p className="text-xs sm:text-sm text-[#6E5C4F] mt-2 max-w-md">
          Sign in to inspect your order ledger, track parcels, and update shipping preferences.
        </p>
        <Link to="/login" className="bazaro-editorial-btn mt-6 px-7 py-3 rounded-full text-xs">
          Sign In to Continue
        </Link>
      </div>
    );
  }

  const totalSpent = orders
    .filter((o) => o.status !== "Canceled")
    .reduce((sum, o) => sum + (parseFloat(o.total_price || o.total || 0) || 0), 0);
  const deliveredCount = orders.filter((o) => o.status === "Delivered").length;
  const activeCount = orders.filter(
    (o) => o.status !== "Delivered" && o.status !== "Canceled"
  ).length;

  return (
    <div data-surface="light" className="w-full min-h-screen bg-[#FAF5EB] text-[#1F1916]">
      {/* Obsidian Patron Hero Header */}
      <section
        data-surface="dark"
        className="w-full bazaro-grain bg-[#0D0A08] text-[#FAF5EB] pt-32 pb-12 px-4 sm:px-8 md:px-12 lg:px-16 border-b border-[#C59B4B]/25"
      >
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#E5C77A] via-[#C59B4B] to-[#9A722B] text-[#0D0A08] font-serif-editorial font-black text-2xl flex items-center justify-center border-2 border-[#FAF5EB]/25 shadow-lg shrink-0">
              {user.first_name
                ? user.first_name[0]
                : user.email
                  ? user.email[0].toUpperCase()
                  : "P"}
            </div>

            <div>
              <div className="flex items-center flex-wrap gap-2">
                <h1 className="font-serif-editorial text-2xl sm:text-3xl font-semibold text-[#FAF5EB]">
                  Welcome,{" "}
                  {user.first_name
                    ? `${user.first_name} ${user.last_name || ""}`
                    : user.email?.split("@")[0]}
                </h1>
                <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-[#C59B4B]/20 text-[#E5C77A] border border-[#C59B4B]/40">
                  Verified Patron
                </span>
                {isAdmin && (
                  <Link
                    to="/admin-dashboard"
                    className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest px-3 py-0.5 rounded-full bg-[#E5C77A] text-[#0D0A08] hover:brightness-105 transition-all"
                  >
                    <FiShield className="text-xs" />
                    <span>Admin Vault →</span>
                  </Link>
                )}
              </div>
              <p className="text-xs text-[#9C7E54] mt-1">
                {user.email} • Patron since{" "}
                {new Date(user.date_joined || Date.now()).getFullYear()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/shop"
              className="bazaro-editorial-btn inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-[11px]"
            >
              <FiShoppingBag className="text-xs" />
              <span>Explore Shop</span>
            </Link>

            <button
              type="button"
              onClick={() => {
                logout();
                navigate("/");
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full border border-[#C59B4B]/35 text-[#EFE7DA] hover:bg-white/10 text-xs font-bold transition-all cursor-pointer"
            >
              <FiLogOut className="text-xs text-[#E5C77A]" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 md:px-12 lg:px-16 py-10">
        {/* Dashboard Tab Bar */}
        <div
          role="tablist"
          aria-label="Patron dashboard sections"
          className="flex items-center gap-2.5 border-b border-[#C59B4B]/20 pb-4 mb-8 overflow-x-auto"
        >
          {[
            { id: "overview", label: "Overview", icon: <FiUser /> },
            { id: "orders", label: `Order Ledger (${orders.length})`, icon: <FiPackage /> },
            { id: "wishlist", label: `Saved Treasures (${wishlistItems.length})`, icon: <FiHeart /> },
            { id: "profile", label: "Shipping & Profile", icon: <FiMapPin /> },
          ].map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap border ${
                  active
                    ? "bg-[#0D0A08] text-[#E5C77A] border-[#C59B4B] shadow-md"
                    : "bg-white text-[#524336] border-[#C59B4B]/25 hover:border-[#C59B4B]"
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Feedback Banner */}
        {orderFeedback.text && (
          <div
            role={orderFeedback.type === "error" ? "alert" : "status"}
            className={`mb-6 p-4 rounded-2xl border text-xs font-bold flex items-center gap-2 ${
              orderFeedback.type === "error"
                ? "bg-red-50 border-red-200 text-red-800"
                : "bg-emerald-50 border-emerald-200 text-emerald-800"
            }`}
          >
            {orderFeedback.type === "error" ? <FiAlertCircle /> : <FiCheckCircle />}
            <span>{orderFeedback.text}</span>
          </div>
        )}

        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[
                {
                  label: "Total Orders",
                  val: orders.length,
                  icon: <FiPackage />,
                  sub: `${activeCount} active in transit`,
                },
                {
                  label: "Net Investment",
                  val: `$${totalSpent.toFixed(2)}`,
                  icon: <FiDollarSign />,
                  sub: "Excludes canceled orders",
                },
                {
                  label: "Bag Waiting",
                  val: cartCount,
                  icon: <FiShoppingBag />,
                  sub: "Ready for settlement",
                },
                {
                  label: "Delivered",
                  val: deliveredCount,
                  icon: <FiTruck />,
                  sub: "Completed shipments",
                },
              ].map((kpi) => (
                <div
                  key={kpi.label}
                  className="bg-white rounded-3xl p-5 border border-[#C59B4B]/25 shadow-sm flex items-center gap-4"
                >
                  <div className="w-12 h-12 rounded-2xl bg-[#0D0A08] border border-[#C59B4B]/40 text-[#E5C77A] flex items-center justify-center text-xl shrink-0">
                    {kpi.icon}
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#9C7E54] block">
                      {kpi.label}
                    </span>
                    <strong className="font-serif-editorial bazaro-tabular text-2xl font-semibold text-[#1F1916] block">
                      {kpi.val}
                    </strong>
                    <span className="text-[11px] text-[#7A6656]">{kpi.sub}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Recent Orders Snapshot */}
            <div className="bg-white rounded-[28px] p-6 sm:p-8 border border-[#C59B4B]/25 shadow-sm">
              <div className="flex items-center justify-between gap-4 pb-4 mb-5 border-b border-[#C59B4B]/20">
                <div>
                  <h2 className="font-serif-editorial text-xl font-semibold text-[#1F1916]">
                    Recent Orders
                  </h2>
                  <p className="text-xs text-[#7A6656]">
                    Live snapshot from BAZARO order service
                  </p>
                </div>
                {orders.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveTab("orders")}
                    className="text-xs font-bold text-[#9C7E54] hover:text-[#1F1916] flex items-center gap-1 cursor-pointer"
                  >
                    <span>Full Ledger</span>
                    <FiArrowRight />
                  </button>
                )}
              </div>

              {loadingOrders ? (
                <div className="py-10 text-center text-xs text-[#7A6656]">
                  Loading your order ledger...
                </div>
              ) : orders.length === 0 ? (
                <div className="py-12 text-center flex flex-col items-center">
                  <div className="w-14 h-14 rounded-full bg-[#FAF5EB] border border-[#C59B4B]/30 text-[#9C7E54] flex items-center justify-center mb-3">
                    <FiClock className="text-2xl" />
                  </div>
                  <h3 className="font-serif-editorial text-lg font-semibold text-[#1F1916]">
                    No Orders Placed Yet
                  </h3>
                  <p className="text-xs text-[#6E5C4F] mt-1 max-w-xs">
                    Explore BAZARO collections and place your first order.
                  </p>
                  <Link to="/shop" className="bazaro-editorial-btn mt-4 px-6 py-2.5 rounded-full text-xs">
                    Browse Collections
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#C59B4B]/20 text-[#9C7E54] font-extrabold uppercase tracking-wider text-[10px]">
                        <th className="pb-3">Order Ref</th>
                        <th className="pb-3">Date</th>
                        <th className="pb-3">Payment</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#C59B4B]/12">
                      {orders.slice(0, 5).map((order) => (
                        <tr key={order.id} className="hover:bg-[#FAF5EB]/60 transition-colors">
                          <td className="py-3.5 font-bold font-mono text-[#1F1916]">
                            #{String(order.id).slice(0, 8)}
                          </td>
                          <td className="py-3.5 text-[#6E5C4F]">
                            {new Date(order.created_at || Date.now()).toLocaleDateString()}
                          </td>
                          <td className="py-3.5">
                            <span
                              className={`font-bold border px-2.5 py-0.5 rounded-full text-[10px] ${
                                PAYMENT_STYLE[order.payment_status] ||
                                "bg-stone-100 text-stone-700 border-stone-200"
                              }`}
                            >
                              {order.payment_status || "Pending"}
                            </span>
                          </td>
                          <td className="py-3.5">
                            <span
                              className={`font-bold border px-2.5 py-0.5 rounded-full text-[10px] ${
                                STATUS_STYLE[order.status] ||
                                "bg-stone-100 text-stone-700 border-stone-200"
                              }`}
                            >
                              {order.status || "Not Paid"}
                            </span>
                          </td>
                          <td className="py-3.5 text-right font-black text-[#1F1916] text-sm">
                            ${parseFloat(order.total_price || order.total || 0).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: ORDER LEDGER */}
        {activeTab === "orders" && (
          <div className="bg-white rounded-[28px] p-6 sm:p-8 border border-[#C59B4B]/25 shadow-sm">
            <h2 className="font-serif-editorial text-2xl sm:text-3xl font-semibold text-[#1F1916] mb-1">
              Complete Order Ledger
            </h2>
            <p className="text-xs text-[#7A6656] mb-6">
              Inspect item breakdowns, payment statuses, and cancel eligible orders before shipping.
            </p>

            {orders.length === 0 ? (
              <div className="py-16 text-center">
                <FiPackage className="text-4xl text-[#C59B4B] mx-auto mb-3" />
                <p className="text-sm font-bold text-[#1F1916]">No orders recorded yet.</p>
                <Link to="/shop" className="bazaro-editorial-btn mt-4 inline-block px-6 py-2.5 rounded-full text-xs">
                  Shop Collections
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((ord) => {
                  const canCancel =
                    ord.status === "Not Paid" || ord.status === "Ready To Ship";
                  const shortId = String(ord.id).slice(0, 8);

                  return (
                    <article
                      key={ord.id}
                      className="border border-[#C59B4B]/25 rounded-2xl p-5 bg-[#FDFBF7] hover:border-[#C59B4B]/60 transition-colors space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-[#C59B4B]/15 pb-3">
                        <div>
                          <span className="font-mono font-bold text-[#1F1916] text-sm">
                            Order #{shortId}
                          </span>
                          <span className="text-xs text-[#7A6656] ml-3">
                            {new Date(ord.created_at || Date.now()).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="flex items-center flex-wrap gap-2">
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                              PAYMENT_STYLE[ord.payment_status] ||
                              "bg-stone-100 text-stone-700 border-stone-200"
                            }`}
                          >
                            Payment: {ord.payment_status || "Pending"}
                          </span>
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                              STATUS_STYLE[ord.status] ||
                              "bg-stone-100 text-stone-700 border-stone-200"
                            }`}
                          >
                            {ord.status || "Not Paid"}
                          </span>
                        </div>
                      </div>

                      {/* Order Line Items */}
                      {Array.isArray(ord.items) && ord.items.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {ord.items.map((item) => (
                            <span
                              key={item.id}
                              className="text-[11px] font-semibold px-3 py-1 rounded-full bg-white border border-[#C59B4B]/20 text-[#1F1916]"
                            >
                              {item.product?.name || "Item"}
                              {item.selected_variant ? ` (${item.selected_variant})` : ""} × {item.quantity}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="text-xs text-[#524336] space-y-1">
                        <p>
                          Settlement:{" "}
                          <strong className="text-[#1F1916]">
                            {ord.payment_method || "Standard"}
                          </strong>
                          {ord.transaction_id ? ` • Ref: ${ord.transaction_id}` : ""}
                        </p>
                        <p>
                          Destination:{" "}
                          <strong className="text-[#1F1916]">
                            {ord.shipping_address || user.address || "Registered Patron Address"}
                          </strong>
                        </p>
                      </div>

                      <div className="pt-2">
                        <OrderTimelineStepper order={ord} compact />
                      </div>

                      <div className="pt-3 border-t border-[#C59B4B]/15 flex flex-wrap justify-between items-center gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-[#7A6656] font-medium">Total Settled:</span>
                          <strong className="font-serif-editorial bazaro-tabular text-lg font-semibold text-[#1F1916]">
                            ${parseFloat(ord.total_price || ord.total || 0).toFixed(2)}
                          </strong>
                        </div>

                        <div className="flex items-center flex-wrap gap-2">
                          <Link
                            to={`/track-order?order_id=${encodeURIComponent(ord.id)}`}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[#C59B4B]/40 bg-[#FAF5EB] hover:bg-[#0D0A08] hover:text-[#E5C77A] text-[#1F1916] text-[11px] font-bold transition-colors"
                          >
                            <FiTruck className="text-xs" />
                            <span>Track Live</span>
                          </Link>

                          <button
                            type="button"
                            onClick={() => setInvoiceOrder(ord)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[#C59B4B]/40 bg-white hover:bg-[#0D0A08] hover:text-[#E5C77A] text-[#1F1916] text-[11px] font-bold transition-colors cursor-pointer"
                          >
                            <FiPrinter className="text-xs" />
                            <span>Invoice / PDF</span>
                          </button>

                          {canCancel && (
                            <div className="flex items-center gap-2">
                              {confirmCancelId === ord.id ? (
                                <>
                                  <button
                                    type="button"
                                    disabled={cancelingId === ord.id}
                                    onClick={() => handleCancelOrder(ord.id)}
                                    className="px-3.5 py-1.5 rounded-full bg-red-700 hover:bg-red-800 text-white text-[11px] font-bold cursor-pointer"
                                  >
                                    {cancelingId === ord.id ? "Canceling..." : "Confirm Cancel"}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setConfirmCancelId(null)}
                                    className="px-3 py-1.5 rounded-full border border-[#C59B4B]/30 text-[11px] font-semibold text-[#524336] hover:bg-white cursor-pointer"
                                  >
                                    Keep Order
                                  </button>
                                </>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setConfirmCancelId(ord.id)}
                                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-red-200 text-red-700 hover:bg-red-50 text-[11px] font-bold transition-colors cursor-pointer"
                                >
                                  <FiXCircle className="text-xs" />
                                  <span>Cancel Order</span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2.5: SAVED TREASURES WISHLIST */}
        {activeTab === "wishlist" && (
          <div className="bg-white rounded-[28px] p-6 sm:p-8 border border-[#C59B4B]/25 shadow-sm">
            <h2 className="font-serif-editorial text-2xl sm:text-3xl font-semibold text-[#1F1916] mb-1">
              Saved Treasures ({wishlistItems.length})
            </h2>
            <p className="text-xs text-[#7A6656] mb-6">
              Move curated pieces directly into your Royal Shopping Bag with a single click.
            </p>

            {wishlistItems.length === 0 ? (
              <div className="py-16 text-center">
                <FiHeart className="text-4xl text-[#C59B4B] mx-auto mb-3" />
                <p className="text-sm font-bold text-[#1F1916]">Your wishlist is empty.</p>
                <p className="text-xs text-[#7A6656] mt-1">
                  Tap the heart icon on any piece in the boutique to preserve it here.
                </p>
                <Link to="/shop" className="bazaro-editorial-btn mt-4 inline-block px-6 py-2.5 rounded-full text-xs">
                  Explore Boutique
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {wishlistItems.map((entry) => {
                  const prod = entry.product || {};
                  const imageSrc =
                    prod.images?.[0]?.image || prod.image || defaultProductImg;
                  const price = parseFloat(prod.price) || 0;
                  const stock = prod.stock ?? 0;

                  return (
                    <article
                      key={entry.id || prod.id}
                      className="rounded-3xl border border-[#C59B4B]/25 bg-[#FDFBF7] overflow-hidden flex flex-col justify-between shadow-xs hover:border-[#C59B4B]/60 transition-colors"
                    >
                      <Link
                        to={`/product/${prod.id}`}
                        className="h-44 bg-gradient-to-b from-[#FAF5EB] to-white p-4 flex items-center justify-center border-b border-[#C59B4B]/15"
                      >
                        <img
                          src={imageSrc}
                          alt={prod.name}
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = defaultProductImg;
                          }}
                          className="h-full w-full object-contain"
                        />
                      </Link>

                      <div className="p-4 flex flex-col flex-1 justify-between space-y-3">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#9C7E54]">
                            {prod.category_name || "Curated Edition"}
                          </span>
                          <Link
                            to={`/product/${prod.id}`}
                            className="font-serif-editorial text-base font-semibold text-[#1F1916] hover:text-[#9C7E54] line-clamp-1 block mt-0.5"
                          >
                            {prod.name}
                          </Link>
                          <p className="text-sm font-black text-[#1F1916] mt-1">
                            ${price.toFixed(2)}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 pt-2 border-t border-[#C59B4B]/15">
                          <button
                            type="button"
                            disabled={stock <= 0}
                            onClick={() => {
                              const variant = [
                                prod.available_colors?.[0],
                                prod.available_sizes?.[0],
                              ]
                                .filter(Boolean)
                                .join(" / ");
                              addToCart({ ...prod, image: imageSrc }, 1, variant);
                            }}
                            className={`flex-1 py-2 px-3 rounded-full text-[11px] font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                              stock <= 0
                                ? "bg-stone-200 text-stone-500 cursor-not-allowed"
                                : "bazaro-editorial-btn"
                            }`}
                          >
                            <FiShoppingBag className="text-xs" />
                            <span>{stock <= 0 ? "Sold Out" : "Move to Bag"}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => removeFromWishlist(prod.id)}
                            aria-label={`Remove ${prod.name} from saved treasures`}
                            className="p-2 rounded-full border border-red-200 text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                          >
                            <FiTrash2 className="text-xs" />
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: SHIPPING & PROFILE */}
        {activeTab === "profile" && (
          <div className="bg-white rounded-[28px] p-6 sm:p-10 border border-[#C59B4B]/25 shadow-sm max-w-2xl bazaro-surface-light">
            <h2 className="font-serif-editorial text-2xl sm:text-3xl font-semibold text-[#1F1916] mb-1">
              Shipping & Account Profile
            </h2>
            <p className="text-xs text-[#7A6656] mb-6">
              Maintain your verified delivery destination and contact number for one-click dispatch.
            </p>

            {profileSaved && (
              <div
                role="status"
                className="mb-5 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2"
              >
                <FiCheckCircle className="text-base" />
                <span>Profile details synchronized with BAZARO vault.</span>
              </div>
            )}

            {profileError && (
              <div
                role="alert"
                className="mb-5 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs font-bold flex items-center gap-2"
              >
                <FiAlertCircle className="text-base" />
                <span>{profileError}</span>
              </div>
            )}

            <form onSubmit={handleProfileUpdate} noValidate className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bazaro-field-group">
                  <label className="text-xs font-bold text-[#1F1916] uppercase tracking-wider block mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    {...getFieldProps("first_name", { errorId: "prof-first-error" })}
                    className="bazaro-field-input w-full px-4 py-2.5 rounded-xl bg-[#FAF5EB]/60 border border-[#C59B4B]/30 text-xs sm:text-sm text-[#1F1916] focus:bg-white focus:outline-none focus:border-[#C59B4B]"
                  />
                  {fieldErrors.first_name && (
                    <p id="prof-first-error" className="bazaro-field-error" data-visible="true">
                      {fieldErrors.first_name}
                    </p>
                  )}
                </div>

                <div className="bazaro-field-group">
                  <label className="text-xs font-bold text-[#1F1916] uppercase tracking-wider block mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#FAF5EB]/60 border border-[#C59B4B]/30 text-xs sm:text-sm text-[#1F1916] focus:bg-white focus:outline-none focus:border-[#C59B4B]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#1F1916] uppercase tracking-wider block mb-1">
                  Registered Email (Locked)
                </label>
                <input
                  type="email"
                  disabled
                  value={user.email}
                  className="w-full px-4 py-2.5 rounded-xl bg-stone-100 border border-stone-200 text-xs sm:text-sm text-[#7A6656] cursor-not-allowed"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#1F1916] uppercase tracking-wider block mb-1">
                  Contact Phone Number
                </label>
                <p id="prof-phone-hint" className="text-[11px] text-[#7A6656] mb-1">
                  Format: +880 17XXXXXXXX
                </p>
                <input
                  type="tel"
                  aria-describedby="prof-phone-hint"
                  placeholder="+880 17XXXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#FAF5EB]/60 border border-[#C59B4B]/30 text-xs sm:text-sm text-[#1F1916] focus:bg-white focus:outline-none focus:border-[#C59B4B]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#1F1916] uppercase tracking-wider block mb-1">
                  Saved Delivery Address
                </label>
                <textarea
                  rows={3}
                  placeholder="House #, Road, Sector/Area, City"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#FAF5EB]/60 border border-[#C59B4B]/30 text-xs sm:text-sm text-[#1F1916] focus:bg-white focus:outline-none focus:border-[#C59B4B] leading-relaxed"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={profileSaving}
                  className="bazaro-editorial-btn px-7 py-3 rounded-full text-xs cursor-pointer inline-flex items-center gap-2"
                >
                  <FiSave className="text-xs" />
                  <span>{profileSaving ? "Synchronizing..." : "Save Profile Changes"}</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      <OrderInvoiceModal
        isOpen={Boolean(invoiceOrder)}
        onClose={() => setInvoiceOrder(null)}
        order={invoiceOrder}
        patronFallback={{
          name: `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.email,
          phone: user.phone_number,
          email: user.email,
          address: user.address,
        }}
      />
    </div>
  );
};

export default UserDashboard;
