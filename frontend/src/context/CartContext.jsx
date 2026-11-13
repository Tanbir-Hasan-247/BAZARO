import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('bazaro_cart') || localStorage.getItem('dokanly_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Save to localStorage whenever cart updates
  useEffect(() => {
    try {
      localStorage.setItem('bazaro_cart', JSON.stringify(cart));
    } catch (e) {
      console.error('Failed to sync cart to localStorage', e);
    }
  }, [cart]);

  const getEntryKey = (item) =>
    item?.cartKey ||
    (item?.selected_variant
      ? `${item.product?.id ?? item.id}::${item.selected_variant}`
      : String(item?.product?.id ?? item?.id ?? ''));

  // Add Item to Cart (supports optional variant selection)
  const addToCart = (product, quantity = 1, selectedVariant = '') => {
    if (!product || !product.id) return;
    const cleanVariant = String(selectedVariant || '').trim().slice(0, 120);
    const targetKey = cleanVariant ? `${product.id}::${cleanVariant}` : String(product.id);

    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex((item) => getEntryKey(item) === targetKey);
      if (existingIndex > -1) {
        const updated = [...prevCart];
        updated[existingIndex] = {
          ...updated[existingIndex],
          cartKey: targetKey,
          selected_variant: cleanVariant,
          quantity: (Number(updated[existingIndex].quantity) || 0) + (Number(quantity) || 1),
        };
        return updated;
      }
      return [
        ...prevCart,
        {
          id: product.id,
          cartKey: targetKey,
          selected_variant: cleanVariant,
          product,
          quantity: Number(quantity) || 1,
        },
      ];
    });
  };

  // Update Item Quantity (accepts cartKey or legacy numeric productId)
  const updateQuantity = (itemKey, newQuantity) => {
    const qty = Number(newQuantity);
    if (qty <= 0) {
      removeFromCart(itemKey);
      return;
    }
    const targetStr = String(itemKey);
    setCart((prevCart) =>
      prevCart.map((item) =>
        getEntryKey(item) === targetStr || String(item.product?.id) === targetStr
          ? { ...item, quantity: qty }
          : item
      )
    );
  };

  // Remove Item from Cart (accepts cartKey or legacy numeric productId)
  const removeFromCart = (itemKey) => {
    const targetStr = String(itemKey);
    setCart((prevCart) =>
      prevCart.filter(
        (item) => getEntryKey(item) !== targetStr && String(item.product?.id) !== targetStr
      )
    );
  };

  // Clear Entire Cart
  const clearCart = () => {
    setCart([]);
    localStorage.removeItem('bazaro_cart');
    localStorage.removeItem('dokanly_cart');
  };

  // Total Item Count
  const cartCount = cart.reduce((total, item) => total + (Number(item.quantity) || 0), 0);

  // Total Subtotal Amount
  const totalAmount = cart.reduce((sum, item) => {
    const price = parseFloat(item.product?.price) || 0;
    return sum + price * (Number(item.quantity) || 0);
  }, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        cartCount,
        totalAmount,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
