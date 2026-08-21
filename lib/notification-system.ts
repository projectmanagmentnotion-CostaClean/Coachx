import { getCurrentLocale, type Locale } from "@/lib/i18n";
import { resolveSafeInternalPath } from "@/lib/auth/session-policy";

export type NotificationCategoryId = "workout" | "meals" | "hydration" | "supplements" | "check-in" | "sleep";
export type NotificationCapabilityState = "SUPPORTED" | "INSTALL_REQUIRED" | "UNSUPPORTED";
export type NotificationPermissionState = "PERMISSION_DEFAULT" | "PERMISSION_REQUESTING" | "PERMISSION_GRANTED" | "PERMISSION_DENIED";
export type NotificationSubscriptionState = "NOT_SUBSCRIBED" | "SUBSCRIBING" | "SUBSCRIBED" | "SUBSCRIPTION_ERROR";
export type NotificationDeliveryState = "IN_APP_ONLY" | "DISABLED_BY_USER" | "OFFLINE_SYNC" | "READY";
export type NotificationIntensity = "minimal" | "recommended" | "more-support";
export type HydrationIntervalMinutes = 0 | 120 | 180;
export type WorkoutLeadMinutes = 15 | 30 | 60;

export interface NotificationCategoryCopy {
  id: NotificationCategoryId;
  label: string;
  description: string;
  enabled: boolean;
}

export interface QuietHoursState {
  enabled: boolean;
  start: string;
  end: string;
  timezone: string;
}

export interface NotificationPreferencesState {
  masterEnabled: boolean;
  workoutEnabled: boolean;
  mealsEnabled: boolean;
  hydrationEnabled: boolean;
  supplementsEnabled: boolean;
  checkinEnabled: boolean;
  sleepEnabled: boolean;
  workoutLeadMinutes: WorkoutLeadMinutes;
  hydrationIntervalMinutes: HydrationIntervalMinutes;
  quietHours: QuietHoursState;
  inAppEnabled: boolean;
  intensity: NotificationIntensity;
  categories: NotificationCategoryCopy[];
}

export interface NotificationRuntimeState {
  capability: NotificationCapabilityState;
  permission: NotificationPermissionState;
  subscription: NotificationSubscriptionState;
  delivery: NotificationDeliveryState;
  installed: boolean;
  canInstall: boolean;
  supportsPush: boolean;
  supportsNotifications: boolean;
  supportsServiceWorker: boolean;
  online: boolean;
}

export type NotificationDestinationCategory = NotificationCategoryId;

const categoryCopy: Record<Locale, NotificationCategoryCopy[]> = {
  en: [
    { id: "workout", label: "Workout", description: "Remind me before today’s planned session.", enabled: true },
    { id: "meals", label: "Meals", description: "Use meal-slot timing from the nutrition plan.", enabled: true },
    { id: "hydration", label: "Hydration", description: "Light timing-based water reminders.", enabled: true },
    { id: "supplements", label: "Supplements", description: "Timing reminders for supplements or habits.", enabled: false },
    { id: "check-in", label: "Check-in", description: "Prompt me when the weekly check-in is due.", enabled: true },
    { id: "sleep", label: "Sleep / wind down", description: "Quiet wind-down reminders before bed.", enabled: false }
  ],
  es: [
    { id: "workout", label: "Entrenamiento", description: "Avisos antes de la sesión programada de hoy.", enabled: true },
    { id: "meals", label: "Comidas", description: "Usa la hora de cada comida del plan nutricional.", enabled: true },
    { id: "hydration", label: "Hidratación", description: "Recordatorios suaves de agua por intervalo.", enabled: true },
    { id: "supplements", label: "Suplementos", description: "Recordatorios de horario para suplementos o hábitos.", enabled: false },
    { id: "check-in", label: "Check-in", description: "Aviso cuando toca la revisión semanal.", enabled: true },
    { id: "sleep", label: "Sueño / desconexión", description: "Recordatorios suaves antes de dormir.", enabled: false }
  ],
  ca: [
    { id: "workout", label: "Entrenament", description: "Avisos abans de la sessió programada d’avui.", enabled: true },
    { id: "meals", label: "Àpats", description: "Fa servir l’horari de cada àpat del pla nutricional.", enabled: true },
    { id: "hydration", label: "Hidratació", description: "Recordatoris suaus d’aigua per interval.", enabled: true },
    { id: "supplements", label: "Suplements", description: "Recordatoris d’horari per suplements o hàbits.", enabled: false },
    { id: "check-in", label: "Check-in", description: "Avís quan toca la revisió setmanal.", enabled: true },
    { id: "sleep", label: "Son / desconnexió", description: "Recordatoris suaus abans d’anar a dormir.", enabled: false }
  ],
  de: [
    { id: "workout", label: "Workout", description: "Erinnert vor der heutigen geplanten Einheit.", enabled: true },
    { id: "meals", label: "Mahlzeiten", description: "Verwendet die Zeiten aus dem Ernährungsplan.", enabled: true },
    { id: "hydration", label: "Hydration", description: "Sanfte Wassererinnerungen im Zeitintervall.", enabled: true },
    { id: "supplements", label: "Supplements", description: "Zeitbasierte Erinnerungen für Supplements oder Habits.", enabled: false },
    { id: "check-in", label: "Check-in", description: "Hinweis, wenn der wöchentliche Check-in fällig ist.", enabled: true },
    { id: "sleep", label: "Schlaf / Wind-down", description: "Sanfte Erinnerungen vor dem Schlafen.", enabled: false }
  ]
};

const routeMap: Record<NotificationCategoryId, string> = {
  workout: "/",
  meals: "/nutrition",
  hydration: "/",
  supplements: "/nutrition",
  "check-in": "/progress/check-in",
  sleep: "/"
};

const allowlistedPathPrefixes = ["/", "/calendar", "/day", "/nutrition", "/progress", "/profile", "/workout"];

export function createNotificationCategories(locale: Locale = getCurrentLocale()) {
  return categoryCopy[locale] ?? categoryCopy.en;
}

export function createNotificationPreferences(locale: Locale = getCurrentLocale()): NotificationPreferencesState {
  return {
    masterEnabled: true,
    workoutEnabled: true,
    mealsEnabled: true,
    hydrationEnabled: true,
    supplementsEnabled: false,
    checkinEnabled: true,
    sleepEnabled: false,
    workoutLeadMinutes: 30,
    hydrationIntervalMinutes: 120,
    quietHours: {
      enabled: true,
      start: "22:00",
      end: "07:00",
      timezone: "Device local"
    },
    inAppEnabled: true,
    intensity: "recommended",
    categories: createNotificationCategories(locale)
  };
}

export function cloneNotificationPreferences(settings: NotificationPreferencesState): NotificationPreferencesState {
  return {
    ...settings,
    quietHours: { ...settings.quietHours },
    categories: settings.categories.map((category) => ({ ...category }))
  };
}

export function reviveNotificationPreferences(settings: Partial<NotificationPreferencesState> | null | undefined, locale: Locale = getCurrentLocale()) {
  const defaults = createNotificationPreferences(locale);

  if (!settings) {
    return cloneNotificationPreferences(defaults);
  }

  const nextCategories = defaults.categories.map((category) => ({
    ...category,
    enabled: settings.categories?.find((item) => item.id === category.id)?.enabled ?? category.enabled
  }));

  return {
    ...defaults,
    ...settings,
    quietHours: {
      ...defaults.quietHours,
      ...(settings.quietHours ?? {})
    },
    categories: nextCategories
  };
}

export function createDefaultNotificationRuntimeState(): NotificationRuntimeState {
  return {
    capability: "UNSUPPORTED",
    permission: "PERMISSION_DEFAULT",
    subscription: "NOT_SUBSCRIBED",
    delivery: "IN_APP_ONLY",
    installed: false,
    canInstall: false,
    supportsPush: false,
    supportsNotifications: false,
    supportsServiceWorker: false,
    online: true
  };
}

export function normalizeBrowserPermissionState(permission: NotificationPermissionState | NotificationPermission | null | undefined): NotificationPermissionState {
  switch (permission) {
    case "granted":
    case "PERMISSION_GRANTED":
      return "PERMISSION_GRANTED";
    case "denied":
    case "PERMISSION_DENIED":
      return "PERMISSION_DENIED";
    case "default":
    case "PERMISSION_DEFAULT":
    case null:
    case undefined:
      return "PERMISSION_DEFAULT";
    case "PERMISSION_REQUESTING":
      return "PERMISSION_REQUESTING";
    default:
      return "PERMISSION_DEFAULT";
  }
}

export function isNotificationInstalled() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.matchMedia?.("(display-mode: standalone)")?.matches ?? (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
}

export function deriveNotificationCapabilityState(
  supportsPush: boolean,
  supportsNotifications: boolean,
  supportsServiceWorker: boolean,
  installed: boolean,
  canInstall: boolean
): NotificationCapabilityState {
  if (!supportsNotifications || !supportsServiceWorker) {
    return "UNSUPPORTED";
  }

  if (supportsPush) {
    return "SUPPORTED";
  }

  if (!installed && canInstall) {
    return "INSTALL_REQUIRED";
  }

  return "UNSUPPORTED";
}

export function createNotificationRuntimeState(partial: Partial<NotificationRuntimeState> = {}): NotificationRuntimeState {
  return {
    ...createDefaultNotificationRuntimeState(),
    ...partial
  };
}

export function isAllowedNotificationPath(pathname: string) {
  return allowlistedPathPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function resolveNotificationDestination(category: NotificationCategoryId, fallback = "/") {
  return resolveSafeInternalPath(routeMap[category] ?? fallback, fallback);
}

export function resolveQuietHoursActive(now: Date, quietHours: QuietHoursState) {
  if (!quietHours.enabled) {
    return false;
  }

  const [startHour, startMinute] = quietHours.start.split(":").map((part) => Number(part));
  const [endHour, endMinute] = quietHours.end.split(":").map((part) => Number(part));

  const current = now.getHours() * 60 + now.getMinutes();
  const start = startHour * 60 + startMinute;
  const end = endHour * 60 + endMinute;

  if (Number.isNaN(start) || Number.isNaN(end)) {
    return false;
  }

  if (start === end) {
    return true;
  }

  if (start < end) {
    return current >= start && current < end;
  }

  return current >= start || current < end;
}

export function coerceQuietHours(
  settings: Partial<QuietHoursState> | null | undefined,
  fallback: QuietHoursState
): QuietHoursState {
  return {
    enabled: settings?.enabled ?? fallback.enabled,
    start: settings?.start && /^\d{2}:\d{2}$/.test(settings.start) ? settings.start : fallback.start,
    end: settings?.end && /^\d{2}:\d{2}$/.test(settings.end) ? settings.end : fallback.end,
    timezone: settings?.timezone?.trim() ? settings.timezone : fallback.timezone
  };
}

export function getNotificationCategoryLabels(locale: Locale = getCurrentLocale()) {
  return createNotificationPreferences(locale).categories.reduce<Record<NotificationCategoryId, NotificationCategoryCopy>>((accumulator, category) => {
    accumulator[category.id] = category;
    return accumulator;
  }, {} as Record<NotificationCategoryId, NotificationCategoryCopy>);
}
