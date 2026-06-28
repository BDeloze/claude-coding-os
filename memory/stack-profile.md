# Stack Profile

The **swappable** layer. `engineering-rules.md` is written generically and defers all
stack-specific detail to this file. To put the Coding OS on a different stack, rewrite
this file — leave the core rules and agents untouched.

> Shipped default: the **Race2Be** stack. Replace the values below for your project.

---

## Framework / runtime

- **Front:** Nuxt 4 (`compatibilityVersion: 4`, `compatibilityDate: '2026-04-29'`) + Vue 3 + Tailwind CSS. **`ssr: false`** — SPA, not SSR (intentional, avoids Supabase header/cookie crashes).
- **Server:** Nitro server routes under `/server`.
- **DB:** Postgres via **Prisma v5**, hosted on **Supabase**.
- **Auth:** `@nuxtjs/supabase`. SSR is off, so the Supabase client runs entirely in the browser.
- **Hosting:** Scalingo (staging + prod).
- **Mapping:** Leaflet (`@vue-leaflet/vue-leaflet`); GraphHopper / OSM planned.
- **Planned:** Stripe, Satori (edge HTML-to-image), Strava (via `StravaAdapter`).

## Folder conventions

- All UI / pages / composables / types live in `/app`.
- All API / utilities / Node-only logic lives in `/server`.
- **Server modules are never imported into `/app`** (the client↔server boundary, rule #8).
- Import alias `~~/` for cross-directory imports.
- Prisma client is a **default export** at `~~/server/utils/prisma` — `import prisma from '~~/server/utils/prisma'` (no braces).
- Styling: Tailwind only.

## Architectural rules (project-specific)

- **Adapter Pattern** for fitness trackers: `StravaAdapter` implements a `FitnessDataInterface`. Never couple app logic to Strava directly.
- **Lean Storage.** Never store generated map / social images in the DB. Generate at edge via Satori.

## The type/lint/build gate (rule #9)

In this project, **"the lint" is the typecheck**:

```
npm run lint     # = npx nuxi typecheck   ← the gate
npm run build
```

A change is not "done" until typecheck is clean and the build passes.

## Commands

- `npm install`
- `npm run dev`
- `npm run lint` (= `npx nuxi typecheck`)
- `npm run build` / `npm start`
- `npx prisma migrate dev --name <descriptive_name>`
- `npx prisma generate` (runs on postinstall)

## Stack-specific clauses the core rules defer here

- **Client/server split (rule #8):** `/app` is client, `/server` is Nitro. `service_role` and
  any Node-only API must live under `/server` and never reach the `/app` bundle.
- **Migrations (rule #6):** named Prisma migrations only. **Never** `prisma db push` on
  staging or prod. Migrations apply to staging first, prod via the host's release hook.
- **Authorization (rule #5):** Supabase **RLS on every exposed table**, least-privilege
  policies scoped to `auth.uid()` or role checks.
- **Data fetching:** `$fetch` for imperative, `useFetch` with explicit `key` for dedup. No
  `prerender`/`swr`/`isr` route rules (SSR is off).

## Known gaps (tech debt)

- **No test framework wired up** (no vitest / playwright). Until then, "tests pass" means
  typecheck + a manual test checklist in the PR. The `test-driven-development` skill's first
  step is to wire a runner when a change genuinely needs automated coverage — raise it as a
  tracked tech-debt task first.
- Stripe / Satori / GraphHopper referenced in vision, not yet implemented.
