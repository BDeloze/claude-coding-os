#!/usr/bin/env node
// Coding OS — SessionStart hook.
// Injects the baseline so every session starts inside the methodology, and announces the
// available roles / skills / commands. Reads CLAUDE.md if present so the context is real,
// not hardcoded. Emits hookSpecificOutput.additionalContext (Claude Code SessionStart format).

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const root = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const read = (p) => (existsSync(join(root, p)) ? readFileSync(join(root, p), 'utf8') : '');

const claudeMd = read('CLAUDE.md');

const banner = [
  'Coding OS is active. Operate inside the methodology:',
  '',
  '- Front door: the **orchestrator** subagent. It confirms the project, classifies the',
  '  change (sensitive vs non-sensitive), and routes to a flow + specialist.',
  '- Roles (.claude/agents): orchestrator, planner, coder, reviewer, ops, tracker.',
  '- Flows (.claude/skills/flow-*): feature-sensitive, feature-nonsensitive, bug-fix,',
  '  incident, daily, weekly.',
  '- Discipline skills: test-driven-development, systematic-debugging, brainstorming,',
  '  writing-skills.',
  '- Commands: /feature /bugfix /incident /standup /weekly.',
  '',
  'Hard rules: 1 task = 1 branch; sensitive surfaces validated on STAGING before PROD;',
  'no secrets in commits; type/lint/build gate green + self-review before "done".',
  'Confirm the project (memory/projects.md) before any external writeback.',
  claudeMd ? '\n--- CLAUDE.md ---\n' + claudeMd : '',
].join('\n');

process.stdout.write(
  JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'SessionStart',
      additionalContext: banner,
    },
  })
);
