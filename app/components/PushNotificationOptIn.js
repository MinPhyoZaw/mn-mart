"use client";

import { BellRing } from "lucide-react";
import { useEffect, useState } from "react";

import {
  enablePushNotifications,
  getPushSupportStatus,
} from "../lib/pushRegistration";

const COPY = {
  default: "Enable notifications to receive order updates.",
  denied:
    "Notifications are blocked. Allow them in your browser or app settings, then try again.",
  enabled: "Notifications are enabled on this device.",
  error: "Notifications could not be enabled. Please try again.",
  requesting: "Enabling notifications…",
  unsupported: "Notifications are not supported in this browser.",
};

export default function PushNotificationOptIn() {
  const [state, setState] = useState("default");

  useEffect(() => {
    let active = true;

    async function checkSupport() {
      const support = await getPushSupportStatus();
      if (!active) return;

      if (!support.supported) {
        setState("unsupported");
      } else if (Notification.permission === "denied") {
        setState("denied");
      }
    }

    checkSupport();
    return () => {
      active = false;
    };
  }, []);

  const enableNotifications = async () => {
    if (state === "requesting" || state === "denied" || state === "unsupported") {
      return;
    }

    setState("requesting");
    const result = await enablePushNotifications();

    if (result.status === "registered") {
      setState("enabled");
    } else if (result.status === "permission-denied") {
      setState("denied");
    } else if (!result.supported) {
      setState("unsupported");
    } else {
      setState("error");
    }
  };

  const disabled = ["requesting", "denied", "unsupported"].includes(state);
  const buttonLabel =
    state === "requesting"
      ? "Enabling…"
      : state === "enabled"
        ? "Refresh Notifications"
        : "Enable Notifications";

  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-50 text-green-700">
          <BellRing aria-hidden="true" size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-gray-900">Notifications</h3>
          <p className="mt-1 text-sm text-gray-600">Get order updates on your phone.</p>
          <p className="mt-2 text-xs text-gray-500" aria-live="polite">
            {COPY[state]}
          </p>
          <button
            type="button"
            onClick={enableNotifications}
            disabled={disabled}
            className="mt-4 w-full rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {buttonLabel}
          </button>
        </div>
      </div>
    </section>
  );
}
