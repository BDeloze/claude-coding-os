# <type>(<scope>): <subject>

<!-- Conventional Commit title. e.g. feat(auth): add verified-email gate to listing creation -->

## Why
<!-- One paragraph: the problem and the chosen approach. Link the spec. -->
Spec: `docs/specs/<slug>.md`

## What
<!-- The user-visible change. Bullets that matter to a stranger. -->
-

## How to test
### Local
```
# use this project's commands (see memory/stack-profile.md), e.g.:
# install · migrate · dev
# steps:
# 1.
```
### Staging
```
# steps:
# 1.
```

## Env vars
<!-- New or changed, for staging and prod. -->
- `<NEW_VAR>` — purpose. Staging: `...`. Prod: set in deployment.

## Migrations / backfills
- Migration: `<path>` · Backfill: `<script>` — idempotent, chunked, logged.

## Rollback plan
1.

## Docs hints for Tracker
<!-- Breadcrumbs so Tracker can update standalone docs post-[shipped:prod]. -->
- **User-visible changes:**
- **New / changed env vars:**
- **New / changed endpoints:**
