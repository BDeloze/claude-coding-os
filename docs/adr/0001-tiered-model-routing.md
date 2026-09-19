# ADR 0001 — Tiered model routing (the token optimizer)

**Status:** proposed
**Date:** 2026-09-19
**Deciders:** Ben

## Context

Every role in the Coding OS ran on the session model. Planning, review, and a one-line copy
change all cost the same per token, and the expensive model spent most of its tokens on work
that did not need it. The wanted shape: a **high-capability model plans precisely**, and each
resulting task runs on a model **matched to its difficulty**.

Claude Code now supports this natively: subagent frontmatter takes `model` (`haiku` /
`sonnet` / `opus` / `fable` / full ID / `inherit`) and `effort`; the Agent tool takes a
per-invocation `model` that outranks the frontmatter; `SubagentStart` hooks receive the
resolved model; `PreToolUse` hooks on the Agent tool can deny a dispatch. Hooks cannot
rewrite a subagent's model, so enforcement has to be deny-or-warn, not silent rerouting.

### Prior art surveyed (open source)

| Project | Shape | Takeaways kept | Not adopted |
|---|---|---|---|
| [musistudio/claude-code-router](https://github.com/musistudio/claude-code-router) (MIT) | Local proxy; routes requests by scenario (default / background / think / long-context) to any provider. | The idea that background/compaction traffic is a big hidden cost. | Proxy layer and cross-vendor routing — out of scope for a files-only OS. |
| [lm-sys/RouteLLM](https://github.com/lm-sys/RouteLLM) | Trained binary router (strong vs weak model) on query complexity. | "Route by difficulty, verify quality" framing. | Needs training data and a serving layer; our router is the Planner. |
| [Adityaraj0421/gearbox](https://github.com/Adityaraj0421/gearbox) (MIT) | Plugin: T0 scout/grunt (Haiku), T1 builder (Sonnet), T2 architect (Opus); escalate one tier after two fails; hard floors for auth/payments/migrations; Haiku verifier; JSONL telemetry. | Tier names, the escalation ladder, hard floors, the ledger. | The Haiku verifier — our Reviewer already exists and runs high. |
| [AqueGen/model-routing](https://github.com/AqueGen/model-routing) (MIT) | Pinned subagents (Sonnet scout/implementer, Haiku test-runner, Opus reviewer); PostToolUse dispatch counter; "the strongest model thinks, cheaper models grind". | The principle, the dispatch counter, Opus reviewer. | Extra pinned agents — we keep the six roles and pass the tier per dispatch. |
| [Bijaykars/claude-code-autoroute](https://github.com/Bijaykars/claude-code-autoroute) (MIT) | Four tiers incl. the top model for judgment only; ledger via PreToolUse/SubagentStart/SubagentStop; experimental self-tuning agent. | Ledger from `SubagentStart` (records the *resolved* model). | Automatic self-tuning — we re-tune from evidence, by hand, never on one run. |
| [tzachbon/claude-model-router-hook](https://github.com/tzachbon/claude-model-router-hook) (MIT) | Keyword classifier at `UserPromptSubmit`; writes next-session model; effort per class. | Effort as a first lever. | Session-level switching — wrong granularity; we route per task. |
| [Zihao-Wu06/claude-code-orchestrate](https://github.com/Zihao-Wu06/claude-code-orchestrate) (CC BY-NC) | Orchestrate skill with scout/fast-worker/deep-reasoner + cross-vendor peer; budget modes that change *who* runs, never verification. | Budget modes (economy/default/thorough); "verification is never cut". | Non-commercial license; cross-vendor peer. |
| [egorfedorov/claude-context-optimizer](https://github.com/egorfedorov/claude-context-optimizer) (MIT) | Context-waste tracking, read cache, budget alerts. | Complementary; not a router. | — |

Anthropic's own cost guidance (the `claude-api` skill's cost-optimization reference) adds two
constraints we adopted: **judge cost per completed task, not per request** (a cheap attempt
that fails and escalates still paid for the attempt), and **sweep effort before dropping a
model tier** — the strongest model at low effort often beats a weaker model at high effort.

## Decision

Add a **token optimizer** as a method + policy, not new infrastructure:

- **Planner** runs on the high tier (`model: opus`, `effort: high`) and the spec gains a
  **task table**: files, tier, objective acceptance check, reason. A task with no check cannot
  go below T2.
- **Three tiers** in `memory/model-routing.md` (T0 haiku · T1 sonnet · T2 opus), first-match
  classification rules, **floors** (Planner/Reviewer ≥ T2, Ops ≥ T1, sensitive-surface code ≥
  T1), an **escalation ladder** (two failures → one tier up, never down), and **budget modes**
  that change who executes, never what is verified.
- **Dispatch per task** with the Agent tool's `model` parameter; the six roles stay the six
  roles, each with a frontmatter default tier.
- **Two hooks:** `routing-guard.mjs` (PreToolUse on Agent — denies a role below its floor,
  reminds when no tier is named) and `dispatch-ledger.mjs` (SubagentStart — JSONL ledger of the
  resolved model; `/routing` reports it).
- **Reviewer stays high** and reviews everything with the same rigor; the gate still runs.

## Options considered

### Option A — Pinned tier agents (scout / builder / architect)
- **Pros:** per-tier effort in frontmatter; what most plugins do. · **Cons:** breaks the
  six-role model; tier becomes a property of the agent, not the task; three Coder prompts drift.

### Option B — Per-task tier passed at dispatch (chosen)
- **Pros:** tier is a plan decision, recorded in the spec; six roles unchanged; per-invocation
  model is precedence #1 in Claude Code. · **Cons:** effort cannot be set per dispatch
  (frontmatter/session only); relies on the dispatcher passing the parameter (mitigated by the
  guard hook's reminder and the ledger).

### Option C — Proxy router (claude-code-router style)
- **Pros:** transparent, any provider. · **Cons:** infrastructure outside the repo, routes by
  request shape rather than by task, no plan-time knowledge.

## Rationale

The OS already has the two things cheap execution needs to be safe — a precise spec and an
independent high-tier Reviewer — so the cheapest correct place to decide the tier is the plan.
Option B keeps the tier next to the acceptance check that justifies it.

## Consequences

- **Positive:** most implementation tokens move to Sonnet/Haiku; the expensive model is spent
  on planning and review, where it changes outcomes.
- **Negative:** a badly specified task at T0/T1 costs an escalation; effort is per agent, not
  per task; hooks fire on every Agent dispatch (cheap, but present).
- **Neutral / follow-up:** re-tune floors from the ledger after real use; consider `fable`
  for Planner/Reviewer on plans that include it; a future eval harness could replay the task
  table against tiers.

## Validation

- `/routing` after two weeks: share of dispatches at T0/T1 vs T2, and escalation count per
  task class. Success = a majority of Coder dispatches below T2 with escalations under ~10%
  and no Reviewer-caught regression attributable to a cheaper tier.
- Evals: `evals/planner/task-routing.md`, `evals/coder/escalates-instead-of-guessing.md`,
  `evals/token-optimizer/escalation-ladder.md`.
