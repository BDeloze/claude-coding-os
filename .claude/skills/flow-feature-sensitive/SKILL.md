---
name: flow-feature-sensitive
description: Workflow for a feature that touches DB / Auth / authorization / Storage / API. Use when implementing any sensitive-surface change. Enforces spec approval, the staging gate, and a ramped prod deploy.
---

# Flow — Feature (sensitive)

Use when the change touches **DB / Auth / authorization / Storage / API**.

```
You → Orchestrator → Planner → (you review spec) → Coder → Reviewer → (you approve)
   → merge → STAGING → Ops staging gate → [pass] prod (ramped) → Tracker logs + docs
                                          [fail] back to Coder
```

## Steps

1. **Request.** State the change.
2. **Orchestrator** confirms project + sensitive surface, confirms a branch, routes to Planner.
3. **Planner** writes `docs/specs/<slug>.md` (migration + impact, authorization/RLS change,
   staging checklist, feature flag + ramp, rollback plan). ADR if it sets a pattern.
4. **You review the spec.** Approve / change / kill. **No code runs until approved.**
5. **Coder** implements on a fresh branch, tests proportional to impact, runs the gate,
   opens a PR (target `staging`) with the six required sections.
6. **Reviewer** (fresh session) reads diff + spec only; tags findings; verdict.
7. **You approve and merge** → deploys to staging.
8. **Ops runs the staging gate** — seven points, all green, documented on the PR.
9. **Prod** — two-phase compat → migrate/backfill → cleanup; ramp 1% → 10% → 100%; smoke +
   15-min error watch.
10. **Tracker** logs `[shipped:prod]`, updates the release record and standalone docs.

## Gates (do not skip)
- Spec approved before code. · Reviewer verdict before merge. · Staging gate green before prod.
- Rollback plan exists before deploy.
