import { createContext, useState, useEffect, useCallback } from 'react';
import { formatPrice } from '../utils/formatter';
import { DELIVERY_FEE, FREE_DELIVERY_MIN, GST_RATE } from '../utils/constants';

export const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const stored = localStorage.getItem('cart');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Persist cart to localStorage
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartItems));
  }, [cartItems]);

  // ── Add item to cart ──
  const addToCart = useCallback((item) => {
    setCartItems((prev) => {
      // Check if same item (same pizza/custom + same size) exists
      const existingIndex = prev.findIndex(
        (i) =>
          i.cartId === item.cartId ||
          (i.pizza?._id === item.pizza?._id &&
            i.size === item.size &&
            i.itemType === 'preset')
      );

      if (existingIndex !== -1 && item.itemType === 'preset') {
        // Increase quantity
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + (item.quantity || 1),
          subtotal: updated[existingIndex].price *
            (updated[existingIndex].quantity + (item.quantity || 1)),
        };
        return updated;
      }

      // Add new item
      const newItem = {
        ...item,
        cartId:   item.cartId || `cart_${Date.now()}_${Math.random()}`,
        quantity: item.quantity || 1,
        subtotal: item.price * (item.quantity || 1),
      };
      return [...prev, newItem];
    });
  }, []);

  // ── Remove item from cart ──
  const removeFromCart = useCallback((cartId) => {
    setCartItems((prev) => prev.filter((i) => i.cartId !== cartId));
  }, []);

  // ── Update quantity ──
  const updateQuantity = useCallback((cartId, quantity) => {
    if (quantity < 1) {
      removeFromCart(cartId);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) =>
        item.cartId === cartId
          ? { ...item, quantity, subtotal: item.price * quantity }
          : item
      )
    );
  }, [removeFromCart]);

  // ── Clear cart ──
  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  // ── Computed values ──
  const cartCount   = cartItems.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal    = cartItems.reduce((sum, i) => sum + i.subtotal, 0);
  const deliveryFee = subtotal >= FREE_DELIVERY_MIN ? 0 : (subtotal > 0 ? DELIVERY_FEE : 0);
  const tax         = Math.round(subtotal * GST_RATE);
  const total       = subtotal + deliveryFee + tax;

  const value = {
    cartItems,
    cartCount,
    subtotal,
    deliveryFee,
    tax,
    total,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};