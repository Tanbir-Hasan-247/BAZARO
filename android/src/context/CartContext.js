import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient, { formatApiError } from '../api/client';
import { useAuth } from './AuthContext';
import {
  STORAGE_KEYS,
  LEGACY_STORAGE_KEYS,
  getStoredValue,
} from '../constants/storageKeys';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState(null);
  const [cartId, setCartId] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      initCart();
    } else {
      setCart(null);
      setCartId(null);
    }
  }, [isAuthenticated]);

  const initCart = async () => {
    try {
      setLoading(true);
      const storedCartId = await getStoredValue(
        STORAGE_KEYS.CART_ID,
        LEGACY_STORAGE_KEYS.CART_ID
      );

      if (storedCartId) {
        try {
          const res = await apiClient.get(`/carts/${storedCartId}/`);
          setCart(res.data);
          setCartId(storedCartId);
          return storedCartId;
        } catch {
          // Expired or converted cart; allocate fresh
        }
      }

      const createRes = await apiClient.post('/carts/', {});
      const newCartId = createRes.data.id;
      setCart(createRes.data);
      setCartId(newCartId);
      await AsyncStorage.setItem(STORAGE_KEYS.CART_ID, newCartId);
      return newCartId;
    } catch (e) {
      console.error('Cart initialization failed:', e);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const refreshCart = async () => {
    if (!cartId) return initCart();
    try {
      const res = await apiClient.get(`/carts/${cartId}/`);
      setCart(res.data);
    } catch (e) {
      if (e.response?.status === 404) {
        await initCart();
      }
    }
  };

  const addToCart = async (productId, quantity = 1, selectedVariant = '') => {
    if (!isAuthenticated) {
      return {
        success: false,
        requireAuth: true,
        message: 'Sign in to reserve curated pieces in your BAZARO bag.',
      };
    }
    try {
      setLoading(true);
      let currentCartId = cartId;
      if (!currentCartId) {
        currentCartId = await initCart();
      }
      if (!currentCartId) {
        return { success: false, message: 'Could not initialize your shopping bag.' };
      }

      await apiClient.post(`/carts/${currentCartId}/items/`, {
        product_id: productId,
        quantity,
        selected_variant: selectedVariant || '',
      });

      await refreshCart();
      return { success: true, message: 'Piece added to your bag.' };
    } catch (error) {
      return {
        success: false,
        message: formatApiError(error, 'Could not add item to bag.'),
      };
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId, newQuantity) => {
    if (!cartId) return { success: false };
    try {
      if (newQuantity <= 0) {
        return removeFromCart(itemId);
      }
      await apiClient.patch(`/carts/${cartId}/items/${itemId}/`, {
        quantity: newQuantity,
      });
      await refreshCart();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: formatApiError(error, 'Failed to update item quantity.'),
      };
    }
  };

  const removeFromCart = async (itemId) => {
    if (!cartId) return { success: false };
    try {
      await apiClient.delete(`/carts/${cartId}/items/${itemId}/`);
      await refreshCart();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: formatApiError(error, 'Failed to remove item.'),
      };
    }
  };

  const resetCartAfterOrder = async () => {
    await AsyncStorage.multiRemove([STORAGE_KEYS.CART_ID, LEGACY_STORAGE_KEYS.CART_ID]);
    setCartId(null);
    setCart(null);
    await initCart();
  };

  const checkout = async ({
    shipping_address = '',
    contact_phone = '',
    recipient_name = '',
    payment_method = 'COD',
    transaction_id = '',
    coupon_code = '',
    confirmPaid = false,
  } = {}) => {
    if (!cartId) return { success: false, message: 'Bag is empty.' };
    try {
      setLoading(true);
      const orderRes = await apiClient.post('/orders/', {
        cart_id: cartId,
        shipping_address,
        contact_phone,
        recipient_name,
        payment_method,
        transaction_id,
        coupon_code,
      });

      let finalOrder = orderRes.data;
      if (confirmPaid && transaction_id && finalOrder?.id) {
        const confirmRes = await apiClient.post(`/orders/${finalOrder.id}/confirm_payment/`, {
          payment_method,
          transaction_id,
        });
        if (confirmRes.data) finalOrder = confirmRes.data;
      }

      await resetCartAfterOrder();
      return { success: true, order: finalOrder };
    } catch (error) {
      return {
        success: false,
        message: formatApiError(error, 'Settlement failed. Please review your details.'),
      };
    } finally {
      setLoading(false);
    }
  };

  const checkoutAndInitiateGateway = async ({
    provider = 'sslcommerz',
    shipping_address = '',
    contact_phone = '',
    recipient_name = '',
    coupon_code = '',
  } = {}) => {
    if (!cartId) return { success: false, message: 'Bag is empty.' };
    try {
      setLoading(true);
      const methodName = provider === 'stripe' ? 'Stripe' : 'SSLCommerz';
      const orderRes = await apiClient.post('/orders/', {
        cart_id: cartId,
        shipping_address,
        contact_phone,
        recipient_name,
        payment_method: methodName,
        coupon_code,
      });
      const createdOrder = orderRes.data;
      await resetCartAfterOrder();

      const gatewayRes = await apiClient.post(`/orders/${createdOrder.id}/initiate_payment/`, {
        provider,
      });
      return {
        success: true,
        order: createdOrder,
        gateway: gatewayRes.data,
      };
    } catch (error) {
      return {
        success: false,
        message: formatApiError(error, 'Failed to contact gateway.'),
      };
    } finally {
      setLoading(false);
    }
  };

  const cartItemCount =
    cart?.items?.reduce((total, item) => total + item.quantity, 0) || 0;
  const totalPrice = cart?.total_price || 0;

  return (
    <CartContext.Provider
      value={{
        cart,
        cartId,
        loading,
        cartItemCount,
        totalPrice,
        addToCart,
        updateQuantity,
        removeFromCart,
        checkout,
        checkoutAndInitiateGateway,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
