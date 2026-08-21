# Notification Security

Slice 28 treats notifications as a scoped capability, not a blanket permission.

## Browser and device rules

- Notification permission is requested only from explicit user action.
- Service worker registration is restricted to the app origin.
- Push subscription payloads only use the VAPID public key exposed to the browser.
- The service worker only opens allowlisted internal paths.
- Invalid destinations fall back to `/`.

## Persistence rules

- Preferences are stored per user.
- Push subscriptions are stored per endpoint and deactivated on terminal failure.
- Reminder records are keyed by a dedupe key so the same logical reminder is not duplicated.
- Delivery attempts are logged separately from the reminder itself.

## Dispatch rules

- Quiet hours are respected before a push is sent.
- Blocked or unsupported browsers stay on in-app reminders.
- Expired or gone subscriptions are deactivated rather than retried indefinitely.
- The dispatch function must never expose raw server secrets to the browser.

## Threat model notes

- No open redirects from notification clicks.
- No direct network calls from the browser to push endpoints.
- No reliance on permission state alone; delivery truth is derived from capability, permission, subscription, and online state.

