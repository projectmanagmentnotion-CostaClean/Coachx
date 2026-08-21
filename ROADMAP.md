# AthlexForce Roadmap

## Canonical Runway

- Baseline commit: `750947236c04479e23d2174a71c19e8946ab663d`
- Canonical production: `https://coachxsync1-zeta.vercel.app`
- Canonical Supabase project: `zlblnezbbiimapruazvc`

## Slice Status

| Slice | Status | Notes |
| --- | --- | --- |
| 1-20 | COMPLETE | Foundation, auth, identity, relationship, workout, nutrition, progress, profile, i18n, QA, and security certification are considered complete under the existing certification trail. |
| 21 | COMPLETE | Athlete Flow Architecture is complete. |
| 22 | COMPLETE | Live Workout Experience is complete and established as the production HEAD baseline. |
| 23 | DESIGN COMPLETE / IMPLEMENTATION NEXT | Exercise Detail + Alternatives is documented, but implementation remains next. |
| 24 | DESIGN COMPLETE / IMPLEMENTATION IN PROGRESS | Nutrition UX 2.0. |
| 25 | COMPLETE | Media System. Production ready. |
| 26 | COMPLETE | Feedback + Motion polish. Production ready. |
| 27 | IMPLEMENTATION COMPLETE / CERTIFICATION PENDING | Inputs and intensity refinement. Imported Slice 27 handoff is in the repo; code validation passed, but authenticated mobile visual QA is still pending in this environment. |
| 28 | IMPLEMENTATION IN PROGRESS / CERTIFICATION PENDING | Web/PWA notifications. Canonical Slice 28 architecture, storage, service worker, dispatch path, and test coverage are in the repo; browser QA still needs to be finished against the live production surface. |
| 29 | NEXT | Athlete Private Alpha final certification. |

## Product Principle

- Finish Athlete Private Alpha first.
- Then test with real athletes.
- Then resume the full coach <-> athlete product.
- Coach foundation and security exist now so athlete modes stay architecturally correct.

## Roadmap Order

1. Keep the current athlete surface stable.
2. Add only the next slice when the current slice is visually and functionally converged.
3. Do not move coach analytics or post-alpha coach scope ahead of Athlete Private Alpha.

## Notes

- `ROADMAP.md` is the canonical roadmap for this repository.
- Supporting audit and slice docs remain valid only when they do not conflict with this file.
