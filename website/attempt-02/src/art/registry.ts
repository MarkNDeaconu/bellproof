// Auto-discovery: every src/art/<folder>/index.ts is imported and each Piece it exports is registered.
// Art agents never edit this file; they only add their own folder.

import { registerModule } from '../engine/registry';

const modules = import.meta.glob<Record<string, unknown>>('./*/index.ts', { eager: true });

for (const [path, mod] of Object.entries(modules)) registerModule(mod, path);

export const discovered = Object.keys(modules);

/** integrator R2 (queue #2, #9): an art folder's module (its DOM helpers besides the pieces), or undefined when the folder
 *  is not in this build. Sections look helpers up here, so `BP_ONLY` (which rewrites `modules` above) covers them too. */
export function artModule(folder: string): Record<string, unknown> | undefined {
  return (modules as Record<string, Record<string, unknown>>)[`./${folder}/index.ts`];
}
