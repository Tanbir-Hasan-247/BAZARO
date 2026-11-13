import React, { useState, useRef, useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import apiClient from "../Services/api-client";
import MobileDrawer from "./MobileDrawer";
import {
  FiShoppingBag,
  FiUser,
  FiSearch,
  FiLogOut,
  FiShield,
  FiChevronDown,
  FiMenu,
  FiX,
} from "react-icons/fi";

const DEFAULT_DROP_ITEMS = [
  {
    href: "/shop?category=electronics",
    label: "Electronics",
    icon: (
      <>
        <rect x="7" y="10" width="22" height="15" rx="3" strokeWidth="1.5" fill="none" />
        <path d="M12 10V7h12v3M11 28h14" strokeWidth="1.5" fill="none" />
      </>
    ),
  },
  {
    href: "/shop?category=audio",
    label: "Audio & Studio",
    icon: (
      <>
        <path d="M9 21v-3a9 9 0 0 1 18 0v3" strokeWidth="1.5" fill="none" />
        <rect x="6" y="20" width="4" height="8" rx="2" strokeWidth="1.5" fill="none" />
        <rect x="26" y="20" width="4" height="8" rx="2" strokeWidth="1.5" fill="none" />
      </>
    ),
  },
  {
    href: "/shop?category=gaming",
    label: "Gaming Gear",
    icon: (
      <>
        <rect x="5" y="12" width="26" height="14" rx="7" strokeWidth="1.5" fill="none" />
        <path d="M11 19h4M13 17v4M23 18h.5M26 20h.5" strokeWidth="1.5" fill="none" />
      </>
    ),
  },
  {
    href: "/shop?category=accessories",
    label: "Heritage Goods",
    icon: (
      <>
        <circle cx="18" cy="18" r="7" strokeWidth="1.5" fill="none" />
        <path d="M15 7h6v4h-6zM15 25h6v4h-6z" strokeWidth="1.5" fill="none" />
      </>
    ),
  },
  {
    href: "/shop",
    label: "All Collections",
    icon: (
      <>
        <rect x="7" y="7" width="9" height="9" rx="2" strokeWidth="1.5" fill="none" />
        <rect x="20" y="7" width="9" height="9" rx="2" strokeWidth="1.5" fill="none" />
        <rect x="7" y="20" width="9" height="9" rx="2" strokeWidth="1.5" fill="none" />
        <rect x="20" y="20" width="9" height="9" rx="2" strokeWidth="1.5" fill="none" />
      </>
    ),
  },
];

const desktopLinkClass = ({ isActive }) =>
  `relative py-1.5 px-2 text-xs font-semibold uppercase tracking-[0.14em] transition-colors flex items-center gap-1.5 ${
    isActive
      ? "text-[#E5C77A]"
      : "text-[#FAF5EB]/85 hover:text-[#E5C77A]"
  }`;

export default function Navbar({ onOpenCart }) {
  const { user, isAdmin, logout } = useAuth();
  const { cartCount } = useCart();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [userDropdown, setUserDropdown] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchVal, setSearchVal] = useState("");
  const [categories, setCategories] = useState([]);

  const timer = useRef();
  const searchInputRef = useRef(null);

  useEffect(() => {
    apiClient
      .get("/categories/")
      .then((res) => {
        const cats = Array.isArray(res.data) ? res.data : res.data?.results || [];
        if (cats.length > 0) setCategories(cats);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    document.getElementById("nav")?.classList.toggle("open", open);
    document.getElementById("drop")?.classList.toggle("open", open);
  }, [open]);

  useEffect(() => {
    if (!searchOpen) return;
    setTimeout(() => searchInputRef.current?.focus(), 60);
    const onEsc = (e) => {
      if (e.key === "Escape") setSearchOpen(false);
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [searchOpen]);

  const openNow = () => {
    clearTimeout(timer.current);
    setOpen(true);
  };

  const closeSoon = () => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(false), 180);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchVal.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchVal.trim())}`);
      setSearchOpen(false);
      setSearchVal("");
    }
  };

  return (
    <div id="nav-shell">
      <nav
        id="nav"
        data-surface="dark"
        aria-label="Primary navigation"
        className="flex items-center justify-between"
      >
        {/* Left Section: Mobile Hamburger + Brand Logo */}
        <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
          <button
            type="button"
            onClick={() => setMobileDrawerOpen(true)}
            className="md:hidden min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg text-[#FAF5EB] hover:text-[#E5C77A] hover:bg-white/10 transition-colors cursor-pointer touch-manipulation"
            aria-label="Open navigation menu"
          >
            <FiMenu className="text-xl" />
          </button>

          <Link className="logo flex items-center gap-2 sm:gap-2.5 group min-w-0" to="/">
            <div className="w-8 h-8 sm:w-9 sm:h-9 shrink-0 rounded-full bg-[#FAF5EB]/95 p-1 border border-[#C59B4B]/60 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              <img
                src="/bazaro-icon.png"
                alt="BAZARO Emblem"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-serif-luxury font-bold tracking-[0.2em] sm:tracking-[0.22em] text-[#FAF5EB] text-sm sm:text-lg leading-none">
                BAZARO
              </span>
              <span className="text-[7.5px] uppercase tracking-[0.24em] text-[#C59B4B] font-bold hidden lg:block mt-0.5 truncate">
                Apnar Desher Bazaar
              </span>
            </div>
          </Link>
        </div>

        {/* Center Nav Links (Desktop & Tablet) */}
        <div id="links" className="hidden md:flex items-center gap-1.5 lg:gap-4">
          <NavLink to="/" end className={desktopLinkClass}>
            Home
          </NavLink>

          <div className="relative" onMouseEnter={openNow} onMouseLeave={closeSoon}>
            <NavLink
              to="/shop"
              className={desktopLinkClass}
              onClick={() => {
                clearTimeout(timer.current);
                setOpen((o) => !o);
              }}
            >
              <span>Collections</span>
              <svg
                viewBox="0 0 10 10"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="w-2.5 h-2.5 text-[#C59B4B]"
              >
                <path d="M1.5 3.5L5 7L8.5 3.5" />
              </svg>
            </NavLink>
          </div>

          <Link
            to="/shop?filter=deals"
            className="relative py-1 px-2.5 rounded-full text-[11px] font-semibold uppercase tracking-[0.14em] text-[#E5C77A] hover:bg-[#C59B4B]/15 border border-[#C59B4B]/35 transition-all flex items-center gap-1.5"
          >
            <span>Vault Deals</span>
            <span className="text-[9px] font-black text-[#E5C77A] tracking-wider">
              −20%
            </span>
          </Link>

          {user && (
            <NavLink to="/dashboard" className={desktopLinkClass}>
              Portal
            </NavLink>
          )}

          {isAdmin && (
            <NavLink to="/admin-dashboard" className={desktopLinkClass}>
              <FiShield className="text-xs text-[#E5C77A]" />
              <span>Admin</span>
            </NavLink>
          )}
        </div>

        {/* Right Action Icons & User Auth */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Search Toggle */}
          <button
            type="button"
            onClick={() => setSearchOpen((s) => !s)}
            className="text-[#FAF5EB] hover:text-[#E5C77A] p-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Search catalog"
            aria-expanded={searchOpen}
          >
            <FiSearch className="text-base" />
          </button>

          {/* Bag Button: opens accessible CartDrawer on site, or navigates on middle click */}
          <button
            type="button"
            onClick={() => (onOpenCart ? onOpenCart() : navigate("/cart"))}
            className="relative text-[#FAF5EB] hover:text-[#E5C77A] p-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
            aria-label={`Open shopping bag, ${cartCount} items`}
          >
            <FiShoppingBag className="text-base" />
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-gradient-to-br from-[#E5C77A] to-[#C59B4B] text-[#0D0A08] text-[10px] font-black flex items-center justify-center shadow-xs">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
          </button>

          {/* User Auth Profile or Sign In CTA */}
          {user ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserDropdown(!userDropdown)}
                aria-expanded={userDropdown}
                className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-[#C59B4B]/15 border border-[#C59B4B]/40 text-[#E5C77A] hover:bg-[#C59B4B]/25 transition-colors cursor-pointer"
              >
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#E5C77A] to-[#A67E33] text-[#0D0A08] flex items-center justify-center text-[10px] font-black">
                  {user.first_name
                    ? user.first_name[0]
                    : user.email
                      ? user.email[0].toUpperCase()
                      : "U"}
                </div>
                <span className="hidden sm:inline max-w-[85px] truncate text-[#FAF5EB]">
                  {user.first_name || user.email?.split("@")[0]}
                </span>
                <FiChevronDown className="text-xs text-[#C59B4B]" />
              </button>

              {userDropdown && (
                <div
                  className="absolute right-0 mt-2.5 w-52 bg-[#140F0C] border border-[#C59B4B]/35 rounded-2xl shadow-2xl py-2 z-50 animate-fade-in text-[#FAF5EB]"
                  onClick={() => setUserDropdown(false)}
                >
                  <div className="px-4 py-2.5 border-b border-[#C59B4B]/20">
                    <p className="text-[10px] text-[#C59B4B] font-bold uppercase tracking-widest">
                      Patron Account
                    </p>
                    <p className="text-xs font-semibold text-[#FAF5EB] truncate mt-0.5">
                      {user.email}
                    </p>
                  </div>

                  <Link
                    to="/dashboard"
                    className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-[#EFE7DA] hover:bg-[#C59B4B]/15 hover:text-[#E5C77A] transition-colors"
                  >
                    <FiUser className="text-sm text-[#C59B4B]" />
                    <span>Patron Dashboard</span>
                  </Link>

                  <Link
                    to="/cart"
                    className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-[#EFE7DA] hover:bg-[#C59B4B]/15 hover:text-[#E5C77A] transition-colors"
                  >
                    <FiShoppingBag className="text-sm text-[#C59B4B]" />
                    <span>Checkout Bag</span>
                  </Link>

                  {isAdmin && (
                    <Link
                      to="/admin-dashboard"
                      className="flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-[#E5C77A] hover:bg-[#C59B4B]/15 transition-colors"
                    >
                      <FiShield className="text-sm" />
                      <span>Admin Vault</span>
                    </Link>
                  )}

                  <button
                    type="button"
                    onClick={logout}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-amber-300 hover:bg-white/5 transition-colors cursor-pointer text-left border-t border-[#C59B4B]/15 mt-1 pt-2"
                  >
                    <FiLogOut className="text-sm" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              className="bazaro-gold-btn inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-full text-[11px] touch-manipulation"
            >
              <FiUser className="text-xs" />
              <span className="hidden sm:inline">Sign In</span>
            </Link>
          )}
        </div>
      </nav>

      {/* Quick Search Overlay Dropdown */}
      {searchOpen && (
        <div
          data-surface="dark"
          className="absolute top-[calc(100%+10px)] left-1/2 -translate-x-1/2 w-[min(92vw,36rem)] z-50 bg-[#140F0C]/97 backdrop-blur-xl rounded-2xl shadow-2xl border border-[#C59B4B]/40 p-2.5 animate-fade-in"
        >
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
            <FiSearch className="text-[#C59B4B] text-lg ml-2 shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              aria-label="Search products"
              placeholder="Search signature pieces, brands, departments..."
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              className="flex-1 min-w-0 py-2 px-2 text-sm bg-transparent text-[#FAF5EB] placeholder-[#9C7E54] focus:outline-none"
            />
            {searchVal && (
              <button
                type="button"
                onClick={() => setSearchVal("")}
                aria-label="Clear search query"
                className="text-[#9C7E54] hover:text-[#FAF5EB] p-1 cursor-pointer"
              >
                <FiX className="text-sm" />
              </button>
            )}
            <button
              type="submit"
              className="bazaro-gold-btn px-4 py-2 rounded-xl text-[11px] cursor-pointer"
            >
              Search
            </button>
            <button
              type="button"
              onClick={() => setSearchOpen(false)}
              aria-label="Close search bar"
              className="p-2 text-[#9C7E54] hover:text-[#FAF5EB] rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
            >
              <FiX className="text-base" />
            </button>
          </form>
        </div>
      )}

      {/* Interactive Department Dropdown Menu (Desktop) */}
      <div id="drop" onMouseEnter={openNow} onMouseLeave={closeSoon}>
        {(categories.length > 0 ? categories.slice(0, 8) : DEFAULT_DROP_ITEMS).map((it, idx) => {
          const href = it.href || `/shop?category=${encodeURIComponent(it.name?.toLowerCase() || "")}`;
          const label = it.label || it.name;
          const icon = it.icon || DEFAULT_DROP_ITEMS[idx % DEFAULT_DROP_ITEMS.length].icon;

          return (
            <Link key={label} to={href} onClick={() => setOpen(false)}>
              <svg viewBox="0 0 36 36">{icon}</svg>
              <span>{label}</span>
            </Link>
          );
        })}
      </div>

      {/* Slide-out Mobile Navigation Drawer */}
      <MobileDrawer
        isOpen={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        categories={categories}
      />
    </div>
  );
}
