"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { Bell, ChevronRight, LayoutDashboard, LogOut, Package, ShieldCheck, X } from "lucide-react";
import styles from "./MobileMenuDrawer.module.css";

const rowClass = "flex min-h-16 w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-gray-800 transition hover:bg-green-50";

function RowContent({ icon: Icon, title, subtitle, count }) {
  return <>
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-700"><Icon size={21} aria-hidden="true" /></span>
    <span className="min-w-0 flex-1"><span className="block text-sm font-semibold leading-6">{title}</span>{subtitle && <span className="block text-xs leading-5 text-gray-500">{subtitle}</span>}</span>
    {count > 0 && <span className="shrink-0 rounded-full bg-green-100 px-2 py-1 text-xs font-bold text-green-800" aria-label={`${count} unread notifications`}>{count}</span>}
    <ChevronRight size={18} className="shrink-0 text-gray-400" aria-hidden="true" />
  </>;
}

export default function MobileMenuDrawer({ open, onClose, user, onAccount, notifications, notificationsOpen, onToggleNotifications, onReadNotification, onLogout }) {
  const dialogRef = useRef(null);
  const closeRef = useRef(null);
  const canNotify = ["customer", "admin", "vendor"].includes(user?.role);
  const unread = notifications.reduce((count, notice) => count + (notice.count ?? 1), 0);

  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    const previousRootOverflow = document.documentElement.style.overflow;
    const desktop = window.matchMedia("(min-width: 768px)");
    const closeOnDesktop = () => { if (desktop.matches) onClose(); };
    const trapFocus = (event) => {
      if (event.key !== "Tab") return;
      const controls = [...dialog.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), [tabindex="0"]')]
        .filter((element) => element.getClientRects().length > 0);
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    dialog.addEventListener("keydown", trapFocus);
    dialog.showModal(); // Native modal makes the background inert.
    closeRef.current?.focus();
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    desktop.addEventListener("change", closeOnDesktop);
    closeOnDesktop();
    return () => {
      desktop.removeEventListener("change", closeOnDesktop);
      dialog.removeEventListener("keydown", trapFocus);
      dialog.close();
      document.body.style.overflow = previousOverflow;
      document.documentElement.style.overflow = previousRootOverflow;
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [open, onClose]);

  return <dialog
    ref={dialogRef}
    id="mobile-menu"
    aria-labelledby="mobile-menu-title"
    aria-modal="true"
    className={styles.drawer}
    onCancel={(event) => { event.preventDefault(); onClose(); }}
    onClick={(event) => { if (event.target === event.currentTarget) {
      const rect = event.currentTarget.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onClose();
    } }}
  >
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex shrink-0 items-center justify-between border-b border-gray-100 px-5 py-3">
        <h2 id="mobile-menu-title" className="text-lg font-bold text-gray-900">Menu</h2>
        <button ref={closeRef} type="button" onClick={onClose} aria-label="Close menu" className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-50 text-gray-600 hover:bg-gray-100"><X size={21} aria-hidden="true" /></button>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
        {user ? <>
          <section aria-label="Your account" className="mb-5 flex items-start gap-3 rounded-2xl border border-green-100 bg-green-50/80 p-4">
            <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-green-700 text-lg font-bold text-white">{user.name?.trim().charAt(0).toUpperCase() || "U"}</span>
            <div className="min-w-0 flex-1 break-words [overflow-wrap:anywhere]">
              <p className="text-sm font-bold leading-7 text-gray-900">{user.name}</p>
              <p className="text-xs leading-6 text-gray-600">{user.email}</p>
              {/* The existing account destination is an in-page pane, not a route. */}
              <button type="button" onClick={onAccount} className="min-h-11 text-sm font-semibold text-green-800 underline-offset-4 hover:underline">View account <span aria-hidden="true">→</span></button>
            </div>
          </section>
          <nav aria-label="Your activity">
            <h3 className="mb-1 px-3 text-[11px] font-bold tracking-widest text-gray-500">YOUR ACTIVITY</h3>
            {user.role === "customer" && <Link href="/orders" onClick={onClose} className={rowClass}><RowContent icon={Package} title="My Orders" subtitle="View orders & delivery updates" /></Link>}
            {canNotify && <>
              <button type="button" className={rowClass} onClick={onToggleNotifications} aria-expanded={notificationsOpen} aria-controls="mobile-notifications"><RowContent icon={Bell} title="Notifications" subtitle="Updates about your orders" count={unread} /></button>
              {notificationsOpen && <div id="mobile-notifications" className="my-2 rounded-xl border border-gray-100 bg-gray-50 p-3">
                {notifications.length === 0 ? <p className="text-sm leading-6 text-gray-500">No notifications yet.</p> : <div className="space-y-2">{notifications.slice(0, 4).map((notice, index) => <label key={`${notice._id}-${index}`} className="flex min-h-11 cursor-pointer items-start gap-3 rounded-lg bg-white p-3 text-sm leading-7 text-gray-700">
                  <input type="checkbox" aria-label={`Mark as read: ${notice.text}`} className="mt-1.5 h-5 w-5 shrink-0 accent-green-600" onChange={() => onReadNotification(notice._id)} />
                  <span className="min-w-0 break-words">{notice.text}{notice.thankYouMessage && <span className="mt-1 block text-green-700">{notice.thankYouMessage}</span>}</span>
                </label>)}</div>}
              </div>}
            </>}
            {user.role === "admin" && <Link href="/admindashboard" prefetch={false} onClick={onClose} className={rowClass}><RowContent icon={LayoutDashboard} title="Admin Dashboard" /></Link>}
            {user.role === "vendor" && <Link href="/vendordashboard" onClick={onClose} className={rowClass}><RowContent icon={LayoutDashboard} title="Vendor Dashboard" /></Link>}
          </nav>
        </> : <section aria-label="Sign in" className="mb-5 space-y-3 rounded-2xl bg-green-50 p-4">
          <p className="text-sm leading-7 text-gray-700">Sign in to view your account and order updates.</p>
          <Link href="/login" onClick={onClose} className="flex min-h-11 items-center justify-center rounded-xl bg-green-700 px-4 py-3 text-sm font-semibold text-white hover:bg-green-800">Login</Link>
          <Link href="/signup" onClick={onClose} className="flex min-h-11 items-center justify-center rounded-xl border border-green-200 bg-white px-4 py-3 text-sm font-semibold text-green-800">Create Account</Link>
        </section>}
        <nav aria-label="Information" className="mt-4 border-t border-gray-100 pt-4">
          <h3 className="mb-1 px-3 text-[11px] font-bold tracking-widest text-gray-500">INFORMATION</h3>
          <Link href="/privacy" onClick={onClose} className={rowClass}><RowContent icon={ShieldCheck} title="Privacy Policy" /></Link>
        </nav>
      </div>
      {user && <footer className={styles.footer}><button type="button" onClick={onLogout} className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-red-600 hover:bg-red-50"><LogOut size={20} aria-hidden="true" />Log out</button></footer>}
    </div>
  </dialog>;
}
