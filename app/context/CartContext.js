"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

const CART_STORAGE_KEY = "mn-mart-cart";

const CartContext = createContext(null);

const normalizeCartItem = (item) => {
  if (!item || typeof item !== "object") return null;

  const itemId = item._id || item.itemId || item.id || null;
  const shopId = item.shopId || item.shop?._id || item.shop?.id || null;
  const vendorId = item.vendorId || item.vendor?._id || item.vendor?.id || null;

  if (!itemId) return null;

  return {
    _id: String(itemId),
    shopId: shopId ? String(shopId) : null,
    shopName: item.shopName || item.shop?.name || "Unknown Shop",
    vendorId: vendorId ? String(vendorId) : null,
    vendorName: item.vendorName || item.vendor?.vendorName || "Unknown Vendor",
    name: item.name || "Unnamed Item",
    price: Number(item.price) || 0,
    image: item.image || null,
    quantity: Math.max(Number(item.quantity) || 1, 1),
  };
};

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY);
      if (savedCart) {
        const parsed = JSON.parse(savedCart);
        const normalized = Array.isArray(parsed)
          ? parsed.map(normalizeCartItem).filter(Boolean)
          : [];
        setCartItems(normalized);
      }
    } catch (error) {
      console.error("Unable to load cart from storage", error);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
  }, [cartItems, hydrated]);

  const addToCart = (item) => {
    const normalizedIncoming = normalizeCartItem(item);
    if (!normalizedIncoming) return;

    setCartItems((prevItems) => {
      const existing = prevItems.find((cartItem) => cartItem._id === normalizedIncoming._id);

      if (existing) {
        return prevItems.map((cartItem) =>
          cartItem._id === normalizedIncoming._id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      }

      return [...prevItems, normalizedIncoming];
    });
  };

  const incrementItem = (itemId) => {
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item._id === itemId ? { ...item, quantity: item.quantity + 1 } : item
      )
    );
  };

  const decrementItem = (itemId) => {
    setCartItems((prevItems) =>
      prevItems
        .map((item) =>
          item._id === itemId
            ? { ...item, quantity: Math.max(item.quantity - 1, 0) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const totalItems = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems]
  );

  const totalPrice = useMemo(
    () =>
      cartItems.reduce((sum, item) => {
        return sum + item.price * item.quantity;
      }, 0),
    [cartItems]
  );

  const value = {
    cartItems,
    isCartOpen,
    addToCart,
    incrementItem,
    decrementItem,
    clearCart: () => setCartItems([]),
    totalItems,
    totalPrice,
    openCart: () => setIsCartOpen(true),
    closeCart: () => setIsCartOpen(false),
    toggleCart: () => setIsCartOpen((prev) => !prev),
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used inside CartProvider");
  }

  return context;
}
