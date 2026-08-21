# Athlete Flow Architecture

## Purpose

This document defines the current athlete-side architecture for the private-alpha AthlexForce experience. The goal is to keep the athlete journey readable, secure, and navigable without collapsing the product into a generic dashboard.

## Core Product Model

AthlexForce now separates three concerns:

1. Identity and access
2. Athlete program execution
3. Coach relationship management

The UI may suggest intent, but backend state decides capability.

## Capability Model

### Self-managed athlete

- Uses the athlete workspace only.
- Sees Today, Calendar, Nutrition, Progress, and Profile.
- Can complete onboarding and use the program without an active coach relationship.

### Coach-managed athlete

- Still uses the athlete workspace as the primary surface.
- Gains relationship context through backend state.
- Does not receive coach privileges just because a local intent value says so.

### Coach user

- Has a separate coach workspace.
- Must be resolved from the coach profile and assignment state.
- Can only access coach routes when the backend confirms active coach capability.

## Route Hierarchy

### Today

Today is the command center.

- Shows the current day summary.
- Surfaces the main workout or rest-day state.
- Keeps the primary CTA visible.
- Links into the actual workout or the next actionable surface.

### Calendar

Calendar is the scheduling and selection surface.

- Month navigation is explicit.
- The current day is easy to jump to.
- Selected day state should be visible.
- Add workout and move workout are separate actions.

### Workout

Workout is a nested execution flow.

- Overview shows the whole session and the progression hierarchy.
- Exercise rows should be tappable.
- Exercise detail is where set logging and safety actions happen.
- Alternatives and adjustment paths are secondary but real routes.

### Nutrition

Nutrition is a direct athlete surface, not a hidden subpage of day detail.

- Meal and day context should be readable at a glance.
- Primary actions should keep the user in the meal workflow.

### Progress

Progress surfaces should present live program context clearly.

- Metrics, trends, and review items should be distinct.
- Technical implementation details should not leak into user copy.

### Profile

Profile is the identity and relationship hub.

- Shows the athlete profile.
- Shows the current plan state.
- Shows relationship mode and settings separately.
- Does not merge profile identity with settings or security.

## Relationship Data Flow

The relationship model is private by default.

- `get_my_coach_relationship()` returns the athlete's current relationship summary.
- `coach_accept_assignment_invitation()` accepts a secure invitation token for the authenticated athlete.
- Grants should be limited to the roles that actually need them.

The client should never infer relationship authority from a cookie, a route, or a local intent flag.

## UX Rules

- Every screen should have one obvious primary action.
- Secondary actions may exist, but they should not compete with the primary action.
- Press states, disabled states, and loading states should be visible.
- No icon-only control should remain dead.
- On mobile, the action hierarchy must still read top-to-bottom without ambiguity.

## Localization Rules

- New UI copy must be translated in `es`, `ca`, `en`, and `de`.
- Technical fallback text should not appear in the normal production flow.
- Mixed-language surfaces should be treated as defects unless the content is intentionally user data.

## Security Rules

- Production origins should remain explicit and narrowly trusted.
- Relationship RPCs must not become public convenience endpoints.
- If the backend rejects a relationship request, the UI should show a safe generic error.

## Implementation Notes

This slice focuses on refining the athlete journey without changing the underlying program model.

- Keep Today as the top-level command center.
- Make workout entry points visibly tappable.
- Keep profile and settings apart.
- Harden private relationship RPC execution rights.
- Preserve existing onboarding and program logic.

## Open Follow-ups

- Re-check the live browser after deployment.
- Verify the relationship RPCs still work for authenticated athletes and stay hidden from anonymous access.
- Confirm the updated CTA hierarchy does not regress on 375 px, 390 px, or 430 px widths.
