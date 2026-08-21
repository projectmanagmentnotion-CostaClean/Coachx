import { coerceQuietHours, getNotificationCategoryLabels, resolveQuietHoursActive, type NotificationCategoryId } from "@/lib/notification-system";

export type NotificationReminderStatus =
  | "scheduled"
  | "ready"
  | "processing"
  | "sent"
  | "delivered"
  | "clicked"
  | "dismissed"
  | "snoozed"
  | "failed"
  | "expired"
  | "cancelled";

export interface NotificationReminderRow {
  id: string;
  user_id: string;
  category: NotificationCategoryId;
  destination_path: string;
  title: string;
  body: string;
  status: NotificationReminderStatus;
  scheduled_for: string;
  sent_at: string | null;
  delivered_at: string | null;
  dismissed_at: string | null;
  snoozed_until: string | null;
  dedupe_key: string;
  payload: Record<string, unknown> | null;
}

export interface NotificationPreferenceRow {
  user_id: string;
  master_enabled: boolean;
  workout_enabled: boolean;
  meals_enabled: boolean;
  hydration_enabled: boolean;
  supplements_enabled: boolean;
  checkin_enabled: boolean;
  sleep_enabled: boolean;
  quiet_hours_enabled: boolean;
  quiet_start: string | null;
  quiet_end: string | null;
  timezone: string | null;
  in_app_enabled: boolean;
}

export interface PushSubscriptionRow {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  expiration_time: string | null;
  active: boolean;
  failure_count: number;
}

export interface NotificationDeliveryAttemptRow {
  notification_reminder_id: string;
  user_id: string;
  push_subscription_id: string | null;
  result: "sent" | "delivered" | "expired" | "gone" | "failed" | "ignored";
  status_code: number | null;
  error_code: string | null;
  error_detail: string | null;
}

type QueryResult<T> = { data: T | null; error: Error | null };

type QueryBuilder = {
  select(columns?: string): QueryBuilder;
  in(column: string, values: string[]): QueryBuilder;
  eq(column: string, value: string | boolean): QueryBuilder;
  order(column: string, options?: { ascending?: boolean }): QueryBuilder;
  update(values: Record<string, unknown>): QueryBuilder;
  insert(values: Record<string, unknown> | Record<string, unknown>[]): QueryBuilder;
  maybeSingle(): Promise<QueryResult<Record<string, unknown>>>;
  single(): Promise<QueryResult<Record<string, unknown>>>;
};

export interface SupabaseLike {
  from(tableName: string): QueryBuilder;
}

export interface DispatchNotificationRemindersOptions {
  supabaseAdmin: SupabaseLike;
  sendPush: (
    subscription: PushSubscriptionRow,
    reminder: NotificationReminderRow,
    destinationPath: string,
    vapidPrivateKey: string,
    vapidSubject: string
  ) => Promise<Response>;
  now?: Date;
  vapidPrivateKey?: string;
  vapidSubject?: string;
}

function isDueReminder(reminder: NotificationReminderRow, now: Date) {
  if (reminder.status === "dismissed" || reminder.status === "clicked" || reminder.status === "cancelled" || reminder.status === "expired") {
    return false;
  }

  if (reminder.snoozed_until && new Date(reminder.snoozed_until) > now) {
    return false;
  }

  return new Date(reminder.scheduled_for) <= now;
}

function categoryEnabledForReminder(row: NotificationPreferenceRow, category: NotificationCategoryId) {
  return category === "workout"
    ? row.workout_enabled
    : category === "meals"
      ? row.meals_enabled
      : category === "hydration"
        ? row.hydration_enabled
        : category === "supplements"
          ? row.supplements_enabled
          : category === "check-in"
            ? row.checkin_enabled
            : row.sleep_enabled;
}

export function buildNotificationPushPayload(reminder: NotificationReminderRow, destinationPath: string) {
  const categoryLabel = getNotificationCategoryLabels("en")[reminder.category]?.label ?? reminder.category;
  return {
    title: reminder.title || "AthlexForce",
    body: reminder.body || "Reminder ready.",
    destinationPath,
    category: reminder.category,
    tag: reminder.dedupe_key,
    reminderId: reminder.id,
    titleLabel: categoryLabel
  };
}

export async function claimNotificationReminder(
  supabaseAdmin: SupabaseLike,
  reminderId: string,
  originalStatus: NotificationReminderStatus
) {
  const result = await supabaseAdmin
    .from("notification_reminders")
    .update({ status: "processing" })
    .eq("id", reminderId)
    .eq("status", originalStatus)
    .select("*")
    .maybeSingle();

  if (result.error) {
    throw result.error;
  }

  return result.data as NotificationReminderRow | null;
}

async function finalizeReminderStatus(
  supabaseAdmin: SupabaseLike,
  reminderId: string,
  hasSuccessfulDelivery: boolean,
  inAppEnabled: boolean,
  now: Date
) {
  const patch = hasSuccessfulDelivery
    ? {
        status: "sent" as const,
        sent_at: now.toISOString()
      }
    : inAppEnabled
      ? { status: "ready" as const }
      : { status: "failed" as const };

  const result = await supabaseAdmin
    .from("notification_reminders")
    .update(patch)
    .eq("id", reminderId)
    .eq("status", "processing")
    .select("*")
    .maybeSingle();

  if (result.error) {
    throw result.error;
  }

  return result.data as NotificationReminderRow | null;
}

export async function dispatchNotificationReminders(options: DispatchNotificationRemindersOptions) {
  const now = options.now ?? new Date();
  const vapidPrivateKey = options.vapidPrivateKey?.trim() ?? "";
  const vapidSubject = options.vapidSubject?.trim() ?? "mailto:support@athlexforce.app";

  if (!vapidPrivateKey) {
    return { ok: false, error: "Missing VAPID_PRIVATE_KEY" };
  }

  const [remindersResult, preferencesResult, subscriptionsResult] = await Promise.all([
    options.supabaseAdmin.from("notification_reminders").select("*").in("status", ["scheduled", "ready", "snoozed"]) as any,
    options.supabaseAdmin.from("notification_preferences").select("*") as any,
    options.supabaseAdmin.from("push_subscriptions").select("*").eq("active", true) as any
  ]);

  if (remindersResult.error) {
    throw remindersResult.error;
  }

  if (preferencesResult.error) {
    throw preferencesResult.error;
  }

  if (subscriptionsResult.error) {
    throw subscriptionsResult.error;
  }

  const reminders = ((remindersResult.data ?? []) as NotificationReminderRow[]).filter((reminder) => isDueReminder(reminder, now));
  const preferences = (preferencesResult.data ?? []) as NotificationPreferenceRow[];
  const subscriptions = (subscriptionsResult.data ?? []) as PushSubscriptionRow[];

  const byUserPreferences = new Map(preferences.map((row) => [row.user_id, row]));
  const byUserSubscriptions = new Map<string, PushSubscriptionRow[]>();

  for (const subscription of subscriptions) {
    const list = byUserSubscriptions.get(subscription.user_id) ?? [];
    list.push(subscription);
    byUserSubscriptions.set(subscription.user_id, list);
  }

  let sent = 0;
  let skipped = 0;
  let failures = 0;
  let claimed = 0;

  for (const reminder of reminders) {
    const preferenceRow = byUserPreferences.get(reminder.user_id);
    if (!preferenceRow || !preferenceRow.master_enabled || !categoryEnabledForReminder(preferenceRow, reminder.category)) {
      skipped += 1;
      continue;
    }

    const quietHours = coerceQuietHours(
      {
        enabled: preferenceRow.quiet_hours_enabled,
        start: preferenceRow.quiet_start ?? "22:00",
        end: preferenceRow.quiet_end ?? "07:00",
        timezone: preferenceRow.timezone ?? "Device local"
      },
      {
        enabled: true,
        start: "22:00",
        end: "07:00",
        timezone: "Device local"
      }
    );

    if (resolveQuietHoursActive(now, quietHours)) {
      skipped += 1;
      continue;
    }

    const claimedReminder = await claimNotificationReminder(options.supabaseAdmin, reminder.id, reminder.status);
    if (!claimedReminder) {
      continue;
    }

    claimed += 1;

    const destinationPath = claimedReminder.destination_path.startsWith("/") ? claimedReminder.destination_path : "/";
    const userSubscriptions = byUserSubscriptions.get(claimedReminder.user_id) ?? [];
    let hasSuccessfulDelivery = false;

    for (const subscription of userSubscriptions) {
      try {
        const response = await options.sendPush(subscription, claimedReminder, destinationPath, vapidPrivateKey, vapidSubject);
        const result = response.ok ? "sent" : response.status === 410 || response.status === 404 ? "gone" : "failed";

        await options.supabaseAdmin.from("notification_delivery_attempts").insert({
          notification_reminder_id: claimedReminder.id,
          user_id: claimedReminder.user_id,
          push_subscription_id: subscription.id,
          result,
          status_code: response.status,
          error_code: response.ok ? null : `http_${response.status}`,
          error_detail: response.ok ? null : response.statusText
        });

        if (response.ok) {
          hasSuccessfulDelivery = true;
          sent += 1;
          await options.supabaseAdmin
            .from("push_subscriptions")
            .update({
              last_success_at: now.toISOString(),
              failure_count: 0
            })
            .eq("id", subscription.id);
          continue;
        }

        if (response.status === 410 || response.status === 404) {
          await options.supabaseAdmin
            .from("push_subscriptions")
            .update({
              active: false,
              failure_count: subscription.failure_count + 1
            })
            .eq("id", subscription.id);
          failures += 1;
          continue;
        }

        await options.supabaseAdmin
          .from("push_subscriptions")
          .update({
            failure_count: subscription.failure_count + 1
          })
          .eq("id", subscription.id);
        failures += 1;
      } catch (error) {
        await options.supabaseAdmin.from("notification_delivery_attempts").insert({
          notification_reminder_id: claimedReminder.id,
          user_id: claimedReminder.user_id,
          push_subscription_id: subscription.id,
          result: "failed",
          status_code: null,
          error_code: "exception",
          error_detail: error instanceof Error ? error.message : "Unknown push failure"
        });
        failures += 1;
      }
    }

    await finalizeReminderStatus(options.supabaseAdmin, claimedReminder.id, hasSuccessfulDelivery, preferenceRow.in_app_enabled, now);
  }

  return {
    ok: true,
    due: reminders.length,
    sent,
    skipped,
    failures,
    claimed
  };
}
