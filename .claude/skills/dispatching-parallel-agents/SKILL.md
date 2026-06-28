---
name: dispatching-parallel-agents
description: Dispatch one agent per independent problem so they work concurrently. Use when there are multiple unrelated failures/tasks across different files or subsystems with no shared state. Do NOT use when problems are related or agents would edit the same code.
---

# Dispatching Parallel Agents

> Adapted from [obra/superpowers](https://github.com/obra/superpowers) `dispatching-parallel-agents`
> (MIT). Local edits: pairs with `using-git-worktrees` for isolation when agents mutate files,
> and routes results back through the Coding OS roles (Reviewer/Ops) before merge.

**Core idea:** one agent per **independent** problem domain, running concurrently. Multiple
dispatch calls **in a single response** = parallel execution.

## When to use
- Multiple unrelated failures across different test files or subsystems.
- Problems understandable independently, with **no shared state**.

## When NOT to use
- Failures are related (fixing one may resolve others).
- You need whole-system understanding first.
- Agents would edit the **same** files (they'd interfere) — if you must, give each its own
  worktree via `using-git-worktrees`.

## How
1. **Group by domain** — partition the work into independent areas.
2. **Write focused, self-contained prompts** — each agent gets exact scope, the files in play,
   clear goals, explicit constraints, and the expected output shape. ("Fix the 3 failures in
   `utils/date.test.ts` caused by the TZ change" — not "fix all the tests".)
3. **Dispatch simultaneously** — issue all the agent calls in one response.
4. **Isolate if they write** — for parallel file edits, run each in its own worktree.
5. **Reconverge through the roles** — collect results, then route through **Reviewer** (and the
   staging gate via **Ops**) before anything merges. Parallelism speeds the work; it does not
   bypass review or the gate.

## Red flags
Vague prompts ("fix everything") · parallelizing related problems · concurrent edits to shared
files without worktrees · merging parallel output without a Reviewer pass.
