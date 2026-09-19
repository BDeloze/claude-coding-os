# Spec — <feature name>

**Status:** draft | approved | shipped
**Author:** Ben
**Date:** YYYY-MM-DD
**Branch:** `feat/<scope>-<subject>`
**Sensitive surface:** yes / no (DB / Auth / authorization / Storage / API)

## Goal
<!-- One paragraph. The problem and the chosen solution at a high level. -->

## Non-goals
<!-- Explicitly out of scope. Prevents scope creep mid-build. -->
-

## Top 3 risks
1.
2.
3.

## Smallest shippable version
<!-- What could ship this week if everything went well. -->

## Target files
<!-- By path, using this project's layout (see memory/stack-profile.md). -->
-

## Task breakdown & model routing
<!-- One row per task the Coder will be dispatched for. Tiers per memory/model-routing.md
     (T0 haiku · T1 sonnet · T2 opus). A task with no objective acceptance check cannot go
     below T2. Sensitive-surface tasks never go below T1. Split design decisions from
     mechanical work. Budget mode: economy | default | thorough. -->
**Budget mode:** default

| # | Task | Files | Tier | Acceptance check | Why this tier |
|---|------|-------|------|------------------|---------------|
| 1 | | | T1 | | |

## Migration / schema impact
- **Migration name:** `<descriptive_name>`
- **Tables / indexes / constraints / cascades:**
- **Backfill required:** yes / no — if yes, what.

## Authorization / Auth / Storage impact
- **Authorization (policies / RLS / access rules):** every exposed table/path touched + the change.
- **Storage:** buckets, paths, MIME types, policies.
- **Auth:** any change to session / refresh / cookie handling.

## Performance impact
- vs. budgets in `engineering-rules.md` §12. New query patterns / indexes / caches.

## Breaking changes
- API contract · public components · env vars.

## Feature flag
- **Name:** `<feature.flag.name>` · **Staging default:** on/off · **Prod ramp:** 1% → 10% → 100%.

## Staging checklist (sensitive changes — every box green before prod)
- [ ] Migration applies cleanly. No drift.
- [ ] Critical endpoints respond (expected status / shape).
- [ ] Authorization verified as a non-admin user (blocked vs allowed).
- [ ] Storage policies verified (if applicable).
- [ ] Critical UI flow walks end-to-end.
- [ ] Perf budgets hold.
- [ ] Feature flag at intended staging state.

## Rollback plan
<!-- Concrete steps. Note any one-way doors. -->
1.

## Open questions
-
