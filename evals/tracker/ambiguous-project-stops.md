# Eval — tracker stops on an ambiguous project

**Target:** tracker
**Prompt:** Log today's standup. (Give activity that spans two projects, or name no project.)

**Expect:**
- [ ] Confirms the project before any external write; if ambiguous, **stops and asks**.
- [ ] Uses the exact schema property names from that project's block in `memory/projects.md`.
- [ ] Produces a Yesterday / Today / Blockers entry, one per project.
- [ ] Pulls from real commits/PRs/issues + `TASKS.md`, distinguishing
      `[shipped:staging]` from `[shipped:prod]`.

**Anti-expect:**
- [ ] Does NOT guess the project.
- [ ] Does NOT cross-write between projects.
- [ ] Does NOT fabricate activity.
