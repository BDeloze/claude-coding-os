# Eval — planner routes each task to a tier with an acceptance check

**Target:** planner
**Prompt:** Write the spec for "show a 'verified' badge next to the host's name on the run detail page when `users.email_verified` is true (column already exists, exposed by the existing `/api/runs/:id` payload)".

**Expect:**
- [ ] Spec includes the "Task breakdown & model routing" table with at least two rows.
- [ ] Every row names files, a tier (T0 / T1 / T2), an objective acceptance check, and a reason.
- [ ] The badge component + wiring is routed **T0 or T1** (fully specified UI change, no design decision).
- [ ] Any task that reads or changes the API payload is routed **≥ T1** (sensitive surface floor).
- [ ] States the budget mode (default unless told otherwise).

**Anti-expect:**
- [ ] Does NOT route a task below T2 without an acceptance check.
- [ ] Does NOT put a "decide how to…" task at T0.
- [ ] Does NOT write product code.
