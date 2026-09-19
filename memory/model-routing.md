# Model Routing Policy — the token optimizer's swappable layer

The **token optimizer** is a method (`.claude/skills/token-optimizer/SKILL.md`) plus this
policy. The method is generic; this file is what you tune per project or per plan tier.
`.claude/hooks/routing-guard.mjs` reads the JSON block below, so keep it valid JSON.

> Principle: **the strongest model decides, the cheapest model that can be verified does.**
> The Planner runs on the high tier and produces a spec whose task table names a tier per
> task. Each task is then dispatched to the Coder at that tier. Cheaper execution is only
> safe because the Reviewer (high tier) and the type/lint/build gate stay on — never cut those.

## Tiers

| Tier | Model alias | When | Never for |
|---|---|---|---|
| **T0** | `haiku` | Read-only recon (locate, map, summarize, run tests and report). Mechanical edits fully specified by the spec: rename, copy, config value, ≤2 files, **zero design decisions**, an objective check exists. | Anything that says "decide", "design", "figure out", or touches a sensitive surface. |
| **T1** | `sonnet` | Fully specified implementation with an objective acceptance check (tests / typecheck / documented manual check). Most feature and bug-fix tasks land here. | Cross-cutting design, concurrency, root-causing a non-obvious bug. |
| **T2** | `opus` | Sets or changes a pattern (ADR), cross-cutting (>5 files or >1 layer), concurrency / races, migration design, authorization / RLS policy design, perf- or security-sensitive logic, non-obvious debugging, ambiguous requirements. Planning and review always run here. | — (top tier; if T2 fails twice the user decides). |

`fable` (where available) is a valid T2 override for the Planner or Reviewer on the hardest
work — set it in the agent frontmatter or per dispatch. Model aliases resolve to the latest
model of that family in Claude Code, so this file never pins versions.

## Floors (the guard hook enforces these)

- **Planner** and **Reviewer** never run below T2. Planning quality is what makes cheap
  execution safe; a cheap reviewer defeats the whole scheme.
- **Ops** never runs below T1 (deploys and incidents).
- **Coder** may run at any tier; the plan's task table decides. **Sensitive-surface tasks**
  (DB / Auth / authorization / Storage / API) never run below T1.
- **Tracker** and read-only exploration default to T0.

## Escalation ladder

1. A task fails its acceptance check **twice** at a tier, or the agent returns
   `ESCALATE: <reason>` → re-dispatch **one tier up** with the failure report attached.
2. **Never route a failed task down.** Never retry a third time at the same tier.
3. T2 fails twice → stop and bring it to the user with the two failure reports.

## Budget modes

Set the mode when you start work (`/feature … --thorough`, or just say it). It changes **who
runs**, never how carefully anything is verified.

| Lever | economy | default | thorough |
|---|---|---|---|
| Borderline T0/T1 or T1/T2 task | route down | Planner's judgment | route up |
| Session effort (`/effort`) | `medium` | leave as is | `high`+ |
| Reviewer + gate | always | always | always |

`CLAUDE_CODE_SUBAGENT_MODEL` sets the fallback for agents with no `model` in their
frontmatter; `CLAUDE_CODE_SUBAGENT_MODEL_FORCE` pins **every** subagent to one model and
disables routing — use it only for a deliberate "everything on Sonnet" economy session.

## Machine-readable policy

`routing-guard.mjs` parses this block. `rank` orders the aliases; `floor` is the lowest tier
an agent may be dispatched at; `default` is what the agent's frontmatter is expected to carry.
Set `"enforce": false` to turn hard denials into warnings.

```json
{
  "enforce": true,
  "rank": { "haiku": 0, "sonnet": 1, "opus": 2, "fable": 3 },
  "tiers": {
    "T0": { "model": "haiku" },
    "T1": { "model": "sonnet" },
    "T2": { "model": "opus" }
  },
  "agents": {
    "orchestrator": { "default": "T1", "floor": "T0" },
    "planner":      { "default": "T2", "floor": "T2" },
    "coder":        { "default": "T1", "floor": "T0" },
    "reviewer":     { "default": "T2", "floor": "T2" },
    "ops":          { "default": "T1", "floor": "T1" },
    "tracker":      { "default": "T0", "floor": "T0" }
  },
  "escalation": { "failuresBeforeEscalate": 2, "neverRouteDown": true }
}
```
