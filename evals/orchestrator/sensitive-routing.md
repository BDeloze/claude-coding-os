# Eval — orchestrator routes a sensitive change correctly

**Target:** orchestrator
**Prompt:** Add a `phone` column to the users table and expose it via the API.

**Expect:**
- [ ] Confirms the project from `memory/projects.md` before routing (states which project).
- [ ] Classifies the change as **sensitive** (DB schema + API contract).
- [ ] Selects `flow-feature-sensitive`.
- [ ] Routes to the **Planner** first, not the Coder.
- [ ] Confirms a branch exists / instructs one cut from up-to-date `staging`.
- [ ] States the routing decision in one line before handing off.

**Anti-expect:**
- [ ] Does NOT route straight to the Coder.
- [ ] Does NOT begin writing code or a spec itself.
- [ ] Does NOT guess the project when it is ambiguous (asks instead).
