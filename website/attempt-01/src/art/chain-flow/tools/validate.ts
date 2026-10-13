// Runs the engine validator over this folder's pieces only (immune to other folders mid-edit).
// Run from attempt-01/:  npx tsx src/art/chain-flow/tools/validate.ts
// Equivalent to `npm run validate -- chain-block job-token magnifier-scroll settle` when every folder imports cleanly.

import { collectPieces } from '../../../engine/registry';
import { validatePiece } from '../../../engine/validate';
import * as mod from '../index';

let errors = 0;
for (const p of collectPieces(mod as unknown as Record<string, unknown>)) {
  const r = validatePiece(p);
  errors += r.errors.length;
  const status = r.errors.length ? 'FAIL' : r.warnings.length ? 'warn' : 'ok';
  console.log(`${status.padEnd(5)} ${p.id.padEnd(18)} ${`${p.size[0]}×${p.size[1]}`.padEnd(7)} ${String(r.colours).padStart(2)} col  ${(r.frameMs ?? 0).toFixed(3)} ms/frame`);
  for (const e of r.errors) console.log(`      ✗ ${e}`);
  for (const w of r.warnings) console.log(`      ! ${w}`);
}
process.exit(errors ? 1 : 0);
