"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageCircle, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import SupportThread from "./SupportThread";
import { chatRequest, useChatPolling } from "./supportChatClient";

const endpoint = "/api/support/chat";

function ChatLauncher({ customerId, loading }) {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const dialog = useRef(null);
  const launcher = useRef(null);

  const refreshUnread = useCallback(async (signal) => {
    try {
      const result = await chatRequest(endpoint + "?unread=1", { signal });
      if (!signal.aborted) setUnread(result.unread);
    } catch {
      // A background refresh failure should keep the last known badge.
    }
  }, []);
  useChatPolling(Boolean(customerId) && !open, refreshUnread, 30000);

  useEffect(() => {
    if (!open) return;
    const panel = dialog.current;
    if (!panel.open) panel.showModal();
    const viewport = window.visualViewport;
    if (!viewport) return;
    function resize() {
      panel.style.setProperty("--support-height", viewport.height + "px");
      panel.style.setProperty("--support-bottom", Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop) + "px");
    }
    resize();
    viewport.addEventListener("resize", resize);
    viewport.addEventListener("scroll", resize);
    return () => {
      viewport.removeEventListener("resize", resize);
      viewport.removeEventListener("scroll", resize);
    };
  }, [open]);

  return (
    <>
      <button ref={launcher} type="button" aria-haspopup="dialog" aria-expanded={open}
        aria-label={unread ? `Chat with MN Mart, ${unread} unread messages` : "Chat with MN Mart"}
        onClick={() => setOpen(true)}
        className="fixed right-4 bottom-[calc(4.75rem_+_env(safe-area-inset-bottom))] z-[55] grid size-14 place-items-center rounded-full bg-emerald-700 text-white shadow-lg hover:bg-emerald-800 sm:right-6 sm:bottom-6">
        <MessageCircle size={25} aria-hidden="true" />
        {unread > 0 && <span aria-hidden="true" className="absolute -top-1 -right-1 min-w-5 rounded-full bg-red-600 px-1 text-xs leading-5">{unread > 99 ? "99+" : unread}</span>}
      </button>
      <dialog ref={dialog} aria-labelledby="support-chat-title"
        onClose={() => {
          setOpen(false);
          launcher.current?.focus();
        }}
        className="fixed inset-auto bottom-[var(--support-bottom,0px)] left-0 m-0 w-full max-w-none overflow-hidden rounded-t-3xl border border-slate-200 bg-white text-slate-900 shadow-2xl backdrop:bg-slate-900/25 sm:right-6 sm:bottom-24 sm:left-auto sm:w-96 sm:rounded-3xl">
        {open && (
          <div className="flex h-[min(34rem,calc(var(--support-height,100dvh)_-_1rem))] sm:max-h-[calc(100dvh_-_7rem)] flex-col">
            <header className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
              <span className="grid size-10 place-items-center rounded-full bg-emerald-100 text-emerald-800">
                <MessageCircle size={20} aria-hidden="true" />
              </span>
              <h2 id="support-chat-title" className="flex-1 font-semibold">Chat with MN Mart</h2>
              <button type="button" aria-label="Close chat" onClick={() => dialog.current.close()}
                className="grid size-10 place-items-center rounded-full hover:bg-slate-100">
                <X size={20} aria-hidden="true" />
              </button>
            </header>
            {customerId ? <SupportThread endpoint={endpoint} role="customer" /> : (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
                <p className="text-sm text-slate-600">{loading ? "Checking your account…" : "Sign in to message MN Mart support."}</p>
                {!loading && <Link href="/login" onClick={() => dialog.current.close()}
                  className="rounded-full bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white">Sign in to chat</Link>}
              </div>
            )}
          </div>
        )}
      </dialog>
    </>
  );
}

export default function SupportChatLauncher() {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  if (user && user.role !== "customer") return null;
  if (/^\/(?:admindashboard|vendordashboard|checkout|login|signup|forgot-password|reset-password)(?:\/|$)/.test(pathname)) {
    return null;
  }

  return <ChatLauncher key={user?._id || "guest"} customerId={user?._id} loading={loading} />;
}
