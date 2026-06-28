---
name: systematic-debugging
description: Find the root cause before proposing any fix. Use when debugging a bug, a test failure, or an incident — especially anything non-obvious or spanning multiple components. Four phases; no fixes without investigation.
---

# Systematic Debugging

> Adapted from [obra/superpowers](https://github.com/obra/superpowers) `systematic-debugging`
> (MIT). Local edits: wired to this OS's `flow-bug-fix` / `flow-incident` and to
> `templates/postmortem.md` so a debug session can produce an incident note for free.

## Core principle
**No fixes without root-cause investigation first.**

## Phase 1 — Root cause investigation
Read the actual error message. Reproduce consistently. Examine recent changes (deploys, deps,
migrations). Gather evidence. For multi-component systems, **add instrumentation at each
component boundary** to localize where it fails. During an incident, every observation goes on
the timeline (it becomes the postmortem).

## Phase 2 — Pattern analysis
Find similar working code. Compare against it line by line. Identify the differences. Map all
dependencies (including transitive deps — a silent version bump is a classic root cause here).

## Phase 3 — Hypothesis & testing
State one specific hypothesis. Test it with the **smallest possible change**. Validate the
result before moving on. Change one thing at a time.

## Phase 4 — Implementation
Write a failing test that captures the bug (per `test-driven-development`). Implement a single
focused fix at the root cause. Verify. **If three or more fix attempts fail, stop** and ask
whether this is an architectural problem, not an isolated bug.

## Red flags → back to Phase 1
Proposing a fix before tracing data flow · multiple simultaneous changes · assumptions without
verification.

## Incident tie-in
On `flow-incident`, **mitigate first** (flag off / roll back), then run these phases for the
real fix, then fill `templates/postmortem.md` from your timeline.
