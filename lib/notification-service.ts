import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Database,
  NotificationPreferencesInsert,
  NotificationPreferencesRow,
  NotificationReminderIntensity
} from "@/lib/supabase/database.types";
import {
  createNotificationSettings,
  type NotificationCategoryId,
  type NotificationPermissionState,
  type NotificationSettings
} from "@/lib/profile-settings-data";

const notificationPreferencesRowSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  master_enabled: z.boolean(),
  workout_reminders_enabled: z.boolean(),
  program_updates_enabled: z.boolean(),
  weekly_check_in_enabled: z.boolean(),
  measurements_enabled: z.boolean(),
  progress_photos_enabled: z.boolean(),
  phase_reviews_enabled: z.boolean(),
  nutrition_reminders_enabled: z.boolean(),
  hydration_enabled: z.boolean(),
  supplements_enabled: z.boolean(),
  sleep_routine_enabled: z.boolean(),
  adaptive_alerts_enabled: z.boolean(),
  reminder_intensity: z.enum(["minimal", "recommended", "more-support"]),
  quiet_hours_enabled: z.boolean(),
  quiet_hours_start: z.string().nullable(),
  quiet_hours_end: z.string().nullable(),
  preferred_timezone: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string()
});

const categoryColumnMap: Record<NotificationCategoryId, keyof Pick<
  NotificationPreferencesRow,
  | "workout_reminders_enabled"
  | "program_updates_enabled"
  | "weekly_check_in_enabled"
  | "measurements_enabled"
  | "progress_photos_enabled"
  | "phase_reviews_enabled"
  | "nutrition_reminders_enabled"
  | "hydration_enabled"
  | "supplements_enabled"
  | "sleep_routine_enabled"
  | "adaptive_alerts_enabled"
>> = {
  "workout-reminders": "workout_reminders_enabled",
  "program-updates": "program_updates_enabled",
  "weekly-check-in": "weekly_check_in_enabled",
  measurements: "measurements_enabled",
  "progress-photos": "progress_photos_enabled",
  "phase-reviews": "phase_reviews_enabled",
  "nutrition-reminders": "nutrition_reminders_enabled",
  hydration: "hydration_enabled",
  supplements: "supplements_enabled",
  "sleep-routine": "sleep_routine_enabled",
  "adaptive-alerts": "adaptive_alerts_enabled"
};

function cloneSettings(settings: NotificationSettings): NotificationSettings {
  return {
    ...settings,
    quietHours: { ...settings.quietHours },
    categories: settings.categories.map((category) => ({ ...category }))
  };
}

function parseRow(row: unknown) {
  return notificationPreferencesRowSchema.parse(row) as NotificationPreferencesRow;
}

export function notificationPreferencesRowToSettings(
  row: NotificationPreferencesRow,
  permission: NotificationPermissionState = "not-requested"
): NotificationSettings {
  const defaults = createNotificationSettings();

  return {
    masterEnabled: row.master_enabled,
    permission,
    intensity: row.reminder_intensity,
    quietHours: {
      enabled: row.quiet_hours_enabled,
      start: row.quiet_hours_start ?? defaults.quietHours.start,
      end: row.quiet_hours_end ?? defaults.quietHours.end,
      timezone: row.preferred_timezone ?? defaults.quietHours.timezone
    },
    categories: defaults.categories.map((category) => ({
      ...category,
      enabled: row[categoryColumnMap[category.id]]
    }))
  };
}

export function buildNotificationPreferencesRow(userId: string, settings: NotificationSettings): NotificationPreferencesInsert {
  const defaults = createNotificationSettings();
  const categories = defaults.categories.reduce<Record<NotificationCategoryId, boolean>>((accumulator, category) => {
    accumulator[category.id] = settings.categories.find((item) => item.id === category.id)?.enabled ?? category.enabled;
    return accumulator;
  }, {} as Record<NotificationCategoryId, boolean>);

  return {
    user_id: userId,
    master_enabled: settings.masterEnabled,
    workout_reminders_enabled: categories["workout-reminders"],
    program_updates_enabled: categories["program-updates"],
    weekly_check_in_enabled: categories["weekly-check-in"],
    measurements_enabled: categories.measurements,
    progress_photos_enabled: categories["progress-photos"],
    phase_reviews_enabled: categories["phase-reviews"],
    nutrition_reminders_enabled: categories["nutrition-reminders"],
    hydration_enabled: categories.hydration,
    supplements_enabled: categories.supplements,
    sleep_routine_enabled: categories["sleep-routine"],
    adaptive_alerts_enabled: categories["adaptive-alerts"],
    reminder_intensity: settings.intensity as NotificationReminderIntensity,
    quiet_hours_enabled: settings.quietHours.enabled,
    quiet_hours_start: settings.quietHours.start,
    quiet_hours_end: settings.quietHours.end,
    preferred_timezone: settings.quietHours.timezone
  };
}

export async function loadNotificationPreferences(
  client: SupabaseClient<Database>,
  userId: string,
  permission: NotificationPermissionState = "not-requested"
) {
  const result = await client.from("notification_preferences").select("*").eq("user_id", userId).maybeSingle();

  if (result.error) {
    throw result.error;
  }

  if (!result.data) {
  return {
    settings: cloneSettings(createNotificationSettings()),
    source: "default" as const
  };
}

  const row = parseRow(result.data);
  return {
    settings: notificationPreferencesRowToSettings(row, permission),
    source: "remote" as const
  };
}

export async function saveNotificationPreferences(client: SupabaseClient<Database>, userId: string, settings: NotificationSettings) {
  const payload = buildNotificationPreferencesRow(userId, settings);
  const result = await client.from("notification_preferences").upsert(payload as never, { onConflict: "user_id" }).select("*").single();

  if (result.error) {
    throw result.error;
  }

  return parseRow(result.data);
}

export function reviveNotificationPreferences(settings: NotificationSettings | null | undefined) {
  if (!settings) {
    return cloneSettings(createNotificationSettings());
  }

  return cloneSettings({
    ...createNotificationSettings(),
    ...settings,
    categories: createNotificationSettings().categories.map((category) => ({
      ...category,
      enabled: settings.categories.find((item) => item.id === category.id)?.enabled ?? category.enabled
    })),
    quietHours: {
      ...createNotificationSettings().quietHours,
      ...settings.quietHours
    }
  });
}
