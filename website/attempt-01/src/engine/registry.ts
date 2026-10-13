// Piece registry. Pieces are discovered automatically (src/art/registry.ts uses import.meta.glob;
// the Node scripts read src/art/*/index.ts). Nobody registers by hand.

import { isPiece, type Piece } from './piece';

const pieces = new Map<string, Piece>();

export function register(piece: Piece, source = 'unknown'): void {
  const prev = pieces.get(piece.id);
  if (prev && prev !== piece) throw new Error(`duplicate piece id "${piece.id}" (from ${source})`);
  pieces.set(piece.id, piece);
}

/** Collect every Piece exported by a module (default export, named exports, or arrays of pieces). */
export function collectPieces(mod: Record<string, unknown>): Piece[] {
  const out: Piece[] = [];
  const visit = (v: unknown) => {
    if (isPiece(v)) out.push(v);
    else if (Array.isArray(v)) v.forEach(visit);
    else if (v && typeof v === 'object' && !isPiece(v)) {
      // a plain object of pieces, e.g. export const pieces = { a, b }
      for (const inner of Object.values(v as Record<string, unknown>)) if (isPiece(inner)) out.push(inner);
    }
  };
  for (const v of Object.values(mod)) visit(v);
  return Array.from(new Set(out));
}

export function registerModule(mod: Record<string, unknown>, source = 'module'): Piece[] {
  const found = collectPieces(mod);
  found.forEach((p) => register(p, source));
  return found;
}

export function getPiece(id: string): Piece {
  const p = pieces.get(id);
  if (!p) throw new Error(`unknown piece "${id}". Registered: ${[...pieces.keys()].sort().join(', ')}`);
  return p;
}

export function hasPiece(id: string): boolean { return pieces.has(id); }

export function allPieces(): Piece[] { return [...pieces.values()].sort((a, b) => a.id.localeCompare(b.id)); }
