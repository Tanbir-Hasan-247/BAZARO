import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import apiClient, { formatApiError } from '../api/client';
import { useAuth } from './AuthContext';

const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [wishlistItems, setWishlistItems] = useState([]);
  const [wishlistedIds, setWishlistedIds] = useState([]);
  const [loading, setLoading] = useState(false);

  const refreshWishlist = useCallback(async () => {
    if (!isAuthenticated) {
      setWishlistItems([]);
      setWishlistedIds([]);
      return;
    }
    try {
      setLoading(true);
      const res = await apiClient.get('/wishlist/');
      const rows = Array.isArray(res.data) ? res.data : res.data?.results || [];
      setWishlistItems(rows);
      setWishlistedIds(rows.map((item) => item.product?.id).filter(Boolean));
    } catch (e) {
      console.error('Wishlist fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) refreshWishlist();
    });
    return () => {
      active = false;
    };
  }, [refreshWishlist]);

  const toggleWishlist = async (productId) => {
    if (!isAuthenticated) {
      return {
        success: false,
        requireAuth: true,
        message: 'Sign in to curate your BAZARO Saved Vault.',
      };
    }

    const wasSaved = wishlistedIds.includes(productId);
    setWishlistedIds((prev) =>
      wasSaved ? prev.filter((id) => id !== productId) : [...prev, productId]
    );

    try {
      const res = await apiClient.post('/wishlist/toggle/', { product_id: productId });
      await refreshWishlist();
      return {
        success: true,
        wishlisted: Boolean(res.data?.wishlisted),
      };
    } catch (error) {
      setWishlistedIds((prev) =>
        wasSaved ? [...prev, productId] : prev.filter((id) => id !== productId)
      );
      return {
        success: false,
        message: formatApiError(error, 'Could not update saved vault.'),
      };
    }
  };

  const isWishlisted = (productId) => wishlistedIds.includes(productId);

  return (
    <WishlistContext.Provider
      value={{
        wishlistItems,
        wishlistedIds,
        loading,
        isWishlisted,
        toggleWishlist,
        refreshWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => useContext(WishlistContext);
