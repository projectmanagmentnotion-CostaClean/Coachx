# COACH PANEL ARCHITECTURE

Date: 2026-08-10

Repository: `03adsg/Coachx`

Branch: `codex/phase-1-foundation`

## Purpose

The Coach Panel is the first coach-facing operations surface for AthlexForce. It is intentionally narrow:

- review assigned athletes
- inspect latest check-ins and context
- inspect recommendations and change proposals
- record coach notes and review actions
- keep athlete data isolated unless explicitly assigned

It is not a generic admin console.

## Role Model

Minimal roles:

- `athlete`
- `coach`
- `admin` later if needed

Coach access is assignment-scoped. A user is not a coach simply because they are authenticated.

## Assignment Model

Core tables:

- `coach_profiles`
- `coach_athlete_assignments`

Assignment rule:

- a coach can access an athlete only when an active assignment exists
- `coach_user_id = auth.uid()`
- `athlete_user_id = target athlete`
- status must be `active`

Assignments are created through trusted tooling or database migration paths, not from the client.

## RLS Strategy

Athlete privacy stays the default.

Coach-readable access is granted only where an explicit coach policy exists and only for assigned athletes.

Coach-readable domains in Slice 9:

- athlete profile/preferences
- active program and phase
- scheduled workouts
- workout sessions and sets
- nutrition plans and day snapshots
- progress entries and measurements
- weekly check-ins and reviews
- AI recommendations
- program change proposals and events
- coach notes and audit events

Progress photos remain excluded from Coach Panel v1.

## Dashboard Loop

Primary user flow:

1. athlete list
2. needs attention
3. athlete detail
4. check-in review
5. recommendation review
6. proposal review
7. explicit coach action

The dashboard is intentionally compact:

- attention queue
- assigned athlete list
- latest check-in state
- recent recommendation state
- recent proposal state
- bounded athlete summary cards

## Attention Queue

The queue is deterministic. Reasons are derived from persisted signals, not a hidden AI score.

Examples:

- check-in needs attention
- reported pain
- low recovery
- low training adherence
- low nutrition adherence
- pending recommendation
- pending proposal
- stale proposal
- missed check-in
- coach review required

## Review Workflow

Coach review actions are audit-backed and immutable from the athlete side.

Supported actions:

- mark reviewed
- acknowledge
- request follow-up
- approve recommendation
- reject recommendation
- approve proposal
- reject proposal
- add note

Coach notes are separate from athlete-submitted responses.

## Recommendation / Proposal Boundary

Important product rule:

- recommendation acceptance is not application
- proposal approval is not application
- explicit apply remains a separate step

This slice only establishes coach review and decision surfaces.

## Audit Trail

Core event table:

- `coach_action_events`

Events record:

- coach user id
- athlete user id
- action type
- target type
- target id
- metadata
- timestamp

The athlete's original history is never rewritten by a coach action.

## Server Boundaries

Coach-facing reads should stay on the server and be bounded by assignment checks.

Do not:

- fetch arbitrary athlete history without assignment validation
- trust client-supplied athlete ids without verifying assignment
- use service-role access in the browser

## Live Verification

Verified live on 2026-08-10 with a disposable coach, assigned athlete, and unassigned athlete.

- Coach routes render only for the authenticated assigned coach session.
- The assigned athlete is visible and the unassigned athlete is blocked.
- Coach review actions persist through the RPC boundary and emit audit rows.
- Recommendation approval does not mutate the active program.
- Proposal approval remains separate from apply.

## UI Scope

Routes in Slice 9:

- `/coach`
- `/coach/athletes`
- `/coach/athletes/[athleteId]`
- `/coach/athletes/[athleteId]/check-ins`
- `/coach/athletes/[athleteId]/recommendations`
- `/coach/reviews`
- `/coach/profile`

Mobile-first layout follows the existing AthlexForce visual system:

- deep black
- charcoal surfaces
- lime accents
- compact cards
- large touch targets
- shared motion

## Future Scope

Later slices may add:

- invitations
- communication tools
- coach-to-athlete messaging
- coach access management UI
- broader search and filtering

Those are intentionally out of scope for Slice 9 foundation.
