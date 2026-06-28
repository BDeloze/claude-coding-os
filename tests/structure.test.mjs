// Structural integrity of the Coding OS: every agent, skill, and command is well-formed,
// and settings.json wires hooks that actually exist. These catch the most common drift:
// a renamed file, a missing frontmatter trigger, a broken hook path.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { read, exists, lsFiles, lsDirs, frontmatter } from './helpers.mjs';

const AGENTS = ['orchestrator', 'planner', 'coder', 'reviewer', 'ops', 'tracker'];
const FLOWS = [
  'flow-feature-sensitive',
  'flow-feature-nonsensitive',
  'flow-bug-fix',
  'flow-incident',
  'flow-daily',
  'flow-weekly',
];
const GRAFTED = [
  'test-driven-development',
  'systematic-debugging',
  'brainstorming',
  'writing-skills',
  'using-git-worktrees',
  'dispatching-parallel-agents',
];
const COMMANDS = ['feature', 'bugfix', 'incident', 'standup', 'weekly'];

test('all six role agents exist with name+description, name matching the filename', () => {
  for (const role of AGENTS) {
    const rel = `.claude/agents/${role}.md`;
    assert.ok(exists(rel), `missing agent file: ${rel}`);
    const fm = frontmatter(read(rel));
    assert.ok(fm, `${rel}: no frontmatter`);
    assert.equal(fm.name, role, `${rel}: name should equal "${role}"`);
    assert.ok(fm.description?.length > 20, `${rel}: description too short / missing`);
  }
});

test('no stray agent files beyond the six roles', () => {
  const found = lsFiles('.claude/agents').filter((f) => f.endsWith('.md')).sort();
  assert.deepEqual(found, AGENTS.map((a) => `${a}.md`).sort());
});

test('every skill has a SKILL.md whose name matches its directory', () => {
  for (const dir of lsDirs('.claude/skills')) {
    const rel = `.claude/skills/${dir}/SKILL.md`;
    assert.ok(exists(rel), `missing ${rel}`);
    const fm = frontmatter(read(rel));
    assert.ok(fm, `${rel}: no frontmatter`);
    assert.equal(fm.name, dir, `${rel}: name should equal directory "${dir}"`);
    assert.ok(fm.description?.length > 20, `${rel}: description too short / missing`);
  }
});

test('the six flows and four grafted skills are all present', () => {
  const dirs = lsDirs('.claude/skills');
  for (const s of [...FLOWS, ...GRAFTED]) {
    assert.ok(dirs.includes(s), `missing skill: ${s}`);
  }
});

test('grafted skills carry obra/superpowers provenance', () => {
  for (const s of GRAFTED) {
    const body = read(`.claude/skills/${s}/SKILL.md`);
    assert.match(body, /obra\/superpowers/, `${s}: missing provenance attribution`);
  }
});

test('every slash command exists with a description', () => {
  for (const cmd of COMMANDS) {
    const rel = `.claude/commands/${cmd}.md`;
    assert.ok(exists(rel), `missing command: ${rel}`);
    const fm = frontmatter(read(rel));
    assert.ok(fm?.description?.length > 5, `${rel}: missing description`);
  }
});

test('settings.json is valid and references hook scripts that exist', () => {
  const settings = JSON.parse(read('.claude/settings.json'));
  const groups = Object.values(settings.hooks ?? {}).flat();
  const commands = groups.flatMap((g) => g.hooks ?? []).map((h) => h.command);
  assert.ok(commands.length >= 2, 'expected at least two wired hooks');
  for (const c of commands) {
    const m = c.match(/hooks\/([\w.-]+\.mjs)/);
    assert.ok(m, `hook command has no .mjs path: ${c}`);
    assert.ok(exists(`.claude/hooks/${m[1]}`), `wired hook missing on disk: ${m[1]}`);
  }
});

test('core baseline files are present', () => {
  for (const f of [
    'CLAUDE.md',
    'engineering-rules.md',
    'README.md',
    'TASKS.md',
    'memory/stack-profile.md',
    'memory/projects.md',
  ]) {
    assert.ok(exists(f), `missing core file: ${f}`);
  }
});
