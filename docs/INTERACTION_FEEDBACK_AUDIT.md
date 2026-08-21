# Interaction Feedback Audit

## Scope

This audit covers athlete and coach actions that require predictable response, confirmation, or recovery. It is intentionally focused on user-visible behavior, not backend policy.

## Findings

### Missing or inconsistent feedback before this slice

- Several async actions relied on generic labels such as `Working...` instead of outcome-specific text.
- Success was sometimes implied by navigation or row updates without a dedicated acknowledgment.
- Error messages were inconsistent in tone and placement.
- High-value actions did not consistently differentiate between review, apply, and completion.
- Locale changes and settings saves did not have a unified interaction memory layer.

### Excessive feedback before this slice

- Some flows relied on generic loading language that did not tell the user what was happening.
- Some route messages exposed implementation language instead of product language.

### Inconsistent feedback before this slice

- Success copy varied by component.
- Error copy mixed product language and technical language.
- Milestone actions and routine saves used the same style.
- Feedback location was not standardized.

## Action inventory

| Action | User intent | Reversible | Risk | Latency | Current feedback | Required feedback |
| --- | --- | --- | --- | --- | --- | --- |
| Sign in | Restore account access | Yes | Medium | Short | Generic form response | Success/error + session state |
| Sign up | Create account | Yes | Medium | Short | Generic form response | Success/error + next step |
| Sign out | End session | Yes | Low | Short | No consistent acknowledgment | Success/info |
| Session expired | Reauthenticate | Yes | Medium | Immediate | Route-level redirect only | Warning/dialog |
| Answer onboarding question | Record profile context | Yes | Low | Immediate | Inline state change | Inline state change |
| Next / back onboarding | Move through steps | Yes | Low | Immediate | Navigation only | Button press + progress state |
| Save onboarding snapshot | Persist setup | Yes | Medium | Short | Mixed copy | Light confirmation |
| Onboarding complete | Finish setup | No | High | Short | Page transition only | Hero success |
| Start workout | Enter active session | Yes | Medium | Immediate | Navigation only | Inline or light confirmation |
| Complete set | Save set data | Yes | Low | Short | Mixed inline state | Inline confirmation |
| Undo set completion | Restore last set | Yes | Low | Immediate | Not standardized | Undo-capable feedback |
| Swap exercise | Change performed movement | Yes | Medium | Short | Mixed copy | Warning + success/error |
| Finish workout | Close session | No | High | Short | Summary screen only | Hero success |
| Select meal | Record meal choice | Yes | Low | Immediate | Inline state | Inline state |
| Mark eaten | Confirm meal consumed | Yes | Low | Immediate | Inline state | Inline state |
| Log water | Update hydration | Yes | Low | Immediate | Inline state | Inline state |
| Toggle supplement | Update supplement status | Yes | Low | Immediate | Inline state | Inline state |
| Save measurement | Persist body measurement | Yes | Medium | Short | Generic save copy | Light confirmation |
| Upload photo | Persist progress photo | Partially | High | Medium | Mixed copy | Progress + success/error |
| Replace photo | Overwrite photo slot | Partially | High | Medium | Unclear confirmation | Warning + success/error |
| Remove photo | Delete photo | No | High | Immediate | No unified confirmation | Destructive confirmation |
| Save check-in draft | Persist answer | Yes | Medium | Short | Mixed copy | Light confirmation |
| Submit check-in | Finalize weekly form | No | High | Short | Completion screen only | Hero success |
| Request recommendation | Ask AI for guidance | Yes | Medium | Medium | Mixed fallback copy | Pending + ready/error |
| Accept recommendation | Record review decision | Yes | Medium | Short | Not always explicit | Success/info, no program mutation |
| Create proposal | Build a change proposal | Yes | High | Short | Mixed copy | Review-ready confirmation |
| Apply proposal | Mutate program | No | High | Short | Mixed copy | Hero success / error recovery |
| Save locale | Change language | Yes | Low | Short | No unified feedback | Light confirmation |
| Save notification preferences | Update reminders | Yes | Low | Short | No unified feedback | Light confirmation |
| Coach review check-in | Record coach decision | Yes | Medium | Short | Mixed copy | Success/info |
| Coach approve recommendation | Record coach decision | Yes | Medium | Short | Mixed copy | Success/info |
| Coach approve proposal | Record coach decision | Yes | High | Short | Mixed copy | Success/info, not apply |

## Recommended system rules

- Use inline feedback for repetitive actions.
- Use toast feedback for async confirmation.
- Use hero feedback only for major milestones.
- Use dialogs only when the user must actively decide.
- Keep recovery copy calm, specific, and actionable.

## Current implementation notes

- A shared feedback provider now centralizes transient messages and recent interaction memory.
- The provider stores a short recent-history queue and dedupes identical notices.
- Higher-value flows now emit consistent success/error notices.

## Remaining opportunities

- Expand direct inline status patterns in controls that already resolve in place.
- Normalize more button labels to state-specific copy.
- Continue replacing generic loading language with action-specific copy where useful.
