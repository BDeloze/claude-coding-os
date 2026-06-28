# Stack Profile — TEMPLATE

Neutral, fill-in-the-blanks version of the swappable layer. To put the Coding OS on a new
project: copy this file over `memory/stack-profile.md`, replace every `<…>`, delete what
doesn't apply, and leave the core (`engineering-rules.md`, agents, flows) untouched.

The generic rules in `engineering-rules.md` defer all stack-specific decisions to here.

---

## Framework / runtime
- **Front:** <framework + version> · render mode: <SSR | SPA | SSG | n/a>
- **Server:** <server runtime / framework, or "none">
- **DB:** <database> via <ORM / query layer>, hosted on <provider>
- **Auth:** <auth library / service; where the session lives>
- **Hosting:** <host> (<environments: staging + prod>)
- **Other notable libs / planned:** <…>

## Folder conventions
- Client code lives in: <path>
- Server / Node-only code lives in: <path>
- The **client ↔ server boundary** (rule #8): <how it's enforced — which dir is which, lint rule>
- Import alias(es): <…>
- Styling: <…>

## Architectural rules (project-specific)
- <pattern the project follows, e.g. "Adapter pattern for X">

## The type/lint/build gate (rule #9)
The command(s) that must pass before "done":
```
<gate command, e.g. typecheck>
<build command>
```

## Commands
- install: `<…>`
- dev: `<…>`
- gate: `<…>`
- build / start: `<…>`
- migration: `<…>`

## Stack-specific clauses the core rules defer here
- **Client/server split (rule #8):** <which dir is client, which is server; what must never cross>
- **Migrations (rule #6):** <named-migration tool; the forbidden "push schema" command, if any>
- **Authorization (rule #5):** <how least-privilege is enforced — RLS / row policies / middleware>
- **Data fetching:** <idioms, caching keys, anything render-mode-specific>

## Known gaps (tech debt)
- **Test framework:** <wired? which? or "none yet — gate + manual checklist is the interim bar">
- <other gaps>
