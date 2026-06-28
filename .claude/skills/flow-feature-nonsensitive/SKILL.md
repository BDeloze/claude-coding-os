---
name: flow-feature-nonsensitive
description: Workflow for a frontend-only feature with NO API contract, DB schema, authorization, storage, or auth change. Use for UI-only changes. Lightweight spec, no staging gate.
---

# Flow — Feature (non-sensitive)

Use when the change touches **only** the frontend — no API contract change, no schema change,
no authorization / storage / auth change.

```
You → Orchestrator → Planner (lightweight) → Coder → Reviewer → (you approve)
   → merge → deploy → Tracker (docs if needed)
```

## Steps

1. **Request.**
2. **Orchestrator** confirms non-sensitive, confirms a branch, routes to Planner.
3. **Planner — lightweight spec.** Goals, non-goals, target files, acceptance criteria. The
   staging checklist is **not** required.
4. **Coder** implements on a fresh branch per the stack profile's UI conventions, runs the
   gate, opens a PR.
5. **Reviewer** reads diff + spec; verdict.
6. **You approve and merge** → deploy.
7. **Tracker** logs the entry; updates docs only if user-visible behavior changed
   (`[docs-updated]`), else `[docs-noop]`.

## Gate check
If during work it turns out the change *does* touch a sensitive surface, **stop and switch to
`flow-feature-sensitive`** — re-route through the staging gate.
