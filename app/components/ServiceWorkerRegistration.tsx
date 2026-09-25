"use client";

import { useEffect } from "react";

let registrationPromise: Promise<ServiceWorkerRegistration | null> | undefined;

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;

  registrationPromise ??= navigator.serviceWorker
    .register("/sw.js", { scope: "/" })
    .catch((error) => {
      console.error("Service worker registration failed:", error);
      return null;
    });
}

export default function ServiceWorkerRegistration() {
  useEffect(registerServiceWorker, []);

  return null;
}
