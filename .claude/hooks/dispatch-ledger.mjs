#!/usr/bin/env node
// Coding OS — PostToolUse(Agent) hook + tiny CLI: the token optimizer's ledger.
// Every Agent dispatch appends one JSONL line to .claude/token-optimizer/ledger.jsonl
// (git-ignored): {ts, session, agent, requested, effort, model, tier, tokens, status, escalated}.
// `node dispatch-ledger.mjs stats` prints share and tokens per tier, escalations, and a
// per-agent × per-model breakdown so routing is re-tuned from evidence, not vibes.
//
// `model` is tool_response.resolvedModel: what the subagent actually started on, which can
// differ from the requested alias (frontmatter defaults, env overrides, fallbacks).
// `tokens` is tool_response.totalTokens; it is absent for background launches.
import { appendFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { loadPolicy, tierForModel, projectRoot } from './routing-policy.mjs';

export const ledgerPath = (root = projectRoot()) =>
  join(root, '.claude', 'token-optimizer', 'ledger.jsonl');

export function record(evt, root = projectRoot()) {
  if (!/^(Agent|Task)$/.test(evt?.tool_name ?? '')) return null;
  const input = evt.tool_input ?? {};
  const res = evt.tool_response && typeof evt.tool_response === 'object' ? evt.tool_response : {};
  const { policy } = loadPolicy(root);
  const model = res.resolvedModel ?? null;
  const line = {
    ts: new Date().toISOString(),
    session: evt.session_id ?? null,
    agent: input.subagent_type || 'general-purpose',
    requested: input.model ?? null,
    effort: input.effort ?? null,
    model,
    tier: tierForModel(policy, model),
    tokens: Number.isFinite(res.totalTokens) ? res.totalTokens : null,
    status: res.status ?? null,
    // A subagent that hit a decision its brief did not settle says so in its result.
    escalated: /\bESCALATE:/.test(JSON.stringify(res.content ?? '')),
  };
  const file = ledgerPath(root);
  mkdirSync(dirname(file), { recursive: true });
  appendFileSync(file, JSON.stringify(line) + '\n');
  return line;
}

export function stats(root = projectRoot()) {
  const empty = { total: 0, byAgent: {}, byTier: {}, tokensByTier: {}, escalations: {} };
  const file = ledgerPath(root);
  if (!existsSync(file)) return empty;
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
  const s = { ...empty, total: rows.length };
  for (const r of rows) {
    const tier = r.tier ?? 'unknown';
    const model = r.model ?? 'unknown';
    s.byTier[tier] = (s.byTier[tier] || 0) + 1;
    if (Number.isFinite(r.tokens)) s.tokensByTier[tier] = (s.tokensByTier[tier] || 0) + r.tokens;
    s.byAgent[r.agent] ??= {};
    s.byAgent[r.agent][model] = (s.byAgent[r.agent][model] || 0) + 1;
    if (r.escalated) s.escalations[`${r.agent}@${tier}`] = (s.escalations[`${r.agent}@${tier}`] || 0) + 1;
  }
  return s;
}

export function formatStats(s) {
  if (!s.total) return 'token-optimizer ledger: no dispatches recorded yet.';
  const pct = (n) => `${Math.round((100 * n) / s.total)}%`;
  const lines = [`token-optimizer ledger: ${s.total} subagent dispatches`, '', 'By tier:'];
  for (const [t, n] of Object.entries(s.byTier).sort()) {
    const tok = s.tokensByTier[t] ? `, ${s.tokensByTier[t]} tokens` : '';
    lines.push(`  ${t}: ${n} (${pct(n)})${tok}`);
  }
  lines.push('', 'By agent × model:');
  for (const [a, models] of Object.entries(s.byAgent).sort()) {
    const parts = Object.entries(models).map(([m, n]) => `${m}=${n}`).join(', ');
    lines.push(`  ${a}: ${parts}`);
  }
  const esc = Object.entries(s.escalations).sort();
  lines.push('', esc.length ? 'Escalations (ESCALATE: returned):' : 'Escalations: none');
  for (const [k, n] of esc) lines.push(`  ${k}: ${n}`);
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
        /* never fail a dispatch over a ledger write */
      }
    });
  }
}
