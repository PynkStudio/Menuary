// Service worker Web Push per il pannello admin piattaforma (admin.menuary.it).
// Generico e riusabile per qualsiasi notifica admin (mail assegnate, ticket
// supporto, contratti, pagamenti, ecc.): riceve il payload inviato da
// src/lib/push/send.ts e mostra la notifica; al click apre/riusa la tab
// sull'URL indicato nel payload.

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (_e) {
    data = {};
  }

  const title = data.title || "Menuary Admin";
  const options = {
    body: data.body || "",
    icon: data.icon || "/logo.png",
    badge: data.badge || "/logo.png",
    tag: data.tag || undefined,
    data: { url: data.url || "/admin" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/admin";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    }),
  );
});
