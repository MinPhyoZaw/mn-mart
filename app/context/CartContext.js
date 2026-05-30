"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getWholesalePrice, normalizeWholesaleTiers } from "../lib/pricing";

const CART_STORAGE_PREFIX = "mn-mart-cart";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [storageKey, setStorageKey] = useState("");

  const sanitizeItem = (item) => {
    if (!item || !item._id || !item.shopId || !item.vendorId) return null;
    const selectedWholesaleTier = item.selectedWholesaleTier
      ? { minQty: Number(item.selectedWholesaleTier.minQty), price: Number(item.selectedWholesaleTier.price) }
      : null;
    const quantity = Math.max(Number(item.quantity) || 0, selectedWholesaleTier?.minQty || 1);
    return {
      _id: String(item._id),
      shopId: String(item.shopId),
      shopName: item.shopName || "Unknown Shop",
      vendorId: String(item.vendorId),
      vendorName: item.vendorName || "Unknown Vendor",
      name: item.name || "Unnamed Item",
      price: Number(item.price) || 0,
      retailPrice: Number(item.retailPrice ?? item.price) || 0,
      wholesaleTiers: normalizeWholesaleTiers(item.wholesaleTiers),
      selectedWholesaleTier:
        selectedWholesaleTier && Number.isFinite(selectedWholesaleTier.minQty) && Number.isFinite(selectedWholesaleTier.price)
          ? selectedWholesaleTier
          : null,
      image: item.image || null,
      quantity,
    };
  };

  useEffect(() => {
    const resolveCartStorageKey = async () => {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        const data = await res.json();
        const identity = data?.user?._id ? String(data.user._id) : "guest";
        setStorageKey(`${CART_STORAGE_PREFIX}:${identity}`);
      } catch {
        setStorageKey(`${CART_STORAGE_PREFIX}:guest`);
      }
    };

    resolveCartStorageKey();
    const syncCartWithAuth = () => resolveCartStorageKey();
    window.addEventListener("auth-changed", syncCartWithAuth);

    return () => window.removeEventListener("auth-changed", syncCartWithAuth);
  }, []);

  useEffect(() => {
    if (!storageKey) return;

    setHydrated(false);
    try {
      const savedCart = localStorage.getItem(storageKey);
      const parsed = savedCart ? JSON.parse(savedCart) : [];
      const normalized = Array.isArray(parsed) ? parsed.map(sanitizeItem).filter(Boolean) : [];
      setCartItems(normalized);
    } catch (error) {
      console.error("Unable to load cart from storage", error);
      setCartItems([]);
    } finally {
      setHydrated(true);
    }
  }, [storageKey]);

  useEffect(() => {
    if (!hydrated || !storageKey) return;

    localStorage.setItem(storageKey, JSON.stringify(cartItems));
  }, [cartItems, hydrated, storageKey]);

  const addToCart = (item) => {
    setCartItems((prevItems) => {
      const selectedWholesaleTier = item.selectedWholesaleTier
        ? { minQty: Number(item.selectedWholesaleTier.minQty), price: Number(item.selectedWholesaleTier.price) }
        : null;
      const requestedQuantity = Math.max(Number(item.quantity) || 0, selectedWholesaleTier?.minQty || 1);
      const baseCartItem = {
        _id: item._id,
        shopId: item.shopId,
        shopName: item.shopName,
        vendorId: item.vendorId,
        vendorName: item.vendorName,
        name: item.name,
        retailPrice: Number(item.retailPrice ?? item.price) || 0,
        wholesaleTiers: normalizeWholesaleTiers(item.wholesaleTiers),
        selectedWholesaleTier:
          selectedWholesaleTier && Number.isFinite(selectedWholesaleTier.minQty) && Number.isFinite(selectedWholesaleTier.price)
            ? selectedWholesaleTier
            : null,
        image: item.image || null,
      };
      const price = baseCartItem.selectedWholesaleTier?.price ?? getWholesalePrice(baseCartItem, requestedQuantity);

      const existing = prevItems.find(
        (cartItem) => cartItem._id === item._id && cartItem.shopId === item.shopId
      );

      if (existing) {
        return prevItems.map((cartItem) => {
          if (cartItem._id !== item._id || cartItem.shopId !== item.shopId) return cartItem;
          const quantity = cartItem.quantity + requestedQuantity;
          const selectedTier = baseCartItem.selectedWholesaleTier || cartItem.selectedWholesaleTier || null;
          return {
            ...cartItem,
            ...baseCartItem,
            selectedWholesaleTier: selectedTier,
            quantity,
            price: selectedTier?.price ?? getWholesalePrice({ ...cartItem, ...baseCartItem }, quantity),
          };
        });
      }

      return [
        ...prevItems,
        {
          ...baseCartItem,
          price,
          quantity: requestedQuantity,
        },
      ];
    });
  };

  const incrementItem = (itemId, shopId) => {
    setCartItems((prevItems) =>
      prevItems.map((item) => {
        if (item._id !== itemId || item.shopId !== shopId) return item;
        const quantity = item.quantity + 1;
        return { ...item, quantity, price: item.selectedWholesaleTier?.price ?? getWholesalePrice(item, quantity) };
      })
    );
  };

  const decrementItem = (itemId, shopId) => {
    setCartItems((prevItems) =>
      prevItems
        .map((item) =>
          item._id === itemId && item.shopId === shopId
            ? (() => {
                const quantity = Math.max(item.quantity - 1, 0);
                return { ...item, quantity, price: item.selectedWholesaleTier?.price ?? getWholesalePrice(item, quantity || 1) };
              })()
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const totalItems = useMemo(() => cartItems.length, [cartItems]);

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
