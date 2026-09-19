---
name: token-optimizer
description: Match the model to the task. Use when the Planner breaks a spec into tasks, when any agent is about to dispatch a subagent (Agent tool), or when a delegated task fails and someone asks "retry or escalate?". The high tier plans and reviews; each task runs on the cheapest tier that can be independently verified. Policy in memory/model-routing.md.
---

# Token Optimizer — plan high, execute at the matched tier, verify independently

> The strongest model **decides**. The cheapest model **that can be verified** does the work.
> Cheap execution is safe only because the Reviewer and the type/lint/build gate stay on.

Policy (tiers → models, floors, budget modes) lives in **`memory/model-routing.md`** — this
skill is the method; that file is what you tune.

## 1. Plan on the high tier
The Planner (T2) writes the spec **and** the task table (`templates/spec.md` → "Task breakdown
& model routing"). Every row names: files, tier, an **objective acceptance check**, and a
one-line reason for the tier. A task without an acceptance check cannot go below T2 — there is
nothing to verify it against.

## 2. Classify each task — first match wins
1. **T2** — sets/changes a pattern (ADR), cross-cutting (>5 files or >1 layer), concurrency,
   migration design, authorization/RLS design, perf- or security-sensitive logic, root-causing a
   non-obvious bug, or the requirements are still ambiguous.
2. **T0** — read-only recon (locate / map / summarize / run tests and report) **or** a
   mechanical edit fully specified by the spec (≤2 files, zero design decisions) with an
   objective check.
3. **T1** — everything else: fully specified implementation with a check.

**Floors override the match:** sensitive-surface code (DB / Auth / authorization / Storage /
API) never runs below T1. Planner and Reviewer never run below T2. Borderline → budget mode
decides (economy: down · default: Planner's call · thorough: up).

**T3 (`fable`) has exactly two triggers**, both decided by the Orchestrator and applied per
dispatch (`model: fable`), never as a frontmatter default:
- **Planner at T3** when the request is *genuinely ambiguous*: still underspecified after the
  three questions, or open-ended enough to need `brainstorming` and touching a sensitive surface.
- **Reviewer at T3** when the diff is *security-heavy*: auth / session handling, authorization
  or RLS policies, storage policies, payments, secrets or crypto, input validation on an
  unauthenticated route.
A routine plan or review stays on T2. T3 is not a Coder tier and not an escalation rung.

Split, don't average: a task that is "mostly mechanical plus one design decision" becomes a
T2 decision task and a T0/T1 execution task.

## 3. Dispatch with the tier named
Dispatch the Coder with the **Agent tool and the `model` parameter set to the tier's alias**
(per-invocation model takes precedence over the agent's frontmatter default):

```
Agent(subagent_type: "coder", model: "haiku" | "sonnet" | "opus",
      prompt: <self-contained brief>)
```

The brief is the only context the subagent has. Include: the spec section verbatim, the exact
files, the acceptance check, the branch, "do not widen scope", and the escalation clause:
*"If you hit a decision the spec does not settle, stop and return `ESCALATE: <reason>` — do not
guess."* Read-only recon goes to the built-in `Explore` agent at `haiku`.

## 4. Escalate, never thrash, never route down
- Fails its check **twice** at a tier, or returns `ESCALATE:` → re-dispatch **one tier up**
  with the failure report attached. Never a third try at the same tier. Never re-route down.
- T2 fails twice → the user decides, with both failure reports in hand.
- Record every escalation in the PR ("routed T1→T2 because …"); it is evidence for re-tuning.

## 5. Verification is never cut
The Reviewer (T2) reads the full diff + spec regardless of which tiers produced it, and the
gate runs on every PR. Budget modes change **who executes**, never how much is verified.

## 6. Measure, then re-tune from evidence
`.claude/hooks/dispatch-ledger.mjs` logs every subagent start (agent, model) to
`.claude/token-optimizer/ledger.jsonl`; `/routing` summarizes it. Judge **cost per completed
task**, not per request — a cheap attempt that escalates still paid for the cheap attempt.
Move a task class up a tier after two escalations of the same kind; move one down only after
several clean runs with an objective check. Never re-tune on a single run.

## Red flags
A `haiku` Reviewer or Planner · a T0 row whose text says "decide", "design", "figure out" ·
a task with no acceptance check below T2 · retrying a failed task at the same tier a third
time · routing down after a failure · skipping the Reviewer "because it was only Haiku work" ·
a brief that assumes the subagent saw the conversation.
