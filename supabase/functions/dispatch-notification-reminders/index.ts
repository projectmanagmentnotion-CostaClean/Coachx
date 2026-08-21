import { withSupabase } from "npm:@supabase/server@^1";
import { buildPushHTTPRequest } from "npm:@pushforge/builder";
import {
  buildNotificationPushPayload,
  dispatchNotificationReminders,
  type NotificationReminderRow,
  type PushSubscriptionRow
} from "../../../lib/notification-dispatcher";

async function sendPush(
  subscription: PushSubscriptionRow,
  reminder: NotificationReminderRow,
  destinationPath: string,
  vapidPrivateKey: string,
  vapidSubject: string
) {
  const privateJwk = JSON.parse(vapidPrivateKey) as JsonWebKey;
  const { endpoint, headers, body } = await buildPushHTTPRequest({
    privateJWK: privateJwk,
    subscription: {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.p256dh,
        auth: subscription.auth
      },
      expirationTime: subscription.expiration_time ? Date.parse(subscription.expiration_time) : undefined
    },
    message: {
      payload: buildNotificationPushPayload(reminder, destinationPath),
      adminContact: vapidSubject
    }
  });

  return fetch(endpoint, {
    method: "POST",
    headers,
    body
  });
}

export default {
  fetch: withSupabase({ auth: "secret" }, async (_req, ctx) => {
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY")?.trim() ?? "";
    const vapidSubject = Deno.env.get("VAPID_SUBJECT")?.trim() ?? "mailto:support@athlexforce.app";

    try {
      const result = await dispatchNotificationReminders({
        supabaseAdmin: ctx.supabaseAdmin,
        sendPush,
        vapidPrivateKey,
        vapidSubject
      });

      if (!result.ok) {
        return Response.json(result, { status: 500 });
      }

      return Response.json(result);
    } catch (error) {
      return Response.json(
        {
          ok: false,
          error: error instanceof Error ? error.message : "Unknown notification dispatch failure"
        },
        { status: 500 }
      );
    }
  })
};
