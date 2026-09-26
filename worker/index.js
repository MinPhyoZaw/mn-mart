const DEFAULT_URL = "/";
const NOTIFICATION_ICON = "/icons/icon-192.png";

function internalUrl(value) {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) {
    return DEFAULT_URL;
  }

  try {
    const url = new URL(value, self.location.origin);
    return url.origin === self.location.origin
      ? `${url.pathname}${url.search}${url.hash}`
      : DEFAULT_URL;
  } catch {
    return DEFAULT_URL;
  }
}

self.addEventListener("push", (event) => {
  let payload;
  try {
    payload = event.data?.json();
  } catch {
    return;
  }

  const data = payload?.data;
  if (!data || typeof data.title !== "string" || typeof data.body !== "string") {
    return;
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: NOTIFICATION_ICON,
      data: { url: internalUrl(data.url) },
      tag: typeof data.eventId === "string" && data.eventId ? data.eventId : undefined,
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const path = internalUrl(event.notification.data?.url);
  const destination = new URL(path, self.location.origin).href;

  event.waitUntil(
    (async () => {
      const windowClients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      const existingClient = windowClients.find((client) => {
        try {
          return new URL(client.url).origin === self.location.origin;
        } catch {
          return false;
        }
      });

      if (existingClient) {
        try {
          await existingClient.focus();

          if (existingClient.url !== destination) {
            const navigatedClient = await existingClient.navigate(destination);
            await navigatedClient?.focus();
          }

          return;
        } catch {
          // Fall back to opening the target when a stale client cannot be used.
        }
      }

      await self.clients.openWindow(destination);
    })()
  );
});
