# Identity, Role & Relationship System

Repository: `03adsg/Coachx`

Branch: `codex/phase-1-foundation`

## Goal

AthlexForce supports three user experiences without reducing them to a client-side role field:

- independent athlete
- coach-managed athlete
- verified coach

The core rule is simple:

**UI intent never grants authorization.**

## Capability Model

The product resolves capabilities from trusted backend state:

- athlete capability: the authenticated user has an athlete profile and athlete workspace access
- coach capability: the authenticated user has an active coach profile
- coach-managed athlete: the authenticated athlete has an active coach assignment

Capabilities can overlap. A user can be both athlete and coach.

## Workspace Model

Workspace is not authorization. It is a safe display preference:

- athlete workspace
- coach workspace

The selected workspace can only choose among authorized destinations.

## Identity Gateway

New or unresolved users see a first-use gateway:

- I train on my own
- I train with a coach
- I am a coach

The gateway writes a browser preference only. It does not create privileges.

## Relationship Lifecycle

Coach-athlete relationships use the existing assignment model and secure invitation handling:

- invited
- pending
- active
- paused
- ended
- revoked

Acceptance is explicit and server-validated.

## Security Invariants

- client role state cannot create coach access
- direct `/coach` navigation is denied unless the backend says the user is an active coach
- ended or revoked relationships lose access
- coach access to an athlete must be assignment-scoped
- invite tokens are single-use and server validated

## Athlete Relationship Surface

Athletes can see a safe summary of their coach relationship, including coach identity and relationship state, without exposing privileged secrets.

## Prescription vs Actual

Athletes always keep the ability to log what actually happened.

- prescription = what the plan says
- actual = what the athlete records

Coach management can affect prescription, not truthful logging.

## Future-Ready Hooks

The system prepares future surfaces for:

- self-managed change approval
- coach-managed change approval
- workspace switching
- coach suspension handling

