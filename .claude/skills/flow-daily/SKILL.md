---
name: flow-daily
description: Daily standup routine. Use each morning (or on /standup) to draft a standup from yesterday's git/PR/issue activity and commitments, written to the project's activity log. One entry per project per day.
---

# Flow — Daily standup

```
Morning → Tracker → standup draft → project activity log (Type=Standup, Date=today)
```

## What Tracker pulls
- Yesterday's commits (your GitHub username), PRs opened/reviewed/merged, issues moved.
- Commitments made in meeting notes / calendar / email ("I'll do X").
- Current state of `TASKS.md`. Distinguish `[shipped:staging]` from `[shipped:prod]`.

## Output (one entry per project per day)
```
**Yesterday**
- <thing done> — <PR or commit link>
**Today**
- <planned task>
**Blockers**
- <blocker> — <what would unblock>
```

If you worked across multiple projects, that's one entry in each project's activity log.
**Confirm the project** before writing (see `memory/projects.md`).
