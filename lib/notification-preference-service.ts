import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import {
  cloneNotificationPreferences,
  createNotificationCategories,
  createNotificationPreferences,
  type HydrationIntervalMinutes,
  type NotificationCategoryId,
  type NotificationDeliveryState,
  type NotificationPreferencesState,
  type NotificationRuntimeState,
  type NotificationSubscriptionState,
  type QuietHoursState,
  type WorkoutLeadMinutes
} from "@/lib/notification-system";
import type { Locale } from "@/lib/i18n";

const preferencesRowSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  master_enabled: z.boolean(),
  workout_enabled: z.boolean().optional(),
  meals_enabled: z.boolean().optional(),
  hydration_enabled: z.boolean(),
  supplements_enabled: z.boolean(),
  checkin_enabled: z.boolean().optional(),
  sleep_enabled: z.boolean().optional(),
  workout_lead_minutes: z.number().int().nullable().optional(),
  hydration_interval_minutes: z.number().int().nullable().optional(),
  quiet_hours_enabled: z.boolean(),
  quiet_start: z.string().nullable().optional(),
  quiet_end: z.string().nullable().optional(),
  timezone: z.string().nullable().optional(),
  in_app_enabled: z.boolean().optional(),
  reminder_intensity: z.enum(["minimal", "recommended", "more-support"]).optional(),
  workout_reminders_enabled: z.boolean().optional(),
  nutrition_reminders_enabled: z.boolean().optional(),
  weekly_check_in_enabled: z.boolean().optional(),
  sleep_routine_enabled: z.boolean().optional(),
  quiet_hours_start: z.string().nullable().optional(),
  quiet_hours_end: z.string().nullable().optional(),
  preferred_timezone: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string()
});

const pushSubscriptionRowSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  endpoint: z.string().min(1),
  p256dh: z.string().min(1),
  auth: z.string().min(1),
  expiration_time: z.string().nullable().optional(),
  active: z.boolean(),
  last_success_at: z.string().nullable().optional(),
  failure_count: z.number().int().nonnegative().optional(),
  created_at: z.string(),
  updated_at: z.string()
});

const reminderRowSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  category: z.enum(["workout", "meals", "hydration", "supplements", "check-in", "sleep"]),
  source_table: z.string().nullable().optional(),
  source_id: z.string().nullable().optional(),
  source_reference: z.string().nullable().optional(),
  destination_path: z.string().min(1),
  title: z.string().min(1),
  body: z.string().min(1),
  status: z.enum(["scheduled", "ready", "processing", "sent", "delivered", "clicked", "dismissed", "snoozed", "failed", "expired", "cancelled"]),
  scheduled_for: z.string(),
  sent_at: z.string().nullable().optional(),
  delivered_at: z.string().nullable().optional(),
  clicked_at: z.string().nullable().optional(),
  dismissed_at: z.string().nullable().optional(),
  snoozed_until: z.string().nullable().optional(),
  dedupe_key: z.string().min(1),
  payload: z.record(z.string(), z.unknown()).nullable().optional(),
  created_at: z.string(),
  updated_at: z.string()
});

export interface NotificationPreferencesRow {
  id: string;
  user_id: string;
  master_enabled: boolean;
  workout_reminders_enabled?: boolean;
  nutrition_reminders_enabled?: boolean;
  weekly_check_in_enabled?: boolean;
  sleep_routine_enabled?: boolean;
  workout_enabled: boolean;
  meals_enabled: boolean;
  hydration_enabled: boolean;
  supplements_enabled: boolean;
  checkin_enabled: boolean;
  sleep_enabled: boolean;
  workout_lead_minutes: WorkoutLeadMinutes;
  hydration_interval_minutes: HydrationIntervalMinutes;
  quiet_hours_enabled: boolean;
  quiet_start: string | null;
  quiet_end: string | null;
  timezone: string | null;
  quiet_hours_start?: string | null;
  quiet_hours_end?: string | null;
  preferred_timezone?: string | null;
  in_app_enabled: boolean;
  reminder_intensity: "minimal" | "recommended" | "more-support";
  created_at: string;
  updated_at: string;
}

export interface PushSubscriptionRow {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  expiration_time: string | null;
  active: boolean;
  last_success_at: string | null;
  failure_count: number;
  created_at: string;
  updated_at: string;
}

export interface NotificationReminderRow {
  id: string;
  user_id: string;
  category: NotificationCategoryId;
  source_table: string | null;
  source_id: string | null;
  source_reference: string | null;
  destination_path: string;
  title: string;
  body: string;
  status: "scheduled" | "ready" | "processing" | "sent" | "delivered" | "clicked" | "dismissed" | "snoozed" | "failed" | "expired" | "cancelled";
  scheduled_for: string;
  sent_at: string | null;
  delivered_at: string | null;
  clicked_at: string | null;
  dismissed_at: string | null;
  snoozed_until: string | null;
  dedupe_key: string;
  payload: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface NotificationDeliveryAttemptRow {
  id: string;
  notification_reminder_id: string;
  user_id: string;
  push_subscription_id: string | null;
  attempted_at: string;
  result: "sent" | "delivered" | "expired" | "gone" | "failed" | "ignored";
  status_code: number | null;
  error_code: string | null;
  error_detail: string | null;
  created_at: string;
}

export interface NotificationSettingsLoadResult {
  settings: NotificationPreferencesState;
  source: "remote" | "default";
}

export interface PushSubscriptionStateResult {
  subscription: PushSubscriptionRow | null;
  source: "remote" | "none";
}

function parsePreferencesRow(row: unknown) {
  return preferencesRowSchema.parse(row) as NotificationPreferencesRow & Record<string, unknown>;
}

function parsePushSubscriptionRow(row: unknown) {
  return pushSubscriptionRowSchema.parse(row) as PushSubscriptionRow;
}

function parseReminderRow(row: unknown) {
  return reminderRowSchema.parse(row) as NotificationReminderRow;
}

function buildCategoryState(row: NotificationPreferencesRow) {
  return createNotificationCategories().map((category) => {
    const enabled = category.id === "workout"
      ? row.workout_enabled ?? row.workout_reminders_enabled ?? true
      : category.id === "meals"
        ? row.meals_enabled ?? row.nutrition_reminders_enabled ?? true
        : category.id === "hydration"
          ? row.hydration_enabled
          : category.id === "supplements"
            ? row.supplements_enabled
            : category.id === "check-in"
              ? row.checkin_enabled ?? row.weekly_check_in_enabled ?? true
              : row.sleep_enabled ?? row.sleep_routine_enabled ?? false;

    return {
      ...category,
      enabled
    };
  });
}

export function notificationPreferencesRowToSettings(
  row: NotificationPreferencesRow,
  locale: Locale = "en"
): NotificationPreferencesState {
  const defaults = createNotificationPreferences(locale);
  return {
    ...defaults,
    ...cloneNotificationPreferences(defaults),
    masterEnabled: row.master_enabled,
    workoutEnabled: row.workout_enabled ?? row.workout_reminders_enabled ?? defaults.workoutEnabled,
    mealsEnabled: row.meals_enabled ?? row.nutrition_reminders_enabled ?? defaults.mealsEnabled,
    hydrationEnabled: row.hydration_enabled,
    supplementsEnabled: row.supplements_enabled,
    checkinEnabled: row.checkin_enabled ?? row.weekly_check_in_enabled ?? defaults.checkinEnabled,
    sleepEnabled: row.sleep_enabled ?? row.sleep_routine_enabled ?? defaults.sleepEnabled,
    workoutLeadMinutes: (row.workout_lead_minutes ?? defaults.workoutLeadMinutes) as WorkoutLeadMinutes,
    hydrationIntervalMinutes: (row.hydration_interval_minutes ?? defaults.hydrationIntervalMinutes) as HydrationIntervalMinutes,
    quietHours: {
      enabled: row.quiet_hours_enabled,
      start: row.quiet_start ?? row.quiet_hours_start ?? defaults.quietHours.start,
      end: row.quiet_end ?? row.quiet_hours_end ?? defaults.quietHours.end,
      timezone: row.timezone ?? row.preferred_timezone ?? defaults.quietHours.timezone
    },
    inAppEnabled: row.in_app_enabled ?? defaults.inAppEnabled,
    intensity: row.reminder_intensity ?? defaults.intensity,
    categories: buildCategoryState(row)
  };
}

export function buildNotificationPreferencesRow(userId: string, settings: NotificationPreferencesState): Partial<NotificationPreferencesRow> & Record<string, unknown> {
  const categoryEnabled = settings.categories.reduce<Record<NotificationCategoryId, boolean>>((accumulator, category) => {
    accumulator[category.id] = category.enabled;
    return accumulator;
  }, {
    workout: settings.workoutEnabled,
    meals: settings.mealsEnabled,
    hydration: settings.hydrationEnabled,
    supplements: settings.supplementsEnabled,
    "check-in": settings.checkinEnabled,
    sleep: settings.sleepEnabled
  });

  return {
    user_id: userId,
    master_enabled: settings.masterEnabled,
    workout_enabled: categoryEnabled.workout,
    meals_enabled: categoryEnabled.meals,
    hydration_enabled: categoryEnabled.hydration,
    supplements_enabled: categoryEnabled.supplements,
    checkin_enabled: categoryEnabled["check-in"],
    sleep_enabled: categoryEnabled.sleep,
    workout_lead_minutes: settings.workoutLeadMinutes,
    hydration_interval_minutes: settings.hydrationIntervalMinutes,
    quiet_hours_enabled: settings.quietHours.enabled,
    quiet_start: settings.quietHours.start,
    quiet_end: settings.quietHours.end,
    timezone: settings.quietHours.timezone,
    in_app_enabled: settings.inAppEnabled,
    reminder_intensity: settings.intensity,
    workout_reminders_enabled: categoryEnabled.workout,
    nutrition_reminders_enabled: categoryEnabled.meals,
    weekly_check_in_enabled: categoryEnabled["check-in"],
    sleep_routine_enabled: categoryEnabled.sleep,
    quiet_hours_start: settings.quietHours.start,
    quiet_hours_end: settings.quietHours.end,
    preferred_timezone: settings.quietHours.timezone
  };
}

export async function loadNotificationPreferences(
  client: SupabaseClient<Database>,
  userId: string,
  locale: Locale
): Promise<NotificationSettingsLoadResult> {
  const result = await client.from("notification_preferences" as never).select("*").eq("user_id", userId).maybeSingle();

  if (result.error) {
    throw result.error;
  }

  if (!result.data) {
    return {
      settings: cloneNotificationPreferences(createNotificationPreferences(locale)),
      source: "default"
    };
  }

  const row = parsePreferencesRow(result.data);
  return {
    settings: notificationPreferencesRowToSettings(row, locale),
    source: "remote"
  };
}

export async function saveNotificationPreferences(client: SupabaseClient<Database>, userId: string, settings: NotificationPreferencesState) {
  const payload = buildNotificationPreferencesRow(userId, settings);
  const result = await client.from("notification_preferences" as never).upsert(payload as never, { onConflict: "user_id" }).select("*").single();

  if (result.error) {
    throw result.error;
  }

  return parsePreferencesRow(result.data);
}

export async function loadPushSubscription(client: SupabaseClient<Database>, userId: string): Promise<PushSubscriptionStateResult> {
  const result = await client
    .from("push_subscriptions" as never)
    .select("*")
    .eq("user_id", userId)
    .eq("active", true)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (result.error) {
    throw result.error;
  }

  return {
    subscription: result.data ? parsePushSubscriptionRow(result.data) : null,
    source: result.data ? "remote" : "none"
  };
}

export async function savePushSubscription(
  client: SupabaseClient<Database>,
  userId: string,
  subscription: Pick<PushSubscriptionRow, "endpoint" | "p256dh" | "auth" | "expiration_time">
) {
  const result = await client
    .from("push_subscriptions" as never)
    .upsert(
      {
        user_id: userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.p256dh,
        auth: subscription.auth,
        expiration_time: subscription.expiration_time,
        active: true
      } as never,
      { onConflict: "endpoint" }
    )
    .select("*")
    .single();

  if (result.error) {
    throw result.error;
  }

  return parsePushSubscriptionRow(result.data);
}

export async function deactivatePushSubscription(client: SupabaseClient<Database>, endpoint: string) {
  const result = await client
    .from("push_subscriptions" as never)
    .update({ active: false } as never)
    .eq("endpoint", endpoint)
    .select("*")
    .maybeSingle();

  if (result.error) {
    throw result.error;
  }

  return result.data ? parsePushSubscriptionRow(result.data) : null;
}

export async function loadNotificationReminders(client: SupabaseClient<Database>, userId: string) {
  const result = await client
    .from("notification_reminders" as never)
    .select("*")
    .eq("user_id", userId)
    .in("status", ["scheduled", "ready", "snoozed"])
    .order("scheduled_for", { ascending: true });

  if (result.error) {
    throw result.error;
  }

  return (result.data ?? []).map((row) => parseReminderRow(row));
}

export async function saveNotificationReminder(client: SupabaseClient<Database>, row: Partial<NotificationReminderRow> & { user_id: string; category: NotificationCategoryId; destination_path: string; title: string; body: string; scheduled_for: string; dedupe_key: string }) {
  const result = await client
    .from("notification_reminders" as never)
    .upsert(
      {
        ...row,
        status: row.status ?? "scheduled",
        payload: (row.payload ?? {}) as never
      } as never,
      { onConflict: "dedupe_key" }
    )
    .select("*")
    .single();

  if (result.error) {
    throw result.error;
  }

  return parseReminderRow(result.data);
}

export async function updateNotificationReminderStatus(
  client: SupabaseClient<Database>,
  reminderId: string,
  patch: Partial<Pick<NotificationReminderRow, "status" | "dismissed_at" | "snoozed_until" | "clicked_at" | "delivered_at" | "sent_at">>
) {
  const result = await client
    .from("notification_reminders" as never)
    .update(patch as never)
    .eq("id", reminderId)
    .select("*")
    .single();

  if (result.error) {
    throw result.error;
  }

  return parseReminderRow(result.data);
}

export function buildNotificationDeliveryTruth(
  settings: NotificationPreferencesState,
  runtime: NotificationRuntimeState
): NotificationDeliveryState {
  if (!settings.masterEnabled) {
    return "DISABLED_BY_USER";
  }

  if (runtime.permission === "PERMISSION_DENIED" || runtime.capability === "UNSUPPORTED") {
    return "IN_APP_ONLY";
  }

  if (runtime.subscription === "SUBSCRIPTION_ERROR" || runtime.subscription === "NOT_SUBSCRIBED") {
    return runtime.online ? "OFFLINE_SYNC" : "IN_APP_ONLY";
  }

  if (!runtime.online) {
    return "OFFLINE_SYNC";
  }

  return "READY";
}
