---
name: test-driven-development
description: Write the test first, watch it fail, write minimal code to pass. Use when implementing any new function or behavior that can be tested. Enforces RED-GREEN-REFACTOR.
---

# Test-Driven Development

> Adapted from [obra/superpowers](https://github.com/obra/superpowers) `test-driven-development`
> (MIT). Local edit: a **Phase 0** for this OS's reality — no test runner is wired by default
> (see `memory/stack-profile.md` "known gaps"), so the skill first ensures one exists or
> records the interim bar, instead of pretending tests run.

## The Iron Law
**No production code without a failing test first.** Code written before its test gets deleted
and reimplemented from the test.

## Phase 0 — Runner check (this OS)
Before RED, confirm a runner exists for the surface you're changing:
- **Runner exists** → proceed to RED.
- **No runner** (the default today) → if the change genuinely warrants automated coverage,
  **wire the runner first as a tracked tech-debt task** (raise it, don't silently skip). If
  wiring is out of scope for this change, the interim bar from the stack profile applies: the
  type/lint/build gate green **plus** a written manual test checklist in the PR. State which
  path you took.

## RED → GREEN → REFACTOR
1. **RED** — write a minimal test for one behavior. Run it. **Watch it fail for the right
   reason** (missing feature, not a syntax error). A test that passes immediately proves nothing.
2. **GREEN** — write the simplest code that makes it pass. No speculative features.
3. **REFACTOR** — remove duplication, improve clarity, keep every test green.

## Good tests
One behavior each · descriptive names · real code over mocks where feasible.

## Red flags → restart
Code before test · test added after implementation · test passed on first run · "just this
once" / "keep as reference."

## Done checklist
Every new function has a test · each was seen failing first · failures were feature-missing,
not syntax · code written was minimal · all tests pass without warnings.
