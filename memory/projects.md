# Projects — registry & external writeback

The **source of truth** for which environment each project writes to. The Orchestrator
classifies the project before routing; every agent that writes externally (e.g. to Notion)
reads the matching project block from this file. **If a task's project is ambiguous, the
Orchestrator stops and asks. Never guess. Never cross-write between projects.**

> The blocks below ship as a **worked example** (Race2Be + Squash+). Replace them with your
> own. The structure — environments, env vars, writeback IDs, pinned schemas — is what to keep.

---

## ── Template (copy this block for a new project, then delete this note) ──

## <Project name>

- **What:** <one line>
- **Repo:** <url>
- **Stack:** see `memory/stack-profile.md`.
- **Environments:**
  - Local: `<url>` · Staging: `<url>` · Production: `<url>`
- **Env vars:** `<NAME>` — purpose (mark server-only ones explicitly).
- **Test framework:** <wired? or interim bar>.
- **External writeback (optional):** <tracker name + the exact DB/collection IDs and the
  property names agents must use — see the "Live schemas" section for the shape>.

---

## Race2Be

- **What:** B2B2C PWA connecting local business owners (cafes / bars / bakeries) with runners.
  BOs host social runs that end at their venues.
- **Repo:** github.com/BDeloze/race2be
- **Stack:** see `memory/stack-profile.md` (this is the shipped default profile).
- **Environments:**
  - Local: `http://localhost:3000`
  - Staging: `https://race2be-staging.osc-fr1.scalingo.io`
  - Production: `<scalingo-prod-url>` *(fill in)*
- **Env vars:**
  - **Supabase:** `NUXT_PUBLIC_SUPABASE_URL`, `NUXT_PUBLIC_SUPABASE_KEY` (anon, browser-exposed),
    `SUPABASE_SERVICE_ROLE_KEY` (server-only — must NEVER appear in the `/app` bundle).
  - **DB:** `DATABASE_URL`, `DIRECT_URL`
  - **Strava:** `STRAVA_CLIENT_ID`, `STRAVA_CLIENT_SECRET`, `STRAVA_REDIRECT_URI`, `STRAVA_PLATFORM_REFRESH_TOKEN`
  - **Other:** `GEMINI_API_KEY`
  - **Share-image:** `SHARE_IMAGE_RETENTION_DAYS`, `INTERNAL_SWEEP_TOKEN` (compared via `crypto.timingSafeEqual`), `PUBLIC_SITE_URL`
- **No test framework yet** — typecheck + manual checklist in PR is the bar today.
- **Notion environment:**
  - **Hub:** Race2Be - Board Hub — https://www.notion.so/34928a567807807fa7f0d031771116cc
  - **Dev dashboard:** https://www.notion.so/35428a56780780f0a465f2c8de43776f
  - **Releases DB:** `collection://35428a56-7807-80d2-b471-000b78696cd0`
  - **Dev tickets DB:** `collection://1b389a8c-71d0-4e57-bb8f-da7a32f2ad89`
  - **Deployments DB:** `collection://5d31199b-e640-41e4-82a2-dd791a033acb`
  - **Activities Journal DB:** `collection://e20f46a7-0454-4e43-8eb6-e1887170bd3c`
  - **GitHub Issues sync:** `collection://35428a56-7807-80c2-9132-000b3e5b30b5`
  - **GitHub PRs sync:** `collection://35428a56-7807-8013-ae9d-000b44fa5222`
  - **Technical Documentation page:** sub-page of Dev dashboard

---

## Squash+

- **What:** SaaS for squash clubs — booking, subscriptions, CRM, analytics, smart-court
  infrastructure, pro-level player analytics.
- **Repo:** *(add when created)* — `github.com/BDeloze/squash-plus` placeholder.
- **Stack:** Nuxt 3 + Prisma + Supabase. *(confirm details when the repo exists.)*
- **Environments:** TBD · **Env vars:** *(add when wired)*
- **Notion environment:**
  - **Hub:** Squash + — https://www.notion.so/1fbb316057334667b52159b85fe10634
  - **Dev dashboard:** https://www.notion.so/36228a5678078099ae9ceb54b20bfaa1
  - **Releases DB:** `collection://36228a56-7807-81fb-b598-000b3e2b27e9`
  - **Dev tickets DB:** `collection://36228a56-7807-81e3-8a5e-000b5e467317`
  - **Deployments DB:** `collection://36228a56-7807-81ae-b617-000b42b3fd44`
  - **Activities Journal DB:** `collection://36228a56-7807-817c-8dbd-000b892d89a0`
  - **Technical Documentation page:** sub-page of Dev dashboard

---

## How agents use this file

1. **Orchestrator** — classifies the project, announces it before delegating.
2. **Planner** — writes specs to the project's docs DB (`Doc type = Spec | PRD`).
3. **Coder / Reviewer** — never write externally. Code goes to GitHub.
4. **Ops** — writes to the project's **Deployments** DB (one row per deploy/ramp step).
5. **Tracker** — writes to **Releases** (lifecycle row), **Activities Journal** (Standup /
   WeeklyUpdate / Development / Incident / Documentation), **Technical Documentation**
   (post-deploy), and files postmortem action items as Dev tickets.

---

## Live schemas (pin these — agents must use exact property names)

### Releases DB
| Property | Type | Notes |
|---|---|---|
| `Version / Name` | title | e.g. `v0.8.0 — Strava integration` |
| `Status` | select | `Planned` → `In progress` → `Shipped` → `Rolled back` |
| `Environment scope` | select | `Staging` → `Prod` |
| `Planned Date` | date | `date:Planned Date:start` |
| `💻  Dev DB` | relation | Link to Dev tickets |

One row per release, walked through stages: created at spec approval (`Planned`/`Staging`),
`In progress` when work starts, `Prod` at prod ramp, `Shipped` at 100%, `Rolled back` if reverted.

### Deployments DB
| Property | Type | Notes |
|---|---|---|
| `Deployment` | title | e.g. `Race2Be staging deploy 2026-05-18 14:32` |
| `Environment` | select | `dev` / `staging` / `prod` (lowercase) |
| `Status` | select | `Queued` → `In progress` → `Success` / `Failed` / `Rolled back` |
| `When (from/to)` | date (time) | `date:When (from/to):start` / `:end` |
| `Git SHA` | text | Commit SHA |
| `Build / Run` | text | Host build/run id |
| `Notes` | text | Ramp %, failed checkpoints, post-deploy verification |
| `Release` | relation (limit 1) | Parent Releases row |

Prefer **one row per ramp step** on prod (1% / 10% / 100%) for an auditable timeline.

### Activities Journal
| Property | Type | Notes |
|---|---|---|
| `Activity` | title | e.g. `Standup 2026-05-18` |
| `Type` | select | `Documentation` / `Development` / `Research` / `Meeting` / `Standup` / `WeeklyUpdate` / `Incident` |
| `Starting Date` / `End Date` | date (time) | |
| `Person` | person | Tag the author |
| Related PRs | text / relation | Race2Be: `BDeloze/race2be PRs` relation; others: text |
| `💻 Dev DB` | relation | Link to Dev tickets |

Per Type: `Standup` daily (Yesterday/Today/Blockers); `WeeklyUpdate` Friday
(Shipped/In-flight/Blocked/Next); `Development` per-feature log; `Incident` running timeline,
link the postmortem from `docs/incidents/`; `Documentation` Tracker's post-deploy docs entry.

---

## Adding a project
Copy a block, replace the IDs and metadata, commit. Agents pick it up automatically — no other
file needs updating.
