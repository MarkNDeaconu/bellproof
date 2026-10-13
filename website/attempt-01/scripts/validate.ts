// npm run validate [-- <id> ...]   · validates every piece under src/art/*/index.ts (or only the ids given).
// Also checks src/styles/tokens.css against the palette when it exists. Exit code 1 on any error.

import { readdirSync, existsSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { collectPieces } from '../src/engine/registry';
import { validatePiece, checkTokens } from '../src/engine/validate';
import { CSS_TOKENS } from '../src/engine/palette';
import type { Piece } from '../src/engine/piece';

const root = resolve(new URL('..', import.meta.url).pathname);
const artDir = join(root, 'src', 'art');
const only = new Set(process.argv.slice(2).filter((a) => !a.startsWith('--')));

// Folders whose index.ts failed to import (e.g. another agent mid-edit). They are skipped, not fatal,
// so one broken folder can't block everyone else's `validate -- <id>` / `sheet`.
export const loadErrors: Array<{ dir: string; message: string }> = [];

export async function discover(): Promise<Array<{ piece: Piece; source: string }>> {
  const out: Array<{ piece: Piece; source: string }> = [];
  const seen = new Map<string, string>();
  for (const dir of readdirSync(artDir).sort()) {
    const full = join(artDir, dir);
    if (!statSync(full).isDirectory()) continue;
    const entry = join(full, 'index.ts');
    if (!existsSync(entry)) continue;
    let mod: Record<string, unknown>;
    try {
      mod = (await import(pathToFileURL(entry).href)) as Record<string, unknown>;
    } catch (e) {
      loadErrors.push({ dir, message: e instanceof Error ? e.message.split('\n')[0] : String(e) });
      continue;
    }
    for (const piece of collectPieces(mod)) {
      if (seen.has(piece.id)) throw new Error(`duplicate piece id "${piece.id}" in ${dir} and ${seen.get(piece.id)}`);
      seen.set(piece.id, dir);
      out.push({ piece, source: dir });
    }
  }
  return out;
}

async function main(): Promise<void> {
  const found = await discover();
  let errors = 0, warnings = 0;
  const rows: string[] = [];
  for (const { dir, message } of loadErrors) {
    // Fatal only for a full run; with explicit ids, someone else's broken folder is just a warning.
    if (only.size) warnings++; else errors++;
    rows.push(`${(only.size ? 'skip' : 'FAIL').padEnd(5)} (import) ${dir.padEnd(18)} ${message}`);
  }
  for (const { piece, source } of found) {
    if (only.size && !only.has(piece.id)) continue;
    const r = validatePiece(piece);
    errors += r.errors.length; warnings += r.warnings.length;
    const status = r.errors.length ? 'FAIL' : r.warnings.length ? 'warn' : 'ok';
    rows.push(`${status.padEnd(5)} ${piece.id.padEnd(24)} ${source.padEnd(18)} ${String(piece.size[0] + '×' + piece.size[1]).padEnd(8)} ${String(r.colours).padStart(2)} col ${r.frameMs !== undefined ? r.frameMs.toFixed(3) + ' ms/frame' : ''}`);
    for (const e of r.errors) rows.push(`      ✗ ${e}`);
    for (const w of r.warnings) rows.push(`      ! ${w}`);
  }
  const tokensPath = join(root, 'src', 'styles', 'tokens.css');
  if (existsSync(tokensPath)) {
    const errs = checkTokens(readFileSync(tokensPath, 'utf8'), CSS_TOKENS);
    errors += errs.length;
    rows.push(errs.length ? `FAIL  tokens.css` : `ok    tokens.css`);
    for (const e of errs) rows.push(`      ✗ ${e}`);
  } else rows.push('skip  tokens.css (not present yet)');
  console.log(rows.join('\n'));
  console.log(`\n${found.length} piece(s) · ${errors} error(s) · ${warnings} warning(s)`);
  process.exit(errors ? 1 : 0);
}

if (process.argv[1] && resolve(process.argv[1]).endsWith('validate.ts')) main().catch((e) => { console.error(e); process.exit(1); });
