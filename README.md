# Coding OS

A portable, **project-agnostic** agentic structure for solo (or small-team) engineering on a
**local → staging → prod** workflow. Drop it into any repo, swap the stack profile and project
registry, and you get a disciplined, role-driven development methodology — expressed as native
Claude Code subagents, auto-activating skills, hooks, and slash commands.

Six specialized agents wired together by six flows, plus grafted discipline skills
(TDD, systematic debugging, brainstorming, skill-authoring) adapted from
[obra/superpowers](https://github.com/obra/superpowers) (MIT).

- **Orchestrator** — front door. Confirms project, classifies the request, routes.
- **Planner** — turns ideas into specs and ADRs.
- **Coder** — implements. Writes code, tests, and inline comments.
- **Reviewer** — independent adversarial review on diff + spec only.
- **Ops** — owns the staging gate, the prod deploy, and incident response.
- **Tracker** — keeps `TASKS.md` in sync, drafts standups/weeklies, updates docs after prod.

The whole thing is files — no special infrastructure.

---

## 1. Layout

```
claude-coding-os/
├── CLAUDE.md                 # always-loaded baseline
├── engineering-rules.md      # canonical, stack-AGNOSTIC rules every agent reads
├── TASKS.md                  # current work, owned by Tracker
├── .claude/
│   ├── agents/               # 6 dispatchable subagents (frontmatter: name, description)
│   ├── skills/               # auto-activating playbooks
│   │   ├── flow-*/           #   the six workflows
│   │   └── <grafted>/        #   tdd, systematic-debugging, brainstorming, writing-skills
│   ├── commands/             # /feature /bugfix /incident /standup /weekly
│   ├── hooks/                # session-start bootstrap + tracker-trigger
│   └── settings.json         # hook wiring + permission allowlist
├── memory/
│   ├── stack-profile.md      # THE SWAPPABLE LAYER — stack specifics live here
│   ├── projects.md           # per-project registry (envs, hosts, writeback IDs)
│   ├── people.md
│   ├── glossary.md
│   └── env-diffs.md
├── templates/                # spec, adr, pr-description, postmortem
├── docs/                     # adr/ specs/ incidents/ runbooks/ plans/
└── evals/                    # behavior tests for agents + skills
```

## 2. Mental model

You do not "run" the Coding OS. You **converse** with Claude, and the structure ensures the
right specialist with the right context shows up at the right moment.

1. **Always-loaded context.** `CLAUDE.md` + `engineering-rules.md` + the session-start hook
   give every session the same baseline.
2. **Native subagents.** The Orchestrator routes; or you invoke a role directly
   ("use the reviewer subagent on this diff"). Claude Code matches on the `description:` field.
3. **Auto-activating skills.** The `flow-*` skills trigger by context; the grafted discipline
   skills (TDD etc.) are invoked by the roles. No copy-pasting prompts.

State persists in `TASKS.md`, `docs/specs/`, `docs/adr/`, and `docs/incidents/`.

## 3. Putting it on a project

1. Copy this repo's contents into your project (or keep it as the project).
2. **Rewrite `memory/stack-profile.md`** for your stack — copy `memory/stack-profile.template.md`
   over it and fill in every `<…>`. This is the only file you must change.
3. Fill in `memory/projects.md` — copy the "Template (copy this block)" block at the top for
   each project (environments, hosts, and any writeback targets).
4. Start a task: `/feature add a verified-email gate on signup`, or just describe it and let
   the Orchestrator route.

The shipped default profile + registry target the **Race2Be** stack (Nuxt 4 SPA + Nitro +
Prisma + Supabase + Scalingo, with Notion writeback) — use them as a worked example.

## 4. Project-agnostic by design

`engineering-rules.md` is written generically; every stack-specific decision is deferred to
`memory/stack-profile.md`. Swap that one file and the same agents, flows, and discipline apply
to a different framework, DB, or host. The core process never changes.

## 5. Tests

The OS is self-tested — `npm test` runs Node's built-in test runner (zero dependencies):

- **`tests/structure.test.mjs`** — every agent/skill/command is well-formed (frontmatter,
  name matches path), `settings.json` wires hooks that exist, grafted skills keep their
  attribution, core files are present.
- **`tests/hooks.test.mjs`** — runs the two hooks as real subprocesses and asserts behavior
  (tracker fires on a merge, stays silent otherwise; session-start emits valid context).

CI (`.github/workflows/ci.yml`) runs the suite on every push to `main` and every PR. This is
the worked example the `test-driven-development` skill's "wire a runner first" step points at.

## 6. Attribution

The `test-driven-development`, `systematic-debugging`, `brainstorming`, `writing-skills`,
`using-git-worktrees`, and `dispatching-parallel-agents` skills are adapted from
[obra/superpowers](https://github.com/obra/superpowers) (MIT License); each carries a
provenance header noting local edits.
