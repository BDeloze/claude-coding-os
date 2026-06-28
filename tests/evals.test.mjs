// Keeps the eval suite honest: every eval file follows the documented format, and every role
// agent has at least one eval. This makes "treat prompts like code" enforceable.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { read, exists, lsDirs, lsFiles } from './helpers.mjs';

const AGENTS = ['orchestrator', 'planner', 'coder', 'reviewer', 'ops', 'tracker'];

const evalFiles = () =>
  lsDirs('evals').flatMap((dir) =>
    lsFiles(`evals/${dir}`)
      .filter((f) => f.endsWith('.md'))
      .map((f) => `evals/${dir}/${f}`)
  );

test('every role agent has at least one eval directory with a case', () => {
  for (const role of AGENTS) {
    assert.ok(exists(`evals/${role}`), `missing evals/${role}/`);
    const cases = lsFiles(`evals/${role}`).filter((f) => f.endsWith('.md'));
    assert.ok(cases.length >= 1, `evals/${role}/ has no eval case`);
  }
});

test('every eval file declares Target, Prompt, Expect, and Anti-expect', () => {
  const files = evalFiles();
  assert.ok(files.length >= AGENTS.length, 'expected at least one eval per agent');
  for (const f of files) {
    const body = read(f);
    assert.match(body, /\*\*Target:\*\*/, `${f}: missing **Target:**`);
    assert.match(body, /\*\*Prompt:\*\*/, `${f}: missing **Prompt:**`);
    assert.match(body, /\*\*Expect:\*\*/, `${f}: missing **Expect:**`);
    assert.match(body, /\*\*Anti-expect:\*\*/, `${f}: missing **Anti-expect:**`);
    // Each eval needs concrete, checkable assertions.
    const checkboxes = (body.match(/^- \[ \] /gm) || []).length;
    assert.ok(checkboxes >= 3, `${f}: needs >=3 checkbox assertions, found ${checkboxes}`);
  }
});

test('each eval Target names a real agent', () => {
  for (const f of evalFiles()) {
    const m = read(f).match(/\*\*Target:\*\*\s*([\w-]+)/);
    assert.ok(m, `${f}: unparseable Target`);
    assert.ok(
      AGENTS.includes(m[1]) || exists(`.claude/skills/${m[1]}`),
      `${f}: Target "${m[1]}" is not a known agent or skill`
    );
  }
});
