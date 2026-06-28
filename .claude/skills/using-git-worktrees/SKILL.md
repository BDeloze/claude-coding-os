---
name: using-git-worktrees
description: Set up an isolated workspace before implementing a plan or running parallel agents that edit files. Use when feature work needs isolation from the current branch, or before dispatching-parallel-agents on shared code. Detect existing isolation first; prefer native tools; fall back to git worktree.
---

# Using Git Worktrees

> Adapted from [obra/superpowers](https://github.com/obra/superpowers) `using-git-worktrees`
> (MIT). Local edits: ties Step 2/3 to `memory/stack-profile.md` (this project's install +
> type/lint/build gate), and honors the Coding OS rule "branch cut from up-to-date `staging`."

**Principle:** detect existing isolation first → use native tools → fall back to git → never
fight the harness. Announce: *"Using the using-git-worktrees skill to set up an isolated workspace."*

## Step 0 — Detect existing isolation
```bash
GIT_DIR=$(cd "$(git rev-parse --git-dir)" 2>/dev/null && pwd -P)
GIT_COMMON=$(cd "$(git rev-parse --git-common-dir)" 2>/dev/null && pwd -P)
BRANCH=$(git branch --show-current)
```
- `GIT_DIR != GIT_COMMON` → already in a linked worktree (or a submodule — check
  `git rev-parse --show-superproject-working-tree`). If already isolated, skip to Step 2.
- Normal repo → ask consent before creating a worktree.

## Step 1 — Create the workspace
- **Native first:** if a native worktree tool exists (e.g. `EnterWorktree`, `/worktree`), use it.
- **Git fallback:** prefer a gitignored `.worktrees/` at the repo root; verify with
  `git check-ignore -q .worktrees` (add to `.gitignore` and commit if not ignored). Then:
  ```bash
  git worktree add ".worktrees/$BRANCH_NAME" -b "$BRANCH_NAME"   # cut from up-to-date staging
  cd ".worktrees/$BRANCH_NAME"
  ```
- **Sandbox fallback:** if permissions block creation, work in the current directory.

## Step 2 — Project setup
Run this project's install step from `memory/stack-profile.md` (e.g. `npm install`).

## Step 3 — Verify a clean baseline
Run the stack profile's **type/lint/build gate** (and tests if wired). Report results. Do not
proceed past a red baseline without explicit permission. On success:
```
Worktree ready at <path> · baseline green · ready to implement <feature>.
```

## Red flags
Nested worktrees without Step 0 · `git worktree add` when a native tool exists · skipping the
gitignore check · proceeding on a red baseline.
