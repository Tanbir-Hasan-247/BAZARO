import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import apiClient from "../Services/api-client";
import { useAuth } from "./AuthContext";

const WishlistContext = createContext();
const GUEST_STORAGE_KEY = "bazaro_guest_wishlist";

function readGuestWishlist() {
  try {
    const raw = localStorage.getItem(GUEST_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export const WishlistProvider = ({ children }) => {
  const { user } = useAuth();
  const [items, setItems] = useState([]); // Array of { id?, product, created_at? }
  const [loading, setLoading] = useState(false);

  const loadWishlist = useCallback(async () => {
    if (!user) {
      setItems(readGuestWishlist());
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient.get("/wishlist/");
      const rows = Array.isArray(res.data) ? res.data : res.data?.results || [];
      setItems(rows);
    } catch {
      setItems(readGuestWishlist());
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadWishlist();
  }, [loadWishlist]);

  const wishlistedIds = new Set(
    items.map((entry) => Number(entry.product?.id ?? entry.product_id ?? entry.id)).filter(Boolean)
  );

  const isWishlisted = useCallback(
    (productId) => wishlistedIds.has(Number(productId)),
    [wishlistedIds]
  );

  const toggleWishlist = useCallback(
    async (product) => {
      if (!product?.id) return { wishlisted: false };
      const targetId = Number(product.id);
      const currentlySaved = wishlistedIds.has(targetId);

      // Optimistic guest persistence
      if (!user) {
        let nextList;
        if (currentlySaved) {
          nextList = items.filter((entry) => Number(entry.product?.id) !== targetId);
        } else {
          nextList = [
            {
              id: `guest-${targetId}`,
              product,
              created_at: new Date().toISOString(),
            },
            ...items,
          ];
        }
        setItems(nextList);
        try {
          localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(nextList));
        } catch {
          // ignore storage quota failure
        }
        return { wishlisted: !currentlySaved };
      }

      try {
        const res = await apiClient.post("/wishlist/toggle/", {
          product_id: targetId,
        });
        const isNowSaved = Boolean(res.data?.wishlisted);
        if (isNowSaved && res.data?.item) {
          setItems((prev) => [
            res.data.item,
            ...prev.filter((entry) => Number(entry.product?.id) !== targetId),
          ]);
        } else {
          setItems((prev) =>
            prev.filter((entry) => Number(entry.product?.id) !== targetId)
          );
        }
        return { wishlisted: isNowSaved };
      } catch {
        return { wishlisted: currentlySaved, error: true };
      }
    },
    [items, user, wishlistedIds]
  );

  const removeFromWishlist = useCallback(
    async (productId) => {
      const targetId = Number(productId);
      if (!user) {
        const nextList = items.filter((entry) => Number(entry.product?.id) !== targetId);
        setItems(nextList);
        try {
          localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(nextList));
        } catch {
          // ignore
        }
        return;
      }

      const match = items.find((entry) => Number(entry.product?.id) === targetId);
      setItems((prev) => prev.filter((entry) => Number(entry.product?.id) !== targetId));
      try {
        if (match?.id && typeof match.id === "number") {
          await apiClient.delete(`/wishlist/${match.id}/`);
        } else {
          await apiClient.post("/wishlist/toggle/", { product_id: targetId });
        }
      } catch {
        loadWishlist();
      }
    },
    [items, loadWishlist, user]
  );

  return (
    <WishlistContext.Provider
      value={{
        wishlistItems: items,
        wishlistCount: items.length,
        wishlistLoading: loading,
        isWishlisted,
        toggleWishlist,
        removeFromWishlist,
        refreshWishlist: loadWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => useContext(WishlistContext);
