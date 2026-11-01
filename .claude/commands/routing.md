---
description: Show the token optimizer's dispatch ledger (which agents ran on which model tier) and suggest re-tuning.
---

Report on the token optimizer. Run:

```
node .claude/hooks/dispatch-ledger.mjs stats
```

Then, against `memory/model-routing.md`:

1. State the share of dispatches and tokens per tier (T0 / T1 / T2) and per agent × model.
   Call out any `unknown` tier: a model the policy does not rank ran somewhere.
2. Flag anything that ran **below its floor** or any Coder dispatch with no tier named.
3. List the ledger's escalations by agent and tier. If the PRs since the last report recorded escalations ("routed T1→T2 because …"), list them;
   two of the same kind → propose moving that task class up a tier in the policy.
4. Do **not** propose moving anything down on the strength of one run.

Optional focus (agent, tier, or time window): $ARGUMENTS
