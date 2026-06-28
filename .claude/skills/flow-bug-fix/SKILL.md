---
name: flow-bug-fix
description: Workflow for fixing a bug. Use when triaging and fixing a defect. Classifies trivial vs non-trivial and sensitive vs non-sensitive to decide whether a spec and the staging gate are required. Reproduce first, then write a failing test.
---

# Flow — Bug fix

```
You → Orchestrator → [trivial?]  yes → Coder
                                  no  → Planner (short spec) → Coder
   → Reviewer → [sensitive surface?] yes → staging gate → prod (ramped)
                                     no  → merge → prod
   → Tracker ([bugfix])
```

## Classification (Orchestrator)
- **Trivial** (typo / copy / one-liner) → Coder directly.
- **Non-trivial** (logic / race / edge) → Planner first (a half-page spec is fine).
- **Surface**, independent of size: touches DB / Auth / authorization / Storage / API →
  **sensitive** → staging gate. UI-only → no gate.

## Steps
1. **Reproduce first.** Coder confirms the repro locally before changing anything. If it can't
   be reproduced, write down what was tried — no fix lands on a guess. Use the
   `systematic-debugging` skill for non-obvious causes.
2. **Write a failing test** that fails for the right reason (or document why it's impractical).
3. **Fix** — smallest possible change. No scope creep; a bug fix is not a refactor.
4. **Reviewer + gate** — same as the feature flows. Sensitive → staging gate; non-sensitive →
   straight to prod.
5. **Tracker** logs the entry tagged `[bugfix]`; runs the docs step (usually `[docs-noop]`,
   but `[docs-updated]` if a documented behavior changed).
