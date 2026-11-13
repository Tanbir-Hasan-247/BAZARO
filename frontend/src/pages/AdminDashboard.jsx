import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router";
import { useAuth } from "../context/AuthContext";
import apiClient from "../Services/api-client";
import { useAccessibleDialog } from "../hooks/useAccessibleDialog";
import { useDeferredValidation } from "../hooks/useDeferredValidation";
import {
  FiShield,
  FiPackage,
  FiGrid,
  FiShoppingBag,
  FiDollarSign,
  FiPlus,
  FiTrash2,
  FiRefreshCw,
  FiArrowLeft,
  FiCheck,
  FiX,
  FiAlertCircle,
  FiLayout,
  FiEdit2,
  FiPrinter,
  FiTag,
  FiZap,
  FiSearch,
} from "react-icons/fi";
import AdminFooterEditor from "../Components/Admin/AdminFooterEditor";
import AdminProductModal from "../Components/Admin/AdminProductModal";
import AdminCouponsTab from "../Components/Admin/AdminCouponsTab";
import AdminCampaignEditor from "../Components/Admin/AdminCampaignEditor";
import OrderInvoiceModal from "../Components/Orders/OrderInvoiceModal";

const ORDER_STATUSES = [
  "Not Paid",
  "Ready To Ship",
  "Shipped",
  "Delivered",
  "Canceled",
];

const PAYMENT_STATUSES = ["Pending", "Paid", "Failed", "Refunded"];

const AdminDashboard = () => {
  const { user, isAdmin } = useAuth();

  const [activeTab, setActiveTab] = useState("overview");
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalLoading, setModalLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState("");
  const [actionErr, setActionErr] = useState("");
  const [updatingOrderId, setUpdatingOrderId] = useState(null);

  // Product Create / Edit Modal State
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [confirmDeleteProdId, setConfirmDeleteProdId] = useState(null);

  // Category Create / Edit Modal State
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [newCatName, setNewCatName] = useState("");
  const [newCatDesc, setNewCatDesc] = useState("");
  const [confirmDeleteCatId, setConfirmDeleteCatId] = useState(null);

  // Orders Search & Invoice Modal State
  const [orderSearch, setOrderSearch] = useState("");
  const [invoiceOrder, setInvoiceOrder] = useState(null);

  const catDialog = useAccessibleDialog(showCategoryModal, () => {
    setShowCategoryModal(false);
    setEditingCategory(null);
  });

  const catValidation = useDeferredValidation();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setActionErr("");
    try {
      const [prodRes, catRes, ordRes] = await Promise.allSettled([
        apiClient.get("/products/?page_size=50"),
        apiClient.get("/categories/"),
        apiClient.get("/orders/"),
      ]);

      if (prodRes.status === "fulfilled") {
        const list = Array.isArray(prodRes.value.data)
          ? prodRes.value.data
          : prodRes.value.data?.results || [];
        setProducts(list);
      }
      if (catRes.status === "fulfilled") {
        const cats = Array.isArray(catRes.value.data)
          ? catRes.value.data
          : catRes.value.data?.results || [];
        setCategories(cats);
      }
      if (ordRes.status === "fulfilled") {
        const ords = Array.isArray(ordRes.value.data)
          ? ordRes.value.data
          : ordRes.value.data?.results || [];
        setOrders(ords);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user && isAdmin) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [user, isAdmin, fetchData]);

  const notifySuccess = useCallback((msg) => {
    setActionErr("");
    setActionMsg(msg);
    setTimeout(() => setActionMsg(""), 3500);
  }, []);

  const notifyError = useCallback((msg) => {
    setActionMsg("");
    setActionErr(msg);
  }, []);

  const handleNotify = useCallback(
    (type, msg) => {
      if (type === "error") notifyError(msg);
      else notifySuccess(msg);
    },
    [notifyError, notifySuccess]
  );

  const handleDeleteProduct = async (productId) => {
    try {
      await apiClient.delete(`/products/${productId}/`);
      setProducts((prev) => prev.filter((p) => p.id !== productId));
      setConfirmDeleteProdId(null);
      notifySuccess(`Product #${productId} removed from catalog.`);
    } catch (err) {
      setActionErr(err.response?.data?.detail || "Could not delete product.");
    }
  };

  const openEditCategory = (cat) => {
    setEditingCategory(cat);
    setNewCatName(cat.name || "");
    setNewCatDesc(cat.description || "");
    catValidation.resetValidation();
    setShowCategoryModal(true);
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!catValidation.validateFormOnSubmit(e.currentTarget)) return;

    setModalLoading(true);
    setActionErr("");
    try {
      const payload = {
        name: newCatName.trim(),
        description: newCatDesc.trim() || "Curated BAZARO department.",
      };

      if (editingCategory?.id) {
        await apiClient.patch(`/categories/${editingCategory.id}/`, payload);
        notifySuccess(`Department "${payload.name}" updated.`);
      } else {
        await apiClient.post("/categories/", payload);
        notifySuccess(`Department "${payload.name}" added successfully.`);
      }

      setShowCategoryModal(false);
      setEditingCategory(null);
      setNewCatName("");
      setNewCatDesc("");
      catValidation.resetValidation();
      await fetchData();
    } catch (err) {
      setActionErr(
        err.response?.data?.detail ||
          err.response?.data?.name?.[0] ||
          "Could not save department."
      );
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteCategory = async (catId) => {
    try {
      await apiClient.delete(`/categories/${catId}/`);
      setCategories((prev) => prev.filter((c) => c.id !== catId));
      setConfirmDeleteCatId(null);
      notifySuccess(`Department #${catId} removed.`);
      await fetchData();
    } catch (err) {
      setActionErr(
        err.response?.data?.detail ||
          "Could not delete department (it may still contain products)."
      );
    }
  };

  const handleUpdateOrderStatus = async (orderId, nextStatus, nextPayment) => {
    setUpdatingOrderId(orderId);
    setActionErr("");
    try {
      const res = await apiClient.patch(`/orders/${orderId}/update_status/`, {
        status: nextStatus,
        payment_status: nextPayment,
      });
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, ...res.data } : o))
      );
      notifySuccess(`Order #${String(orderId).slice(0, 8)} status updated to ${nextStatus}.`);
    } catch (err) {
      setActionErr(err.response?.data?.detail || "Unable to update order status.");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  if (!user || !isAdmin) {
    return (
      <div
        data-surface="dark"
        className="min-h-[80vh] bazaro-grain bg-[#0D0A08] text-[#FAF5EB] pt-36 pb-20 px-4 flex flex-col items-center justify-center text-center"
      >
        <div className="w-16 h-16 rounded-full bg-[#1A1410] border border-[#C59B4B]/50 text-[#E5C77A] flex items-center justify-center mb-4">
          <FiShield className="text-2xl" />
        </div>
        <h2 className="font-serif-editorial text-3xl font-bold text-[#FAF5EB]">
          Staff Vault Restricted
        </h2>
        <p className="text-xs text-[#9C7E54] mt-2 max-w-md">
          This command console is reserved for BAZARO administrators. Sign in with staff credentials (`admin@bazaro.com`) to continue.
        </p>
        <div className="mt-6 flex items-center gap-3">
          <Link to="/login" className="bazaro-editorial-btn px-6 py-3 rounded-full text-xs">
            Staff Sign In
          </Link>
          <Link
            to="/"
            className="px-6 py-3 rounded-full border border-[#C59B4B]/35 text-xs font-bold text-[#EFE7DA] hover:bg-white/5"
          >
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  const totalRevenue = orders
    .filter((o) => o.status !== "Canceled")
    .reduce((sum, o) => sum + (parseFloat(o.total_price || o.total || 0) || 0), 0);

  const normalizedOrderQuery = orderSearch.trim().toLowerCase();
  const filteredOrders = normalizedOrderQuery
    ? orders.filter((ord) => {
        const haystack = [
          String(ord.id || ""),
          ord.recipient_name || "",
          ord.user_email || "",
          ord.status || "",
          ord.payment_status || "",
          ord.coupon_code || "",
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(normalizedOrderQuery);
      })
    : orders;

  return (
    <div
      data-surface="dark"
      className="w-full min-h-screen bazaro-grain bg-[#0D0A08] text-[#FAF5EB] pt-32 pb-20 px-4 sm:px-8 md:px-12 lg:px-16"
    >
      <div className="max-w-7xl mx-auto">
        {/* Obsidian Console Masthead */}
        <div className="bg-[#140F0C] rounded-[28px] p-6 sm:p-8 border border-[#C59B4B]/30 shadow-2xl mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#E5C77A] to-[#A67E33] text-[#0D0A08] flex items-center justify-center text-2xl shadow-lg shrink-0">
              <FiShield />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="font-serif-editorial text-2xl sm:text-3xl font-bold text-[#FAF5EB]">
                  BAZARO Command Vault
                </h1>
                <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-[#C59B4B]/20 text-[#E5C77A] border border-[#C59B4B]/40">
                  Staff Console
                </span>
              </div>
              <p className="text-xs text-[#9C7E54] mt-1">
                Live inventory operations, order fulfillment controls & department management
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={fetchData}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-[#1A1410] border border-[#C59B4B]/35 hover:border-[#E5C77A] text-xs font-bold text-[#E5C77A] transition-all cursor-pointer"
            >
              <FiRefreshCw className={`text-xs ${loading ? "animate-spin" : ""}`} />
              <span>Sync Vault</span>
            </button>

            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full border border-white/15 hover:border-[#C59B4B] text-[#EFE7DA] text-xs font-bold transition-all"
            >
              <FiArrowLeft className="text-xs" />
              <span>Patron View</span>
            </Link>
          </div>
        </div>

        {/* Status Alerts */}
        {actionMsg && (
          <div
            role="status"
            className="mb-6 p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2"
          >
            <FiCheck className="text-base shrink-0" />
            <span>{actionMsg}</span>
          </div>
        )}

        {actionErr && (
          <div
            role="alert"
            className="mb-6 p-4 rounded-2xl bg-amber-950/70 border border-amber-500/40 text-amber-200 text-xs font-bold flex items-center gap-2"
          >
            <FiAlertCircle className="text-base shrink-0" />
            <span>{actionErr}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div
          role="tablist"
          aria-label="Admin sections"
          className="flex items-center gap-2.5 border-b border-[#C59B4B]/20 pb-4 mb-8 overflow-x-auto"
        >
          {[
            { id: "overview", label: "Analytics Overview", icon: <FiDollarSign /> },
            { id: "products", label: `Catalog (${products.length})`, icon: <FiPackage /> },
            { id: "categories", label: `Departments (${categories.length})`, icon: <FiGrid /> },
            { id: "orders", label: `Orders (${orders.length})`, icon: <FiShoppingBag /> },
            { id: "coupons", label: "Promo Coupons", icon: <FiTag /> },
            { id: "campaign", label: "Campaign & Subscribers", icon: <FiZap /> },
            { id: "footer", label: "Footer CMS", icon: <FiLayout /> },
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
                    ? "bg-gradient-to-r from-[#E5C77A] to-[#C59B4B] text-[#0D0A08] border-[#E5C77A] shadow-md"
                    : "bg-[#140F0C] text-[#9C7E54] border-[#C59B4B]/25 hover:text-[#FAF5EB] hover:border-[#C59B4B]/60"
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[
                {
                  label: "Gross Revenue",
                  val: `$${totalRevenue.toFixed(2)}`,
                  icon: <FiDollarSign />,
                },
                {
                  label: "Active Pieces",
                  val: products.length,
                  icon: <FiPackage />,
                },
                {
                  label: "Customer Orders",
                  val: orders.length,
                  icon: <FiShoppingBag />,
                },
                {
                  label: "Departments",
                  val: categories.length,
                  icon: <FiGrid />,
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="bg-[#140F0C] p-6 rounded-3xl border border-[#C59B4B]/25 flex items-center gap-4 shadow-xl"
                >
                  <div className="w-12 h-12 rounded-2xl bg-[#C59B4B]/15 border border-[#C59B4B]/40 text-[#E5C77A] flex items-center justify-center text-xl shrink-0">
                    {stat.icon}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-[#9C7E54] uppercase tracking-widest block">
                      {stat.label}
                    </span>
                    <strong className="font-serif-editorial bazaro-tabular text-2xl font-semibold text-[#FAF5EB]">
                      {stat.val}
                    </strong>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#140F0C] p-6 rounded-3xl border border-[#C59B4B]/25 space-y-3">
                <h2 className="font-serif-editorial text-xl font-bold text-[#FAF5EB]">
                  Inscribe New Product
                </h2>
                <p className="text-xs text-[#9C7E54]">
                  Publish a curated product record straight to the live catalog API.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setEditingProduct(null);
                    setShowProductModal(true);
                  }}
                  className="bazaro-editorial-btn px-5 py-2.5 rounded-full text-xs inline-flex items-center gap-2 cursor-pointer"
                >
                  <FiPlus />
                  <span>Open Product Creator</span>
                </button>
              </div>

              <div className="bg-[#140F0C] p-6 rounded-3xl border border-[#C59B4B]/25 space-y-3">
                <h2 className="font-serif-editorial text-xl font-bold text-[#FAF5EB]">
                  Launch New Department
                </h2>
                <p className="text-xs text-[#9C7E54]">
                  Add a new storefront category immediately reflected in navbar & filters.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setEditingCategory(null);
                    setNewCatName("");
                    setNewCatDesc("");
                    setShowCategoryModal(true);
                  }}
                  className="px-5 py-2.5 rounded-full border border-[#C59B4B]/45 bg-[#1A1410] hover:bg-[#C59B4B]/20 text-[#E5C77A] text-xs font-bold inline-flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <FiPlus />
                  <span>Create Department</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CATALOG PRODUCTS */}
        {activeTab === "products" && (
          <div className="bg-[#140F0C] rounded-[28px] p-6 sm:p-8 border border-[#C59B4B]/25 shadow-2xl">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-[#C59B4B]/20">
              <div>
                <h2 className="font-serif-editorial text-xl font-bold text-[#FAF5EB]">
                  Catalog Inventory ({products.length})
                </h2>
                <p className="text-xs text-[#9C7E54]">Managed via `/api/v1/products/`</p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setEditingProduct(null);
                  setShowProductModal(true);
                }}
                className="bazaro-editorial-btn bazaro-touch-control px-5 py-2.5 rounded-full text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <FiPlus />
                <span>Add Product</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#C59B4B]/20 text-[#9C7E54] font-bold uppercase tracking-wider text-[10px]">
                    <th className="pb-3">Piece</th>
                    <th className="pb-3">Department</th>
                    <th className="pb-3">Price</th>
                    <th className="pb-3">Stock</th>
                    <th className="pb-3">Variants & Gallery</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#C59B4B]/12">
                  {products.map((p) => {
                    const imgList = Array.isArray(p.images) ? p.images : [];
                    const thumbSrc = imgList[0]?.image || imgList[0]?.image_url;
                    const variantCount =
                      (p.available_colors?.length || 0) +
                      (p.available_sizes?.length || 0);
                    return (
                      <tr key={p.id} className="hover:bg-white/[0.03] transition-colors">
                        <td className="py-3.5 pr-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-[#0D0A08] border border-[#C59B4B]/25 overflow-hidden shrink-0 flex items-center justify-center text-[10px] font-mono text-[#9C7E54]">
                              {thumbSrc ? (
                                <img
                                  src={thumbSrc}
                                  alt={p.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                `#${p.id}`
                              )}
                            </div>
                            <div className="min-w-0">
                              <span className="font-mono text-[10px] text-[#9C7E54] block">
                                #{p.id}
                              </span>
                              <span className="font-bold text-[#FAF5EB] max-w-[220px] truncate block">
                                {p.name}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 text-[#EFE7DA]/80 capitalize">
                          {p.category_name ||
                            categories.find((c) => c.id === p.category)?.name ||
                            "Signature"}
                        </td>
                        <td className="py-3.5 font-extrabold text-[#E5C77A] text-sm">
                          ${Number(p.price).toFixed(2)}
                        </td>
                        <td className="py-3.5">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                              (p.stock || 0) > 0
                                ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-300"
                                : "bg-red-950/60 border-red-500/40 text-red-300"
                            }`}
                          >
                            {p.stock || 0} units
                          </span>
                        </td>
                        <td className="py-3.5 text-[11px] text-[#9C7E54]">
                          <span>{imgList.length} photo(s)</span>
                          {variantCount > 0 && (
                            <span className="block text-[10px] text-[#E5C77A]">
                              {variantCount} options
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingProduct(p);
                                setShowProductModal(true);
                              }}
                              aria-label={`Edit ${p.name}`}
                              className="bazaro-touch-control px-3 py-1.5 rounded-full bg-[#1A1410] border border-[#C59B4B]/35 hover:border-[#E5C77A] text-[#E5C77A] text-[11px] font-bold inline-flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <FiEdit2 className="text-xs" />
                              <span>Edit</span>
                            </button>

                            {confirmDeleteProdId === p.id ? (
                              <div className="inline-flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteProduct(p.id)}
                                  className="bazaro-touch-control px-2.5 py-1.5 rounded-full bg-red-600/85 hover:bg-red-600 text-white text-[10px] font-bold cursor-pointer"
                                >
                                  Confirm
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteProdId(null)}
                                  className="bazaro-touch-control px-2 py-1.5 rounded-full border border-white/15 text-[#9C7E54] text-[10px] cursor-pointer"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteProdId(p.id)}
                                aria-label={`Delete ${p.name}`}
                                className="bazaro-touch-control p-2 rounded-full text-[#9C7E54] hover:text-amber-300 hover:bg-white/10 transition-colors cursor-pointer"
                              >
                                <FiTrash2 className="text-sm" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: DEPARTMENTS */}
        {activeTab === "categories" && (
          <div className="bg-[#140F0C] rounded-[28px] p-6 sm:p-8 border border-[#C59B4B]/25 shadow-2xl">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-[#C59B4B]/20">
              <div>
                <h2 className="font-serif-editorial text-xl font-bold text-[#FAF5EB]">
                  Departments ({categories.length})
                </h2>
                <p className="text-xs text-[#9C7E54]">Configured in `/api/v1/categories/`</p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setEditingCategory(null);
                  setNewCatName("");
                  setNewCatDesc("");
                  catValidation.resetValidation();
                  setShowCategoryModal(true);
                }}
                className="bazaro-editorial-btn bazaro-touch-control px-5 py-2.5 rounded-full text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <FiPlus />
                <span>Create Department</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((c) => (
                <div
                  key={c.id}
                  className="p-5 rounded-2xl bg-[#1A1410] border border-[#C59B4B]/25 flex flex-col justify-between gap-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-[#9C7E54]">Dept #{c.id}</span>
                      {typeof c.product_count === "number" && (
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#C59B4B]/20 text-[#E5C77A] border border-[#C59B4B]/30">
                          {c.product_count} items
                        </span>
                      )}
                    </div>
                    <h3 className="font-serif-editorial text-lg font-bold text-[#FAF5EB] capitalize">
                      {c.name}
                    </h3>
                    <p className="text-xs text-[#9C7E54] line-clamp-2">
                      {c.description || "Curated product collection."}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-[#C59B4B]/15 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => openEditCategory(c)}
                      className="bazaro-touch-control px-3 py-1.5 rounded-full bg-[#140F0C] border border-[#C59B4B]/35 hover:border-[#E5C77A] text-[#E5C77A] text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <FiEdit2 className="text-xs" />
                      <span>Edit</span>
                    </button>

                    {confirmDeleteCatId === c.id ? (
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleDeleteCategory(c.id)}
                          className="bazaro-touch-control px-2.5 py-1.5 rounded-full bg-red-600/85 hover:bg-red-600 text-white text-[10px] font-bold cursor-pointer"
                        >
                          Confirm
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteCatId(null)}
                          className="bazaro-touch-control px-2 py-1.5 rounded-full border border-white/15 text-[#9C7E54] text-[10px] cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteCatId(c.id)}
                        aria-label={`Delete ${c.name}`}
                        className="bazaro-touch-control p-2 rounded-full text-[#9C7E54] hover:text-amber-300 hover:bg-white/10 transition-colors cursor-pointer"
                      >
                        <FiTrash2 className="text-sm" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: ORDERS FULFILLMENT */}
        {activeTab === "orders" && (
          <div className="bg-[#140F0C] rounded-[28px] p-6 sm:p-8 border border-[#C59B4B]/25 shadow-2xl">
            <div className="mb-6 pb-4 border-b border-[#C59B4B]/20 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="font-serif-editorial text-xl font-bold text-[#FAF5EB]">
                  Order Fulfillment Command ({filteredOrders.length} / {orders.length})
                </h2>
                <p className="text-xs text-[#9C7E54]">
                  Advance dispatch states (`PATCH /orders/&#123;id&#125;/update_status/`) & generate official BAZARO invoices
                </p>
              </div>

              <div className="relative w-full md:w-72">
                <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9C7E54] text-sm" />
                <input
                  type="search"
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  placeholder="Search ID, patron, status..."
                  aria-label="Search orders"
                  className="w-full pl-9 pr-3.5 py-2 rounded-full bg-[#0D0A08] border border-[#C59B4B]/30 text-xs text-[#FAF5EB] placeholder-[#9C7E54] focus:outline-none focus:border-[#E5C77A]"
                />
              </div>
            </div>

            {filteredOrders.length === 0 ? (
              <p className="py-12 text-center text-xs text-[#9C7E54]">
                {orders.length === 0
                  ? "No orders logged yet."
                  : "No orders matched your filter query."}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#C59B4B]/20 text-[#9C7E54] font-bold uppercase tracking-wider text-[10px]">
                      <th className="pb-3">Order</th>
                      <th className="pb-3">Patron</th>
                      <th className="pb-3">Total</th>
                      <th className="pb-3">Payment Status</th>
                      <th className="pb-3">Fulfillment Stage</th>
                      <th className="pb-3 text-right">Invoice</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#C59B4B]/12">
                    {filteredOrders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-white/[0.03] transition-colors">
                        <td className="py-4 font-mono font-bold text-[#FAF5EB]">
                          #{String(ord.id).slice(0, 8)}
                          <span className="block text-[10px] font-sans font-normal text-[#9C7E54]">
                            {new Date(ord.created_at || Date.now()).toLocaleDateString()}
                          </span>
                          {ord.coupon_code && (
                            <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#C59B4B]/20 text-[#E5C77A] border border-[#C59B4B]/35">
                              {ord.coupon_code}
                            </span>
                          )}
                        </td>
                        <td className="py-4 text-[#EFE7DA]">
                          <span className="block font-semibold">
                            {ord.recipient_name || ord.user_email || "Patron"}
                          </span>
                          <span className="text-[10px] text-[#9C7E54] line-clamp-1 max-w-[200px]">
                            {ord.shipping_address || ord.user_email}
                          </span>
                        </td>
                        <td className="py-4 font-black text-[#E5C77A] text-sm">
                          ${parseFloat(ord.total_price || ord.total || 0).toFixed(2)}
                        </td>
                        <td className="py-4">
                          <select
                            aria-label={`Payment status for order ${ord.id}`}
                            disabled={updatingOrderId === ord.id}
                            value={ord.payment_status || "Pending"}
                            onChange={(e) =>
                              handleUpdateOrderStatus(
                                ord.id,
                                ord.status || "Not Paid",
                                e.target.value
                              )
                            }
                            className="bg-[#1A1410] border border-[#C59B4B]/30 rounded-xl px-2.5 py-1.5 text-xs text-[#FAF5EB] focus:outline-none focus:border-[#E5C77A] cursor-pointer"
                          >
                            {PAYMENT_STATUSES.map((ps) => (
                              <option key={ps} value={ps}>
                                {ps}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-4">
                          <select
                            aria-label={`Fulfillment status for order ${ord.id}`}
                            disabled={updatingOrderId === ord.id}
                            value={ord.status || "Not Paid"}
                            onChange={(e) =>
                              handleUpdateOrderStatus(
                                ord.id,
                                e.target.value,
                                ord.payment_status || "Pending"
                              )
                            }
                            className="bg-[#1A1410] border border-[#C59B4B]/40 rounded-xl px-2.5 py-1.5 text-xs font-bold text-[#E5C77A] focus:outline-none focus:border-[#E5C77A] cursor-pointer"
                          >
                            {ORDER_STATUSES.map((st) => (
                              <option key={st} value={st}>
                                {st}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-4 text-right">
                          <button
                            type="button"
                            onClick={() => setInvoiceOrder(ord)}
                            className="bazaro-touch-control inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#1A1410] border border-[#C59B4B]/35 hover:border-[#E5C77A] text-[#E5C77A] text-[11px] font-bold cursor-pointer"
                          >
                            <FiPrinter className="text-xs" />
                            <span>Invoice</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: PROMO COUPONS */}
        {activeTab === "coupons" && <AdminCouponsTab onNotify={handleNotify} />}

        {/* TAB 6: TOP BAR, FLASH SALE CMS & NEWSLETTER SUBSCRIBERS */}
        {activeTab === "campaign" && <AdminCampaignEditor onNotify={handleNotify} />}

        {/* TAB 7: FULL FOOTER CMS EDITOR */}
        {activeTab === "footer" && (
          <AdminFooterEditor
            onNotifySuccess={notifySuccess}
            onNotifyError={notifyError}
          />
        )}
      </div>

      {/* PRODUCT CREATE / EDIT + MULTI-IMAGE MODAL */}
      <AdminProductModal
        isOpen={showProductModal}
        onClose={() => {
          setShowProductModal(false);
          setEditingProduct(null);
        }}
        categories={categories}
        editingProduct={editingProduct}
        onSaved={() => fetchData()}
        onNotify={handleNotify}
      />

      {/* CREATE / EDIT CATEGORY ACCESSIBLE <dialog> */}
      <dialog
        ref={catDialog.dialogRef}
        closedby="any"
        aria-labelledby="add-cat-dialog-title"
        className="bazaro-dialog bazaro-dialog-sm"
      >
        <div
          ref={catDialog.contentRef}
          data-surface="dark"
          className="w-full bg-[#140F0C] rounded-[28px] p-6 sm:p-7 border border-[#C59B4B]/40 text-[#FAF5EB] shadow-2xl"
        >
          <div className="flex justify-between items-center mb-5 pb-3 border-b border-[#C59B4B]/20">
            <h3
              id="add-cat-dialog-title"
              className="font-serif-editorial text-xl font-bold text-[#FAF5EB]"
            >
              {editingCategory ? `Edit Department #${editingCategory.id}` : "Create New Department"}
            </h3>
            <button
              type="button"
              onClick={() => {
                setShowCategoryModal(false);
                setEditingCategory(null);
              }}
              aria-label="Close department dialog"
              className="bazaro-touch-control p-2 rounded-full bg-white/5 hover:bg-[#C59B4B]/20 text-[#E5C77A] cursor-pointer flex items-center justify-center"
            >
              <FiX className="text-base" />
            </button>
          </div>

          <form onSubmit={handleSaveCategory} noValidate className="space-y-3.5 text-xs">
            <div className="bazaro-field-group">
              <label htmlFor="admin-cat-name-input" className="text-[#EFE7DA] font-bold block mb-1">
                Department Name *
              </label>
              <input
                id="admin-cat-name-input"
                type="text"
                autoFocus
                required
                placeholder="e.g. Timepieces & Horology"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                {...catValidation.getFieldProps("catName", {
                  errorId: "admin-cat-name-err",
                })}
                className="bazaro-field-input w-full px-3.5 py-2.5 bg-[#0D0A08] rounded-xl border border-[#C59B4B]/30 text-[#FAF5EB] focus:outline-none focus:border-[#E5C77A]"
              />
              {catValidation.fieldErrors.catName && (
                <p id="admin-cat-name-err" className="bazaro-field-error" data-visible="true">
                  {catValidation.fieldErrors.catName}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="admin-cat-desc-input" className="text-[#EFE7DA] font-bold block mb-1">
                Description
              </label>
              <textarea
                id="admin-cat-desc-input"
                rows={3}
                placeholder="Department overview..."
                value={newCatDesc}
                onChange={(e) => setNewCatDesc(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#0D0A08] rounded-xl border border-[#C59B4B]/30 text-[#FAF5EB] focus:outline-none focus:border-[#E5C77A]"
              />
            </div>

            <div className="pt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowCategoryModal(false);
                  setEditingCategory(null);
                }}
                className="bazaro-touch-control px-4 py-2.5 rounded-full border border-[#C59B4B]/30 text-[#EFE7DA] font-bold hover:bg-white/5 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={modalLoading}
                className="bazaro-editorial-btn bazaro-touch-control px-6 py-2.5 rounded-full text-xs cursor-pointer"
              >
                {modalLoading
                  ? "Saving..."
                  : editingCategory
                  ? "Update Department"
                  : "Save Department"}
              </button>
            </div>
          </form>
        </div>
      </dialog>

      {/* OFFICIAL ORDER INVOICE / PDF PREVIEW */}
      <OrderInvoiceModal
        isOpen={Boolean(invoiceOrder)}
        onClose={() => setInvoiceOrder(null)}
        order={invoiceOrder}
      />
    </div>
  );
};

export default AdminDashboard;
