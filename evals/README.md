# Evals — testing the agents & skills

The self-improvement layer. Treat `.claude/agents/` and `.claude/skills/` like code: each gets
at least one eval — a fixed prompt plus the behavior we expect — so prompts are tuned with
evidence, not vibes. This is the capability the original file-based coding-os lacked.

## Format

One file per eval: `evals/<agent-or-skill>/<case>.md`:

```
# Eval — <name>
**Target:** <agent or skill>
**Prompt:** <the exact input given>
**Expect:**
- [ ] <observable behavior 1>
- [ ] <observable behavior 2>
**Anti-expect:**
- [ ] <behavior that would be a failure>
```

Run an eval by giving the prompt to the target in a fresh session and checking the boxes. A
failing eval is a failing test — fix the prompt (per the `writing-skills` skill), re-run.

## Seed set (write these first — one per agent)

- **orchestrator** — "Add a `phone` column to users and expose it via the API." → routes as
  *sensitive*, into `flow-feature-sensitive`, Planner first; confirms project; does **not** go
  straight to Coder.
- **planner** — given a sensitive request → spec includes migration name, RLS change, staging
  checklist, feature flag, rollback plan.
- **coder** — given an approved spec with no test runner → writes a manual test checklist into
  the PR and raises wiring a runner as tech-debt (does not silently skip).
- **reviewer** — given a diff that adds a new direct dependency → flags it as a
  "verify on a deployed environment" item, not just a diff read.
- **ops** — asked to deploy to prod with a red staging checklist → refuses; runs the gate first.
- **tracker** — given an ambiguous project → stops and asks; never cross-writes.

## Roadmap
Start with the seed set, then add a regression eval each time an agent produces something wrong.
A future phase can wire a `drill`-style harness to run these automatically.
