# Notification Architecture

Slice 28 adds a canonical notification stack for web and PWA delivery without claiming universal support.

## Layering

1. UI surfaces collect explicit preference intent.
2. Browser capability detection decides whether the device can request permission, install the service worker, and subscribe to push.
3. Persisted preferences live in `notification_preferences`.
4. Per-device push subscriptions live in `push_subscriptions`.
5. Delivery work items live in `notification_reminders`.
6. Delivery attempts are written to `notification_delivery_attempts`.
7. The Today surface shows in-app fallback reminders when push is unavailable or blocked.

## Canonical state model

- Capability: `SUPPORTED`, `INSTALL_REQUIRED`, or `UNSUPPORTED`.
- Permission: `PERMISSION_DEFAULT`, `PERMISSION_REQUESTING`, `PERMISSION_GRANTED`, or `PERMISSION_DENIED`.
- Subscription: `NOT_SUBSCRIBED`, `SUBSCRIBING`, `SUBSCRIBED`, or `SUBSCRIPTION_ERROR`.
- Delivery: `IN_APP_ONLY`, `DISABLED_BY_USER`, `OFFLINE_SYNC`, or `READY`.

## Notification categories

- workout
- meals
- hydration
- supplements
- check-in
- sleep

## Behavioral rules

- Permission is only requested after an explicit user tap.
- Master off preserves category choices and timing preferences.
- Quiet hours are respected for reminder dispatch.
- Notification clicks resolve only to allowlisted internal paths.
- Invalid or expired push subscriptions are deactivated, not retried forever.

## Production sources

- Browser push: service worker + VAPID subscription.
- In-app fallback: Today screen and notification settings screen.
- Dispatch: Supabase Edge Function.

