# CLAUDE.md — Coding OS

Always loaded by Claude Code. Keep this short. Anything longer belongs in
`engineering-rules.md`, `memory/`, or the skills under `.claude/skills/`.

This repo is a **portable, project-agnostic coding OS**: a role-driven, staging-first
engineering methodology expressed as native Claude Code subagents, skills, hooks, and
commands. Drop it into any project; swap the stack profile and project registry.

## How it fits together

- **Roles** (`.claude/agents/`) — Orchestrator, Planner, Coder, Reviewer, Ops, Tracker.
  The Orchestrator is the front door; it classifies a request and routes to a specialist.
- **Skills** (`.claude/skills/`) — auto-activating playbooks. The `flow-*` skills encode
  the workflows; the grafted skills (`test-driven-development`, `systematic-debugging`,
  `brainstorming`, `writing-skills`) add discipline the roles invoke.
- **Commands** (`.claude/commands/`) — `/feature`, `/bugfix`, `/incident`, `/standup`,
  `/weekly` slash wrappers that kick off a flow.
- **Rules** (`engineering-rules.md`) — the canonical, stack-agnostic process every agent loads.
- **Stack profile** (`memory/stack-profile.md`) — the swappable, project-specific stack
  details the generic rules reference. **Edit this, not the core rules, per project.**
- **Project registry** (`memory/projects.md`) — environments, hosts, and any external
  writeback targets (e.g. Notion), one block per project.

## Hard rules (non-negotiable — full text in `engineering-rules.md`)

1. **Confirm the project** before any external writeback (Notion, trackers). Never guess; never cross-write.
2. **1 task = 1 branch.** `feat|fix|chore|refactor|test/<scope>-<subject>`.
3. **Any DB / Auth / authorization / Storage / API change is validated on STAGING before PROD.**
   Two-phase deploy + written rollback plan for sensitive changes.
4. **Secrets are server-only and never committed.** No `.env`, no service keys.
5. **Least-privilege authorization on every exposed data path** (e.g. RLS on every exposed table).
6. **No schema push to staging/prod.** Named, reviewed migrations only.
7. **Conventional Commits, clean messages.** No AI-authored trailers, no stray markup.
8. **Respect the client ↔ server boundary.** Server-only code never ships in the client bundle.
9. **The project's type/lint/build gate passes before "done."**
10. **Self-review the diff before opening a PR.**
11. **Tests proportional to impact** (see the `test-driven-development` skill).

## Where to look

- Full routine + per-area rules: `engineering-rules.md`
- Stack specifics for this project: `memory/stack-profile.md`
- Agent prompts (dispatchable subagents): `.claude/agents/`
- Workflows (auto-activating): `.claude/skills/flow-*`
- Project registry (envs, hosts, writeback IDs): `memory/projects.md`
- Glossary, people: `memory/`
- Architecture decisions: `docs/adr/` · Specs: `docs/specs/` · Incidents: `docs/incidents/`
- Current work: `TASKS.md`

## When in doubt

Say so. Propose a verification. Never fabricate command output, file contents, or results.
