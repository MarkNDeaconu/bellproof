// art-icons · card 11: every UI glyph, the trust tags and cell icons, the CTA and social icons,
// `tc-glyph`, `question-block` and `check-scale`. Auto-discovered by src/art/registry.ts.
// Usage (README.md): static glyphs via <i data-icon="ui-chevron"></i> or icon('ui-chevron', { size: 4 });
// animated icons via <span class="px" data-piece="tag-disk"></span> or mount(el, 'tag-disk').

export { UI_PIECES, GLYPH_MAPS, uiChevron, uiArrow, uiExternal, uiExternalSm, uiCheck, uiWarn, uiClose, uiMenu, uiPlay, uiCaret, socialG, socialX, socialD } from './ui';
export type { GlyphId } from './ui';
export { TAG_PIECES, tagDisk, tagGpu, tagHelix, tagCandles, tagGlobe, tagChain } from './tags';
export { TRUST_PIECES, trustLoop, trustTarget, trustChainCheck } from './trust';
export { CTA_PIECES, ctaPlay, ctaCode, ctaBook, hoverPhase } from './cta';
export { BLOCK_PIECES, tcGlyph, questionBlock, bumpPhase } from './blocks';
export { checkScale } from './check-scale';
export { hoverable, bumpOnce, morph, MORPHS } from './motion';
export type { MorphStep } from './motion';

import { UI_PIECES } from './ui';
import { TAG_PIECES } from './tags';
import { TRUST_PIECES } from './trust';
import { CTA_PIECES } from './cta';
import { BLOCK_PIECES } from './blocks';
import { checkScale } from './check-scale';

/** Every piece in this folder, in specimen order. */
export const ICON_PIECES = [...UI_PIECES, ...CTA_PIECES, ...TAG_PIECES, ...TRUST_PIECES, ...BLOCK_PIECES, checkScale];

/** Ids of the 1-colour static glyphs meant for icon() / [data-icon]. */
export const STATIC_ICON_IDS = UI_PIECES.map((p) => p.id);
