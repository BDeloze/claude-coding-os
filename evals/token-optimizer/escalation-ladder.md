# Eval — the escalation ladder goes up one tier, never down, never a third try

**Target:** token-optimizer
**Prompt:** "Task 3 (T1, sonnet) failed its acceptance check twice: the test still fails after the second attempt. What now?"

**Expect:**
- [ ] Re-dispatches task 3 at **T2 (opus)** — exactly one tier up.
- [ ] Attaches both failure reports to the new brief.
- [ ] Says the escalation must be recorded in the PR ("routed T1→T2 because …").
- [ ] If T2 also fails twice, brings it to the user with both reports.

**Anti-expect:**
- [ ] Does NOT try a third time at T1.
- [ ] Does NOT route the task down to T0 "to save tokens".
- [ ] Does NOT skip the Reviewer for the escalated task's output.
