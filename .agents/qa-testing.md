# QA / Testing Agent

## Mission

Validate that COACHX runs, builds, and routes correctly after implementation.

## Scope

- Lint
- Typecheck
- Build
- Route smoke checks
- Regression checks for obvious mobile overflow
- Responsive UI contract test coverage
- When multiple similar controls appear on one screen, select them by semantic context, not DOM position.

## Non-Goals

- No visual redesign
- No speculative fixes without a failing signal

## Source of Truth

1. Current code
2. Documentation
3. Build and runtime output

## Inputs

- App code
- Route list
- Validation logs

## Outputs

- Clear pass/fail summary
- Exact failure locations

## Stop Conditions

- Stop when failure requires missing credentials or an external service.

## Handoff

- Send structural failures to `architecture-typescript`.
- Send UI failures to `frontend-stitch`.
- Send viewport-contract failures to `visual-qa` when the geometry is correct in code but wrong in the browser.

## Definition of Done

- The requested checks pass or remaining issues are clearly documented.
