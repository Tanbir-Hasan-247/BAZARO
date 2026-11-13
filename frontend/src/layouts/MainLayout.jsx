import React, { useEffect, useState } from "react";
import { Outlet } from "react-router";
import Navbar from "./Navbar";
import Footer from "./Footer";
import TopAnnouncementBar from "./TopAnnouncementBar";
import MobileBottomNav from "./MobileBottomNav";
import SmoothScrollProvider from "../Components/ui/SmoothScrollProvider";
import CustomCursor from "../Components/ui/CustomCursor";
import CartDrawer from "../Components/ui/CartDrawer";

const MainLayout = () => {
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const supportsTimeline =
      typeof CSS !== "undefined" &&
      CSS.supports?.("(animation-timeline: scroll()) and (animation-range: 0% 100%)");

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        setIsScrolled(y > 28);

        if (!supportsTimeline) {
          const scrollable =
            document.documentElement.scrollHeight - window.innerHeight;
          const pct = scrollable > 0 ? Math.min(1, Math.max(0, y / scrollable)) : 0;
          document.documentElement.style.setProperty("--scroll-progress", pct.toFixed(4));
        }
        ticking = false;
      });
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <SmoothScrollProvider>
      <div className="min-h-screen min-h-dvh flex flex-col bg-[#FAF5EB] text-[#1F1916] selection:bg-[#C59B4B]/25 selection:text-[#1F1916]">
        {/* Architectural Gold Scroll Progress Hairline */}
        <div id="bazaro-scroll-progress" aria-hidden="true" />

        {/* Luxury Magnetic Gold Pointer Follower */}
        <CustomCursor />

        {/* Unified Fixed Site Header (Announcement Strip + Floating Obsidian Nav) */}
        <header
          id="bazaro-site-header"
          className={isScrolled ? "is-scrolled" : ""}
        >
          <TopAnnouncementBar isCompact={isScrolled} />
          <Navbar onOpenCart={() => setCartDrawerOpen(true)} />
        </header>

        {/* Accessible Slide-Over Royal Cart Vault */}
        <CartDrawer
          isOpen={cartDrawerOpen}
          onClose={() => setCartDrawerOpen(false)}
        />

        {/* Main Content Area */}
        <main className="flex-grow w-full">
          <Outlet />
        </main>

        {/* BAZARO Luxury Obsidian Footer (cleared above mobile bottom dock + safe area) */}
        <div className="pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] md:pb-0">
          <Footer />
        </div>

        {/* Mobile Bottom Navigation Bar (Phone view only) */}
        <MobileBottomNav />
      </div>
    </SmoothScrollProvider>
  );
};

export default MainLayout;
