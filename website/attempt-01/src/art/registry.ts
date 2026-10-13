// Auto-discovery: every src/art/<folder>/index.ts is imported and each Piece it exports is registered.
// Art agents never edit this file; they only add their own folder.

import { registerModule } from '../engine/registry';

const modules = import.meta.glob<Record<string, unknown>>('./*/index.ts', { eager: true });

for (const [path, mod] of Object.entries(modules)) registerModule(mod, path);

export const discovered = Object.keys(modules);
