/**
 * Page meta, verbatim from `research/briefs/content.md` §1 (revision 1 applied).
 * `index.html` (layout-core) writes these into <head>; keep the two in sync.
 */

export interface Meta {
  readonly title: string;
  /** 155 characters (content §1). */
  readonly description: string;
  readonly ogTitle: string;
  readonly ogDescription: string;
  /**
   * Absolute og:image URL (scrapers ignore relative ones); the file is `public/og.png` (1200×630).
   * final validation: `[Site URL]` filled with the GitHub Pages project URL the site deploys to.
   */
  readonly ogImage: string;
  readonly ogImageWidth: number;
  readonly ogImageHeight: number;
  /** og:image:alt, describing the shipped `public/og.png`. */
  readonly ogImageAlt: string;
  /** Brief for the og:image art (not shipped as text). */
  readonly ogImageBrief: string;
  /** `ink` (#0E1424). */
  readonly themeColor: string;
  /** meta author (integrator R2, user request). */
  readonly author: string;
}

export const meta: Meta = {
  title: 'Bellproof · Verified quantum computation, settled on-chain',
  description:
    'Bellproof verifies quantum cloud results with compiled nonlocal games. Providers get paid only when an answer passes, and anyone can audit the certificate.',
  ogTitle: 'Bellproof',
  ogDescription: 'Delegate quantum work. Verify every answer.',
  ogImage: 'https://markndeaconu.github.io/bellproof/og.png',
  ogImageWidth: 1200,
  ogImageHeight: 630,
  ogImageAlt:
    'The Bellproof wordmark beside a pixel-art bell with a check mark, the line “Verified quantum computation, settled on-chain.” and stepped blue bands along the bottom.',
  ogImageBrief:
    'A 1200×630 pixel-art card: the pixel bell mark on the left, the wordmark and “Verified quantum computation, settled on-chain.” on the right, with ramp bands along the bottom.',
  themeColor: '#0E1424',
  author: 'Mark Deaconu',
};
