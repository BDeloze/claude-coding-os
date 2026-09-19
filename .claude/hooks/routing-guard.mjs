#!/usr/bin/env node
// Coding OS — PreToolUse(Agent) hook: the token optimizer's floor guard.
// Reads the dispatch about to happen (subagent_type + optional per-invocation model) and
// checks it against memory/model-routing.md:
//   - a Coding OS role dispatched BELOW its floor is denied (or warned, when enforce=false);
//   - a Coding OS role dispatched with NO model gets a reminder that the plan's task table
//     should have named the tier (it resolves to the agent's frontmatter default).
// Non-Coding-OS agents (Explore, general-purpose, …) are left alone.
//
// Input: PreToolUse event JSON on stdin. Output: hookSpecificOutput (Claude Code format).
import { loadPolicy, modelFamily, tierRank, tierForModel } from './routing-policy.mjs';

let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (c) => (raw += c));
process.stdin.on('end', () => {
  let evt;
  try {
    evt = JSON.parse(raw || '{}');
  } catch {
    process.exit(0);
  }
  if (evt?.tool_name && !/^(Agent|Task)$/.test(evt.tool_name)) process.exit(0);

  const input = evt?.tool_input ?? {};
  const agent = String(input.subagent_type ?? '').toLowerCase();
  const { policy } = loadPolicy();
  const rule = policy.agents?.[agent];
  if (!rule) process.exit(0); // not one of ours

  const emit = (fields) =>
    process.stdout.write(
      JSON.stringify({ hookSpecificOutput: { hookEventName: 'PreToolUse', ...fields } })
    );

  const requested = input.model;
  if (!requested) {
    emit({
      additionalContext:
        `[token-optimizer] "${agent}" dispatched without a model — it runs at its frontmatter ` +
        `default (${rule.default}). If this task came from a spec, pass model: <tier alias> from ` +
        `the task table (see memory/model-routing.md).`,
    });
    return;
  }

  const fam = modelFamily(requested, policy.rank);
  if (fam === null) process.exit(0); // unknown alias/ID: not our call

  const floorRank = tierRank(policy, rule.floor);
  if (floorRank === undefined || policy.rank[fam] >= floorRank) process.exit(0);

  const reason =
    `[token-optimizer] "${agent}" may not run below ${rule.floor} ` +
    `(${policy.tiers[rule.floor].model}); requested "${requested}" is ` +
    `${tierForModel(policy, requested) ?? 'below every tier'}. Planning and review quality is ` +
    `what makes cheap execution safe — re-dispatch at ${rule.floor} or raise the floor in ` +
    `memory/model-routing.md.`;

  if (policy.enforce === false) {
    emit({ additionalContext: reason.replace('may not', 'should not') });
    return;
  }
  emit({ permissionDecision: 'deny', permissionDecisionReason: reason });
});
