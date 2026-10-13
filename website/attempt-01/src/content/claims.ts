/**
 * Claims ledger for QA (content.md §14), plus the "Never say" list.
 * QA checks every number on the page against these rows.
 *
 * `claim`, `brief` and `source` are verbatim from §14. `match` (added by the
 * content agent) lists literal substrings of `strings.ts` where the claim ships,
 * so a script can find every occurrence; `illustrative` marks rows whose values
 * must carry the `illustrative` tag wherever they appear.
 */

export interface Claim {
  readonly claim: string;
  /** Brief sections the claim appears in, e.g. `['§6']`. */
  readonly brief: readonly string[];
  readonly source: string;
  readonly match: readonly string[];
  readonly illustrative?: true;
}

export const claims: readonly Claim[] = [
  {
    claim: 'IBM Quantum, Amazon Braket and Azure Quantum rent time on real quantum processors',
    brief: ['§6'],
    source: 'deck/quantum-cloud',
    match: ['IBM Quantum, Amazon Braket and Azure Quantum already rent time on real quantum processors'],
  },
  {
    claim: 'ΔE = −12.4 (± 1.0) kcal/mol, job #0412, hashes, addresses',
    brief: ['§4', '§6', '§8', '§10', '§13'],
    source: 'deck/example, deck/certificate (illustrative; must be labelled)',
    match: ['−12.4', '#0412', '±1.0 kcal/mol', '0x9f3c…e21a', '0x41b2…7c09', 'ipfs://bafy…q3k'],
    illustrative: true,
  },
  {
    claim: '2¹⁰⁰ ≈ 10³⁰ amplitudes, ~100-qubit model',
    brief: ['§6'],
    source: 'deck/example',
    match: ['2¹⁰⁰ ≈ 10³⁰', '~100-qubit model'],
  },
  {
    claim: 'At 99.9% gate fidelity, a 10,000-gate circuit expects ~10 faults',
    brief: ['§7'],
    source: 'deck/silent',
    match: ['At 99.9% gate fidelity, a 10,000-gate circuit expects ~10 faults'],
  },
  {
    claim: '$2.6B per approved drug, including failures',
    brief: ['§7'],
    source: 'deck/pharma-numbers, which cites DiMasi, Grabowski & Hansen 2016',
    match: ['$2.6B', 'DiMasi, Grabowski & Hansen'],
  },
  {
    claim: '9.6% Phase I → approval',
    brief: ['§7'],
    source: 'deck/pharma-numbers, which cites BIO 2016',
    match: ['9.6%', 'BIO, Clinical Development Success Rates 2006–2015 (2016)'],
  },
  {
    claim: '10–15 years discovery → approval',
    brief: ['§7'],
    source: 'deck/pharma-numbers, which cites PhRMA',
    match: ['10–15 years', 'PhRMA'],
  },
  {
    claim: 'Intel 1994, $475M charge',
    brief: ['§7'],
    source: 'deck/history, which cites Intel Jan 1995',
    match: ['$475M charge', 'Intel, Jan 1995'],
  },
  {
    claim: 'JPMorgan 2012, ~$6.2B losses',
    brief: ['§7'],
    source: 'deck/history, which cites the JPMorgan Chase Task Force 2013',
    match: ['~$6.2B in losses', 'JPMorgan Chase Management Task Force report, 2013'],
  },
  {
    claim: 'Google and Meta 2021, silent CPU errors',
    brief: ['§7'],
    source: 'deck/history, which cites Hochschild et al. HotOS 2021 and Dixit et al. 2021',
    match: ['Google · Meta', 'Hochschild et al. (Google), HotOS 2021', 'Dixit et al. (Meta), 2021'],
  },
  {
    claim: 'Magic Square: classical 8/9, quantum 1',
    brief: ['§11'],
    source: 'deck/games',
    match: ['8/9', 'classical ≤ 8/9 · quantum = 1'],
  },
  {
    claim: 'LWE is the assumption family behind NIST ML-KEM',
    brief: ['§11'],
    source: 'deck/compiler',
    match: ["the lattice assumption family behind NIST's ML-KEM standard"],
  },
  {
    claim: 'Holler–Natarajan: quasilinear total cost',
    brief: ['§11', '§12'],
    source: 'deck/compiler; MR §1',
    match: ['Holler–Natarajan (2026) cut the total cost to quasilinear in circuit size', 'Total cost cut to quasilinear in circuit size'],
  },
  {
    claim: '"The first marketplace where quantum results are cryptographically verified before anyone gets paid."',
    brief: ['§8'],
    source: 'MR §1. Use this verbatim; never paraphrase it upward.',
    match: ['The first marketplace where quantum results are cryptographically verified before anyone gets paid.'],
  },
  {
    claim: 'Providers have started certifying their own results',
    brief: ['§8'],
    source: 'MR §2 Tier 2',
    match: ['Providers have started certifying their own results.'],
  },
  {
    claim: 'Fault-tolerant providers assumed; full protocol about 2030 or later',
    brief: ['§13'],
    source: 'deck/guarantees; MR TL;DR #3',
    match: ['The protocol assumes fault-tolerant providers', 'about 2030 or later'],
  },
  {
    claim: 'Commit–reveal relates to time-delayed public verifiability',
    brief: ['§10'],
    source: 'MR §3.4; arXiv:2604.23516',
    match: ['The same idea drives time-delayed public verifiability.'],
  },
];

/** Content §14 "Never say", verbatim. */
export const neverSay: readonly string[] = [
  '"First quantum blockchain", "first quantum verification", or "first quantum compute on-chain". [MR §1]',
  'That the certificate proves the chemistry, or the model, is right.',
  'That the full protocol works on today\'s noisy hardware, or any delivery date other than "about 2030 or later".',
  'Customers, partners, pilots, quotes, logos, user counts, or revenue.',
  '"Trustless". Use "anyone can audit" instead.',
  'That the escrow currency, chain or token is decided. Use `[Network / testnet]`.',
];

/**
 * Machine-checkable forms of the "Never say" list and the voice rules (content §0, §14),
 * case-insensitive substrings that must not appear in any shipped string.
 */
export const bannedPhrases: readonly string[] = [
  'first quantum blockchain',
  'first quantum verification',
  'first quantum compute on-chain',
  'trustless',
  'our clients',
  'our customers',
  // Hype words (content §0 Voice).
  'revolutionary',
  'game-changing',
  'groundbreaking',
  'cutting-edge',
  'seamless',
  'unlock',
  'next-gen',
  'supercharge',
];

/** Values that must carry the `illustrative` tag wherever they appear (content §0). */
export const illustrativeTokens: readonly string[] = ['−12.4', '#0412'];
