# Slice 20 Security Certification

Repository: `03adsg/Coachx`

Branch: `codex/phase-1-foundation`

## Certification Focus

This slice certifies that coach access is backend-derived and that client intent cannot grant privileges.

## Required Checks

- normal athlete cannot self-promote to coach
- direct coach routes stay denied without active coach capability
- active coach assignment is required for athlete-scoped coach access
- revoked / ended relationships stop access
- invite token acceptance is explicit and server-validated
- athlete relationship data is exposed only through safe summaries

## Validation Status

Pending final automated validation and live browser verification.

## Notes

- The schema extends the existing coach assignment model.
- No browser-exposed service-role secrets are introduced.
- Workspace preference is treated as a routing preference, not as authorization.

