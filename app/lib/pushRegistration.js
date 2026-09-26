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

async function readResponse(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function getCurrentToken() {
  // next-pwa owns the app's root worker. Waiting for that registration and
  // passing it to getToken prevents Firebase from creating another worker.
  const registration = await navigator.serviceWorker.ready;
  const { getMessaging, getToken } = await import("firebase/messaging");
  const messaging = getMessaging(getFirebaseClientApp());
  const token = await getToken(messaging, {
    vapidKey: getFirebaseVapidKey(),
    serviceWorkerRegistration: registration,
  });

  return { messaging, token };
}

async function deviceRequest(method, token, body) {
  const response = await fetch("/api/push/devices", {
    method,
    credentials: "include",
    cache: "no-store",
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { "X-Push-Device-Token": token } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const result = await readResponse(response);

  if (!response.ok || !result?.success) {
    return {
      ok: false,
      status:
        response.status === 401
          ? "authentication-required"
          : "device-request-failed",
    };
  }

  return { ok: true, result };
}

// This check never requests browser permission or registers the token. It only
// compares this browser's current token with this user's saved devices.
export async function getPushRegistrationStatus() {
  const support = await getPushSupportStatus();
  if (!support.supported) return support;

  if (Notification.permission === "denied") {
    return { supported: true, status: "permission-denied", registered: false };
  }
  if (Notification.permission !== "granted") {
    return { supported: true, status: "not-registered", registered: false };
  }

  try {
    const { token } = await getCurrentToken();
    if (!token) {
      return { supported: true, status: "token-unavailable", registered: false };
    }

    const request = await deviceRequest("GET", token);
    if (!request.ok) return { supported: true, status: request.status };

    return {
      supported: true,
      status: request.result.registered ? "registered" : "not-registered",
      registered: request.result.registered === true,
    };
  } catch {
    return { supported: true, status: "status-check-failed" };
  }
}

// Call only from an explicit user gesture, such as the notifications switch.
export async function enablePushNotifications() {
  const support = await getPushSupportStatus();
  if (!support.supported) return support;

  try {
    let permission = Notification.permission;
    if (permission === "default") {
      permission = await Notification.requestPermission();
    }
    if (permission !== "granted") {
      return {
        supported: true,
        status:
          permission === "denied"
            ? "permission-denied"
            : "permission-not-granted",
      };
    }

    const { token } = await getCurrentToken();
    if (!token) {
      return { supported: true, status: "token-unavailable" };
    }

    const request = await deviceRequest("POST", null, {
      token,
      platform: "web",
    });
    if (!request.ok) {
      return { supported: true, status: request.status };
    }

    return { supported: true, status: "registered" };
  } catch {
    return { supported: true, status: "token-acquisition-failed" };
  }
}

export async function disablePushNotifications() {
  const support = await getPushSupportStatus();
  if (!support.supported) return support;

  try {
    if (Notification.permission !== "granted") {
      return { supported: true, status: "not-registered" };
    }

    const { messaging, token } = await getCurrentToken();
    if (!token) {
      return { supported: true, status: "token-unavailable" };
    }

    const request = await deviceRequest("DELETE", null, { token });
    if (!request.ok) {
      return { supported: true, status: request.status };
    }

    // The server is the source of truth for the switch. Token cleanup prevents
    // this browser from retaining an unused FCM token after unregistering.
    try {
      const { deleteToken } = await import("firebase/messaging");
      await deleteToken(messaging);
    } catch {
      // The authenticated, device-scoped server registration is already gone.
    }

    return { supported: true, status: "unregistered" };
  } catch {
    return { supported: true, status: "unregistration-failed" };
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
