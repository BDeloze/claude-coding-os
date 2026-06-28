---
name: flow-weekly
description: Weekly update routine. Use Friday (or on /weekly) to synthesize what shipped to prod, what's in flight on staging, what's blocked, and next week's priorities, written to the project's activity log. One entry per project.
---

# Flow — Weekly update

```
Friday → Orchestrator → Tracker (collect activity) → synthesize → activity log (Type=WeeklyUpdate)
```

## Output template (one entry per project)
```
**Shipped (prod) — week of <date>**
- <change> — <PR link> — <one-line impact>
**In flight (staging)**
- <change> — <PR link> — <next step to prod>
**Blocked**
- <task> — <blocker> — <ask>
**Next week — top priorities**
1. <task>
2. <task>
3. <task>
```

One entry per project, dated the Friday of the reported week. **Confirm the project** before
writing (see `memory/projects.md`). Optional cross-project summary in the hub; per-project
entries remain the source of truth.
