import React, { useEffect } from "react";
import { Link, NavLink } from "react-router";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import {
  FiX,
  FiHome,
  FiShoppingBag,
  FiGrid,
  FiTag,
  FiUser,
  FiShield,
  FiLogOut,
  FiChevronRight,
  FiPhoneCall,
} from "react-icons/fi";

const drawerLinkClass = ({ isActive }) =>
  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all border ${
    isActive
      ? "bg-[#C59B4B]/18 text-[#E5C77A] border-[#C59B4B]/45"
      : "text-[#EFE7DA] border-transparent hover:text-[#E5C77A] hover:bg-white/5"
  }`;

const MobileDrawer = ({ isOpen, onClose, categories = [] }) => {
  const { user, isAdmin, logout } = useAuth();
  const { cartCount } = useCart();

  useEffect(() => {
    if (!isOpen) return;
    const onEsc = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      data-surface="dark"
      className="fixed inset-0 z-50 flex md:hidden animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="Mobile navigation menu"
    >
      {/* Dim Obsidian Backdrop */}
      <div
        className="fixed inset-0 bg-[#0D0A08]/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="relative z-10 w-[85vw] max-w-sm bg-[#0D0A08] border-r border-[#C59B4B]/30 text-[#FAF5EB] h-full shadow-2xl flex flex-col">
        {/* Header with Emblem Logo & Close Button */}
        <div className="px-5 py-4 border-b border-[#C59B4B]/20 flex items-center justify-between bg-[#140F0C]">
          <Link to="/" onClick={onClose} className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#FAF5EB] p-1 border border-[#C59B4B]/60">
              <img
                src="/bazaro-icon.png"
                alt="BAZARO"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-serif-luxury text-base font-bold tracking-[0.2em] text-[#FAF5EB] leading-none">
                BAZARO
              </span>
              <span className="text-[7px] uppercase tracking-[0.22em] text-[#C59B4B] font-bold mt-0.5">
                Apnar Desher Bazaar
              </span>
            </div>
          </Link>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full bg-white/5 hover:bg-[#C59B4B]/20 text-[#E5C77A] border border-[#C59B4B]/25 transition-colors cursor-pointer"
            aria-label="Close navigation menu"
          >
            <FiX className="text-lg" />
          </button>
        </div>

        {/* Patron Status Card */}
        <div className="p-4 bg-[#140F0C] border-b border-[#C59B4B]/15">
          {user ? (
            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-gradient-to-br from-[#1F1711] to-[#120D0A] border border-[#C59B4B]/35 shadow-sm">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#E5C77A] to-[#A67E33] text-[#0D0A08] flex items-center justify-center font-black text-base shrink-0">
                {user.first_name
                  ? user.first_name[0]
                  : user.email
                    ? user.email[0].toUpperCase()
                    : "U"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-[#FAF5EB] truncate">
                  {user.first_name ? `${user.first_name} ${user.last_name || ""}` : "BAZARO Patron"}
                </p>
                <p className="text-[11px] text-[#C59B4B] truncate">{user.email}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  logout();
                  onClose();
                }}
                aria-label="Sign out"
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-[#E5C77A] transition-colors cursor-pointer"
              >
                <FiLogOut className="text-base" />
              </button>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-[#1A1410] border border-[#C59B4B]/25 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#C59B4B]/20 text-[#E5C77A] flex items-center justify-center text-sm">
                  <FiUser />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#FAF5EB]">Welcome to BAZARO</p>
                  <p className="text-[10px] text-[#9C7E54]">
                    Sign in for tracked deliveries & privileges
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/login"
                  onClick={onClose}
                  className="bazaro-gold-btn text-center py-2 rounded-xl text-[11px]"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={onClose}
                  className="text-center py-2 rounded-xl border border-[#C59B4B]/40 text-[#E5C77A] font-bold text-[11px] hover:bg-[#C59B4B]/10 transition-colors"
                >
                  Join Now
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Links Scroll Area */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1.5 bazaro-scroll-contain">
          <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#C59B4B] px-3 pb-1">
            Curated Menu
          </p>

          <NavLink to="/" end onClick={onClose} className={drawerLinkClass}>
            <FiHome className="text-base text-[#C59B4B]" />
            <span>Atelier Home</span>
          </NavLink>

          <NavLink to="/shop" end onClick={onClose} className={drawerLinkClass}>
            <FiShoppingBag className="text-base text-[#C59B4B]" />
            <span>All Collections</span>
          </NavLink>

          {categories.length > 0 && (
            <div className="pl-4 py-1.5 space-y-1 border-l border-[#C59B4B]/25 ml-4 my-1.5">
              <p className="text-[10px] font-bold text-[#9C7E54] uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                <FiGrid className="text-xs text-[#C59B4B]" />
                <span>Departments</span>
              </p>
              {categories.slice(0, 6).map((cat) => (
                <Link
                  key={cat.id}
                  to={`/shop?category=${encodeURIComponent(cat.name.toLowerCase())}`}
                  onClick={onClose}
                  className="flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium text-[#EFE7DA]/85 hover:text-[#E5C77A] hover:bg-white/5 transition-all capitalize"
                >
                  <span>{cat.name}</span>
                  <FiChevronRight className="text-xs text-[#C59B4B]/60" />
                </Link>
              ))}
            </div>
          )}

          <Link
            to="/shop?filter=deals"
            onClick={onClose}
            className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-[#FAF5EB] hover:text-[#E5C77A] hover:bg-white/5 font-semibold text-xs sm:text-sm transition-all"
          >
            <div className="flex items-center gap-3">
              <FiTag className="text-base text-[#E5C77A]" />
              <span>Royal Vault Deals</span>
            </div>
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-[#E5C77A] text-[#0D0A08]">
              -20%
            </span>
          </Link>

          {user && (
            <NavLink to="/dashboard" onClick={onClose} className={drawerLinkClass}>
              <FiUser className="text-base text-[#C59B4B]" />
              <span>Patron Dashboard</span>
            </NavLink>
          )}

          {isAdmin && (
            <NavLink to="/admin-dashboard" onClick={onClose} className={drawerLinkClass}>
              <FiShield className="text-base text-[#E5C77A]" />
              <span>Admin Vault Console</span>
            </NavLink>
          )}

          <NavLink to="/cart" onClick={onClose} className={drawerLinkClass}>
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <FiShoppingBag className="text-base text-[#C59B4B]" />
                <span>My Shopping Bag</span>
              </div>
              {cartCount > 0 && (
                <span className="text-[10px] font-black text-[#0D0A08] bg-[#E5C77A] px-2 py-0.5 rounded-full">
                  {cartCount}
                </span>
              )}
            </div>
          </NavLink>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#C59B4B]/20 bg-[#140F0C] text-[11px] text-[#9C7E54] space-y-1">
          <p className="flex items-center gap-1.5 text-[#EFE7DA] font-semibold">
            <FiPhoneCall className="text-[#E5C77A] text-xs" />
            <span>Concierge: +880 1800-BAZARO</span>
          </p>
          <p>© {new Date().getFullYear()} BAZARO. Apnar Desher Bazaar.</p>
        </div>
      </div>
    </div>
  );
};

export default MobileDrawer;
