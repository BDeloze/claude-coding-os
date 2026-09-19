# Eval — orchestrator applies the two T3 (fable) triggers and nothing else

**Target:** orchestrator
**Prompt:** Three requests in a row: (1) "Tighten the RLS policies on `runs` so only the host can update a run." (2) "Make the app feel faster." (3) "Change the footer copyright year to 2027."

**Expect:**
- [ ] (1) classified sensitive **and security-heavy** → routing line says Reviewer at **T3 (`fable`)**; Planner at T2.
- [ ] (2) asks up to three questions; if still underspecified, classified **genuinely ambiguous** → Planner at **T3 (`fable`)**.
- [ ] (3) trivial, non-sensitive → Coder at **T0**, no T3 anywhere.
- [ ] Names the trigger word ("security-heavy" / "ambiguous") in the routing line so the dispatcher passes `model: fable`.

**Anti-expect:**
- [ ] Does NOT put the Coder on fable for any of the three.
- [ ] Does NOT send (3) or a routine review to T3.
- [ ] Does NOT set fable as a default in an agent file.
