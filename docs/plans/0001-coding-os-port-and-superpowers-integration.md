# Plan 0001 — Port `coding-os` to a Claude Code plugin + graft Superpowers

**Status:** Draft for review · **Date:** 2026-06-28 · **Owner:** Ben

This plan describes how to evolve `claude-coding-os` from two inputs:

1. The mature **race2be `coding-os/`** — a file-based, role-driven operations system
   (6 agents, 6 flows, deep stack rules, Notion writeback, persistent docs).
2. **[obra/superpowers](https://github.com/obra/superpowers)** — a methodology packaged
   as auto-activating Claude Code *skills* (TDD, systematic debugging, brainstorming,
   skill-authoring, worktrees, parallel agents).

The goal: a **portable, plugin-format, project-agnostic** coding OS that keeps everything
that makes the race2be system good, fixes its two real weaknesses (no test discipline,
manual agent loading), and grafts in the handful of superpowers skills that add value —
without importing the generic superpowers pieces your system already does better.

> **No code is written under this plan.** It is the design to approve before any scaffolding.

---

## 1. What we keep, graft, and drop

### Keep (race2be is already better than superpowers here)
- **6 role agents** — Orchestrator, Planner, Coder, Reviewer, Ops, Tracker. Superpowers
  has nothing equivalent.
- **Engineering rules** — deep, stack-specific (Nuxt 4 SPA, Nitro, Prisma, Supabase RLS,
  Scalingo, staging-first). Superpowers' rules are generic.
- **Persistent memory + docs** — ADRs, specs, incidents, runbooks, glossary, projects.
- **Notion writeback map** — project-scoped DB targets per event.
- **Templates** — spec, ADR, PR, postmortem.
- **Staging-first gate** and the **2-phase compat/migrate/cleanup** discipline.

### Graft from superpowers (fills real gaps)
| Skill | Why |
|---|---|
| `test-driven-development` | `engineering-rules.md §13` admits **no test framework is wired up**; this is the #1 gap. |
| `systematic-debugging` | bug-fix flow is thin ("reproduce → failing test → fix"); a root-cause method would have helped the 2026-05-24 incidents. |
| `brainstorming` | Planner jumps straight to a spec; structured ideation sharpens specs upstream. |
| `writing-skills` (+ eval/drill harness) | You treat agents/flows "like code" but have **no way to test prompts**. |

### Drop / do not import (your system already does it better)
- superpowers `requesting-code-review` / `receiving-code-review` → your **Reviewer agent** is richer.
- superpowers `writing-plans` / `executing-plans` → your **Planner + templates/spec.md** are stack-aware.
- superpowers `finishing-a-development-branch` → your **staging gate + Ops flow** supersede it.

### Optional (defer; nice-to-have)
- `using-git-worktrees` + `dispatching-parallel-agents` — your flows are sequential today.
  Real payoff for Reviewer-×3 rounds and the "lockstep across both files" tasks in `TASKS.md`.
  Proposed for a **phase 2**, not the initial port.

---

## 2. Target repository structure

```
claude-coding-os/
├── README.md                       # what this is, install + 3 usage modes (ported & generalized)
├── CLAUDE.md                       # always-loaded baseline (RECONSTRUCTED — missing from export)
├── engineering-rules.md            # split: core (generic) + project overlay (see §4)
├── .claude/
│   ├── agents/                     # 6 native subagents w/ frontmatter (RECONSTRUCTED — see §3)
│   │   ├── orchestrator.md
│   │   ├── planner.md
│   │   ├── coder.md
│   │   ├── reviewer.md
│   │   ├── ops.md
│   │   └── tracker.md
│   ├── skills/                     # auto-activating SKILL.md skills
│   │   ├── flow-feature-sensitive/SKILL.md      # ported from flows/
│   │   ├── flow-feature-nonsensitive/SKILL.md
│   │   ├── flow-bug-fix/SKILL.md
│   │   ├── flow-incident/SKILL.md
│   │   ├── flow-daily/SKILL.md
│   │   ├── flow-weekly/SKILL.md
│   │   ├── test-driven-development/SKILL.md      # grafted from superpowers, adapted (§5)
│   │   ├── systematic-debugging/SKILL.md         # grafted
│   │   ├── brainstorming/SKILL.md                # grafted
│   │   └── writing-skills/SKILL.md               # grafted (meta)
│   ├── commands/                   # optional slash wrappers: /feature /bugfix /incident /standup
│   ├── hooks/
│   │   ├── session-start.mjs       # bootstrap context + announce active skills
│   │   └── tracker-trigger.mjs     # ported from race2be PR #54 (post-merge reconciliation)
│   └── settings.json               # hook wiring + permission allowlist
├── memory/                         # project shorthand (kept generic; race2be specifics → overlay)
│   ├── projects.md
│   ├── people.md
│   ├── glossary.md
│   └── env-diffs.md
├── templates/                      # pr-description, spec, adr, postmortem (ported verbatim)
├── docs/
│   ├── plans/                      # this doc lives here
│   ├── adr/
│   ├── specs/
│   ├── incidents/
│   └── runbooks/
└── evals/                          # drill-style behavior tests for agents + skills (§6)
    └── README.md
```

**Why both `.claude/` and top-level dirs?** `.claude/agents`, `.claude/skills`, `.claude/hooks`,
`.claude/settings.json` are the **machine-readable** layer Claude Code auto-loads. `memory/`,
`templates/`, `docs/` stay top-level because agents read them on demand and humans edit them
directly — exactly the race2be split, just with the agent/flow layer promoted to native format.

---

## 3. Agent reconstruction (from README + rules + flows)

The export was missing `agents/` and `CLAUDE.md`. Each role will be rebuilt as a native
subagent (`.claude/agents/<role>.md`) with YAML frontmatter so Claude Code auto-routes by
`description`. Source material per role:

| Agent | Reconstructed from | Frontmatter `description` trigger |
|---|---|---|
| **orchestrator** | README §"mental model", all flows' step 1–2 | "Front door. Classify any request and route to the right specialist + flow." |
| **planner** | flows step 3, `templates/spec.md`, rules §1/§5 | "Turn an idea into a spec/ADR before code. Use for features and non-trivial bugs." |
| **coder** | flows step 5, rules §2/§4/§6–§10 | "Implement an approved spec on a fresh branch with tests + self-review." |
| **reviewer** | flows step 6, rules §15 | "Independent adversarial review on diff + spec only, in a fresh session." |
| **ops** | flows §"staging/prod", rules §3/§14, incidents | "Own the staging gate, ramped prod deploy, and incident response." |
| **tracker** | README §4a, `TASKS.md` header, PR #54 hook | "Keep TASKS.md in sync, draft standups, update docs + Notion after prod." |

Each agent file embeds: role lens, the rules it must load, its inputs/outputs, and its
handoff contract. **You review and refine these after reconstruction** (they're inferred,
not your originals).

---

## 4. Make it project-agnostic (core + overlay)

The race2be system is hard-wired to one stack and two projects. To make `claude-coding-os`
reusable, split the opinionated content into two layers:

- **Core (generic):** the *process* — git discipline, staging-first, 2-phase migrations,
  self-review checklist, PR delivery, communication discipline, the agent roles, the flows.
- **Overlay (`memory/projects.md` + a `stack` profile):** the stack specifics — Nuxt/Nitro
  versions, Supabase surfaces, Scalingo hooks, Notion DB IDs, env vars, project list.

`engineering-rules.md` is refactored so stack-specific clauses (§6 Nuxt SPA, §8 Prisma, §9
Supabase) reference a swappable **stack profile** rather than being baked into the core. Drop
race2be into the overlay and the same OS serves Squash+ or a future non-Nuxt project.

> **Decision needed (D1):** do you want this generalization now, or a faithful 1:1 port of the
> race2be rules first (generalize later)? Recommended: faithful port first, generalize in phase 2.

---

## 5. Adapting the grafted superpowers skills

Grafted skills are **vendored and edited**, not used raw, so they fit your rules:

- **test-driven-development** — adapt to your reality: `engineering-rules.md §13` says no
  framework is wired. The skill's first step becomes *"if no runner exists, wire vitest
  (unit) / Playwright (e2e) as a tracked tech-debt task, else proceed red-green-refactor."*
  Aligns TDD with your "typecheck + build + manual checklist" interim state instead of
  pretending tests exist.
- **systematic-debugging** — wire its output into your `templates/postmortem.md` and the
  `docs/incidents/` convention, so a debug session produces an incident note for free.
- **brainstorming** — slot it **before** the Planner in the feature flows as an optional
  step; output feeds `templates/spec.md`.
- **writing-skills** — keep its skill-authoring discipline; point its "test the skill"
  step at the `evals/` harness (§6).

Provenance: each vendored skill keeps a header noting it derives from obra/superpowers (MIT)
with a one-line summary of local edits.

---

## 6. Evals (the self-improvement layer)

Add `evals/` with a lightweight, drill-style harness that runs a fixed prompt against an
agent/skill and asserts on the behavior (e.g. "Reviewer flags a missing RLS policy",
"Orchestrator routes a DB change through the staging gate"). This is what lets you tune
`agents/` and `skills/` like code instead of by vibes — the capability your current system
lacks. Start with 1 eval per agent; grow over time.

---

## 7. Phased delivery

| Phase | Scope | Output |
|---|---|---|
| **0 (this doc)** | Design + decisions | this plan, approved |
| **1 — Faithful port** | Re-create race2be structure here; reconstruct 6 agents + CLAUDE.md as native subagents; flows → skills; session-start + tracker hooks; templates/memory/docs verbatim | working plugin-format OS, 1:1 with race2be |
| **2 — Graft** | Vendor + adapt the 4 superpowers skills; wire brainstorming into flows; TDD reality-check | superpowers capabilities live |
| **3 — Evals** | `evals/` harness + 1 test per agent | self-testable prompts |
| **4 — Generalize (optional)** | core/overlay split (§4); worktrees + parallel-agents skills | reusable across projects |

Each phase is its own PR off `claude/superpowers-claude-os-ze2gmd`.

---

## 8. Open decisions for you

- **D1 — Generalization timing:** faithful 1:1 port first (recommended), or build
  core/overlay generic from the start?
- **D2 — Agent reconstruction confidence:** OK to ship inferred agent prompts in phase 1
  for you to refine, or do you want to upload the real `agents/` + `CLAUDE.md` first so the
  port is exact?
- **D3 — Slash commands:** want `/feature`, `/bugfix`, `/incident`, `/standup` wrappers in
  phase 1, or rely on auto-routing via agent `description` fields?
- **D4 — Worktrees/parallel agents:** in scope for phase 4, or skip (you work solo,
  sequential flows may be fine)?
- **D5 — License/attribution:** confirm MIT-style attribution header on vendored superpowers
  skills is acceptable.

---

## 9. What I need from you to proceed past phase 1

- The real `agents/*.md` and `CLAUDE.md` from race2be (optional but makes the port exact —
  see D2).
- Answers to D1–D5.

Once approved, phase 1 is a single scaffolding PR.
