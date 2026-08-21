"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BrandLogo } from "@/components/brand-logo";
import { Screen } from "@/components/screen";
import { Card, IconButton, PrimaryButton, SecondaryButton, Section } from "@/components/ui";
import { useAuthStore } from "@/components/auth-provider";
import { useTranslator } from "@/components/locale-provider";
import { publishFeedbackError, publishFeedbackPending, publishFeedbackSuccess } from "@/components/feedback-provider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { resolveSafeInternalPath } from "@/lib/auth/session-policy";
import {
  buildNotificationDeliveryTruth,
  loadNotificationPreferences,
  loadNotificationReminders,
  loadPushSubscription,
  saveNotificationPreferences,
  saveNotificationReminder,
  savePushSubscription,
  type NotificationPreferencesRow,
  type NotificationReminderRow,
  type PushSubscriptionRow
} from "@/lib/notification-preference-service";
import {
  createDefaultNotificationRuntimeState,
  createNotificationPreferences,
  getNotificationCategoryLabels,
  isAllowedNotificationPath,
  resolveNotificationDestination,
  type HydrationIntervalMinutes,
  type NotificationCategoryId,
  type NotificationDeliveryState,
  type NotificationPermissionState,
  type NotificationPreferencesState,
  type NotificationRuntimeState,
  type NotificationSubscriptionState,
  type WorkoutLeadMinutes
} from "@/lib/notification-system";
import {
  buildPushSubscriptionPayload,
  readNotificationBrowserCapabilities,
  registerNotificationServiceWorker,
  requestBrowserNotificationPermission,
  subscribeToPush
} from "@/lib/notification-browser";
import type { Locale } from "@/lib/i18n";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

type Copy = {
  title: string;
  subtitle: string;
  summaryLabel: string;
  manageCta: string;
  enableCta: string;
  installCta: string;
  howToEnableCta: string;
  inAppCta: string;
  customizeCta: string;
  doneCta: string;
  notNowCta: string;
  permissionSection: string;
  permissionDetail: string;
  capabilitySection: string;
  masterSection: string;
  timingSection: string;
  fallbackSection: string;
  privacySection: string;
  deliverySection: string;
  syncSaved: string;
  syncPending: string;
  syncFailed: string;
  pausedHelp: string;
  installHelp: string;
  deniedHelp: string;
  unsupportedHelp: string;
  defaultHelp: string;
  grantedHelp: string;
};

const copyByLocale: Record<Locale, Copy> = {
  en: {
    title: "Notifications",
    subtitle: "Useful reminders only. No spam, no streak pressure.",
    summaryLabel: "Status",
    manageCta: "Manage notifications",
    enableCta: "Enable notifications",
    installCta: "Install app",
    howToEnableCta: "How to enable",
    inAppCta: "Use in-app reminders",
    customizeCta: "Customize reminders",
    doneCta: "Done",
    notNowCta: "Not now",
    permissionSection: "Permission",
    permissionDetail: "Permission must be requested only after an explicit tap.",
    capabilitySection: "Capability truth",
    masterSection: "Master control",
    timingSection: "Timing",
    fallbackSection: "Today fallback",
    privacySection: "Privacy",
    deliverySection: "Delivery state",
    syncSaved: "Saved",
    syncPending: "Sync pending",
    syncFailed: "Could not save",
    pausedHelp: "Delivery is paused. Category choices stay stored.",
    installHelp: "This device benefits from installation before push can work.",
    deniedHelp: "Browser permission is blocked. Use browser settings to change it later.",
    unsupportedHelp: "This browser cannot deliver Web Push here.",
    defaultHelp: "AthlexForce explains the benefit before the system permission prompt.",
    grantedHelp: "Permission is on. AthlexForce can now subscribe this device.",
  },
  es: {
    title: "Notificaciones",
    subtitle: "Solo recordatorios útiles. Sin spam ni presión.",
    summaryLabel: "Estado",
    manageCta: "Gestionar notificaciones",
    enableCta: "Activar notificaciones",
    installCta: "Instalar app",
    howToEnableCta: "Cómo activarlas",
    inAppCta: "Usar recordatorios dentro de la app",
    customizeCta: "Ajustar recordatorios",
    doneCta: "Hecho",
    notNowCta: "Ahora no",
    permissionSection: "Permiso",
    permissionDetail: "El permiso solo se pide después de un toque explícito.",
    capabilitySection: "Verdad de la capacidad",
    masterSection: "Control principal",
    timingSection: "Horario",
    fallbackSection: "Fallback de Today",
    privacySection: "Privacidad",
    deliverySection: "Estado de entrega",
    syncSaved: "Guardado",
    syncPending: "Sincronización pendiente",
    syncFailed: "No se pudo guardar",
    pausedHelp: "La entrega está en pausa. Las categorías se conservan.",
    installHelp: "Este dispositivo puede necesitar instalación antes de usar push.",
    deniedHelp: "El permiso del navegador está bloqueado. Cámbialo luego desde ajustes.",
    unsupportedHelp: "Este navegador no puede entregar Web Push aquí.",
    defaultHelp: "AthlexForce explica el beneficio antes del aviso del sistema.",
    grantedHelp: "El permiso está activo. AthlexForce puede suscribir este dispositivo.",
  },
  ca: {
    title: "Notificacions",
    subtitle: "Només recordatoris útils. Sense spam ni pressió.",
    summaryLabel: "Estat",
    manageCta: "Gestionar notificacions",
    enableCta: "Activar notificacions",
    installCta: "Instal·lar app",
    howToEnableCta: "Com activar-les",
    inAppCta: "Usar recordatoris dins l’app",
    customizeCta: "Ajustar recordatoris",
    doneCta: "Fet",
    notNowCta: "Ara no",
    permissionSection: "Permís",
    permissionDetail: "El permís només es demana després d’un toc explícit.",
    capabilitySection: "Veritat de la capacitat",
    masterSection: "Control principal",
    timingSection: "Horari",
    fallbackSection: "Fallback de Today",
    privacySection: "Privacitat",
    deliverySection: "Estat de lliurament",
    syncSaved: "Desat",
    syncPending: "Sincronització pendent",
    syncFailed: "No s’ha pogut desar",
    pausedHelp: "El lliurament està en pausa. Les categories es conserven.",
    installHelp: "Aquest dispositiu pot necessitar instal·lació abans de fer servir push.",
    deniedHelp: "El permís del navegador està bloquejat. Canvia’l després des dels ajustos.",
    unsupportedHelp: "Aquest navegador no pot lliurar Web Push aquí.",
    defaultHelp: "AthlexForce explica el benefici abans del permís del sistema.",
    grantedHelp: "El permís està actiu. AthlexForce ja pot subscriure aquest dispositiu.",
  },
  de: {
    title: "Benachrichtigungen",
    subtitle: "Nur nützliche Erinnerungen. Kein Spam, kein Druck.",
    summaryLabel: "Status",
    manageCta: "Benachrichtigungen verwalten",
    enableCta: "Benachrichtigungen aktivieren",
    installCta: "App installieren",
    howToEnableCta: "So aktivierst du sie",
    inAppCta: "In-App-Erinnerungen verwenden",
    customizeCta: "Erinnerungen anpassen",
    doneCta: "Fertig",
    notNowCta: "Nicht jetzt",
    permissionSection: "Berechtigung",
    permissionDetail: "Die Berechtigung wird erst nach einem klaren Tap angefragt.",
    capabilitySection: "Fähigkeitsstatus",
    masterSection: "Hauptschalter",
    timingSection: "Zeitsteuerung",
    fallbackSection: "Today-Fallback",
    privacySection: "Datenschutz",
    deliverySection: "Auslieferungsstatus",
    syncSaved: "Gespeichert",
    syncPending: "Sync ausstehend",
    syncFailed: "Speichern fehlgeschlagen",
    pausedHelp: "Die Auslieferung ist pausiert. Kategorien bleiben gespeichert.",
    installHelp: "Dieses Gerät benötigt möglicherweise eine Installation, bevor Push funktioniert.",
    deniedHelp: "Die Browser-Berechtigung ist blockiert. Später in den Einstellungen ändern.",
    unsupportedHelp: "Dieser Browser kann hier kein Web Push ausliefern.",
    defaultHelp: "AthlexForce erklärt den Nutzen vor dem Systemdialog.",
    grantedHelp: "Die Berechtigung ist aktiv. AthlexForce kann dieses Gerät jetzt abonnieren.",
  }
};

const deliveryLabels: Record<NotificationDeliveryState, Record<Locale, string>> = {
  READY: { en: "Ready", es: "Listo", ca: "A punt", de: "Bereit" },
  DISABLED_BY_USER: { en: "Disabled by user", es: "Desactivado por ti", ca: "Desactivat per tu", de: "Vom Nutzer deaktiviert" },
  IN_APP_ONLY: { en: "In-app only", es: "Solo dentro de la app", ca: "Només dins l’app", de: "Nur in der App" },
  OFFLINE_SYNC: { en: "Offline sync", es: "Sincronización sin conexión", ca: "Sincronització fora de línia", de: "Offline-Sync" }
};

const permissionLabels: Record<NotificationPermissionState, Record<Locale, string>> = {
  PERMISSION_DEFAULT: { en: "Not requested", es: "No solicitado", ca: "No demanat", de: "Nicht angefragt" },
  PERMISSION_REQUESTING: { en: "Requesting", es: "Solicitando", ca: "Sol·licitant", de: "Wird angefragt" },
  PERMISSION_GRANTED: { en: "Granted", es: "Concedido", ca: "Concedit", de: "Gewährt" },
  PERMISSION_DENIED: { en: "Blocked", es: "Bloqueado", ca: "Bloquejat", de: "Blockiert" }
};

const capabilityLabels: Record<"SUPPORTED" | "INSTALL_REQUIRED" | "UNSUPPORTED", Record<Locale, string>> = {
  SUPPORTED: { en: "Supported", es: "Compatible", ca: "Compatible", de: "Unterstützt" },
  INSTALL_REQUIRED: { en: "Install required", es: "Instalación requerida", ca: "Instal·lació requerida", de: "Installation erforderlich" },
  UNSUPPORTED: { en: "Unsupported", es: "No disponible", ca: "No disponible", de: "Nicht unterstützt" }
};

const subscriptionLabels: Record<NotificationSubscriptionState, Record<Locale, string>> = {
  NOT_SUBSCRIBED: { en: "Not subscribed", es: "No suscrito", ca: "No subscrit", de: "Nicht abonniert" },
  SUBSCRIBING: { en: "Subscribing", es: "Suscribiendo", ca: "Subscrivint", de: "Wird abonniert" },
  SUBSCRIBED: { en: "Subscribed", es: "Suscrito", ca: "Subscrit", de: "Abonniert" },
  SUBSCRIPTION_ERROR: { en: "Subscription error", es: "Error de suscripción", ca: "Error de subscripció", de: "Abo-Fehler" }
};

function localeCopy(locale: Locale) {
  return copyByLocale[locale] ?? copyByLocale.en;
}

function localeLabel<T extends string>(value: T, labels: Record<T, Record<Locale, string>>, locale: Locale) {
  return labels[value]?.[locale] ?? labels[value]?.en ?? value;
}

function isTimeString(value: string) {
  return /^\d{2}:\d{2}$/.test(value);
}

function isPositiveInterval(value: number) {
  return Number.isFinite(value) && value >= 0;
}

export function buildNotificationSummary(settings: NotificationPreferencesState, runtime: NotificationRuntimeState, locale: Locale) {
  return {
    capability: localeLabel(runtime.capability, capabilityLabels, locale),
    permission: localeLabel(runtime.permission, permissionLabels, locale),
    subscription: localeLabel(runtime.subscription, subscriptionLabels, locale),
    delivery: localeLabel(buildNotificationDeliveryTruth(settings, runtime), deliveryLabels, locale),
    deliveryState: buildNotificationDeliveryTruth(settings, runtime)
  };
}

export function getNotificationPermissionHelp(runtime: NotificationRuntimeState, locale: Locale) {
  const copy = localeCopy(locale);
  if (runtime.permission === "PERMISSION_DENIED") {
    return copy.deniedHelp;
  }

  if (runtime.capability === "INSTALL_REQUIRED") {
    return copy.installHelp;
  }

  if (runtime.capability === "UNSUPPORTED") {
    return copy.unsupportedHelp;
  }

  if (runtime.permission === "PERMISSION_GRANTED") {
    return copy.grantedHelp;
  }

  return copy.defaultHelp;
}

export function getNotificationTimingSummary(settings: NotificationPreferencesState, locale: Locale) {
  const copy = localeCopy(locale);
  return {
    workoutLeadMinutes: settings.workoutLeadMinutes,
    hydrationIntervalMinutes: settings.hydrationIntervalMinutes,
    quietHours: `${settings.quietHours.start} – ${settings.quietHours.end}`,
    labels: {
      workout: copy.timingSection,
      hydration: copy.timingSection,
      quietHours: copy.timingSection
    }
  };
}

export function updateCategoryEnabled(settings: NotificationPreferencesState, categoryId: NotificationCategoryId, enabled: boolean): NotificationPreferencesState {
  return {
    ...settings,
    categories: settings.categories.map((category) => (category.id === categoryId ? { ...category, enabled } : category)),
    workoutEnabled: categoryId === "workout" ? enabled : settings.workoutEnabled,
    mealsEnabled: categoryId === "meals" ? enabled : settings.mealsEnabled,
    hydrationEnabled: categoryId === "hydration" ? enabled : settings.hydrationEnabled,
    supplementsEnabled: categoryId === "supplements" ? enabled : settings.supplementsEnabled,
    checkinEnabled: categoryId === "check-in" ? enabled : settings.checkinEnabled,
    sleepEnabled: categoryId === "sleep" ? enabled : settings.sleepEnabled
  };
}

export function updateTimingPreference(settings: NotificationPreferencesState, patch: Partial<Pick<NotificationPreferencesState, "workoutLeadMinutes" | "hydrationIntervalMinutes" | "quietHours">>) {
  return {
    ...settings,
    workoutLeadMinutes: patch.workoutLeadMinutes ?? settings.workoutLeadMinutes,
    hydrationIntervalMinutes: patch.hydrationIntervalMinutes ?? settings.hydrationIntervalMinutes,
    quietHours: patch.quietHours ? { ...settings.quietHours, ...patch.quietHours } : settings.quietHours
  };
}

export function validateNotificationPreferences(settings: NotificationPreferencesState) {
  return {
    quietHoursValid: isTimeString(settings.quietHours.start) && isTimeString(settings.quietHours.end),
    workoutLeadValid: [15, 30, 60].includes(settings.workoutLeadMinutes),
    hydrationIntervalValid: [0, 120, 180].includes(settings.hydrationIntervalMinutes),
    inAppEnabled: Boolean(settings.inAppEnabled),
    masterEnabled: Boolean(settings.masterEnabled)
  };
}

export function resolveNotificationModeDescription(settings: NotificationPreferencesState, runtime: NotificationRuntimeState, locale: Locale) {
  const copy = localeCopy(locale);
  const truth = buildNotificationDeliveryTruth(settings, runtime);

  if (!settings.masterEnabled) {
    return copy.pausedHelp;
  }

  if (truth === "OFFLINE_SYNC") {
    return copy.syncPending;
  }

  return copy.syncSaved;
}

export function buildTodayFallbackReminderTitle(locale: Locale, categoryId: NotificationCategoryId) {
  const category = getNotificationCategoryLabels(locale)[categoryId];
  return category?.label ?? categoryId;
}

export function sanitizeNotificationRoute(pathname: string, fallback = "/") {
  return isAllowedNotificationPath(pathname) ? resolveSafeInternalPath(pathname, fallback) : fallback;
}

export function getNotificationRouteForCategory(categoryId: NotificationCategoryId, referencePath?: string | null) {
  if (referencePath) {
    return sanitizeNotificationRoute(referencePath, resolveNotificationDestination(categoryId));
  }

  return resolveNotificationDestination(categoryId);
}

export function coerceWorkoutLeadMinutes(value: number): WorkoutLeadMinutes {
  return [15, 30, 60].includes(value as WorkoutLeadMinutes) ? (value as WorkoutLeadMinutes) : 30;
}

export function coerceHydrationIntervalMinutes(value: number): HydrationIntervalMinutes {
  return [0, 120, 180].includes(value as HydrationIntervalMinutes) ? (value as HydrationIntervalMinutes) : 120;
}

export function coerceQuietHours(settings: Partial<NotificationPreferencesState["quietHours"]> | null | undefined, fallback: NotificationPreferencesState["quietHours"]) {
  return {
    enabled: settings?.enabled ?? fallback.enabled,
    start: settings?.start && isTimeString(settings.start) ? settings.start : fallback.start,
    end: settings?.end && isTimeString(settings.end) ? settings.end : fallback.end,
    timezone: settings?.timezone?.trim() ? settings.timezone : fallback.timezone
  };
}

function getDeliveryLabel(state: NotificationDeliveryState, locale: Locale) {
  return deliveryLabels[state][locale] ?? deliveryLabels[state].en;
}

function getPermissionLabel(state: NotificationPermissionState, locale: Locale) {
  return permissionLabels[state][locale] ?? permissionLabels[state].en;
}

function getCapabilityLabel(state: NotificationRuntimeState["capability"], locale: Locale) {
  return capabilityLabels[state][locale] ?? capabilityLabels[state].en;
}

function getSubscriptionLabel(state: NotificationSubscriptionState, locale: Locale) {
  return subscriptionLabels[state][locale] ?? subscriptionLabels[state].en;
}

function getLeadLabel(minutes: WorkoutLeadMinutes, locale: Locale) {
  if (locale === "es") {
    return `${minutes === 60 ? "1 hora" : `${minutes} min`} antes`;
  }

  if (locale === "ca") {
    return `${minutes === 60 ? "1 hora" : `${minutes} min`} abans`;
  }

  if (locale === "de") {
    return `${minutes === 60 ? "1 Stunde" : `${minutes} min`} vorher`;
  }

  return `${minutes === 60 ? "1 hour" : `${minutes} min`} before`;
}

function getHydrationLabel(minutes: HydrationIntervalMinutes, locale: Locale) {
  if (minutes === 0) {
    return locale === "es" ? "Apagado" : locale === "ca" ? "Apagat" : locale === "de" ? "Aus" : "Off";
  }

  if (locale === "es") {
    return `Cada ${minutes / 60} h`;
  }

  if (locale === "ca") {
    return `Cada ${minutes / 60} h`;
  }

  if (locale === "de") {
    return `Alle ${minutes / 60} h`;
  }

  return `Every ${minutes / 60}h`;
}

function StatePill({ label, tone = "neutral" }: { label: string; tone?: "neutral" | "accent" | "warning" | "error" }) {
  const background =
    tone === "accent"
      ? "rgba(182,255,0,0.16)"
      : tone === "warning"
        ? "rgba(255,176,32,0.16)"
        : tone === "error"
          ? "rgba(255,77,79,0.16)"
          : "#1a1a1a";

  const color = tone === "accent" ? "var(--accent-primary)" : tone === "warning" ? "var(--warning)" : tone === "error" ? "var(--error)" : "var(--text-secondary)";

  return (
    <span
      className="pill"
      style={{
        minHeight: 30,
        paddingInline: 10,
        background,
        color,
        border: "1px solid rgba(255,255,255,0.08)"
      }}
    >
      {label}
    </span>
  );
}

function SwitchRow({
  title,
  subtitle,
  checked,
  onToggle,
  disabled = false
}: {
  title: string;
  subtitle: string;
  checked: boolean;
  onToggle: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-disabled={disabled}
      onClick={disabled ? undefined : onToggle}
      className="card focus-ring"
      style={{
        width: "100%",
        textAlign: "left",
        padding: 16,
        opacity: disabled ? 0.6 : 1
      }}
    >
      <div className="row" style={{ alignItems: "center", gap: 16 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="body-md" style={{ fontWeight: 700 }}>
            {title}
          </div>
          <p className="caption" style={{ marginTop: 6 }}>
            {subtitle}
          </p>
        </div>
        <span
          aria-hidden="true"
          style={{
            width: 58,
            height: 34,
            borderRadius: 9999,
            background: checked ? "var(--accent-primary)" : "#2a2a2a",
            position: "relative",
            flex: "0 0 auto"
          }}
        >
          <span
            style={{
              position: "absolute",
              top: 4,
              left: checked ? 30 : 4,
              width: 26,
              height: 26,
              borderRadius: 9999,
              background: checked ? "#050505" : "#f7f7f7"
            }}
          />
        </span>
      </div>
    </button>
  );
}

function SegmentedChoice({
  label,
  options,
  value,
  onSelect
}: {
  label: string;
  options: Array<{ value: number; label: string; caption?: string }>;
  value: number;
  onSelect: (value: number) => void;
}) {
  return (
    <div className="stack" style={{ gap: 10 }}>
      <div className="eyebrow">{label}</div>
      <div className="row" style={{ flexWrap: "wrap", gap: 8 }}>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            className="focus-ring"
            aria-pressed={option.value === value}
            onClick={() => onSelect(option.value)}
            style={{
              minHeight: 44,
              padding: "10px 14px",
              borderRadius: 16,
              border: `1px solid ${option.value === value ? "rgba(182,255,0,0.9)" : "rgba(255,255,255,0.08)"}`,
              background: option.value === value ? "rgba(182,255,0,0.12)" : "#121212",
              color: "#f7f7f7"
            }}
          >
            <div className="body-md" style={{ fontWeight: 700 }}>
              {option.label}
            </div>
            {option.caption ? <div className="caption">{option.caption}</div> : null}
          </button>
        ))}
      </div>
    </div>
  );
}

function TimeField({
  label,
  value,
  onChange
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="stack" style={{ gap: 8 }}>
      <span className="eyebrow">{label}</span>
      <input
        type="time"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="focus-ring"
        style={{
          minHeight: 44,
          borderRadius: 16,
          border: "1px solid rgba(255,255,255,0.12)",
          background: "#121212",
          color: "#f7f7f7",
          paddingInline: 14
        }}
      />
    </label>
  );
}

function CategoryRow({
  category,
  disabled,
  onToggle
}: {
  category: ReturnType<typeof createNotificationPreferences>["categories"][number];
  disabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={category.enabled}
      className="card focus-ring"
      onClick={disabled ? undefined : onToggle}
      style={{
        width: "100%",
        textAlign: "left",
        padding: 16,
        opacity: disabled ? 0.6 : 1
      }}
    >
      <div className="row" style={{ alignItems: "center", gap: 14 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="body-md" style={{ fontWeight: 700 }}>
            {category.label}
          </div>
          <p className="caption" style={{ marginTop: 6 }}>
            {category.description}
          </p>
        </div>
        <span
          aria-hidden="true"
          style={{
            width: 58,
            height: 34,
            borderRadius: 9999,
            background: category.enabled ? "var(--accent-primary)" : "#2a2a2a",
            position: "relative",
            flex: "0 0 auto"
          }}
        >
          <span
            style={{
              position: "absolute",
              top: 4,
              left: category.enabled ? 30 : 4,
              width: 26,
              height: 26,
              borderRadius: 9999,
              background: category.enabled ? "#050505" : "#f7f7f7"
            }}
          />
        </span>
      </div>
    </button>
  );
}

export function NotificationSettingsScreen() {
  const router = useRouter();
  const auth = useAuthStore();
  const { locale } = useTranslator();
  const copy = localeCopy(locale);
  const categoryLabels = useMemo(() => getNotificationCategoryLabels(locale), [locale]);
  const client = getSupabaseBrowserClient();
  const pendingSaveRef = useRef<NotificationPreferencesState | null>(null);
  const installPromptRef = useRef<BeforeInstallPromptEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [preferences, setPreferences] = useState<NotificationPreferencesState>(() => createNotificationPreferences(locale));
  const [runtime, setRuntime] = useState<NotificationRuntimeState>(() => createDefaultNotificationRuntimeState());
  const [subscription, setSubscription] = useState<PushSubscriptionRow | null>(null);
  const [reminders, setReminders] = useState<NotificationReminderRow[]>([]);
  const [syncState, setSyncState] = useState<"idle" | "saving" | "offline" | "error" | "saved">("idle");
  const [requestState, setRequestState] = useState<"idle" | "requesting" | "ready" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  const deliveryTruth = buildNotificationDeliveryTruth(preferences, runtime);
  const modeDescription = resolveNotificationModeDescription(preferences, runtime, locale);
  const permissionHelp = useMemo(() => getNotificationPermissionHelp(runtime, locale), [locale, runtime]);
  const canRequestPermission = runtime.permission === "PERMISSION_DEFAULT" || runtime.permission === "PERMISSION_GRANTED";
  const nextActionLabel =
    runtime.capability === "INSTALL_REQUIRED"
      ? copy.installCta
      : runtime.permission === "PERMISSION_DENIED"
        ? copy.howToEnableCta
        : runtime.permission === "PERMISSION_GRANTED"
          ? copy.customizeCta
          : copy.enableCta;

  useEffect(() => {
    if (!auth.ready) {
      return;
    }

    let active = true;

    async function hydrate() {
      const browserRuntime = readNotificationBrowserCapabilities();
      if (!active) {
        return;
      }

      setRuntime(browserRuntime);

      if (!auth.user || !client) {
        setPreferences((current) => ({
          ...current,
          categories: createNotificationPreferences(locale).categories
        }));
        setLoading(false);
        return;
      }

      try {
        const [remotePreferences, remoteReminders, pushResult] = await Promise.all([
          loadNotificationPreferences(client, auth.user.id, locale),
          loadNotificationReminders(client, auth.user.id),
          loadPushSubscription(client, auth.user.id)
        ]);

        if (!active) {
          return;
        }

        const nextPreferences = remotePreferences.source === "default" ? createNotificationPreferences(locale) : remotePreferences.settings;
        setPreferences(nextPreferences);
        setReminders(remoteReminders);
        setSubscription(pushResult.subscription);
        pendingSaveRef.current = null;

        const nextDelivery = buildNotificationDeliveryTruth(nextPreferences, browserRuntime);
        setRuntime((current) => ({
          ...current,
          delivery: nextDelivery,
          subscription: pushResult.subscription ? "SUBSCRIBED" : current.subscription
        }));

        if (remotePreferences.source === "default") {
          await saveNotificationPreferences(client, auth.user.id, nextPreferences);
        }
      } catch (error) {
        if (!active) {
          return;
        }

        setMessage(error instanceof Error ? error.message : "Notification preferences could not be loaded.");
        setSyncState("error");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void hydrate();

    return () => {
      active = false;
    };
  }, [auth.ready, auth.user, client, locale]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      const promptEvent = event as BeforeInstallPromptEvent;
      event.preventDefault();
      installPromptRef.current = promptEvent;
      setRuntime((current) => ({
        ...current,
        canInstall: true
      }));
    };

    const handleOnline = () => {
      setRuntime((current) => ({ ...current, online: true }));
      if (pendingSaveRef.current && auth.user && client) {
        void persistPreferences(pendingSaveRef.current, true);
      }
    };

    const handleOffline = () => {
      setRuntime((current) => ({ ...current, online: false }));
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [auth.user, client]);

  async function persistPreferences(next: NotificationPreferencesState, silent = false) {
    pendingSaveRef.current = next;
    setSyncState("saving");
    try {
      if (!auth.user || !client) {
        throw new Error("No authenticated client available.");
      }

      const saved = await saveNotificationPreferences(client, auth.user.id, next);
      pendingSaveRef.current = null;
      setPreferences((current) => ({
        ...current,
        ...next,
        categories: next.categories.map((category) => ({ ...category }))
      }));
      setSyncState("saved");
      setMessage(copy.syncSaved);

      if (!silent) {
        publishFeedbackSuccess("profile.notifications", "Notification preferences saved", "Your reminder choices are stored.");
      }

      return saved;
    } catch (error) {
      const isOffline = typeof navigator !== "undefined" && !navigator.onLine;
      setSyncState(isOffline ? "offline" : "error");
      setMessage(isOffline ? copy.syncPending : copy.syncFailed);
      if (!silent) {
        publishFeedbackError("profile.notifications", isOffline ? "Notification preferences pending" : "Notification preferences could not be saved", isOffline ? "AthlexForce will retry when you are back online." : "Your current settings stay in place.");
      }
      throw error;
    }
  }

  async function reconcilePushSubscription(nextPermission: NotificationPermissionState = runtime.permission) {
    if (!auth.user || !client) {
      return;
    }

    if (nextPermission !== "PERMISSION_GRANTED") {
      setRuntime((current) => ({ ...current, permission: nextPermission }));
      return;
    }

    setRequestState("requesting");
    setRuntime((current) => ({ ...current, permission: "PERMISSION_GRANTED", subscription: current.subscription === "SUBSCRIPTION_ERROR" ? current.subscription : "SUBSCRIBING" }));
    publishFeedbackPending("profile.notifications", "Updating notifications", "AthlexForce is reconciling this device.");

    try {
      const registration = await registerNotificationServiceWorker();
      if (!registration) {
        setRuntime((current) => ({ ...current, subscription: "SUBSCRIPTION_ERROR", delivery: buildNotificationDeliveryTruth(preferences, current) }));
        setRequestState("error");
        return;
      }

      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim() ?? "";
      if (!publicKey) {
        setRuntime((current) => ({ ...current, subscription: "SUBSCRIPTION_ERROR" }));
        setRequestState("error");
        setMessage("Missing public push key.");
        return;
      }

      const browserSubscription = await subscribeToPush(registration, publicKey);
      const saved = await savePushSubscription(client, auth.user.id, buildPushSubscriptionPayload(browserSubscription));
      setSubscription(saved);
      setRuntime((current) => ({
        ...current,
        subscription: "SUBSCRIBED",
        delivery: buildNotificationDeliveryTruth(preferences, current)
      }));
      setRequestState("ready");
      publishFeedbackSuccess("profile.notifications", "Notifications are on", "This device is ready to receive reminder pushes.");
    } catch (error) {
      setRuntime((current) => ({
        ...current,
        subscription: "SUBSCRIPTION_ERROR",
        delivery: buildNotificationDeliveryTruth(preferences, current)
      }));
      setRequestState("error");
      publishFeedbackError("profile.notifications", "We could not enable notifications", error instanceof Error ? error.message : "The browser subscription could not be completed.");
    }
  }

  async function handleEnableNotifications() {
    if (runtime.capability === "INSTALL_REQUIRED") {
      if (installPromptRef.current) {
        await installPromptRef.current.prompt();
        const choice = await installPromptRef.current.userChoice;
        if (choice.outcome === "accepted") {
          setRuntime((current) => ({ ...current, installed: true, canInstall: false, capability: "SUPPORTED" }));
        }
      }
      return;
    }

    if (runtime.capability === "UNSUPPORTED") {
      router.push("/");
      return;
    }

    if (runtime.permission === "PERMISSION_DENIED") {
      router.push("/profile");
      return;
    }

    if (runtime.permission === "PERMISSION_GRANTED") {
      await reconcilePushSubscription("PERMISSION_GRANTED");
      return;
    }

    setRequestState("requesting");
    setRuntime((current) => ({ ...current, permission: "PERMISSION_REQUESTING" }));
    const nextPermission = await requestBrowserNotificationPermission();
    setRuntime((current) => ({ ...current, permission: nextPermission }));
    if (nextPermission === "PERMISSION_GRANTED") {
      await reconcilePushSubscription("PERMISSION_GRANTED");
    } else if (nextPermission === "PERMISSION_DENIED") {
      setMessage(copy.deniedHelp);
      setRequestState("error");
      setRuntime((current) => ({
        ...current,
        permission: "PERMISSION_DENIED",
        subscription: "NOT_SUBSCRIBED",
        delivery: buildNotificationDeliveryTruth(preferences, current)
      }));
      publishFeedbackError("profile.notifications", "Notifications are blocked", "Enable them later from the browser settings.");
    } else {
      setRequestState("idle");
    }
  }

  function updatePreference(next: NotificationPreferencesState) {
    setPreferences(next);
    void persistPreferences(next).catch(() => undefined);
  }

  function toggleCategory(categoryId: NotificationCategoryId) {
    const next = updateCategoryEnabled(preferences, categoryId, !preferences.categories.find((category) => category.id === categoryId)?.enabled);
    updatePreference(next);
  }

  function toggleMaster() {
    const next = {
      ...preferences,
      masterEnabled: !preferences.masterEnabled
    };
    updatePreference(next);
  }

  function updateQuietHours(patch: Partial<NotificationPreferencesState["quietHours"]>) {
    updatePreference({
      ...preferences,
      quietHours: coerceQuietHours({ ...preferences.quietHours, ...patch }, preferences.quietHours)
    });
  }

  function updateLeadMinutes(value: number) {
    updatePreference({
      ...preferences,
      workoutLeadMinutes: coerceWorkoutLeadMinutes(value)
    });
  }

  function updateHydrationInterval(value: number) {
    updatePreference({
      ...preferences,
      hydrationIntervalMinutes: coerceHydrationIntervalMinutes(value)
    });
  }

  async function handleReminderAction(reminder: NotificationReminderRow, action: "done" | "later") {
    if (!auth.user || !client) {
      return;
    }

    try {
      if (action === "done") {
        await saveNotificationReminder(client, {
          ...reminder,
          user_id: auth.user.id,
          status: "dismissed",
          dismissed_at: new Date().toISOString()
        });
        setReminders((current) => current.filter((item) => item.id !== reminder.id));
        publishFeedbackSuccess("profile.notifications", "Reminder dismissed", "The in-app reminder has been cleared.");
      } else {
        await saveNotificationReminder(client, {
          ...reminder,
          user_id: auth.user.id,
          status: "snoozed",
          snoozed_until: new Date(Date.now() + 30 * 60 * 1000).toISOString()
        });
        publishFeedbackPending("profile.notifications", "Reminder snoozed", "AthlexForce will keep it visible later.");
      }
    } catch {
      publishFeedbackError("profile.notifications", "Reminder could not be updated", "The current reminder stays in place.");
    }
  }

  const currentReminder = reminders[0] ?? null;

  if (loading) {
    return (
      <Screen
        topbar={
          <header className="topbar">
            <IconButton icon="close" label="Close" onClick={() => router.push("/profile")} />
            <BrandLogo variant="horizontal" width={128} alt="AthlexForce" />
            <div style={{ width: 44 }} />
          </header>
        }
      >
        <main className="content">
          <section className="section">
            <Card className="p-16">
              <div className="headline-md">{copy.title}</div>
              <p className="caption" style={{ marginTop: 8 }}>
                Loading notification settings…
              </p>
            </Card>
          </section>
        </main>
      </Screen>
    );
  }

  return (
    <Screen
      topbar={
        <header className="topbar">
          <IconButton icon="arrow_back" label="Back" onClick={() => router.push("/profile")} />
          <BrandLogo variant="horizontal" width={128} alt="AthlexForce" />
          <Link href="/profile" aria-label="Profile" className="focus-ring">
            <span className="icon" aria-hidden="true">
              person
            </span>
          </Link>
        </header>
      }
    >
      <main className="content">
        <section className="section">
          <Card className="p-16 elevated" style={{ background: "var(--surface-elevated)" }}>
            <div className="stack" style={{ gap: 12 }}>
              <div className="eyebrow">{copy.summaryLabel}</div>
              <h1 className="headline-xl" style={{ margin: 0 }}>
                {copy.title}
              </h1>
              <p className="body-md" style={{ color: "var(--text-muted)", margin: 0 }}>
                {copy.subtitle}
              </p>
              <div className="row" style={{ flexWrap: "wrap", gap: 8, marginTop: 4 }}>
                <StatePill label={getCapabilityLabel(runtime.capability, locale)} tone={runtime.capability === "SUPPORTED" ? "accent" : runtime.capability === "INSTALL_REQUIRED" ? "warning" : "error"} />
                <StatePill label={getPermissionLabel(runtime.permission, locale)} tone={runtime.permission === "PERMISSION_GRANTED" ? "accent" : runtime.permission === "PERMISSION_DENIED" ? "error" : "neutral"} />
                <StatePill label={getSubscriptionLabel(runtime.subscription, locale)} tone={runtime.subscription === "SUBSCRIBED" ? "accent" : runtime.subscription === "SUBSCRIPTION_ERROR" ? "warning" : "neutral"} />
                <StatePill label={getDeliveryLabel(deliveryTruth, locale)} tone={deliveryTruth === "READY" ? "accent" : deliveryTruth === "OFFLINE_SYNC" ? "warning" : "neutral"} />
              </div>
              <p className="caption" style={{ marginTop: 4 }}>
                {modeDescription}
              </p>
            </div>
          </Card>
        </section>

        <Section title={copy.capabilitySection} meta={copy.permissionDetail}>
          <Card className="p-16">
            <div className="stack" style={{ gap: 12 }}>
              <div className="row" style={{ flexWrap: "wrap", gap: 8 }}>
                <StatePill label={getCapabilityLabel(runtime.capability, locale)} tone={runtime.capability === "SUPPORTED" ? "accent" : runtime.capability === "INSTALL_REQUIRED" ? "warning" : "error"} />
                <StatePill label={getPermissionLabel(runtime.permission, locale)} tone={runtime.permission === "PERMISSION_GRANTED" ? "accent" : runtime.permission === "PERMISSION_DENIED" ? "error" : "neutral"} />
                <StatePill label={getSubscriptionLabel(runtime.subscription, locale)} />
              </div>
              <p className="caption">{permissionHelp}</p>
              <div className="row" style={{ gap: 12, flexWrap: "wrap" }}>
                <PrimaryButton onClick={handleEnableNotifications} className="focus-ring">
                  {nextActionLabel}
                </PrimaryButton>
                <SecondaryButton onClick={() => router.push("/profile")} className="focus-ring">
                  {copy.notNowCta}
                </SecondaryButton>
              </div>
              <div className="stack" style={{ gap: 8 }}>
                <div className="eyebrow">System / browser UI</div>
                <div className="body-md" style={{ fontWeight: 700 }}>
                  {runtime.permission === "PERMISSION_DEFAULT"
                    ? copy.defaultHelp
                    : runtime.permission === "PERMISSION_GRANTED"
                      ? copy.grantedHelp
                      : runtime.permission === "PERMISSION_DENIED"
                        ? copy.deniedHelp
                        : copy.installHelp}
                </div>
              </div>
            </div>
          </Card>
        </Section>

        <Section title={copy.masterSection} meta={copy.manageCta}>
          <SwitchRow
            title={preferences.masterEnabled ? "Notifications ON" : "Notifications OFF"}
            subtitle={preferences.masterEnabled ? "Category choices stay preserved while delivery is active." : "Preferences stay stored, delivery is paused, and push permission is not revoked."}
            checked={preferences.masterEnabled}
            onToggle={toggleMaster}
          />
        </Section>

        <Section title="Categories" meta="WORKOUT · MEALS · HYDRATION · SUPPLEMENTS · CHECK-IN · SLEEP / WIND DOWN">
          <div className="stack" style={{ gap: 12 }}>
            {preferences.categories.map((category) => (
              <CategoryRow key={category.id} category={category} disabled={!preferences.masterEnabled} onToggle={() => toggleCategory(category.id)} />
            ))}
          </div>
        </Section>

        <Section title={copy.timingSection} meta="Workout lead, hydration frequency and quiet hours">
          <div className="stack" style={{ gap: 16 }}>
            <SegmentedChoice
              label="Workout lead"
              value={preferences.workoutLeadMinutes}
              onSelect={updateLeadMinutes}
              options={[
                { value: 15, label: "15 min" },
                { value: 30, label: "30 min" },
                { value: 60, label: getLeadLabel(60, locale) }
              ]}
            />
            <SegmentedChoice
              label="Hydration"
              value={preferences.hydrationIntervalMinutes}
              onSelect={updateHydrationInterval}
              options={[
                { value: 0, label: locale === "es" ? "Apagado" : locale === "ca" ? "Apagat" : locale === "de" ? "Aus" : "Off" },
                { value: 120, label: getHydrationLabel(120, locale) },
                { value: 180, label: getHydrationLabel(180, locale) }
              ]}
            />
            <Card className="p-16">
              <div className="stack" style={{ gap: 14 }}>
                <div className="row" style={{ alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                  <div>
                    <div className="eyebrow">Quiet hours</div>
                    <div className="body-md" style={{ fontWeight: 700, marginTop: 6 }}>
                      {preferences.quietHours.enabled ? `${preferences.quietHours.start} – ${preferences.quietHours.end}` : locale === "es" ? "Desactivado" : locale === "ca" ? "Desactivat" : locale === "de" ? "Aus" : "Off"}
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-label="Quiet hours"
                    aria-checked={preferences.quietHours.enabled}
                    onClick={() => updateQuietHours({ enabled: !preferences.quietHours.enabled })}
                    className="focus-ring"
                    style={{
                      width: 58,
                      height: 34,
                      borderRadius: 9999,
                      background: preferences.quietHours.enabled ? "var(--accent-primary)" : "#2a2a2a",
                      position: "relative",
                      flex: "0 0 auto"
                    }}
                  >
                    <span
                      aria-hidden="true"
                      style={{
                        position: "absolute",
                        top: 4,
                        left: preferences.quietHours.enabled ? 30 : 4,
                        width: 26,
                        height: 26,
                        borderRadius: 9999,
                        background: preferences.quietHours.enabled ? "#050505" : "#f7f7f7"
                      }}
                    />
                  </button>
                </div>
                <div className="row" style={{ gap: 12, flexWrap: "wrap" }}>
                  <TimeField label="Start" value={preferences.quietHours.start} onChange={(value) => updateQuietHours({ start: value })} />
                  <TimeField label="End" value={preferences.quietHours.end} onChange={(value) => updateQuietHours({ end: value })} />
                </div>
                <p className="caption">
                  Timezone: {preferences.quietHours.timezone}
                </p>
              </div>
            </Card>
          </div>
        </Section>

        <Section title={copy.fallbackSection} meta={copy.inAppCta}>
          {currentReminder ? (
            <Card className="p-16 elevated" style={{ background: "var(--surface-secondary)" }}>
              <div className="stack" style={{ gap: 10 }}>
                <StatePill label={categoryLabels[currentReminder.category].label} tone="accent" />
                <div className="headline-md" style={{ margin: 0 }}>
                  {currentReminder.title}
                </div>
                <p className="body-md" style={{ color: "var(--text-muted)", margin: 0 }}>
                  {currentReminder.body}
                </p>
                <div className="row" style={{ gap: 12, flexWrap: "wrap", marginTop: 4 }}>
                  <PrimaryButton onClick={() => void handleReminderAction(currentReminder, "done")}>{copy.doneCta}</PrimaryButton>
                  <SecondaryButton onClick={() => void handleReminderAction(currentReminder, "later")}>Later</SecondaryButton>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="p-16">
              <div className="stack" style={{ gap: 10 }}>
                <div className="eyebrow">No active in-app reminder</div>
                <p className="caption">Today will surface the next relevant reminder if push is unavailable or blocked.</p>
                <div className="row" style={{ gap: 12, flexWrap: "wrap" }}>
                  <PrimaryButton href="/" className="focus-ring">
                    Go to Today
                  </PrimaryButton>
                  <SecondaryButton onClick={() => router.push("/profile")} className="focus-ring">
                    {copy.doneCta}
                  </SecondaryButton>
                </div>
              </div>
            </Card>
          )}
        </Section>

        <Section title={copy.privacySection} meta="Notification permission is used only for reminders you enable.">
          <Card className="p-16">
            <p className="body-md" style={{ margin: 0 }}>
              AthlexForce uses notification permission only for the reminder categories you choose. No ads, no social feed, no coach messaging, no marketing notifications.
            </p>
            <div className="row" style={{ flexWrap: "wrap", gap: 8, marginTop: 12 }}>
              <StatePill label={copy.syncSaved} tone={syncState === "saved" ? "accent" : "neutral"} />
              <StatePill label={syncState === "offline" ? copy.syncPending : syncState === "error" ? copy.syncFailed : copy.syncSaved} tone={syncState === "error" ? "warning" : syncState === "offline" ? "warning" : "neutral"} />
              <StatePill label={deliveryTruth === "DISABLED_BY_USER" ? "Disabled by user" : getDeliveryLabel(deliveryTruth, locale)} tone={deliveryTruth === "READY" ? "accent" : deliveryTruth === "OFFLINE_SYNC" ? "warning" : "neutral"} />
            </div>
            {message ? <p className="caption" style={{ marginTop: 10 }}>{message}</p> : null}
          </Card>
        </Section>

        <section className="section">
          <div className="stack" style={{ gap: 12 }}>
            <PrimaryButton href="/profile" className="focus-ring">
              {copy.doneCta}
            </PrimaryButton>
            <SecondaryButton onClick={() => router.push("/")} className="focus-ring">
              Today
            </SecondaryButton>
          </div>
        </section>
      </main>
    </Screen>
  );
}
