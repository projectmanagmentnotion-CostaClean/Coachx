# AthlexForce Agent Routing

## Common Tasks

- `Implement Calendar from Stitch` -> `architecture-typescript` + `frontend-stitch` + `visual-qa` + `qa-testing`
- `Audit mobile visual drift` -> `visual-qa`
- `Refactor shared models` -> `architecture-typescript`
- `Fix build errors` -> `qa-testing` + `architecture-typescript` if the failure is structural
- `Add or adjust screen transitions` -> `cinematic-frontend-gsap` + `frontend-stitch` + `visual-qa`
- `Design feedback / confirmations / undo` -> `feedback-interaction-ux` + `frontend-stitch` + `visual-qa`
- `Auth / session / recovery UX` -> `auth-security-ux` + `architecture-typescript` + `frontend-stitch` + `qa-testing`
- `Identity / role / relationship gateway` -> `identity-role-security-architect` + `athlete-flow-architect` + `architecture-typescript` + `qa-testing`
- `Workout state machine / active flow motion` -> `workout-active-flow-motion` + `cinematic-frontend-gsap` + `frontend-stitch` + `visual-qa` + `qa-testing`
- `Exercise detail / alternatives / swap UX` -> `frontend-stitch` + `visual-qa` + `workout-active-flow-motion`
- `Media System` -> `media-system-architect` + `frontend-stitch` + `visual-qa` + `qa-testing`
- `Performance analytics / motion visualization` -> `data-visualization-motion` + `frontend-stitch` + `visual-qa` + `qa-testing`
- `Immersive progress / achievements` -> `motivational-immersion-ux` + `frontend-stitch` + `visual-qa` + `qa-testing`
- `Global feedback / motion polish` -> `feedback-motion-system` + `frontend-stitch` + `visual-qa` + `qa-testing`
- `I18n / locale QA` -> `i18n-exhaustive-auditor` + `language-selector-ux-auditor` + `visual-qa` + `qa-testing`
- `Live browser audit` -> `live-product-flow-audit` + `qa-testing`
- `Web / PWA notifications` -> `pwa-notifications-architect` + `qa-testing`

## Collaboration Order

1. `architecture-typescript` verifies boundaries and data contracts.
2. `frontend-stitch` implements or updates the UI.
3. `visual-qa` checks fidelity, spacing, and motion drift.
4. `qa-testing` validates lint, typecheck, build, and route smoke.

## Routing Notes

- There is no separate redundant agent file for `exercise-detail-swap-ux`; route that work through the agents above.
- Feedback, immersive progress, and live audit work already have dedicated agent coverage in `.agents/`.
- All routes must respect the canonical production security, design, and roadmap order.
