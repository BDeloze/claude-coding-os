#!/usr/bin/env node
// Coding OS — PostToolUse(Bash) hook.
// Detects a merge to main (`gh pr merge <N>`, a push whose destination ref is main, or a
// `git merge` run while main is checked out) and reminds Claude to run the tracker subagent
// for post-prod reconciliation (TASKS.md + release log + standalone docs). Ported from the
// race2be coding-os tracker hook.
//
// Input: the PostToolUse event JSON on stdin. We inspect the Bash command that ran.
// Output: a non-blocking reason that surfaces to Claude as guidance.
//
// The command is parsed, not regex-matched as a whole: quoted strings and heredoc bodies are
// blanked first, so a commit message that mentions "main" or "gh pr merge 12" never fires.

// Replace literal text with a placeholder token so option arguments keep their slot.
export function stripLiterals(cmd) {
  return cmd
    .replace(/<<-?\s*(['"]?)(\w+)\1([^\n]*)\n[\s\S]*?\n\s*\2(?=\s|$)/g, ' __HEREDOC__ $3 ')
    .replace(/"(?:\\.|[^"\\])*"|'[^']*'/g, ' __STR__ ');
}

const GIT_GLOBAL_WITH_ARG = new Set(['-C', '-c', '--git-dir', '--work-tree', '--namespace']);
const PUSH_OPT_WITH_ARG = new Set(['-o', '--push-option', '--receive-pack', '--exec', '--repo']);

const positionals = (args, withArg = new Set()) => {
  const out = [];
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--') break;
    if (a.startsWith('-')) {
      if (withArg.has(a)) i++;
      continue;
    }
    out.push(a);
  }
  return out;
};

const isMainRef = (ref) => ref.replace(/^\+/, '').replace(/^refs\/heads\//, '') === 'main';

// Returns { pr } for a PR merge, { main: true } for a change into main, or null.
export function detect(cmd) {
  const segments = stripLiterals(cmd).split(/&&|\|\||[;|\n]/);
  let onMain = false;
  for (const seg of segments) {
    const t = seg.trim().split(/\s+/).filter(Boolean);
    if (t[0] === 'gh' && t[1] === 'pr' && t[2] === 'merge') {
      const n = t.slice(3).find((x) => /^\d+$/.test(x));
      if (n) return { pr: n };
      continue;
    }
    if (t[0] !== 'git') continue;
    let i = 1;
    while (t[i]?.startsWith('-')) i += GIT_GLOBAL_WITH_ARG.has(t[i]) ? 2 : 1;
    const sub = t[i];
    const args = t.slice(i + 1);

    if (sub === 'checkout' || sub === 'switch') {
      const pos = positionals(args, new Set(['-b', '-B', '-c', '-C']));
      // `checkout -b x` names a new branch: x is positional here and correctly leaves main.
      if (pos.length) onMain = pos[0] === 'main';
    } else if (sub === 'merge') {
      // Merging *main into* a branch is the opposite of shipping; only a merge on main counts.
      if (onMain && !args.some((a) => ['--abort', '--quit', '--continue'].includes(a))) {
        return { main: true };
      }
    } else if (sub === 'push') {
      const [, ...refspecs] = positionals(args, PUSH_OPT_WITH_ARG);
      const dests = refspecs.map((r) => r.split(':').pop());
      if (dests.some(isMainRef) || (onMain && refspecs.length === 0)) return { main: true };
    }
  }
  return null;
}

const invokedDirectly = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;
if (invokedDirectly) {
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

    const hit = typeof cmd === 'string' ? detect(cmd) : null;
    if (!hit) process.exit(0);

    const which = hit.pr ? `PR #${hit.pr}` : 'a change into main';
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
}
