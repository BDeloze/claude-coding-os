# Engineering Rules

The canonical, **stack-agnostic** rules every agent in the Coding OS loads. If a rule here
conflicts with a request, the rule wins until you explicitly override it.

All stack-specific detail (framework, folder layout, migration tool, auth model, the
type/lint/build gate, commands) lives in **`memory/stack-profile.md`**. This file references
"the stack profile" wherever a concrete choice is needed, so the process stays portable.

Workflow assumed throughout: **local → staging → production.**

---

## 0. The Permanent Reminders

- **1 task = 1 branch.** Always.
- **Any change touching DB, Auth, authorization, Storage, or API must be validated on STAGING before PROD.**
- **No secrets in commits, ever** (`.env`, service keys, signed URLs, tokens).
- **Tests + self-review before "done."**
- **When in doubt, say so and propose a verification.** Never fabricate command output.

---

## 1. Framing (before any change)

Before writing code, produce:

- A one-paragraph restatement of the goal and context (front / backend / DB / infra).
- Explicit constraints, read from `memory/stack-profile.md`: framework + version, render mode,
  runtime, DB/migration tool, auth/authorization surface, hosting target.
- Acceptance criteria: UI expected, API expected, performance, security, data shape.
- If ambiguous: ask at most **3** questions, then proceed with explicit assumptions stated.

---

## 2. Git and Commit Discipline

- **Always cut fresh branches from an up-to-date `staging`** — never from `main`. `main` is
  release-only; feature/fix branches integrate via `staging`, which periodically rolls up to
  `main` (`rollout: staging → main`). PRs target `staging`, not `main`.
- One branch per task. Name format: `feat|fix|chore|refactor|test/<scope>-<short-subject>`.
- Small, frequent commits using **Conventional Commits** (`feat:`, `fix:`, `refactor:`, etc.).
- Never commit `.env`, service keys, or any secret. If one is detected, abort and rewrite
  history before pushing.
- **Commit messages are clean.** Specifically:
  - **Never** append a `Co-Authored-By: Claude ...` footer or any AI-generated trailer.
  - **Never** append stray markup.
  - Strip any auto-injected footer before confirming (`git commit --edit`, then save).
  - Verify with `git log -1 --format=%B` after committing.
  - Real human co-authors only, and only when explicitly requested.

---

## 3. Environments (Staging-First)

Three environments minimum: **local**, **staging**, **production**.

- Any change touching DB, Auth, authorization, Storage, or API is validated on staging before
  prod. No exceptions.
- Environment-specific config lives in env vars, never in code (see the stack profile and
  `memory/projects.md` for the names).
- Schema migrations are applied to staging first.
- Sensitive changes are deployed in two phases:
  1. **Compat phase.** Ship code that works with both old and new schema/state.
  2. **Migration / backfill phase.** Apply the migration, run the backfill, verify.
  3. **Cleanup phase** (if needed). Remove compat code once safe.
- Every sensitive change has an explicit **rollback plan**, written before the deploy.
- Feature flags are the default for non-trivial behavior changes — ramp 1% → 10% → 100% on
  prod after staging passes.

---

## 4. Codebase Exploration (before editing)

Before touching code, locate the surfaces named in `memory/stack-profile.md` — UI layer,
server layer, schema + migrations, auth/authorization config, build/runtime config,
generated types, test setup, and the package scripts (lint / typecheck / test / build / dev).

Read before editing. **Convention drift is the silent killer.**

---

## 5. Plan of Attack (before implementation)

Produce a 3–7 step plan with target files named. Call out impact on:

- Rendering / SEO (per the stack profile's render mode).
- DX (auto-imports, generated types).
- DB (migration? index? cascade?).
- Authorization (policies / access rules).
- Performance (bundle size, query count, Core Web Vitals).
- Breaking changes (API contract, public components).
- Staging validation plan: what specifically you will check on staging.

---

## 6. Implementation

Follow the conventions in `memory/stack-profile.md` exactly (folder layout, imports, styling,
client/server boundary, data-fetching idioms). General requirements regardless of stack:

- Components / modules: small, single-responsibility, typed interfaces, explicit outputs.
- Shared logic factored into the stack's idiomatic reuse unit (composable / module / package).
- Every async UI state explicit: `loading`, `error`, `empty`, `success`.
- Accessibility: labels, focus management, ARIA where needed, keyboard reachable.
- Responsive, mobile-first; no fixed pixel widths in layout primitives.
- Respect the **client ↔ server boundary** (rule #8): server-only code never ships to the client.

---

## 7. Server API and Security

- Every server route validates input with a schema (zod / valibot / equivalent). Reject early
  with a clear 4xx and a stable error code.
- Error responses are typed and **never leak internal details** (no stack traces, no SQL
  fragments, no secrets in messages).
- Logs are structured (JSON), include a request id, and **never include PII or secrets**.
- Rate-limit any endpoint exposed unauthenticated. Cache where safe.
- **Server-only credentials stay server-only.** Never imported into a file that ships to the
  client. Enforce with a lint / import-restriction rule.

---

## 8. Database & Migrations

- Before changing the schema: list impact — tables touched, indexes affected, relations,
  nullability, cascades.
- Use **named migrations** with descriptive titles. **Never** push schema directly to staging
  or prod (the stack profile names the forbidden command).
- Every new query reviewed for: N+1 patterns, missing indexes on filter/join columns, and
  constraint correctness (unique, FK, cascade).
- **Backfills:** dedicated, idempotent script with progress logging; tested on staging with
  production-shaped data; transactional where size allows, chunked otherwise; run inside the
  2-phase compat / migrate / cleanup pattern.

---

## 9. Auth, Authorization & Storage

- **Auth model is explicit.** Document where the session lives, how refresh works, what the
  server client uses vs the browser client (see the stack profile).
- **Least-privilege authorization on every exposed data path.** For Postgres/Supabase that
  means RLS on every exposed table — no exceptions. Explicit per-action policies scoped to the
  caller's identity or role.
- **Storage:** explicit read/write policies per bucket, predictable path conventions, enforced
  MIME types.
- **Environment parity:** staging and prod have the same buckets, policies, and provider
  config — or the difference is documented in `memory/env-diffs.md`.

---

## 10. End-to-End Types

- The DB layer's generated types are the source of truth for data shapes.
- API contracts use a shared schema (zod / valibot) that both validates the request and infers
  the response type; the client imports the same types so refactors propagate.
- The type check is a release gate, not a suggestion.

---

## 11. Observability

- Structured logs in server code; one line per significant event with a request id.
- No PII or secrets in logs. Redact at the logger boundary.
- Errors hit an error tracker with environment, release, and user-id-only context.
- Front-end errors and unhandled rejections are captured.
- A health endpoint reports DB / auth / storage reachability. Watched after every deploy.

---

## 12. Performance Budgets

- Server response time: p95 < 300ms, p99 < 800ms for typed business endpoints.
- Page LCP target: < 2.5s on a mid-tier device on 4G.
- First-route JS bundle: < 200KB compressed (adjust per page, stay disciplined).
- No image larger than necessary — responsive `srcset` by default.
- Regressions outside the budget block the merge.

---

## 13. Tests and Verifications (before "done")

Add or update tests proportional to impact — unit (utils, validators, shared logic),
integration (server routes against a test DB), e2e (critical user paths). The
`test-driven-development` skill is the canonical workflow; follow it.

Before declaring done, run the stack profile's **type/lint/build gate** and verify: no type
errors, no runtime errors in the console, no warnings.

> If no test framework is wired up yet (see the stack profile's "known gaps"), "tests pass"
> means the gate is green **plus** a manual test checklist in the PR. Wiring a runner is a
> tracked tech-debt task, not a silent skip — the TDD skill drives this.

---

## 14. Staging → Prod Validation

Deploy to staging, then run the staging checklist:

- Migrations applied cleanly. No drift.
- Critical endpoints responding (including auth).
- Authorization enforced — test as a non-admin user.
- Critical UI flow walks end-to-end.
- Perf budgets hold on key pages.
- Feature flag at the intended ramp.

Only then write release notes (one paragraph) and deploy to prod, followed by: smoke check,
watch the error tracker for 15 minutes, confirm the flag ramp. If you cannot deploy yourself,
hand over a runbook with exact commands for staging then prod, each with verification steps.

---

## 15. Self-Review (before PR)

Read the full diff as a stranger would. Check for: unhandled edge cases (empty, very large,
concurrent); security (XSS, injection, SSRF, IDOR, missing authz); the client↔server boundary;
performance regressions vs budget; tech debt added without a comment; leftover debug
statements / commented-out blocks / unjustified TODOs; and no secrets or temp files tracked.

---

## 16. PR Delivery

Every PR description includes: **Why** (problem + approach, one paragraph), **What**
(user-visible change), **How to test** (local + staging, exact commands), **Env vars** (new or
changed, staging + prod), **Migrations / backfills** (names, order, expected duration), and a
**Rollback plan** (exact steps, caveats if data was written).

A short PR description is fine. A missing rollback plan is not.

---

## 17. Communication Discipline

- If you are not sure, say so and propose a verification step.
- Never fabricate command output, file contents, or test results.
- Prefer correctness to speed. The fast wrong answer costs more than the slow right one.
- Disagree with a request explicitly when you have grounds — explain why, propose an alternative.

---

## Permanent Reminder (again, because it matters)

**1 task = 1 branch. Any DB / Auth / authorization / Storage / API change is validated on
STAGING before PROD. No secrets, ever. Tests and self-review before "done."**
