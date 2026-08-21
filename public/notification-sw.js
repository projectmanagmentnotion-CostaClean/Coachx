const ALLOWED_PREFIXES = ["/", "/calendar", "/day", "/nutrition", "/progress", "/profile", "/workout"];

function sanitizePath(pathname) {
  if (typeof pathname !== "string" || !pathname.startsWith("/")) {
    return "/";
  }

  if (pathname.startsWith("//") || pathname.includes("://")) {
    return "/";
  }

  return ALLOWED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)) ? pathname : "/";
}

function defaultPayload() {
  return {
    title: "AthlexForce",
    body: "Reminder ready.",
    destinationPath: "/",
    tag: "athlexforce-reminder",
    category: "general"
  };
}

self.addEventListener("push", (event) => {
  let payload = defaultPayload();

  try {
    const text = event.data ? event.data.text() : "";
    const parsed = text ? JSON.parse(text) : {};
    payload = {
      title: typeof parsed.title === "string" && parsed.title.trim() ? parsed.title.trim() : payload.title,
      body: typeof parsed.body === "string" && parsed.body.trim() ? parsed.body.trim() : payload.body,
      destinationPath: sanitizePath(typeof parsed.destinationPath === "string" ? parsed.destinationPath : typeof parsed.destination_path === "string" ? parsed.destination_path : "/"),
      tag: typeof parsed.tag === "string" && parsed.tag.trim() ? parsed.tag.trim() : payload.tag,
      category: typeof parsed.category === "string" && parsed.category.trim() ? parsed.category.trim() : payload.category,
      reminderId: typeof parsed.reminderId === "string" ? parsed.reminderId : null
    };
  } catch {
    payload = defaultPayload();
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      tag: payload.tag,
      renotify: false,
      silent: false,
      icon: "/brand/athlexforce-icon-192.png",
      badge: "/brand/athlexforce-icon-192.png",
      data: {
        destinationPath: payload.destinationPath,
        category: payload.category,
        reminderId: payload.reminderId ?? null
      }
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  const notification = event.notification;
  const destinationPath = sanitizePath(notification?.data?.destinationPath ?? "/");

  event.notification.close();

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });

      for (const client of allClients) {
        try {
          if ("focus" in client) {
            await client.focus();
          }
          if ("navigate" in client && destinationPath) {
            await client.navigate(destinationPath);
          }
          return;
        } catch {
          // Continue to open a new window fallback below.
        }
      }

      if (self.clients.openWindow) {
        await self.clients.openWindow(destinationPath);
      }
    })()
  );
});

self.addEventListener("pushsubscriptionchange", (event) => {
  event.waitUntil(Promise.resolve());
});
