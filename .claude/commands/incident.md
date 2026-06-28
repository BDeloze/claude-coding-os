---
description: Declare a production incident (Ops drives; mitigate first, postmortem within 24h).
---

Drive a production incident using the Coding OS. Use the **ops** subagent and `flow-incident`:
confirm the project, set severity, **mitigate first** (flag off / roll back / scale up), keep a
timestamped timeline, hot-fix on a fresh branch with a Reviewer pass, and write a blameless
postmortem within 24h to `docs/incidents/`.

Incident: $ARGUMENTS
