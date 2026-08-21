# AthlexForce Notification System Specification (v1.1)

## 1. Truthful State Matrix
AthlexForce distinguishes between device capability, OS permission, and user preference. These are independent dimensions.

### Capability & Permission States
- **SUPPORTED**: Standard browser/device support for Web Push.
- **INSTALL_REQUIRED**: PWA installation needed for push on specific platforms (e.g., iOS Safari).
- **UNSUPPORTED**: Platform/Browser has no push capability.
- **PERMISSION_DEFAULT**: State before user has been asked.
- **PERMISSION_REQUESTING**: Browser prompt active.
- **PERMISSION_GRANTED**: User approved the system prompt.
- **PERMISSION_DENIED**: Blocked at browser/OS level. Cannot be re-requested via code.

### Subscription & Preference States
- **SUBSCRIBING**: App attempting to register push token with backend.
- **SUBSCRIBED**: Delivery is technically active.
- **SUBSCRIPTION_ERROR**: Preference saved, but push registration failed (e.g., VAPID or network error).
- **DISABLED_BY_USER**: User has master toggle OFF. Settings are preserved but delivery is paused.
- **IN_APP_ONLY**: Push is unavailable (Denied or Unsupported), fallback cards active in Today.
- **OFFLINE_SYNC**: Local preference change awaiting server sync.

## 2. Notification Categories (The Six)
AthlexForce reminders are neutral, descriptive, and actionable.
- **WORKOUT**: Pre-session reminders (15m, 30m, 1h).
- **MEALS**: Scheduled meal/nutrition timing based on plan.
- **HYDRATION**: Frequency-based (2h, 3h) or custom timing.
- **SUPPLEMENTS**: Scheduled habit/supplement entry.
- **CHECK-IN**: Weekly performance assessment.
- **SLEEP / WIND DOWN**: Recovery-focused reminders before bed.

## 3. Interaction & Timing
- **Hydration Frequency**: OFF, Every 2h, Every 3h, Custom (Custom = Implement only if supported).
- **Quiet Hours**: Mutes non-critical reminders during a set window (e.g., 23:00 - 07:00).
- **Master Toggle**: When OFF, all categories remain visually preserved but delivery is halted.

## 4. Deep Link Mapping
- **Workout** -> Today / Workout Overview.
- **Nutrition** -> Daily Nutrition.
- **Hydration** -> Today fallback.
- **Supplements** -> Today / Habit surface.
- **Check-in** -> Weekly Check-in.
- **Sleep / Wind Down** -> Today fallback.
- **Fallback** -> Today dashboard. *Do not invent routes.*

## 5. Responsive Standards
- **Viewports**: 375x812, 390x844, 430x932 (iPhone-first).
- **Touch Targets**: 44px minimum for all toggles and buttons.
- **i18n**: Support ES, CA, EN, DE. Handle German text expansion without clipping.

## 6. Motion Rhythm
- **Micro**: 150ms (L1).
- **Component**: 300ms (L2).
- **Ease**: `power3.out` (Enter), `power2.in` (Exit), `expo.out` (Emphasis).
- **Reduced Motion**: Swap translations for short cross-fades and instant values.

## 7. Privacy & Principles
- No marketing, social, or third-party tracking push.
- Permission is never forced or repeated after explicit denial.
- ATHLEXFORCE visual authority: #050505 (BG), #121212 (Surface), #B6FF00 (Accent).
