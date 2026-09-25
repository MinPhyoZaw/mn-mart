"use client";

import { getFirebaseClientApp, getFirebaseVapidKey } from "./firebaseClient";

export async function getPushSupportStatus() {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return { supported: false, status: "not-browser" };
  }
  if (!("Notification" in window)) {
    return { supported: false, status: "notification-api-unavailable" };
  }
  if (!("serviceWorker" in navigator)) {
    return { supported: false, status: "service-worker-unavailable" };
  }

  try {
    const { isSupported } = await import("firebase/messaging");
    if (!(await isSupported())) {
      return { supported: false, status: "firebase-messaging-unsupported" };
    }
    return { supported: true, status: "supported" };
  } catch {
    return { supported: false, status: "support-check-failed" };
  }
}

function getPlatform() {
  return window.matchMedia?.("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
    ? "pwa"
    : "web";
}

async function readResponse(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

// Call only from an explicit user gesture, such as an "Enable notifications" button.
export async function enablePushNotifications() {
  const support = await getPushSupportStatus();
  if (!support.supported) return support;

  let permission = Notification.permission;
  if (permission === "default") {
    permission = await Notification.requestPermission();
  }
  if (permission !== "granted") {
    return { supported: true, status: permission === "denied" ? "permission-denied" : "permission-not-granted" };
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const { getMessaging, getToken } = await import("firebase/messaging");
    const messaging = getMessaging(getFirebaseClientApp());
    const token = await getToken(messaging, {
      vapidKey: getFirebaseVapidKey(),
      serviceWorkerRegistration: registration,
    });

    if (!token) {
      return { supported: true, status: "token-unavailable" };
    }

    const response = await fetch("/api/push/devices", {
      method: "POST",
      credentials: "include",
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, platform: getPlatform() }),
    });
    const result = await readResponse(response);
    if (!response.ok || !result?.success) {
      return {
        supported: true,
        status: response.status === 401 ? "authentication-required" : "registration-failed",
      };
    }

    return { supported: true, status: "registered" };
  } catch {
    return { supported: true, status: "token-acquisition-failed" };
  }
}

// Foreground delivery is left to the caller; this helper never creates a system notification.
export async function subscribeToForegroundPush(onMessageReceived) {
  const support = await getPushSupportStatus();
  if (!support.supported) return support;
  if (typeof onMessageReceived !== "function") {
    return { supported: true, status: "invalid-listener" };
  }

  try {
    const { getMessaging, onMessage } = await import("firebase/messaging");
    const unsubscribe = onMessage(
      getMessaging(getFirebaseClientApp()),
      onMessageReceived
    );
    return { supported: true, status: "subscribed", unsubscribe };
  } catch {
    return { supported: true, status: "subscription-failed" };
  }
}
