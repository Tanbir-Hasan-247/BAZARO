import React from "react";
import { NavLink } from "react-router";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { FiHome, FiGrid, FiShoppingBag, FiUser, FiTag } from "react-icons/fi";

const mobileTabClass = ({ isActive }) =>
  `relative min-h-[48px] min-w-[44px] flex flex-col items-center justify-center py-2 px-1 transition-all duration-200 touch-manipulation ${
    isActive ? "text-[#E5C77A]" : "text-[#9C7E54] hover:text-[#FAF5EB]"
  }`;

const MobileBottomNav = () => {
  const { user } = useAuth();
  const { cartCount } = useCart();

  return (
    <nav
      data-surface="dark"
      aria-label="Mobile bottom navigation"
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-[#0D0A08]/95 backdrop-blur-xl border-t border-[#C59B4B]/30 px-2 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_28px_-6px_rgba(0,0,0,0.45)]"
    >
      <div className="grid grid-cols-5 items-center max-w-md mx-auto">
        <NavLink to="/" end className={mobileTabClass}>
          {({ isActive }) => (
            <>
              {isActive && (
                <span className="absolute top-0 w-7 h-[2.5px] rounded-full bg-[#E5C77A]" />
              )}
              <FiHome className="text-[19px]" />
              <span className="text-[10px] font-bold mt-0.5 tracking-wide">Home</span>
            </>
          )}
        </NavLink>

        <NavLink to="/shop" end className={mobileTabClass}>
          {({ isActive }) => (
            <>
              {isActive && (
                <span className="absolute top-0 w-7 h-[2.5px] rounded-full bg-[#E5C77A]" />
              )}
              <FiGrid className="text-[19px]" />
              <span className="text-[10px] font-bold mt-0.5 tracking-wide">Catalog</span>
            </>
          )}
        </NavLink>

        <NavLink to="/cart" className={mobileTabClass}>
          {({ isActive }) => (
            <>
              {isActive && (
                <span className="absolute top-0 w-7 h-[2.5px] rounded-full bg-[#E5C77A]" />
              )}
              <div className="relative">
                <FiShoppingBag className="text-[19px]" />
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-[16px] h-[16px] px-1 rounded-full bg-[#E5C77A] text-[#0D0A08] text-[9px] font-black flex items-center justify-center">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-bold mt-0.5 tracking-wide">Bag</span>
            </>
          )}
        </NavLink>

        <NavLink to="/shop?filter=deals" className={mobileTabClass}>
          {({ isActive }) => (
            <>
              {isActive && (
                <span className="absolute top-0 w-7 h-[2.5px] rounded-full bg-[#E5C77A]" />
              )}
              <FiTag className="text-[19px]" />
              <span className="text-[10px] font-bold mt-0.5 tracking-wide">Deals</span>
            </>
          )}
        </NavLink>

        <NavLink to={user ? "/dashboard" : "/login"} className={mobileTabClass}>
          {({ isActive }) => (
            <>
              {isActive && (
                <span className="absolute top-0 w-7 h-[2.5px] rounded-full bg-[#E5C77A]" />
              )}
              <FiUser className="text-[19px]" />
              <span className="text-[10px] font-bold mt-0.5 tracking-wide">
                {user ? "Portal" : "Sign In"}
              </span>
            </>
          )}
        </NavLink>
      </div>
    </nav>
  );
};

export default MobileBottomNav;
