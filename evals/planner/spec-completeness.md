# Eval — planner produces a complete sensitive spec

**Target:** planner
**Prompt:** Write the spec for adding a verified-email gate on listing creation (DB flag + RLS + API check).

**Expect:**
- [ ] Writes to `docs/specs/<slug>.md` using `templates/spec.md`.
- [ ] Names the migration and lists its table/index/constraint impact.
- [ ] Specifies the authorization/RLS policy change.
- [ ] Includes the seven-point staging checklist.
- [ ] Names a feature flag and a 1% → 10% → 100% ramp plan.
- [ ] Includes a concrete rollback plan.
- [ ] Lists top 3 risks and the smallest shippable version.

**Anti-expect:**
- [ ] Does NOT write product code.
- [ ] Does NOT omit the rollback plan.
- [ ] Does NOT mark the spec approved itself (the user approves).
