/**
 * Page meta, verbatim from `research/briefs/content.md` §1.
 * `index.html` (layout-core) writes these into <head>; keep the two in sync.
 */

export interface Meta {
  readonly title: string;
  /** 155 characters (content §1). */
  readonly description: string;
  readonly ogTitle: string;
  readonly ogDescription: string;
  /** Published by the logo-mark agent at `public/og.png` (1200×630). Relative to the site root. */
  readonly ogImage: string;
  readonly ogImageWidth: number;
  readonly ogImageHeight: number;
  /** Brief for the og:image art (not shipped as text). */
  readonly ogImageBrief: string;
  /** `ink` (#0E1424). */
  readonly themeColor: string;
}

export const meta: Meta = {
  title: 'Bellproof · Verified quantum computation, settled on-chain',
  description:
    'Bellproof verifies quantum cloud results with compiled nonlocal games. Providers get paid only when an answer passes, and anyone can audit the certificate.',
  ogTitle: 'Bellproof',
  ogDescription: 'Delegate quantum work. Verify every answer.',
  ogImage: 'og.png',
  ogImageWidth: 1200,
  ogImageHeight: 630,
  ogImageBrief:
    'A 1200×630 pixel-art card: the dilution-fridge sprite on the left, the wordmark and "Verified quantum computation, settled on-chain." on the right, with ramp bands along the bottom.',
  themeColor: '#0E1424',
};
