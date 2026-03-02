"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function CartDrawer() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // open animation after mount
    setOpen(true);
  }, []);

  const handleClose = () => {
    setOpen(false);

    // wait for animation before navigating back
    setTimeout(() => {
      router.back();
    }, 300);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black z-40"
            onClick={handleClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="fixed right-0 top-0 h-full w-[90%] sm:w-[400px] bg-white z-50 shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-semibold">Your Cart</h2>
              <button onClick={handleClose}>
                <X className="w-6 h-6 text-gray-600 hover:text-black transition" />
              </button>
            </div>

            {/* Cart Content */}
            <div className="flex-1 p-6 overflow-y-auto">
              <p className="text-gray-500 text-sm">
                Your cart is empty.
              </p>
            </div>

            {/* Footer */}
            <div className="p-6 border-t">
              <button className="w-full bg-yellow-500 text-white py-3 rounded-lg font-semibold hover:bg-yellow-600 transition">
                Checkout
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}