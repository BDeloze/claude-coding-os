// Behavioral tests for the two hooks. We run them as real subprocesses with real stdin,
// exactly as Claude Code invokes them, and assert on their stdout.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { ROOT } from './helpers.mjs';

const runHook = (script, stdin) =>
  execFileSync('node', [join(ROOT, '.claude/hooks', script)], {
    input: stdin ?? '',
    encoding: 'utf8',
  });

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
