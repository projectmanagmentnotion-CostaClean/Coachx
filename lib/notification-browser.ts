"use client";

import {
  createDefaultNotificationRuntimeState,
  deriveNotificationCapabilityState,
  isNotificationInstalled,
  normalizeBrowserPermissionState,
  type NotificationPermissionState,
  type NotificationRuntimeState
} from "@/lib/notification-system";

export interface NotificationBrowserCapabilities extends NotificationRuntimeState {}

export function readNotificationBrowserCapabilities(): NotificationBrowserCapabilities {
  const supportsNotifications = typeof window !== "undefined" && "Notification" in window;
  const supportsServiceWorker = typeof navigator !== "undefined" && "serviceWorker" in navigator;
  const supportsPush = typeof window !== "undefined" && "PushManager" in window;
  const installed = isNotificationInstalled();
  const canInstall = typeof window !== "undefined" && "onbeforeinstallprompt" in window;

  return {
    ...createDefaultNotificationRuntimeState(),
    capability: deriveNotificationCapabilityState(supportsPush, supportsNotifications, supportsServiceWorker, installed, canInstall),
    permission: supportsNotifications ? normalizeBrowserPermissionState(window.Notification?.permission as NotificationPermissionState | undefined) : "PERMISSION_DEFAULT",
    subscription: "NOT_SUBSCRIBED",
    delivery: "IN_APP_ONLY",
    installed,
    canInstall,
    supportsPush,
    supportsNotifications,
    supportsServiceWorker,
    online: typeof navigator === "undefined" ? true : navigator.onLine
  };
}

export async function registerNotificationServiceWorker() {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }

  try {
    return await navigator.serviceWorker.register("/notification-sw.js", { scope: "/" });
  } catch {
    return null;
  }
}

export async function getNotificationServiceWorkerRegistration() {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }

  try {
    return (await navigator.serviceWorker.ready) ?? null;
  } catch {
    return null;
  }
}

export function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = typeof window !== "undefined" ? window.atob(base64) : Buffer.from(base64, "base64").toString("binary");
  const outputArray = new Uint8Array(rawData.length);

  for (let index = 0; index < rawData.length; index += 1) {
    outputArray[index] = rawData.charCodeAt(index);
  }

  return outputArray;
}

export async function requestBrowserNotificationPermission() {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "PERMISSION_DENIED" as const;
  }

  try {
    const permission = await window.Notification.requestPermission();
    return normalizeBrowserPermissionState(permission);
  } catch {
    return "PERMISSION_DENIED" as const;
  }
}

export function buildPushSubscriptionPayload(subscription: PushSubscription) {
  const json = subscription.toJSON();
  const p256dh = json.keys?.p256dh ?? "";
  const auth = json.keys?.auth ?? "";

  return {
    endpoint: subscription.endpoint,
    p256dh,
    auth,
    expiration_time: json.expirationTime ? new Date(json.expirationTime).toISOString() : null
  };
}

export async function subscribeToPush(registration: ServiceWorkerRegistration, publicKey: string) {
  if (!publicKey) {
    throw new Error("Missing VAPID public key.");
  }

  const existing = await registration.pushManager.getSubscription();
  if (existing) {
    return existing;
  }

  return registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey)
  });
}

export async function unsubscribePush(registration: ServiceWorkerRegistration) {
  const existing = await registration.pushManager.getSubscription();
  if (!existing) {
    return false;
  }

  return existing.unsubscribe();
}

