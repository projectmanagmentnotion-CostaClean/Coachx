# AthlexForce Notification System Specification (v1.0)

## 1. Permission & Capability States
Truthful representation of platform capabilities.
- **SUPPORTED**: Standard browser/device support.
- **INSTALL_REQUIRED**: PWA installation needed for push on specific platforms (e.g., iOS Safari).
- **PERMISSION_DEFAULT**: State before user has been asked.
- **PERMISSION_REQUESTING**: Browser prompt active.
- **PERMISSION_GRANTED**: Success.
- **PERMISSION_DENIED**: Blocked at browser/OS level. Requires manual settings update.
- **UNSUPPORTED**: Platform/Browser has no push capability.

## 2. Subscription Lifecycle
Separation of user preference and technical delivery.
- **SUBSCRIBING**: App attempting to register push token with backend.
- **SUBSCRIBED**: Delivery is technically active.
- **SUBSCRIPTION_ERROR**: Preference saved, but push registration failed. Show truthful failure state.
- **OFFLINE_SYNC**: Local preference change awaiting server sync.

## 3. Categories & Semantics
AthlexForce reminders are neutral, descriptive, and actionable.
- **WORKOUT**: Pre-session reminders (15m, 30m, 1h).
- **MEALS**: Scheduled meal/nutrition timing.
- **HYDRATION**: Frequency-based (2h, 3h) or custom timing.
- **SUPPLEMENTS**: Scheduled habit/supplement entry.
- **CHECK-IN**: Weekly performance assessment.
- **SLEEP / WIND DOWN**: Recovery-focused reminders.

## 4. In-App Fallback
When push is unavailable, Today acts as the recovery hub.
- **Reminder Card**: Non-intrusive card in the Today feed.
- **Contextual Notification**: (L3) Inline feedback for internal app actions.
- **No Notification Inbox**: AthlexForce does not use a persistent 'inbox' for reminders.

## 5. Deep Link Mapping
- **Workout** -> Today / Workout Overview.
- **Nutrition** -> Daily Nutrition.
- **Check-in** -> Weekly Check-in.
- **Fallback** -> Today dashboard.

## 6. Motion & Feedback
- **Permission Flow**: 650ms (L3) for successful setup.
- **Toggle**: 180ms (L1) Micro-interaction.
- **Reduced Motion**: Swap 400ms+ translations for 150ms cross-fades and instant values.
- **Easing**: `power3.out` (Enter), `power2.in` (Exit), `expo.out` (Emphasis).

## 7. Accessibility
- **Touch Targets**: 44px minimum for all toggles, cards, and buttons.
- **Status Indicators**: Must not rely on color alone (e.g., icons or text labels for on/off/error).
- **Contrast**: Maintain high legibility (White/Lime on dark surface).

## 8. Internationalization (i18n)
- **Languages**: ES, CA, EN, DE.
- **DE Pressure**: UI must handle long German strings (e.g., 'Benachrichtigungen' vs 'Notifications') without clipping.

## 9. Privacy
- Notifications are strictly for athlete-selected reminders.
- No marketing, social, or third-party tracking push.
- Permission is never forced or repeated after explicit denial.