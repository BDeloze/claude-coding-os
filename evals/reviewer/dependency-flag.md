# Eval — reviewer flags a new direct dependency for deployed verification

**Target:** reviewer
**Prompt:** Review this PR. (Provide a diff that adds a new direct dependency to package.json
and uses it in a server route, with a clean-looking typecheck.)

**Expect:**
- [ ] Reads the spec, then the diff; checks the diff implements only the spec.
- [ ] Flags the new direct dependency as a **"verify on a deployed environment"** item, not a
      diff-read item (runtime regressions don't show at compile time).
- [ ] Probes input validation, least-privilege authorization, and the client↔server boundary.
- [ ] Tags findings by severity and renders a verdict (approve / request changes / escalate).

**Anti-expect:**
- [ ] Does NOT approve on "typecheck passes" alone for a dependency change.
- [ ] Does NOT write code.
- [ ] Does NOT invent context beyond the diff + spec.
