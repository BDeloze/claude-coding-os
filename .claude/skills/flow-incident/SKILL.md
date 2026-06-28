---
name: flow-incident
description: Workflow for a production incident or outage. Use when an alert fires or a customer reports something broken in prod. Ops drives; mitigate first, fix second, postmortem within 24h.
---

# Flow — Incident

```
Alert / report → Orchestrator → Ops (confirm project, triage, severity)
   → mitigate first → (Coder hot-fix + Reviewer if code change) → resolved
   → Ops postmortem (24h) → Tracker captures action items as P1
```

## Severity & SLA
- **SEV-1** — users blocked or data at risk. Ack 5 min, updates every 15 min.
- **SEV-2** — significant degradation. Ack 15 min, updates every 30 min.
- **SEV-3** — annoying, not blocking. Same-day fix.

## During (Ops is the single driver)
1. **Acknowledge** within SLA; state what's known.
2. **Timeline** — every observation/action timestamped → becomes the postmortem skeleton.
3. **Mitigate first** — disable flag, roll back, scale up. Unblock users, *then* debug
   (use `systematic-debugging`).
4. **Status updates on cadence**, even "still investigating."
5. **Hot-fix** on a fresh `fix/<incident-slug>` branch; Reviewer pass required (even 60s);
   **compressed** staging gate if sensitive (5 min, not 30 — never skipped).

## Resolution criteria
Health green · error rate at baseline · user reports stopped · verified by someone who didn't
ship the fix.

## After
Postmortem within 24h → `docs/incidents/YYYY-MM-DD-<slug>.md` (blameless, from
`templates/postmortem.md`). Action items become P1 tasks (`[from:postmortem-...]`). Record the
incident in the project's activity log.
