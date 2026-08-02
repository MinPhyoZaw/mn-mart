"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useAuth } from "./AuthContext";

const NotificationsContext = createContext(null);

const POLL_INTERVAL_MS = 60_000;
const MIN_FETCH_GAP_MS = 2_000;

let inflightRequest = null;
let lastFetchAt = 0;

async function fetchOrderNotifications() {
  const now = Date.now();

  if (inflightRequest) {
    return inflightRequest;
  }

  if (now - lastFetchAt < MIN_FETCH_GAP_MS) {
    return null;
  }

  inflightRequest = fetch("/api/orders/notifications", {
    cache: "no-store",
  })
    .then(async (res) => {
      if (!res.ok) {
        throw new Error(
          `Failed to fetch notifications: ${res.status}`
        );
      }

      return res.json();
    })
    .then((data) => {
      return data.success ? data.data || [] : [];
    })
    .catch((error) => {
      console.error(
        "Failed to fetch order notifications:",
        error
      );

      return [];
    })
    .finally(() => {
      inflightRequest = null;
      lastFetchAt = Date.now();
    });

  return inflightRequest;
}

async function fetchPendingVendorRequestsCount() {
  try {
    const res = await fetch(
      "/api/vendor-requests?status=pending&limit=1",
      {
        cache: "no-store",
      }
    );

    if (!res.ok) {
      throw new Error(
        `Failed to fetch vendor requests: ${res.status}`
      );
    }

    const data = await res.json();

    return data?.pagination?.total || 0;
  } catch (error) {
    console.error(
      "Failed to fetch pending vendor requests:",
      error
    );

    return 0;
  }
}

function mergeAdminVendorRequests(notices, count) {
  if (count <= 0) {
    return notices;
  }

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
  const [vendorRequestsCount, setVendorRequestsCount] =
    useState(0);

  const pollTimerRef = useRef(null);
  const initialLoadTimerRef = useRef(null);

  const userId = user?._id
    ? String(user._id)
    : null;

  const userRole = user?.role || null;

  const canReceiveNotifications = Boolean(
    userRole &&
      ["customer", "admin", "vendor"].includes(userRole)
  );

  const loadNotifications = useCallback(async () => {
    if (!canReceiveNotifications) {
      return;
    }

    const notices = await fetchOrderNotifications();

    if (notices === null) {
      return;
    }

    let pendingVendorCount = 0;

    if (userRole === "admin") {
      pendingVendorCount =
        await fetchPendingVendorRequestsCount();
    }

    setVendorRequestsCount(pendingVendorCount);

    if (userRole === "admin") {
      setNotifications(
        mergeAdminVendorRequests(
          notices,
          pendingVendorCount
        )
      );
    } else {
      setNotifications(notices);
    }
  }, [canReceiveNotifications, userRole]);

  useEffect(() => {
    if (authLoading || !canReceiveNotifications) {
      return;
    }

    const stopInitialLoadTimer = () => {
      if (initialLoadTimerRef.current) {
        clearTimeout(initialLoadTimerRef.current);
        initialLoadTimerRef.current = null;
      }
    };

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
          void loadNotifications();
        }
      }, POLL_INTERVAL_MS);
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void loadNotifications();
        startPolling();
      } else {
        stopPolling();
      }
    };

    /*
     * Delay the initial notification request until after
     * the effect finishes. This avoids synchronously
     * triggering state updates inside the effect body.
     */
    initialLoadTimerRef.current = setTimeout(() => {
      void loadNotifications();
    }, 0);

    if (document.visibilityState === "visible") {
      startPolling();
    }

    document.addEventListener(
      "visibilitychange",
      onVisibilityChange
    );

    return () => {
      stopInitialLoadTimer();
      stopPolling();

      document.removeEventListener(
        "visibilitychange",
        onVisibilityChange
      );
    };
  }, [
    authLoading,
    canReceiveNotifications,
    userId,
    loadNotifications,
  ]);

  const markAsRead = useCallback(async (noticeId) => {
    try {
      const res = await fetch(
        "/api/orders/notifications",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            orderId: noticeId,
          }),
        }
      );

      if (!res.ok) {
        throw new Error(
          `Failed to mark notification as read: ${res.status}`
        );
      }

      const data = await res.json();

      if (!data.success) {
        return false;
      }

      setNotifications((previousNotifications) =>
        previousNotifications.filter(
          (notice) => notice._id !== noticeId
        )
      );

      return true;
    } catch (error) {
      console.error(
        "Failed to mark notification as read:",
        error
      );

      return false;
    }
  }, []);

  const visibleNotifications = useMemo(() => {
    if (!canReceiveNotifications) {
      return [];
    }

    return notifications;
  }, [canReceiveNotifications, notifications]);

  const visibleVendorRequestsCount = useMemo(() => {
    if (
      !canReceiveNotifications ||
      userRole !== "admin"
    ) {
      return 0;
    }

    return vendorRequestsCount;
  }, [
    canReceiveNotifications,
    userRole,
    vendorRequestsCount,
  ]);

  const totalCount = useMemo(() => {
    return visibleNotifications.reduce(
      (total, notice) =>
        total + (notice.count || 1),
      0
    );
  }, [visibleNotifications]);

  const value = useMemo(
    () => ({
      notifications: visibleNotifications,
      vendorRequestsCount:
        visibleVendorRequestsCount,
      totalCount,
      markAsRead,
      refresh: loadNotifications,
    }),
    [
      visibleNotifications,
      visibleVendorRequestsCount,
      totalCount,
      markAsRead,
      loadNotifications,
    ]
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(
    NotificationsContext
  );

  if (!context) {
    throw new Error(
      "useNotifications must be used inside NotificationsProvider"
    );
  }

  return context;
}