# Confirmation Matrix

| Action | Risk | Reversible | Feedback | Confirmation needed? | Undo? | Component |
| --- | --- | --- | --- | --- | --- | --- |
| Sign in | Medium | Yes | Success / error toast | No | No | Auth entry |
| Sign up | Medium | Yes | Success / error toast | No | No | Auth entry |
| Sign out | Low | Yes | Info toast | No | No | Auth entry / profile |
| Save onboarding step | Low | Yes | Inline + light confirmation | No | Yes if local draft matters | Onboarding flow |
| Complete onboarding | High | No | Hero success | No | No | Onboarding flow |
| Start workout | Medium | Yes | Inline confirmation | No | No | Today / day view |
| Complete set | Low | Yes | Inline state change | No | Yes, if local draft exists | Workout log |
| Undo set completion | Low | Yes | Inline undo affordance | No | Yes | Workout log |
| Swap exercise | Medium | Yes | Warning + success/error | Sometimes | Yes | Workout log |
| Finish workout | High | No | Hero success | Yes if incomplete data remains | No | Workout session |
| Select meal | Low | Yes | Inline state change | No | Yes | Nutrition screen |
| Mark meal eaten | Low | Yes | Inline state change | No | Yes | Nutrition screen |
| Log water | Low | Yes | Inline state change | No | Yes | Nutrition screen |
| Toggle supplement | Low | Yes | Inline state change | No | Yes | Nutrition screen |
| Save measurement | Medium | Yes | Toast / light confirmation | No | Yes | Progress measurements |
| Upload photo | High | Partially | Toast + state change | No | Sometimes | Progress photos |
| Replace photo | High | Partially | Warning + toast | Yes | Limited | Progress photos |
| Remove photo | High | No | Destructive dialog | Yes | No | Progress photos |
| Submit weekly check-in | High | No | Hero success | Yes if fields are incomplete | No | Weekly check-in |
| Request recommendation | Medium | Yes | Pending + ready/error | No | No | AI recommendation |
| Accept recommendation | Medium | Yes | Success/info | No | Yes | Recommendation review |
| Create change proposal | High | Yes | Review-ready toast | No | Yes | Program change review |
| Apply change proposal | High | No | Hero success / failure recovery | Yes | No | Program change apply |
| Save locale | Low | Yes | Toast | No | Yes | Profile / settings |
| Save notification preferences | Low | Yes | Toast | No | Yes | Profile / settings |
| Coach review check-in | Medium | Yes | Toast | No | Yes | Coach panel |
| Coach approve recommendation | Medium | Yes | Toast | No | Yes | Coach panel |
| Coach approve proposal | High | Yes | Toast / hero only if apply occurs later | No | Yes | Coach panel |

## Rules

- Routine actions should not block the user.
- Irreversible actions require explicit language.
- Program mutation is never implied by recommendation acceptance.
- Apply actions require a distinct confirmation path.
- Error copy must state what changed and what did not change.

