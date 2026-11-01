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

const trackerFires = (command) =>
  runHook('tracker-trigger.mjs', JSON.stringify({ tool_input: { command } })).trim() !== '';

test('tracker-trigger ignores "main" inside quoted messages and heredocs', () => {
  for (const command of [
    'git merge -s ours -m "chore: merge tip (content already on main via #3)" origin/feature',
    'git commit -m "fix: run git push origin main later"',
    "git commit -m 'docs: explain gh pr merge 12 on main'",
    'git commit -F - <<\'EOF\'\nfix: git push origin main\nEOF',
  ]) {
    assert.equal(trackerFires(command), false, `should stay silent: ${command}`);
  }
});

test('tracker-trigger ignores merging main INTO a branch and branches that merely contain "main"', () => {
  for (const command of [
    'git merge main',
    'git merge origin/main',
    'git push origin claude/maintenance',
    'git push -u origin fix/main-menu',
    'git push origin main-backup',
  ]) {
    assert.equal(trackerFires(command), false, `should stay silent: ${command}`);
  }
});

test('tracker-trigger fires on real pushes to main and merges made while on main', () => {
  for (const command of [
    'git push origin main',
    'git push origin HEAD:main',
    'git push --force-with-lease origin +staging:refs/heads/main',
    'git -C /repo push origin staging:main',
    'git checkout main && git merge --no-ff feat/x',
    'git switch main; git merge staging && git push',
    'git checkout main && git push origin',
    'gh pr merge 42 --squash',
  ]) {
    assert.equal(trackerFires(command), true, `should fire: ${command}`);
  }
});

test('tracker-trigger stops treating later merges as into main after leaving main', () => {
  assert.equal(trackerFires('git checkout main && git pull && git checkout feat/x && git merge main'), false);
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

test('routing-guard allows a coder at any tier and planner/reviewer at their floor', () => {
  for (const [agent, model] of [['coder', 'haiku'], ['coder', 'opus'], ['planner', 'opus'], ['reviewer', 'claude-opus-5-5']]) {
    assert.equal(runHook('routing-guard.mjs', dispatch(agent, model)).trim(), '', `${agent}@${model} should pass silently`);
  }
});

test('routing-guard reminds (does not block) when a role is dispatched with no tier', () => {
  const json = JSON.parse(runHook('routing-guard.mjs', dispatch('coder')));
  assert.equal(json.hookSpecificOutput.permissionDecision, undefined);
  assert.match(json.hookSpecificOutput.additionalContext, /without a model/);
  assert.match(json.hookSpecificOutput.additionalContext, /model: sonnet, effort: medium/);
});

test('routing-guard ignores non-Coding-OS agents, unranked models, other tools, and malformed input', () => {
  assert.equal(runHook('routing-guard.mjs', dispatch('Explore', 'haiku')).trim(), '');
  assert.equal(runHook('routing-guard.mjs', dispatch('reviewer', 'fable')).trim(), '');
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

test('dispatch-ledger records each Agent dispatch from PostToolUse and reports stats', () => {
  const root = mkdtempSync(join(tmpdir(), 'coding-os-'));
  const done = (subagent_type, requested, effort, resolvedModel, totalTokens, text = 'done') =>
    runHook(
      'dispatch-ledger.mjs',
      JSON.stringify({
        hook_event_name: 'PostToolUse',
        session_id: 's1',
        tool_name: 'Agent',
        tool_input: { subagent_type, model: requested, effort, prompt: 'p', description: 'd' },
        tool_response: { status: 'completed', resolvedModel, totalTokens, content: [{ type: 'text', text }] },
      }),
      { CLAUDE_PROJECT_DIR: root }
    );
  done('coder', 'haiku', 'low', 'claude-haiku-5-5', 1000);
  done('coder', 'sonnet', 'medium', 'claude-sonnet-5-5', 3000, 'ESCALATE: the spec does not settle the return type');
  done('reviewer', 'opus', 'xhigh', 'claude-opus-5-5', 6000);
  done('reviewer', undefined, undefined, 'claude-fable-5-1', 2000); // not in the policy: shown as unknown
  const file = join(root, '.claude/token-optimizer/ledger.jsonl');
  assert.ok(existsSync(file), 'ledger file created under CLAUDE_PROJECT_DIR');
  const rows = readFileSync(file, 'utf8').trim().split('\n').map((l) => JSON.parse(l));
  assert.equal(rows.length, 4);
  assert.deepEqual(rows.map((r) => r.tier), ['T0', 'T1', 'T2', null]);
  assert.deepEqual(rows.map((r) => r.effort), ['low', 'medium', 'xhigh', null]);
  assert.deepEqual(rows.map((r) => r.escalated), [false, true, false, false]);
  assert.equal(rows[2].requested, 'opus');
  const out = runHook('dispatch-ledger.mjs', '', { CLAUDE_PROJECT_DIR: root, args: ['stats'] });
  assert.match(out, /4 subagent dispatches/);
  assert.match(out, /T1: 1 \(25%\), 3000 tokens/);
  assert.match(out, /unknown: 1 \(25%\), 2000 tokens/);
  assert.match(out, /coder: claude-haiku-5-5=1, claude-sonnet-5-5=1/);
  assert.match(out, /coder@T1: 1/);
});

test('dispatch-ledger ignores other tools and the old SubagentStart shape', () => {
  const root = mkdtempSync(join(tmpdir(), 'coding-os-'));
  runHook('dispatch-ledger.mjs', JSON.stringify({ tool_name: 'Bash', tool_input: { command: 'ls' } }), { CLAUDE_PROJECT_DIR: root });
  runHook('dispatch-ledger.mjs', JSON.stringify({ hook_event_name: 'SubagentStart', agent_type: 'coder' }), { CLAUDE_PROJECT_DIR: root });
  assert.ok(!existsSync(join(root, '.claude/token-optimizer/ledger.jsonl')));
});

test('dispatch-ledger records a background launch without tokens', () => {
  const root = mkdtempSync(join(tmpdir(), 'coding-os-'));
  runHook(
    'dispatch-ledger.mjs',
    JSON.stringify({ tool_name: 'Agent', tool_input: { subagent_type: 'Explore', model: 'haiku' }, tool_response: { status: 'async_launched', resolvedModel: 'claude-haiku-5-5' } }),
    { CLAUDE_PROJECT_DIR: root }
  );
  const row = JSON.parse(readFileSync(join(root, '.claude/token-optimizer/ledger.jsonl'), 'utf8'));
  assert.equal(row.agent, 'Explore');
  assert.equal(row.tier, 'T0');
  assert.equal(row.tokens, null);
});

test('dispatch-ledger stays silent and never throws on malformed input', () => {
  const root = mkdtempSync(join(tmpdir(), 'coding-os-'));
  assert.equal(runHook('dispatch-ledger.mjs', 'nope', { CLAUDE_PROJECT_DIR: root }).trim(), '');
  assert.equal(runHook('dispatch-ledger.mjs', '{}', { CLAUDE_PROJECT_DIR: root }).trim(), '');
  assert.ok(!existsSync(join(root, '.claude/token-optimizer/ledger.jsonl')), 'no ledger for a non-event');
});
