---
name: brainstorming
description: Refine a fuzzy idea and explore options BEFORE writing a spec. Use at the start of an open-ended feature when the problem or approach isn't yet sharp. Output feeds templates/spec.md.
---

# Brainstorming

> Adapted from [obra/superpowers](https://github.com/obra/superpowers) `brainstorming` (MIT).
> Local edit: positioned **upstream of the Planner** in the feature flows; its output is the
> raw material for `templates/spec.md`.

Use this before committing to a spec when the request is open-ended or the right approach is
unclear. The goal is to converge on a sharp problem statement and a chosen direction.

## Routine
1. **Restate the problem** as you understand it; confirm with the user before generating options.
2. **Diverge** — generate 2–4 genuinely distinct approaches, not variations of one. For each:
   the core idea, what it optimizes for, and its main risk.
3. **Pressure-test** each against the constraints in `memory/stack-profile.md` and the
   engineering rules (sensitive surface? migration? authorization? perf budget?).
4. **Converge** — recommend one, with a one-line rationale and the runner-up's best idea worth
   grafting in.
5. **Hand off to the Planner** — the chosen direction, top 3 risks, and the smallest shippable
   version become the seed of `docs/specs/<slug>.md`.

## Discipline
Ask before assuming. Don't write code or a full spec here — this step exists to make the spec
that follows correct. If the request is already sharp, skip straight to the Planner.
