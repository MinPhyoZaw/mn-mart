"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const AuthContext = createContext(null);

let inflightRequest = null;

/*
 * --------------------------------------------------
 * Fetch current authenticated user
 * --------------------------------------------------
 *
 * Returns:
 *
 * {
 *   ok: true,
 *   user: {...} | null
 * }
 *
 * OR
 *
 * {
 *   ok: false,
 *   error: ...
 * }
 *
 * A temporary network/server error is NOT treated
 * as a logout.
 */
async function fetchCurrentUser() {
  if (inflightRequest) {
    return inflightRequest;
  }

  inflightRequest = fetch("/api/auth/me", {
    cache: "no-store",
    credentials: "include",
  })
    .then(async (res) => {
      let data = null;

      try {
        data = await res.json();
      } catch {
        data = null;
      }

      /*
       * 401 means the session really is invalid.
       */
      if (res.status === 401) {
        return {
          ok: true,
          user: null,
        };
      }

      /*
       * Any 5xx/server error should NOT
       * automatically log the user out.
       */
      if (!res.ok) {
        throw new Error(
          data?.message ||
            `Failed to load session: ${res.status}`
        );
      }

      return {
        ok: true,
        user: data?.user ?? null,
      };
    })
    .catch((error) => {
      console.error(
        "Failed to refresh authentication:",
        error
      );

      return {
        ok: false,
        error,
      };
    })
    .finally(() => {
      inflightRequest = null;
    });

  return inflightRequest;
}

/*
 * Avoid unnecessary React state updates when the
 * important user information has not changed.
 */
function isSameUser(previousUser, nextUser) {
  const previousId = previousUser?._id
    ? String(previousUser._id)
    : null;

  const nextId = nextUser?._id
    ? String(nextUser._id)
    : null;

  return (
    previousId === nextId &&
    previousUser?.role === nextUser?.role &&
    previousUser?.name === nextUser?.name &&
    previousUser?.email === nextUser?.email
  );
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  /*
   * --------------------------------------------------
   * Refresh authentication
   * --------------------------------------------------
   */
  const refresh = useCallback(async () => {
    const result = await fetchCurrentUser();

    /*
     * Temporary network/server problem:
     * keep the current user.
     */
    if (!result.ok) {
      setAuthError(
        result.error ||
          new Error(
            "Unable to refresh authentication."
          )
      );

      return null;
    }

    setAuthError(null);

    setUser((previousUser) => {
      if (
        isSameUser(
          previousUser,
          result.user
        )
      ) {
        return previousUser;
      }

      return result.user;
    });

    return result.user;
  }, []);

  /*
   * --------------------------------------------------
   * Logout
   * --------------------------------------------------
   *
   * Server cookie deletion must succeed first.
   * Only then do we clear local auth state.
   */
  const logout = useCallback(async () => {
    try {
      const res = await fetch(
        "/api/auth/logout",
        {
          method: "POST",
          credentials: "include",
          cache: "no-store",
        }
      );

      let data = null;

      try {
        data = await res.json();
      } catch {
        data = null;
      }

      if (!res.ok || !data?.success) {
        throw new Error(
          data?.message ||
            "Logout failed."
        );
      }

      /*
       * Cookie was successfully removed.
       *
       * Clear the UI immediately instead of
       * waiting for another /api/auth/me request.
       */
      setUser(null);
      setAuthError(null);
      setLoading(false);

      /*
       * Other providers such as NotificationsContext
       * can react to this event if necessary.
       */
      window.dispatchEvent(
        new Event("auth-changed")
      );

      return {
        success: true,
      };
    } catch (error) {
      console.error(
        "Logout failed:",
        error
      );

      setAuthError(error);

      /*
       * IMPORTANT:
       * Do NOT set user to null here.
       *
       * If the logout request failed, the server
       * cookie may still exist.
       */
      return {
        success: false,
        error,
      };
    }
  }, []);

  /*
   * --------------------------------------------------
   * Initial authentication load
   * --------------------------------------------------
   */
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const result =
        await fetchCurrentUser();

      if (!mounted) {
        return;
      }

      if (result.ok) {
        setUser((previousUser) => {
          if (
            isSameUser(
              previousUser,
              result.user
            )
          ) {
            return previousUser;
          }

          return result.user;
        });

        setAuthError(null);
      } else {
        /*
         * Initial session lookup failed.
         *
         * We cannot invent a user, but we also
         * record that this was a server/network
         * problem rather than a confirmed logout.
         */
        setAuthError(
          result.error ||
            new Error(
              "Unable to check authentication."
            )
        );
      }

      setLoading(false);
    };

    void init();

    /*
     * Other parts of the app can request
     * an authentication refresh.
     */
    const onAuthChanged = () => {
      void refresh();
    };

    window.addEventListener(
      "auth-changed",
      onAuthChanged
    );

    return () => {
      mounted = false;

      window.removeEventListener(
        "auth-changed",
        onAuthChanged
      );
    };
  }, [refresh]);

  const value = useMemo(
    () => ({
      user,
      loading,
      authError,

      refresh,
      logout,

      /*
       * Allows login code to immediately update
       * state if necessary without another request.
       */
      setUser,

      isAuthenticated:
        Boolean(user),
    }),
    [
      user,
      loading,
      authError,
      refresh,
      logout,
    ]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}