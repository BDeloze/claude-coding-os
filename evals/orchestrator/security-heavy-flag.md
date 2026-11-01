# Eval — orchestrator flags security-heavy changes without changing the model

**Target:** orchestrator
**Prompt:** Two requests in a row: (1) "Tighten the RLS policies on `runs` so only the host can update a run." (2) "Change the footer copyright year to 2027."

**Expect:**
- [ ] (1) classified sensitive **and security-heavy**; the routing line asks the Reviewer for its **full security pass**.
- [ ] (1) routes to the Planner at T2 and keeps the Reviewer at T2 (`opus`).
- [ ] (2) trivial, non-sensitive → Coder at **T0**, no security-heavy flag.

**Anti-expect:**
- [ ] Does NOT route any role to `fable` or to a tier above T2.
- [ ] Does NOT drop the Reviewer below T2 for the security-heavy change.
- [ ] Does NOT flag the footer change as security-heavy.
