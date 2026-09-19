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
| **T2** | `opus` | Sets or changes a pattern (ADR), cross-cutting (>5 files or >1 layer), concurrency / races, migration design, authorization / RLS policy design, perf- or security-sensitive logic, non-obvious debugging. Planning and review run here by default. | — (if T2 fails twice the user decides). |
| **T3** | `fable` | **Conditional override, two triggers only.** (a) **Planner** when the requirements are *genuinely ambiguous* — still underspecified after the Orchestrator's three questions, or open-ended enough to need `brainstorming` *and* touching a sensitive surface. (b) **Reviewer** when the diff is *security-heavy* — it touches auth / session handling, authorization or RLS policies, storage policies, payments, secrets or crypto, or input validation on an unauthenticated route. | Coder work, routine plans, routine reviews. Not an escalation rung for the Coder. |

T3 is dispatched **per invocation** (`model: fable`), never set as a frontmatter default: the
agent files stay on `opus` so the OS works on plans without Fable. Where Fable is not
available, T3 falls back to T2 and the trigger is noted in the spec / review. Model aliases
resolve to the latest model of that family in Claude Code, so this file never pins versions.

## Floors (the guard hook enforces these)

- **Planner** and **Reviewer** never run below T2. Planning quality is what makes cheap
  execution safe; a cheap reviewer defeats the whole scheme. On a T3 trigger (above) they are
  dispatched at `fable`; the Orchestrator names the trigger in its routing line.
- **Ops** never runs below T1 (deploys and incidents).
- **Coder** may run at any tier; the plan's task table decides. **Sensitive-surface tasks**
  (DB / Auth / authorization / Storage / API) never run below T1.
- **Tracker** and read-only exploration default to T0.

## Escalation ladder

1. A task fails its acceptance check **twice** at a tier, or the agent returns
   `ESCALATE: <reason>` → re-dispatch **one tier up** with the failure report attached.
2. **Never route a failed task down.** Never retry a third time at the same tier.
3. T2 fails twice → stop and bring it to the user with the two failure reports. T3 is not a
   rung on this ladder: a task the Coder cannot finish on Opus is a planning problem, not a
   model problem.

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
an agent may be dispatched at; `default` is what the agent's frontmatter is expected to carry;
`overrides` lists the only per-invocation upgrades above the default and their trigger.
Set `"enforce": false` to turn hard denials into warnings.

```json
{
  "enforce": true,
  "rank": { "haiku": 0, "sonnet": 1, "opus": 2, "fable": 3 },
  "tiers": {
    "T0": { "model": "haiku" },
    "T1": { "model": "sonnet" },
    "T2": { "model": "opus" },
    "T3": { "model": "fable" }
  },
  "agents": {
    "orchestrator": { "default": "T1", "floor": "T0" },
    "planner":      { "default": "T2", "floor": "T2" },
    "coder":        { "default": "T1", "floor": "T0" },
    "reviewer":     { "default": "T2", "floor": "T2" },
    "ops":          { "default": "T1", "floor": "T1" },
    "tracker":      { "default": "T0", "floor": "T0" }
  },
  "overrides": {
    "planner":  { "tier": "T3", "when": "ambiguous" },
    "reviewer": { "tier": "T3", "when": "security-heavy" }
  },
  "escalation": { "failuresBeforeEscalate": 2, "neverRouteDown": true }
}
```
