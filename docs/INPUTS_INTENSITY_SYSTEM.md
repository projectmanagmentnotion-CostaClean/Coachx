# AthlexForce Inputs & Intensity System

This document is the canonical reference for Slice 27 numeric entry, set logging, and intensity selection behavior.

## Scope

- Workout load, reps, and RIR entry in the live workout logger.
- Logged-set editing for completed workout sets.
- Progress measurement entry on the progress flow.
- Shared parsing, stepper, and validation behavior across these surfaces.

## Core rules

- Accept both dot and comma decimals.
- Never rely on browser `type="number"` semantics for parsing or persistence.
- Keep stepper targets at touch-safe size.
- Preserve actual logged values separately from plan/prescription values.
- Show localized validation when a value is blank, invalid, out of range, or otherwise not usable.
- Treat RIR as the discrete 0-5+ family.
- Treat RPE as the discrete 6-10 family when intensity controls are surfaced.

## Workout logger behavior

- The current set editor uses shared numeric controls for load and reps.
- RIR is selected from discrete option chips rather than a free-form number input.
- Completed sets can be reopened, edited, and saved without rewriting the prescription history.
- Coach-managed athletes still log actual performance normally; only the prescription area is marked read-only.

## Progress measurement behavior

- Measurement inputs use the same parser and validation copy as workout numeric entry.
- Comma decimals are accepted and normalized before persistence.
- Existing saved values remain available when a field is left blank.

## Reference package

- Slice 27 authority package: `docs/design-references/slice-27/`
- Slice 27 authority note: `docs/design-references/slice-27/AUTHORITY.md`
- Slice 27 source audit: `docs/design-references/slice-27/SOURCE_AUDIT.md`
- Slice 27 spec: `docs/design-references/slice-27/spec/athlexforce_inputs_intensity_spec_v1.1.md`

