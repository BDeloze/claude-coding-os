// Behavioral tests for the two hooks. We run them as real subprocesses with real stdin,
// exactly as Claude Code invokes them, and assert on their stdout.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { ROOT } from './helpers.mjs';

const runHook = (script, stdin, env = {}) =>
  execFileSync('node', [join(ROOT, '.claude/hooks', script), ...(env.args ?? [])], {
    input: stdin ?? '',
    encoding: 'utf8',
    env: { ...process.env, CLAUDE_PROJECT_DIR: ROOT, ...env },
  });

const dispatch = (subagent_type, model) =>
  JSON.stringify({ tool_name: 'Agent', tool_input: { subagent_type, ...(model ? { model } : {}) } });

test('tracker-trigger fires on `gh pr merge <N>` and names the PR', () => {
  const out = runHook(
    'tracker-trigger.mjs',
    JSON.stringify({ tool_input: { command: 'gh pr merge 137 --merge' } })
  );
  const json = JSON.parse(out);
  assert.match(json.hookSpecificOutput.additionalContext, /PR #137/);
  assert.match(json.hookSpecificOutput.additionalContext, /tracker/i);
});

test('tracker-trigger fires on a git merge/push into main', () => {
  const out = runHook(
    'tracker-trigger.mjs',
    JSON.stringify({ tool_input: { command: 'git push origin staging:main' } })
  );
  assert.match(JSON.parse(out).hookSpecificOutput.additionalContext, /merge to main/i);
});

test('tracker-trigger stays silent on unrelated commands', () => {
  const out = runHook(
    'tracker-trigger.mjs',
    JSON.stringify({ tool_input: { command: 'ls -la && npm test' } })
  );
  assert.equal(out.trim(), '', 'expected no output for a non-merge command');
});

test('tracker-trigger survives malformed input without throwing', () => {
  const out = runHook('tracker-trigger.mjs', 'not json at all');
  assert.equal(out.trim(), '');
});

test('session-start emits valid SessionStart context with the banner', () => {
  const out = runHook('session-start.mjs', '');
  const json = JSON.parse(out);
  assert.equal(json.hookSpecificOutput.hookEventName, 'SessionStart');
  assert.match(json.hookSpecificOutput.additionalContext, /Coding OS is active/);
  assert.match(json.hookSpecificOutput.additionalContext, /orchestrator/);
});

// ---- Token optimizer hooks

test('routing-guard denies a reviewer dispatched below its floor (haiku < T2)', () => {
  const json = JSON.parse(runHook('routing-guard.mjs', dispatch('reviewer', 'haiku')));
  assert.equal(json.hookSpecificOutput.permissionDecision, 'deny');
  assert.match(json.hookSpecificOutput.permissionDecisionReason, /reviewer.*T2/);
});

test('routing-guard denies a planner dispatched on sonnet (floor is the top tier)', () => {
  const json = JSON.parse(runHook('routing-guard.mjs', dispatch('planner', 'claude-sonnet-5')));
  assert.equal(json.hookSpecificOutput.permissionDecision, 'deny');
});

test('routing-guard allows a coder at any tier and a planner at/above its floor', () => {
  for (const [agent, model] of [['coder', 'haiku'], ['coder', 'opus'], ['planner', 'opus'], ['planner', 'fable']]) {
    assert.equal(runHook('routing-guard.mjs', dispatch(agent, model)).trim(), '', `${agent}@${model} should pass silently`);
  }
});

test('routing-guard reminds (does not block) when a role is dispatched with no tier', () => {
  const json = JSON.parse(runHook('routing-guard.mjs', dispatch('coder')));
  assert.equal(json.hookSpecificOutput.permissionDecision, undefined);
  assert.match(json.hookSpecificOutput.additionalContext, /without a model/);
  assert.match(json.hookSpecificOutput.additionalContext, /T1/);
});

test('routing-guard ignores non-Coding-OS agents, other tools, and malformed input', () => {
  assert.equal(runHook('routing-guard.mjs', dispatch('Explore', 'haiku')).trim(), '');
  assert.equal(
    runHook('routing-guard.mjs', JSON.stringify({ tool_name: 'Bash', tool_input: { command: 'ls' } })).trim(),
    ''
  );
  assert.equal(runHook('routing-guard.mjs', 'not json').trim(), '');
});

test('routing-guard only warns when the policy sets enforce=false', () => {
  // A throwaway project root whose policy copies the real one with enforce flipped off.
  const root = mkdtempSync(join(tmpdir(), 'coding-os-'));
  mkdirSync(join(root, 'memory'));
  const policy = readFileSync(join(ROOT, 'memory/model-routing.md'), 'utf8').replace('"enforce": true', '"enforce": false');
  writeFileSync(join(root, 'memory/model-routing.md'), policy);
  const json = JSON.parse(runHook('routing-guard.mjs', dispatch('reviewer', 'haiku'), { CLAUDE_PROJECT_DIR: root }));
  assert.equal(json.hookSpecificOutput.permissionDecision, undefined);
  assert.match(json.hookSpecificOutput.additionalContext, /should not run below T2/);
});

test('dispatch-ledger records the resolved model on SubagentStart and reports stats', () => {
  const root = mkdtempSync(join(tmpdir(), 'coding-os-'));
  const start = (agent_type, model) =>
    runHook('dispatch-ledger.mjs', JSON.stringify({ hook_event_name: 'SubagentStart', session_id: 's1', agent_type, model }), { CLAUDE_PROJECT_DIR: root });
  start('coder', 'claude-haiku-4-5');
  start('coder', 'claude-sonnet-5');
  start('reviewer', 'claude-opus-5');
  const file = join(root, '.claude/token-optimizer/ledger.jsonl');
  assert.ok(existsSync(file), 'ledger file created under CLAUDE_PROJECT_DIR');
  const rows = readFileSync(file, 'utf8').trim().split('\n').map((l) => JSON.parse(l));
  assert.equal(rows.length, 3);
  assert.deepEqual(rows.map((r) => r.tier), ['T0', 'T1', 'T2']);
  const out = runHook('dispatch-ledger.mjs', '', { CLAUDE_PROJECT_DIR: root, args: ['stats'] });
  assert.match(out, /3 subagent dispatches/);
  assert.match(out, /coder: claude-haiku-4-5=1, claude-sonnet-5=1/);
  assert.match(out, /T2: 1 \(33%\)/);
});

test('dispatch-ledger stays silent and never throws on malformed input', () => {
  const root = mkdtempSync(join(tmpdir(), 'coding-os-'));
  assert.equal(runHook('dispatch-ledger.mjs', 'nope', { CLAUDE_PROJECT_DIR: root }).trim(), '');
  assert.equal(runHook('dispatch-ledger.mjs', '{}', { CLAUDE_PROJECT_DIR: root }).trim(), '');
  assert.ok(!existsSync(join(root, '.claude/token-optimizer/ledger.jsonl')), 'no ledger for a non-event');
});
