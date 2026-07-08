// Service worker Web Push per il pannello Gestione dei tenant
// (gestione.menuary.it/[slug], gestione.bizery.it, domini custom tenant).
// Generico e riusabile per qualsiasi notifica del pannello Gestione (oggi:
// nuova mail nel modulo mail; in futuro altri moduli potranno riusarlo senza
// bisogno di un nuovo service worker). Riceve il payload inviato da
// src/lib/push/send.ts e mostra la notifica; al click apre/riusa la tab
// sull'URL indicato nel payload (o sulla pagina da cui ci si è iscritti).

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (_e) {
    data = {};
  }

  const title = data.title || "Menuary Gestione";
  const options = {
    body: data.body || "",
    icon: data.icon || "/logo.png",
    badge: data.badge || "/logo.png",
    tag: data.tag || undefined,
    data: { url: data.url || "/" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
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
