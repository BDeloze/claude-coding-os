// Coding OS — shared loader for the model-routing policy.
// The single source of truth is the ```json block in memory/model-routing.md (human-readable
// policy + machine-readable block in one file, so they cannot drift apart).
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

export const projectRoot = () => process.env.CLAUDE_PROJECT_DIR || process.cwd();

export const FALLBACK_POLICY = {
  enforce: true,
  rank: { haiku: 0, sonnet: 1, opus: 2, fable: 3 },
  tiers: { T0: { model: 'haiku' }, T1: { model: 'sonnet' }, T2: { model: 'opus' } },
  agents: {
    orchestrator: { default: 'T1', floor: 'T0' },
    planner: { default: 'T2', floor: 'T2' },
    coder: { default: 'T1', floor: 'T0' },
    reviewer: { default: 'T2', floor: 'T2' },
    ops: { default: 'T1', floor: 'T1' },
    tracker: { default: 'T0', floor: 'T0' },
  },
  escalation: { failuresBeforeEscalate: 2, neverRouteDown: true },
};

export function loadPolicy(root = projectRoot()) {
  const file = join(root, 'memory', 'model-routing.md');
  if (!existsSync(file)) return { policy: FALLBACK_POLICY, source: 'fallback' };
  const m = readFileSync(file, 'utf8').match(/```json\s*\n([\s\S]*?)\n```/);
  if (!m) return { policy: FALLBACK_POLICY, source: 'fallback' };
  try {
    return { policy: JSON.parse(m[1]), source: file };
  } catch {
    return { policy: FALLBACK_POLICY, source: 'fallback' };
  }
}

// "haiku" | "claude-haiku-4-5" | "sonnet[1m]" → family alias, or null when unknown.
export function modelFamily(model, rank) {
  if (!model || typeof model !== 'string') return null;
  const lower = model.toLowerCase();
  for (const alias of Object.keys(rank)) if (lower.includes(alias)) return alias;
  return null;
}

export function tierRank(policy, tier) {
  const model = policy.tiers?.[tier]?.model;
  return model ? policy.rank[model] : undefined;
}

export function tierForModel(policy, model) {
  const fam = modelFamily(model, policy.rank);
  if (fam === null) return null;
  for (const [tier, def] of Object.entries(policy.tiers)) if (def.model === fam) return tier;
  // A family above every tier (e.g. fable) counts as the top tier.
  const top = Object.entries(policy.tiers).sort((a, b) => policy.rank[b[1].model] - policy.rank[a[1].model])[0];
  return policy.rank[fam] > policy.rank[top[1].model] ? top[0] : null;
}
