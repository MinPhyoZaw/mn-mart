"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Minus, Plus, X } from "lucide-react";
import { useCart } from "../context/CartContext";

export default function CartDrawer() {
  const {
    cartItems,
    isCartOpen,
    closeCart,
    incrementItem,
    decrementItem,
    totalPrice,
  } = useCart();

  return (
    <AnimatePresence>
      {isCartOpen && (
        <motion.aside
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          className="fixed right-0 top-0 h-full w-[92%] sm:w-[420px] bg-white z-[60] shadow-2xl flex flex-col border-l"
          aria-label="Shopping cart drawer"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <h2 className="text-lg font-semibold">Your Cart</h2>
            <button onClick={closeCart} className="p-1 rounded hover:bg-gray-100">
              <X className="w-6 h-6 text-gray-600 hover:text-black transition" />
            </button>
          </div>

          <div className="flex-1 p-4 overflow-y-auto">
            {cartItems.length === 0 ? (
              <p className="text-gray-500 text-sm">Your cart is empty.</p>
            ) : (
              <div className="space-y-3">
                {cartItems.map((item) => (
                  <div
                    key={item._id}
                    className="flex gap-3 p-3 rounded-lg border border-gray-100"
                  >
                    <div className="relative w-16 h-16 rounded-md overflow-hidden bg-gray-100 shrink-0">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      ) : null}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold line-clamp-1">{item.name}</p>
                      <p className="text-sm text-gray-600">{item.price.toLocaleString()} MMK</p>

                      <div className="mt-2 inline-flex items-center border rounded-md overflow-hidden">
                        <button
                          onClick={() => decrementItem(item._id)}
                          className="px-2 py-1 hover:bg-gray-100"
                          aria-label={`Decrease quantity for ${item.name}`}
                        >
                          <Minus size={15} />
                        </button>
                        <span className="px-3 py-1 text-sm">{item.quantity}</span>
                        <button
                          onClick={() => incrementItem(item._id)}
                          className="px-2 py-1 hover:bg-gray-100"
                          aria-label={`Increase quantity for ${item.name}`}
                        >
                          <Plus size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-6 border-t bg-white">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-600">Total</span>
              <span className="text-lg font-semibold">{totalPrice.toLocaleString()} MMK</span>
            </div>

            <Link
              href="/checkout"
              onClick={closeCart}
              className={`block w-full text-center text-white py-3 rounded-lg font-semibold transition ${
                cartItems.length === 0 ? "bg-gray-300 pointer-events-none" : "bg-yellow-500 hover:bg-yellow-600"
              }`}
            >
              Checkout
            </Link>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
