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

const POLL_INTERVAL_MS = 5 * 60_000;
const MIN_FETCH_GAP_MS = 5_000;

let inflightOrderRequest = null;
let inflightVendorRequest = null;

let lastOrderFetchAt = 0;
let lastVendorFetchAt = 0;

async function fetchOrderNotifications() {
  const now = Date.now();

  if (inflightOrderRequest) {
    return inflightOrderRequest;
  }

  if (now - lastOrderFetchAt < MIN_FETCH_GAP_MS) {
    return {
      success: false,
      skipped: true,
      data: null,
    };
  }

  inflightOrderRequest = fetch("/api/orders/notifications", {
    cache: "no-store",
    credentials: "include",
  })
    .then(async (res) => {
      if (res.status === 401) {
        return {
          success: true,
          data: [],
        };
      }

      if (!res.ok) {
        throw new Error(
          `Failed to fetch notifications: ${res.status}`
        );
      }

      const data = await res.json();

      return {
        success: true,
        data: data?.success ? data.data || [] : [],
      };
    })
    .catch((error) => {
      console.error(
        "Failed to fetch order notifications:",
        error
      );

      return {
        success: false,
        data: null,
      };
    })
    .finally(() => {
      inflightOrderRequest = null;
      lastOrderFetchAt = Date.now();
    });

  return inflightOrderRequest;
}

async function fetchPendingVendorRequestsCount() {
  const now = Date.now();

  if (inflightVendorRequest) {
    return inflightVendorRequest;
  }

  if (now - lastVendorFetchAt < MIN_FETCH_GAP_MS) {
    return {
      success: false,
      skipped: true,
      count: null,
    };
  }

  inflightVendorRequest = fetch(
    "/api/vendor-requests?status=pending&limit=1",
    {
      cache: "no-store",
      credentials: "include",
    }
  )
    .then(async (res) => {
      if (res.status === 401 || res.status === 403) {
        return {
          success: true,
          count: 0,
        };
      }

      if (!res.ok) {
        throw new Error(
          `Failed to fetch vendor requests: ${res.status}`
        );
      }

      const data = await res.json();

      return {
        success: true,
        count: Number(data?.pagination?.total || 0),
      };
    })
    .catch((error) => {
      console.error(
        "Failed to fetch pending vendor requests:",
        error
      );

      return {
        success: false,
        count: null,
      };
    })
    .finally(() => {
      inflightVendorRequest = null;
      lastVendorFetchAt = Date.now();
    });

  return inflightVendorRequest;
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
  const {
    user,
    loading: authLoading,
  } = useAuth();

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

  const orderResult =
    await fetchOrderNotifications();

  if (
    !orderResult.success &&
    !orderResult.skipped
  ) {
    return;
  }

  const nextNotifications =
    orderResult.data ?? null;

  let nextVendorCount = null;

  if (userRole === "admin") {
    const vendorResult =
      await fetchPendingVendorRequestsCount();

    if (vendorResult.success) {
      nextVendorCount =
        vendorResult.count;
    }
  }

  /*
   * Admin
   */
  if (userRole === "admin") {
    /*
     * If we successfully received a new vendor
     * request count, update both states using
     * that same count.
     */
    if (nextVendorCount !== null) {
      setVendorRequestsCount(
        nextVendorCount
      );

      if (nextNotifications !== null) {
        setNotifications(
          mergeAdminVendorRequests(
            nextNotifications,
            nextVendorCount
          )
        );
      }

      return;
    }

    /*
     * Vendor-request fetch was skipped/failed.
     *
     * Use the current count through a functional
     * state update instead of depending on
     * vendorRequestsCount in useCallback.
     */
    if (nextNotifications !== null) {
      setVendorRequestsCount(
        (currentVendorCount) => {
          setNotifications(
            mergeAdminVendorRequests(
              nextNotifications,
              currentVendorCount
            )
          );

          return currentVendorCount;
        }
      );
    }

    return;
  }

  /*
   * Customer / Vendor
   */
  if (nextNotifications !== null) {
    setNotifications(
      nextNotifications
    );
  }
}, [
  canReceiveNotifications,
  userRole,
]);

  useEffect(() => {
    if (
      authLoading ||
      !canReceiveNotifications
    ) {
      return;
    }

    const stopInitialLoadTimer = () => {
      if (initialLoadTimerRef.current) {
        clearTimeout(
          initialLoadTimerRef.current
        );

        initialLoadTimerRef.current = null;
      }
    };

    const stopPolling = () => {
      if (pollTimerRef.current) {
        clearInterval(
          pollTimerRef.current
        );

        pollTimerRef.current = null;
      }
    };

    const startPolling = () => {
      stopPolling();

      pollTimerRef.current = setInterval(
        () => {
          if (
            document.visibilityState ===
            "visible"
          ) {
            void loadNotifications();
          }
        },
        POLL_INTERVAL_MS
      );
    };

    const onVisibilityChange = () => {
      if (
        document.visibilityState ===
        "visible"
      ) {
        void loadNotifications();
        startPolling();
      } else {
        stopPolling();
      }
    };

    initialLoadTimerRef.current =
      setTimeout(() => {
        void loadNotifications();
      }, 500);

    if (
      document.visibilityState ===
      "visible"
    ) {
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

  useEffect(() => {
    if (!canReceiveNotifications) {
      setNotifications([]);
      setVendorRequestsCount(0);
    }
  }, [canReceiveNotifications]);

  const markAsRead = useCallback(
    async (noticeId) => {
      try {
        if (noticeId === "vendor-requests") {
          return true;
        }

        const res = await fetch(
          "/api/orders/notifications",
          {
            method: "PATCH",
            credentials: "include",
            headers: {
              "Content-Type":
                "application/json",
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

        if (!data?.success) {
          return false;
        }

        setNotifications(
          (previousNotifications) =>
            previousNotifications.filter(
              (notice) =>
                notice._id !== noticeId
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
    },
    []
  );

  const visibleNotifications = useMemo(() => {
    if (!canReceiveNotifications) {
      return [];
    }

    return notifications;
  }, [
    canReceiveNotifications,
    notifications,
  ]);

  const visibleVendorRequestsCount =
    useMemo(() => {
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
      notifications:
        visibleNotifications,

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
    <NotificationsContext.Provider
      value={value}
    >
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