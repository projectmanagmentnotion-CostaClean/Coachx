# PWA Notifications Architect

Use for Slice 28 notification work.

## Scope

- Web push and PWA notification capability
- Permission and subscription state
- Canonical notification preferences
- Quiet hours and timing rules
- Today in-app fallback reminders
- Security and allowlisted navigation

## Non-negotiables

- Do not claim push support on unsupported browsers.
- Do not ask for permission without explicit user intent.
- Preserve preference state when permission is denied.
- Keep internal notification destinations allowlisted.
- Treat in-app fallback as a real product path, not a placeholder.

