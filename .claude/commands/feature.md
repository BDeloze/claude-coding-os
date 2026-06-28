---
description: Start a feature through the Coding OS (Orchestrator classifies sensitive vs non-sensitive and routes).
---

Start a feature using the Coding OS. Use the **orchestrator** subagent first to:

1. Confirm the project (`memory/projects.md`).
2. Classify the change as sensitive (DB / Auth / authorization / Storage / API) or non-sensitive.
3. Confirm a branch exists (cut from up-to-date `staging` if not).
4. Route into `flow-feature-sensitive` or `flow-feature-nonsensitive` and hand off to the Planner.

Do not write code until the spec is approved.

Feature request: $ARGUMENTS
