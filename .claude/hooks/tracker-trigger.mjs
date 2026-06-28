#!/usr/bin/env node
// Coding OS — PostToolUse(Bash) hook.
// Detects a merge to main (`gh pr merge <N>` or a `git merge`/push into main) and reminds
// Claude to run the tracker subagent for post-prod reconciliation (TASKS.md + release log +
// standalone docs). Ported from the race2be coding-os tracker hook.
//
// Input: the PostToolUse event JSON on stdin. We inspect the Bash command that ran.
// Output: a non-blocking reason that surfaces to Claude as guidance.

let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (c) => (raw += c));
process.stdin.on('end', () => {
  let cmd = '';
  try {
    const evt = JSON.parse(raw || '{}');
    cmd = evt?.tool_input?.command || '';
  } catch {
    process.exit(0);
  }

  const mergedPr = cmd.match(/gh\s+pr\s+merge\s+(\d+)/);
  const mergedToMain = /git\s+(merge|push)\b[^\n]*\bmain\b/.test(cmd);

  if (!mergedPr && !mergedToMain) process.exit(0);

  const which = mergedPr ? `PR #${mergedPr[1]}` : 'a change into main';
  const msg =
    `A merge to main was detected (${which}). Run the **tracker** subagent for ` +
    `post-prod reconciliation: update TASKS.md (tag [shipped:prod]), update the project's ` +
    `release log, and refresh standalone docs per the PR's docs hints. Confirm the project ` +
    `from memory/projects.md first.`;

  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: { hookEventName: 'PostToolUse', additionalContext: msg },
    })
  );
});
