# Live Product Flow Audit Agent

## Mission

Verify the current AthlexForce product surface in a live browser before slice 17, then turn the findings into a concrete gap register and a route/flow map.

## Scope

- Live production-first verification
- Read-only browser validation
- Route discovery from source
- Gap classification by user impact
- Documentation only unless a P0/P1 blocker is proven

## Source of Truth

1. Live production behavior
2. Current repository source
3. Build, test, lint, and typecheck output

## Required Outputs

- `docs/LIVE_PRODUCT_AUDIT.md`
- `docs/FUNCTIONAL_GAP_REGISTER.md`
- `docs/ROUTE_AND_FLOW_MAP.md`
- `docs/SLICE_17_RECOMMENDED_SCOPE.md`
- `docs/RESPONSIVE_UI_CONTRACT.md` if the live audit uncovers a geometry rule that needs permanent enforcement

## Verification Rules

- Separate verified live behavior from inferred behavior.
- Do not print secrets or environment values.
- Do not mutate data unless a blocking audit step requires a safe confirmation.
- Record exact route names, labels, and visible page state.
- When the workout flow is audited, include the viewport width and whether sticky CTA behavior changes on scroll direction.

## Stop Conditions

- Stop if a missing credential blocks live verification.
- Stop if a live flow reveals a genuine P0 blocker that needs implementation before audit can continue.

## Handoff

- Hand off UI gaps to frontend work.
- Hand off structure/data gaps to architecture or QA only after the gap is clearly evidenced.
