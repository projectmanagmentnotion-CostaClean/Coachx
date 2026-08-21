# AthlexForce Agents

## Current Specialized Agents

- `architecture-typescript.md` - Next.js structure, TypeScript models, and data boundaries.
- `frontend-stitch.md` - Stitch-faithful screen implementation and shared UI.
- `visual-qa.md` - Stitch comparison, spacing, typography, and motion drift checks.
- `qa-testing.md` - lint, typecheck, build, and route-level regression validation.
- `responsive-ui-contract.md` - repository-level responsive geometry contract and viewport gate.
- `auth-security-ux.md` - secure entry, session persistence, and recovery UX.
- `identity-role-security-architect.md` - capability, workspace, and relationship security.
- `athlete-flow-architect.md` - athlete-side route hierarchy and command-center clarity.
- `workout-active-flow-motion.md` - workout state machine and cinematic active-flow motion.
- `cinematic-frontend-gsap.md` - broader motion, overlays, and visual stability.
- `i18n-exhaustive-auditor.md` - exhaustive localization QA and copy source tracing.
- `language-selector-ux-auditor.md` - language selector hierarchy and locale persistence QA.
- `live-product-flow-audit.md` - live-browser route discovery and gap registration.
- `feedback-interaction-ux.md` - feedback, confirmations, undo, and interaction memory.
- `feedback-motion-system.md` - global feedback hierarchy, contextual success, and GSAP motion centralization.
- `data-visualization-motion.md` - analytics, charts, and motion-safe progress surfaces.
- `motivational-immersion-ux.md` - restrained achievement and progress immersion.

## Coordination Order

1. `architecture-typescript` for structure, contracts, and boundaries.
2. `auth-security-ux` and `identity-role-security-architect` for auth or capability work.
3. `athlete-flow-architect` for route hierarchy and athlete-flow clarity.
4. `frontend-stitch` for screen implementation.
5. `workout-active-flow-motion` and `cinematic-frontend-gsap` for motion-heavy UI.
6. `visual-qa` for fidelity and drift review.
7. `i18n-exhaustive-auditor` and `language-selector-ux-auditor` for locale work.
8. `feedback-interaction-ux`, `feedback-motion-system`, `data-visualization-motion`, and `motivational-immersion-ux` for their domains.
9. `live-product-flow-audit` for live browser verification.
10. `responsive-ui-contract` for viewport contracts, scroll containment, and CTA geometry.
11. `qa-testing` for lint, typecheck, build, and regression checks.

## Global Rule

All specialized agents inherit the repository source-of-truth order and must not override production security, current app architecture, or canonical design and roadmap docs.
