# AthlexForce Slice 28 — Engineering Authority

## Status
SLICE 28 DESIGN COMPLETE — ENGINEERING HANDOFF READY

This handoff consolidates the three reviewed Stitch exports for Slice 28.

## Source precedence
When sources disagree, use this order:

1. AthlexForce repository security/data invariants
2. Existing working product architecture and real route/data model
3. Canonical AthlexForce design system and motion system
4. `athlexforce_notification_system_spec_v1.1.md`
5. Approved Stitch screenshots for layout/state composition
6. Stitch `code.html` only as prototype/reference code

Never allow generated Stitch theme metadata to override canonical product tokens.

## Canonical tokens
- Background: `#050505`
- Primary surface: `#121212`
- Elevated: `#181818`
- Secondary surface: `#1A1A1A`
- Primary accent: `#B6FF00`
- Secondary accent: `#CAFF4A`
- Text: `#F7F7F7`
- Warning: `#FFB020`
- Error: `#FF4D4F`
- Typography: Hanken Grotesk
- Minimum touch target: 44px

## Critical notification truth model
These dimensions are independent:

`CAPABILITY != PERMISSION != SUBSCRIPTION != USER PREFERENCE`

Canonical states:
- Capability: `SUPPORTED`, `INSTALL_REQUIRED`, `UNSUPPORTED`
- Permission: `PERMISSION_DEFAULT`, `PERMISSION_REQUESTING`, `PERMISSION_GRANTED`, `PERMISSION_DENIED`
- Subscription: `SUBSCRIBING`, `SUBSCRIBED`, `SUBSCRIPTION_ERROR`
- Delivery/preference: `IN_APP_ONLY`, `DISABLED_BY_USER`, `OFFLINE_SYNC`

User preference may remain saved even when push capability/permission/subscription prevents external delivery.
Do not silently revert a user's saved category preference just because browser push is blocked.
The UI must truthfully show push unavailable/failed while preserving in-app fallback where supported.

## Six canonical categories
1. WORKOUT
2. MEALS
3. HYDRATION
4. SUPPLEMENTS
5. CHECK-IN
6. SLEEP / WIND DOWN

Do not replace these with unrelated categories such as Weekly Progress or Coach Feedback in Slice 28.

## Engineering corrections to visual prototype copy
The final visual repair is accepted for layout/state authority, with these explicit semantic overrides:

1. `master_off_disabled_by_user`
   - Use the visual layout only.
   - Runtime categories must be the six canonical Slice 28 categories.
   - Master OFF means `DISABLED_BY_USER`: preferences preserved, delivery paused.

2. `truthful_state_matrix`
   - Use the visual matrix layout only.
   - The v1.1 spec is semantic authority.
   - Do not implement a rule that automatically reverts preference ON when permission is denied.
   - `PERMISSION_DENIED` / `UNSUPPORTED` should surface truthful push unavailability and `IN_APP_ONLY` fallback where appropriate.

3. `board_y_responsive_matrix`
   - The 375 / 390 / 430 visual references are valid responsive authority.
   - Runtime settings must support all six categories even if the board shows only a shortened list.
   - Do not copy judgmental German prototype phrasing implying the athlete's progress will suffer if notifications are disabled. Production copy remains neutral and non-coercive.

## Routing
Inspect the real repository routes before wiring deep links.
Do not invent routes.

Canonical intent:
- Workout -> existing Workout / Today destination
- Meals -> existing Nutrition destination
- Hydration -> Today fallback
- Supplements -> Today / existing habit surface if one exists
- Check-in -> existing Check-in destination
- Sleep / Wind Down -> Today fallback
- Invalid/expired -> Today safe fallback

## Permission UX
- Never request native permission immediately at login.
- Explain benefit first, then request only after explicit athlete action.
- Do not fake native browser/OS permission UI.
- Do not repeatedly re-request after `PERMISSION_DENIED`.
- Permission granted is not equivalent to subscription success.

## Push vs in-app fallback
AthlexForce must remain useful when Web Push is unavailable.
In-app reminders are not a second notification/toast framework; integrate with existing AthlexForce feedback/Today architecture.

## Responsive acceptance
Required real-browser QA:
- 375x812
- 390x844
- 430x932

No UI implementation may be marked production ready from build/tests alone.
Follow the repository `RESPONSIVE_UI_CONTRACT.md` and visual QA gate.
