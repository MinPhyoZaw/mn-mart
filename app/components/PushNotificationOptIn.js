"use client";

import { useEffect, useState } from "react";

import {
  disablePushNotifications,
  enablePushNotifications,
  getPushRegistrationStatus,
} from "../lib/pushRegistration";

const COPY = {
  denied: "Notifications are blocked in browser settings.",
  error: "Notification settings could not be updated. Please try again.",
  unsupported: "Notifications are not supported in this browser.",
};

export default function PushNotificationOptIn() {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [available, setAvailable] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadRegistrationStatus() {
      const result = await getPushRegistrationStatus();
      if (!active) return;

      setEnabled(result.registered === true);
      if (!result.supported) {
        setAvailable(false);
        setMessage(COPY.unsupported);
      } else if (result.status === "permission-denied") {
        setAvailable(false);
        setMessage(COPY.denied);
      } else if (!["registered", "not-registered"].includes(result.status)) {
        setMessage(COPY.error);
      }
      setLoading(false);
    }

    loadRegistrationStatus();
    return () => {
      active = false;
    };
  }, []);

  const toggleNotifications = async () => {
    if (loading || !available) return;

    const previousValue = enabled;
    setLoading(true);
    setMessage("");

    const result = previousValue
      ? await disablePushNotifications()
      : await enablePushNotifications();

    if (result.status === "registered") {
      setEnabled(true);
    } else if (["unregistered", "not-registered"].includes(result.status)) {
      setEnabled(false);
    } else {
      setEnabled(previousValue);
      if (result.status === "permission-denied") {
        setAvailable(false);
        setMessage(COPY.denied);
      } else if (!result.supported) {
        setAvailable(false);
        setMessage(COPY.unsupported);
      } else {
        setMessage(COPY.error);
      }
    }

    setLoading(false);
  };

  return (
    <section className="rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
          <p className="mt-0.5 text-xs text-gray-500">
            Receive order and account updates
          </p>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label="Notifications"
          onClick={toggleNotifications}
          disabled={loading || !available}
          className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${
            enabled ? "bg-emerald-600" : "bg-gray-300"
          }`}
        >
          <span className="sr-only">{enabled ? "Turn notifications off" : "Turn notifications on"}</span>
          <span
            aria-hidden="true"
            className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
              enabled ? "translate-x-6" : "translate-x-1"
            } ${loading ? "animate-pulse" : ""}`}
          />
        </button>
      </div>

      {message && (
        <p className="mt-2 text-xs text-gray-500" aria-live="polite">
          {message}
        </p>
      )}
    </section>
  );
}
