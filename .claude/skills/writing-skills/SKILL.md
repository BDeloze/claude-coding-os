---
name: writing-skills
description: How to author and test a new skill or agent prompt for this Coding OS. Use when creating or editing anything under .claude/skills/ or .claude/agents/. Treat prompts like code — write an eval for them.
---

# Writing Skills

> Adapted from [obra/superpowers](https://github.com/obra/superpowers) `writing-skills` (MIT).
> Local edit: the "test the skill" step points at this repo's `evals/` harness, and the format
> matches Claude Code's native `SKILL.md` / agent frontmatter.

Agents and skills are versioned artifacts. Write them with the same discipline as code.

## SKILL.md format
- A `SKILL.md` lives in `.claude/skills/<skill-name>/` with YAML frontmatter:
  - `name:` — kebab-case, matches the directory.
  - `description:` — one or two sentences. **Front-load the trigger** ("Use when…") because
    this is what Claude Code matches on to auto-activate the skill.
- Body: the methodology — concise, imperative, with explicit gates and red flags. Prefer a
  short checklist over prose. Reference rules/profile rather than duplicating them.

## Agent format
- `.claude/agents/<role>.md` with frontmatter `name:` + `description:` (the routing trigger).
- Body: the role's lens, what it always loads, its routine, and its hard constraints.

## Authoring routine
1. **Name the trigger first** — when should this activate? Write the `description` to match.
2. **Write the smallest useful body** — one job, clear gates, no duplication of the rules.
3. **Write an eval** in `evals/` (see `evals/README.md`): a fixed prompt + the behavior you
   expect (e.g. "Reviewer flags a missing RLS policy"). This is how you tune prompts without
   guessing.
4. **Run it, refine, commit.** Treat a failing eval like a failing test.

## Red flags
Vague trigger · body duplicates `engineering-rules.md` · no eval · two jobs in one skill ·
description doesn't say "use when."
