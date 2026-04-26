"use client";

import Link from "next/link";
import Image from "next/image";
import { Bell, Menu, ShoppingCart, User, X, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useCart } from "../context/CartContext";

const MAX_IMAGE_SIDE = 320;
const OUTPUT_QUALITY = 0.72;

const fileToDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = () => reject(new Error("Unable to read the image file."));
  reader.readAsDataURL(file);
});

const loadImageElement = (src) => new Promise((resolve, reject) => {
  const img = new window.Image();
  img.onload = () => resolve(img);
  img.onerror = () => reject(new Error("Unable to load selected image."));
  img.src = src;
});

const compressProfileImage = async (file) => {
  const sourceDataUrl = await fileToDataUrl(file);
  const image = await loadImageElement(sourceDataUrl);

  const scale = Math.min(MAX_IMAGE_SIDE / image.width, MAX_IMAGE_SIDE / image.height, 1);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));

  const ctx = canvas.getContext("2d", { alpha: false });
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

  return canvas.toDataURL("image/webp", OUTPUT_QUALITY);
};

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const fileInputRef = useRef(null);
  const router = useRouter();
  const pathname = usePathname();
  const { totalItems, toggleCart } = useCart();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        const data = await res.json();
        setUser(data.user);

        if (data.user?.role === "customer") {
          const noticeRes = await fetch("/api/orders/notifications", { cache: "no-store" });
          const noticeData = await noticeRes.json();
          if (noticeData.success) {
            setNotifications(noticeData.data || []);
          }
        } else {
          setNotifications([]);
        }
      } catch {
        setUser(null);
        setNotifications([]);
      }
    };

    fetchUser();

    const syncAuth = () => {
      fetchUser();
    };

    window.addEventListener("auth-changed", syncAuth);
    return () => window.removeEventListener("auth-changed", syncAuth);
  }, [pathname]);

  const closeMenu = () => setIsMenuOpen(false);

  const markNotificationAsRead = async (noticeId) => {
    const res = await fetch("/api/orders/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: noticeId }),
    });
    const data = await res.json();
    if (!data.success) return;
    setNotifications((prev) => prev.filter((notice) => notice._id !== noticeId));
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setIsAccountOpen(false);
    setIsNotificationsOpen(false);
    window.dispatchEvent(new Event("auth-changed"));
    setIsMenuOpen(false);
    router.push("/");
  };

  const openAccountPane = () => {
    closeMenu();
    setIsAccountOpen(true);
    setUploadError("");
  };

  const handleProfileImageChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setUploadError("Please upload a valid image file.");
      return;
    }

    setUploadError("");
    setIsUploading(true);

    try {
      const profileImage = await compressProfileImage(file);
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileImage }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Unable to update your profile image.");
      }

      setUser(data.user);
      window.dispatchEvent(new Event("auth-changed"));
    } catch (error) {
      setUploadError(error.message || "Image upload failed.");
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  };

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : "U";

  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-gray-100/80 bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="text-2xl font-extrabold tracking-tight sm:text-3xl">
              <span className="font-[var(--font-raleway)] text-green-600">MN</span>
              <span className="font-[var(--font-raleway)] text-red-500">Mart</span>
            </Link>

            <div className="hidden items-center gap-2 md:flex">
              {!user ? (
                <>
                  <Link
                    href="/login"
                    onClick={closeMenu}
                    className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 hover:text-green-600"
                  >
                    Login
                  </Link>
                  <Link
                    href="/signup"
                    onClick={closeMenu}
                    className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700"
                  >
                    Sign Up
                  </Link>
                </>
              ) : (
                <>
                  {user.role === "admin" && (
                    <Link
                      href="/admindashboard"
                      onClick={closeMenu}
                      className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 hover:text-green-600"
                    >
                      Admin
                    </Link>
                  )}

                  {user.role === "vendor" && (
                    <Link
                      href="/vendordashboard"
                      onClick={closeMenu}
                      className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 hover:text-green-600"
                    >
                      Vendor Dashboard
                    </Link>
                  )}

                  {user.role === "customer" && (
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setIsNotificationsOpen((prev) => !prev)}
                        className="relative rounded-full p-2 text-gray-700 transition hover:bg-gray-100"
                        aria-label="Order notifications"
                      >
                        <Bell size={21} />
                        <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-red-500 px-1.5 py-0.5 text-center text-[10px] font-bold text-white">
                          {notifications.length}
                        </span>
                      </button>

                      {isNotificationsOpen && (
                        <div className="absolute right-0 mt-2 w-80 rounded-xl border bg-white p-3 shadow-xl">
                          <p className="text-sm font-semibold mb-2">Order notifications</p>
                          {notifications.length === 0 ? (
                            <p className="text-xs text-gray-500">No notifications yet.</p>
                          ) : (
                            <div className="space-y-2 max-h-64 overflow-auto">
                              {notifications.map((notice, idx) => (
                                <label key={`${notice.orderId}-${idx}`} className="text-xs text-gray-700 border rounded p-2 flex gap-2 items-start">
                                  <input
                                    type="checkbox"
                                    className="mt-0.5 h-4 w-4 accent-green-600"
                                    onChange={() => markNotificationAsRead(notice._id)}
                                  />
                                  <span>{notice.text}</span>
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={openAccountPane}
                    className="rounded-full p-2 text-gray-700 transition hover:bg-gray-100"
                    aria-label="Open account pane"
                  >
                    <User size={21} className="rounded-full" />
                  </button>

                  <button
                    onClick={() => {
                      toggleCart();
                      closeMenu();
                    }}
                    className="relative rounded-full p-2 text-gray-700 transition hover:bg-gray-100"
                    aria-label="Open shopping cart"
                  >
                    <ShoppingCart size={21} />
                    <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-green-600 px-1.5 py-0.5 text-center text-xs font-bold text-white">
                      {totalItems}
                    </span>
                  </button>
                </>
              )}
            </div>

            <button
              onClick={() => setIsMenuOpen((prev) => !prev)}
              className="rounded-lg p-2 text-gray-700 transition hover:bg-gray-100 md:hidden"
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            >
              {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="border-t border-gray-100 bg-white px-4 pb-4 pt-3 shadow-sm md:hidden">
            <div className="flex flex-col gap-2">
              {!user ? (
                <>
                  <Link
                    href="/login"
                    onClick={closeMenu}
                    className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 hover:text-green-600"
                  >
                    Login
                  </Link>
                  <Link
                    href="/signup"
                    onClick={closeMenu}
                    className="rounded-lg bg-green-600 px-3 py-2 text-center text-sm font-semibold text-white transition hover:bg-green-700"
                  >
                    Sign Up
                  </Link>
                </>
              ) : (
                <>
                  {user.role === "admin" && (
                    <Link
                      href="/admindashboard"
                      onClick={closeMenu}
                      className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 hover:text-green-600"
                    >
                      Admin
                    </Link>
                  )}

                  {user.role === "vendor" && (
                    <Link
                      href="/vendordashboard"
                      onClick={closeMenu}
                      className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 hover:text-green-600"
                    >
                      Vendor Dashboard
                    </Link>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    {user.role === "customer" && (
                      <button
                        type="button"
                        onClick={() => setIsNotificationsOpen((prev) => !prev)}
                        className="relative flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700"
                      >
                        <Bell size={18} /> Notifications
                        <span className="absolute right-2 top-1 min-w-5 rounded-full bg-red-500 px-1.5 py-0.5 text-center text-[10px] font-bold text-white">
                          {notifications.length}
                        </span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={openAccountPane}
                      className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700"
                    >
                      <User size={18} /> Account
                    </button>

                    <button
                      onClick={() => {
                        toggleCart();
                        closeMenu();
                      }}
                      className="relative flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700"
                      aria-label="Open shopping cart"
                    >
                      <ShoppingCart size={18} /> Cart
                      <span className="absolute right-2 top-1 min-w-5 rounded-full bg-green-600 px-1.5 py-0.5 text-center text-[10px] font-bold text-white">
                        {totalItems}
                      </span>
                    </button>
                  </div>

                  {user.role === "customer" && isNotificationsOpen && (
                    <div className="mt-2 rounded-lg border border-gray-200 bg-gray-50 p-2">
                      {notifications.length === 0 ? (
                        <p className="text-xs text-gray-500">No notifications yet.</p>
                      ) : (
                        notifications.slice(0, 4).map((notice, idx) => (
                          <label key={`${notice.orderId}-${idx}`} className="text-xs text-gray-700 py-1 flex gap-2 items-start">
                            <input
                              type="checkbox"
                              className="mt-0.5 h-4 w-4 accent-green-600"
                              onChange={() => markNotificationAsRead(notice._id)}
                            />
                            <span>{notice.text}</span>
                          </label>
                        ))
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      {isAccountOpen && user && (
        <>
          <button
            type="button"
            aria-label="Close account pane"
            onClick={() => setIsAccountOpen(false)}
            className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[1px]"
          />

          <aside className="fixed right-0 top-0 z-[60] flex h-full w-full max-w-sm flex-col border-l border-gray-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <h2 className="text-lg font-semibold text-gray-900">My Account</h2>
              <button
                type="button"
                onClick={() => setIsAccountOpen(false)}
                className="rounded-full p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-5 p-5">
              <div className="rounded-2xl border border-gray-100 bg-gray-50/80 p-4">
                <div className="mb-4 flex items-center gap-4">
                  <div className="relative h-20 w-20 overflow-hidden rounded-full border border-gray-200 bg-white">
                    {user.profileImage ? (
                      <Image
                        src={user.profileImage}
                        alt={`${user.name} profile`}
                        fill
                        sizes="80px"
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-green-100 text-xl font-bold text-green-700">
                        {userInitial}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold text-gray-900">{user.name}</p>
                    <p className="truncate text-sm text-gray-500">{user.email}</p>
                  </div>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleProfileImageChange}
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <Upload size={16} />
                  {isUploading ? "Uploading..." : "Upload Profile Photo"}
                </button>

                {uploadError && <p className="mt-2 text-sm text-red-500">{uploadError}</p>}
                <p className="mt-2 text-xs text-gray-500">
                  Images are auto-resized and compressed for fast loading and consistent quality.
                </p>
              </div>

              <button
                onClick={handleLogout}
                className="w-full rounded-lg bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100"
              >
                Logout
              </button>
            </div>
          </aside>
        </>
      )}
    </>
  );
}
