#!/usr/bin/env node
// Coding OS — SubagentStart hook + tiny CLI: the token optimizer's ledger.
// Every subagent start appends one JSONL line {ts, session, agent, model, tier} to
// .claude/token-optimizer/ledger.jsonl (git-ignored). `node dispatch-ledger.mjs stats` prints
// a per-agent × per-model breakdown so routing is re-tuned from evidence, not vibes.
//
// The resolved model comes from the SubagentStart event (Claude Code fills it in), so the
// ledger records what actually ran — including frontmatter defaults and env overrides.
import { appendFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { loadPolicy, tierForModel, projectRoot } from './routing-policy.mjs';

export const ledgerPath = (root = projectRoot()) =>
  join(root, '.claude', 'token-optimizer', 'ledger.jsonl');

export function record(evt, root = projectRoot()) {
  const agent = evt?.agent_type;
  if (!agent) return null;
  const { policy } = loadPolicy(root);
  const line = {
    ts: new Date().toISOString(),
    session: evt.session_id ?? null,
    agent,
    model: evt.model ?? null,
    tier: tierForModel(policy, evt.model),
  };
  const file = ledgerPath(root);
  mkdirSync(dirname(file), { recursive: true });
  appendFileSync(file, JSON.stringify(line) + '\n');
  return line;
}

export function stats(root = projectRoot()) {
  const file = ledgerPath(root);
  if (!existsSync(file)) return { total: 0, byAgent: {}, byModel: {}, byTier: {} };
  const rows = readFileSync(file, 'utf8')
    .split('\n')
    .filter(Boolean)
    .flatMap((l) => {
      try {
        return [JSON.parse(l)];
      } catch {
        return [];
      }
    });
  const count = (key) =>
    rows.reduce((acc, r) => ((acc[r[key] ?? 'unknown'] = (acc[r[key] ?? 'unknown'] || 0) + 1), acc), {});
  const byAgent = {};
  for (const r of rows) {
    byAgent[r.agent] ??= {};
    byAgent[r.agent][r.model ?? 'unknown'] = (byAgent[r.agent][r.model ?? 'unknown'] || 0) + 1;
  }
  return { total: rows.length, byAgent, byModel: count('model'), byTier: count('tier') };
}

export function formatStats(s) {
  if (!s.total) return 'token-optimizer ledger: no dispatches recorded yet.';
  const pct = (n) => `${Math.round((100 * n) / s.total)}%`;
  const lines = [`token-optimizer ledger: ${s.total} subagent dispatches`, '', 'By tier:'];
  for (const [t, n] of Object.entries(s.byTier).sort()) lines.push(`  ${t}: ${n} (${pct(n)})`);
  lines.push('', 'By agent × model:');
  for (const [a, models] of Object.entries(s.byAgent).sort()) {
    const parts = Object.entries(models).map(([m, n]) => `${m}=${n}`).join(', ');
    lines.push(`  ${a}: ${parts}`);
  }
  return lines.join('\n');
}

const invokedDirectly = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;
if (invokedDirectly) {
  if (process.argv[2] === 'stats') {
    process.stdout.write(formatStats(stats()) + '\n');
  } else {
    let raw = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (c) => (raw += c));
    process.stdin.on('end', () => {
      try {
        record(JSON.parse(raw || '{}'));
      } catch {
        /* never block a subagent start over a ledger write */
      }
    });
  }
}
