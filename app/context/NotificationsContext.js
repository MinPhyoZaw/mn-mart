"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "./AuthContext";

const NotificationsContext = createContext(null);

const POLL_INTERVAL_MS = 60_000;
const MIN_FETCH_GAP_MS = 2_000;

let inflightRequest = null;
let lastFetchAt = 0;

async function fetchOrderNotifications() {
  const now = Date.now();
  if (inflightRequest) return inflightRequest;
  if (now - lastFetchAt < MIN_FETCH_GAP_MS) return null;

  inflightRequest = fetch("/api/orders/notifications", { cache: "no-store" })
    .then((res) => res.json())
    .then((data) => (data.success ? data.data || [] : []))
    .catch(() => [])
    .finally(() => {
      inflightRequest = null;
      lastFetchAt = Date.now();
    });

  return inflightRequest;
}

async function fetchPendingVendorRequestsCount() {
  try {
    const res = await fetch("/api/vendor-requests?status=pending&limit=1", { cache: "no-store" });
    const data = await res.json();
    return data?.pagination?.total || 0;
  } catch {
    return 0;
  }
}

function mergeAdminVendorRequests(notices, count) {
  if (count <= 0) return notices;

  return [
    {
      _id: "vendor-requests",
      type: "vendor-request",
      text: `${count} vendor requests pending`,
      count,
    },
    ...notices,
  ];
}

export function NotificationsProvider({ children }) {
  const { user, loading: authLoading } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [vendorRequestsCount, setVendorRequestsCount] = useState(null);
  const pollTimerRef = useRef(null);
  const userId = user?._id ? String(user._id) : null;
  const userRole = user?.role || null;
  const canReceiveNotifications = Boolean(
    userRole && ["customer", "admin", "vendor"].includes(userRole)
  );

  const loadNotifications = useCallback(async () => {
    if (!canReceiveNotifications) {
      setNotifications([]);
      setVendorRequestsCount(0);
      return;
    }

    const notices = await fetchOrderNotifications();
    if (notices === null) return;

    let pendingVendorCount = 0;
    if (userRole === "admin") {
      pendingVendorCount = await fetchPendingVendorRequestsCount();
    }

    setVendorRequestsCount(pendingVendorCount);
    setNotifications(
      userRole === "admin" ? mergeAdminVendorRequests(notices, pendingVendorCount) : notices
    );
  }, [canReceiveNotifications, userRole]);

  useEffect(() => {
    if (authLoading) return;

    if (!canReceiveNotifications) {
      setNotifications([]);
      setVendorRequestsCount(0);
      return;
    }

    loadNotifications();

    const stopPolling = () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };

    const startPolling = () => {
      stopPolling();
      pollTimerRef.current = setInterval(() => {
        if (document.visibilityState === "visible") {
          loadNotifications();
        }
      }, POLL_INTERVAL_MS);
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        loadNotifications();
        startPolling();
      } else {
        stopPolling();
      }
    };

    if (document.visibilityState === "visible") {
      startPolling();
    }

    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      stopPolling();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [authLoading, canReceiveNotifications, userId, userRole, loadNotifications]);

  const markAsRead = useCallback(async (noticeId) => {
    const res = await fetch("/api/orders/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: noticeId }),
    });
    const data = await res.json();
    if (!data.success) return false;

    setNotifications((prev) => prev.filter((notice) => notice._id !== noticeId));
    return true;
  }, []);

  const totalCount = useMemo(
    () => notifications.reduce((acc, notice) => acc + (notice.count || 1), 0),
    [notifications]
  );

  const value = {
    notifications,
    vendorRequestsCount,
    totalCount,
    markAsRead,
    refresh: loadNotifications,
  };

  return (
    <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);

  if (!context) {
    throw new Error("useNotifications must be used inside NotificationsProvider");
  }

  return context;
}
