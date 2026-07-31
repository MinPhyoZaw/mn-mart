"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);

let inflightRequest = null;

async function fetchCurrentUser() {
  if (inflightRequest) return inflightRequest;

  inflightRequest = fetch("/api/auth/me", { cache: "no-store" })
    .then((res) => res.json())
    .then((data) => data?.user ?? null)
    .catch(() => null)
    .finally(() => {
      inflightRequest = null;
    });

  return inflightRequest;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const nextUser = await fetchCurrentUser();
    setUser((prev) => {
      const prevId = prev?._id ? String(prev._id) : null;
      const nextId = nextUser?._id ? String(nextUser._id) : null;

      if (
        prevId === nextId &&
        prev?.role === nextUser?.role &&
        prev?.name === nextUser?.name &&
        prev?.email === nextUser?.email
      ) {
        return prev;
      }

      return nextUser;
    });
    return nextUser;
  }, []);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const nextUser = await fetchCurrentUser();
      if (mounted) {
        setUser((prev) => {
          const prevId = prev?._id ? String(prev._id) : null;
          const nextId = nextUser?._id ? String(nextUser._id) : null;

          if (
            prevId === nextId &&
            prev?.role === nextUser?.role &&
            prev?.name === nextUser?.name &&
            prev?.email === nextUser?.email
          ) {
            return prev;
          }

          return nextUser;
        });
        setLoading(false);
      }
    };

    init();

    const onAuthChanged = () => {
      refresh();
    };

    window.addEventListener("auth-changed", onAuthChanged);
    return () => {
      mounted = false;
      window.removeEventListener("auth-changed", onAuthChanged);
    };
  }, [refresh]);

  const value = {
    user,
    loading,
    refresh,
    isAuthenticated: Boolean(user),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
