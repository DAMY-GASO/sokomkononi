// ============================================================
// public/sw.js — Service Worker kwa push notifications
//
// Inashughulikia push events + notification clicks.
// ============================================================

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// ── Push notification received ──
self.addEventListener("push", (event) => {
  let data = { title: "SokoMkononi", body: "", url: "/", icon: "/logo.webp" };
  try {
    if (event.data) {
      const parsed = event.data.json();
      data = { ...data, ...parsed };
    }
  } catch {
    try {
      data.body = event.data.text();
    } catch {
      /* ignore */
    }
  }

  const options = {
    body: data.body || "",
    icon: data.icon || "/logo.webp",
    badge: "/logo.webp",
    data: { url: data.url || "/" },
    tag: data.tag || "sokomkononi-notification",
    renotify: true,
    vibrate: [120, 60, 120],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || "SokoMkononi", options)
  );
});

// ── Notification click ──
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(url) && "focus" in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    })
  );
});