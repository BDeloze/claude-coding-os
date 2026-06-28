// Tiny zero-dependency helpers for the Coding OS test suite.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

export const read = (rel) => readFileSync(join(ROOT, rel), 'utf8');
export const exists = (rel) => existsSync(join(ROOT, rel));
export const lsFiles = (rel) =>
  readdirSync(join(ROOT, rel), { withFileTypes: true })
    .filter((d) => d.isFile())
    .map((d) => d.name);
export const lsDirs = (rel) =>
  readdirSync(join(ROOT, rel), { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

// Parse a leading YAML-ish frontmatter block (--- ... ---) into a flat key/value map.
// Good enough for `name:` / `description:` single-line fields; no nesting needed.
export function frontmatter(content) {
  const m = content.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return null;
  const out = {};
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (kv) out[kv[1]] = kv[2].trim();
  }
  return out;
}
