/**
 * Every visible string on the Bellproof site, transcribed verbatim from
 * `research/briefs/content.md` §1–§13 (plus §15, the optional block).
 *
 * Owner: content agent. Section agents never hard-code copy: import `strings`
 * (or use `fillStrings` from `./fill`) and map over the arrays below.
 *
 * Conventions
 * - Internal `[src: …]` tags from the brief are stripped; they never ship.
 *   Shipped `Sources:` lines are kept verbatim (`cost.stats.sources`, `cost.history.sources`).
 * - Placeholders such as `[Team]` and `[Demo link]` are kept exactly as written
 *   (see `PLACEHOLDERS`). Hrefs that are placeholders are kept verbatim too;
 *   use `isPlaceholder()` to decide how to render them.
 * - `Rich` = plain text with trailing highlight spans. A `{ em }` part is the
 *   brief's **bold** text, which the design renders in `--blue` at the same
 *   weight (design-spec §2.1). Render with `richHTML()` / `richText()`.
 * - Icon glyphs are NOT part of the strings: ✓ / ⚠ rows, the ↗ external-link
 *   mark, ▶ play, chevrons. The design draws them as pixel icons (design §4.9).
 *   Arrows the brief writes inside a label (`See the contracts →`,
 *   `Job + escrow →`, `← Certified result`) ARE part of the string.
 * - `piece` fields are art-spec ids (not visible text), given where content.md
 *   names the icon or sprite for an item, so sections can map without guessing.
 * - `runningExample: true` marks the blocks that carry the `RUNNING EXAMPLE` chip;
 *   `illustrative: true` marks values that need the small `illustrative` tag.
 */

/* ------------------------------------------------------------------ types */

/** A link. `href` is verbatim from content.md: `#id`, `mailto:…`, `https://…` or a placeholder. */
export interface Link {
  readonly label: string;
  readonly href: string;
}

/** Plain text, or a highlighted span (the brief's **bold**, rendered in `--blue`). */
export type RichPart = string | { readonly em: string };
/** Text with highlight spans. Spaces between parts are included in the strings. */
export type Rich = readonly RichPart[];

/** A value that must carry the small mono `illustrative` tag (content §0). */
export interface Illustrative {
  readonly text: string;
  readonly illustrative: true;
}
/** A table cell: plain text, or an illustrative value. */
export type Cell = string | Illustrative;

export interface TitleBody {
  readonly title: string;
  readonly body: string;
}

export interface Table {
  readonly headers: readonly string[];
  /** Each row has one cell per header; the first cell is the row title (`h5`). */
  readonly rows: readonly (readonly Cell[])[];
}

export interface ResearchItem {
  /** 1-based row number in content §12. */
  readonly n: number;
  readonly year: string;
  readonly authors: string;
  /** Paper title (italic in the brief; design sets it as `h5`, italic off). */
  readonly title: string;
  readonly venue: string;
  /** "What it gives us": one line in ink-soft under the title. */
  readonly gives: string;
  readonly url: string;
  /** e.g. `arXiv:1804.01082` (shown in the footer Research column). */
  readonly arxiv: string;
}

export interface Strings {
  readonly common: {
    /** The ink pill with paper text (content §0). */
    readonly runningExample: string;
    /** The small mono tag next to illustrative values (content §0). */
    readonly illustrative: string;
  };
  /** UI microcopy that content.md does not write (design-spec §4.1 and a11y labels). */
  readonly ui: {
    readonly skipLink: string;
    readonly menuLabel: string;
    readonly menuOpen: string;
    readonly menuClose: string;
  };
  readonly nav: {
    readonly logo: Link;
    readonly items: readonly Link[];
    /** Right, outline cell. */
    readonly contact: Link;
    /** Right, solid ink cell (with the pixel play glyph). */
    readonly demo: Link;
  };
  readonly top: {
    readonly pill: Link;
    readonly h1: string;
    /** The inline Bloch sphere sits after this word of the H1. */
    readonly h1SpriteAfter: string;
    readonly lead: string;
    readonly ctas: { readonly primary: Link; readonly secondary: Link };
    readonly ticker: Illustrative;
    readonly strip: {
      readonly label: string;
      readonly cells: readonly { readonly name: string; readonly venue: string; readonly href: string }[];
    };
    /** Design-spec §5.1: temperature labels beside the fridge plates, top to bottom. */
    readonly fridgeLabels: readonly string[];
    /** Design-spec §5.1: the cooldown readout, one value per step. */
    readonly cooldown: readonly string[];
    readonly alt: { readonly fridge: string };
    readonly optional: {
      /** Content §4 alternates for the creative director. NOT shipped: design §5.1 uses `top.h1`. */
      readonly h1Alternates: readonly string[];
    };
  };
  readonly trust: {
    readonly eyebrow: string;
    readonly h2: string;
    readonly lead: string;
    readonly tags: readonly { readonly label: string; readonly piece: string }[];
    readonly cells: readonly { readonly title: string; readonly body: string; readonly tag: string; readonly piece: string }[];
    readonly closing: Rich;
    readonly example: { readonly runningExample: true; readonly text: string };
  };
  readonly flip: {
    readonly eyebrow: string;
    readonly h2: string;
    readonly lead: string;
    readonly example: {
      readonly runningExample: true;
      readonly questionLabel: string;
      readonly question: string;
      readonly whyLabel: string;
      readonly why: string;
      readonly comesBack: { readonly eyebrow: string; readonly value: string; readonly body: string; readonly illustrative: true };
      readonly behind: { readonly eyebrow: string; readonly value: string; readonly body: string };
    };
    readonly table: Table & { readonly title: string };
    readonly paradox: { readonly id: string; readonly eyebrow: string; readonly statement: string; readonly sub: string };
    readonly alt: { readonly fridgeOut: string };
  };
  readonly cost: {
    readonly eyebrow: string;
    readonly h2: string;
    readonly lead: string;
    readonly cells: readonly { readonly title: string; readonly body: string; readonly piece: string }[];
    readonly cascade: {
      readonly runningExample: true;
      readonly h3: string;
      readonly body: string;
      readonly bars: readonly { readonly n: string; readonly title: string; readonly body: string }[];
      readonly connector: { readonly left: string; readonly right: string };
      readonly errors: readonly { readonly tag: string; readonly title: string; readonly body: string }[];
    };
    readonly stats: {
      readonly items: readonly {
        /** Final value, verbatim. */
        readonly value: string;
        readonly caption: string;
        /** Count-up hint: `prefix + to.toFixed(decimals) + suffix === value`. */
        readonly count: { readonly prefix: string; readonly to: number; readonly decimals: number; readonly suffix: string };
      }[];
      readonly closing: Rich;
      readonly sources: string;
    };
    readonly history: {
      readonly h3: string;
      readonly items: readonly { readonly year: string; readonly who: string; readonly line: string; readonly body: string }[];
      readonly closing: Rich;
      readonly sources: string;
    };
    readonly alt: { readonly cascadeCoin: string };
  };
  readonly layer: {
    readonly eyebrow: string;
    readonly h2: string;
    readonly lead: string;
    readonly diagram: {
      readonly clients: { readonly title: string; readonly body: string; readonly tag: string };
      readonly bellproof: { readonly title: string; readonly rows: readonly { readonly label: string; readonly body: string }[] };
      readonly clouds: { readonly title: string; readonly body: string; readonly tag: string };
      readonly lanes: {
        readonly left: { readonly top: string; readonly bottom: string };
        readonly right: { readonly top: string; readonly bottom: string };
      };
    };
    readonly line1: Rich;
    /** Pull quote: the approved "first" claim, verbatim (claims ledger). */
    readonly quote: string;
    readonly quoteNote: string;
    readonly table: Table & { readonly id: string; readonly runningExample: true; readonly h3: string };
    readonly cta: Link;
    readonly alt: { readonly packets: string };
  };
  readonly clients: {
    readonly eyebrow: string;
    readonly h2: string;
    readonly lead: string;
    readonly cta: Link;
    readonly labels: { readonly question: string; readonly stakes: string; readonly certificate: string };
    readonly tabs: readonly {
      readonly tab: string;
      readonly question: string;
      readonly stakes: string;
      readonly certificate: string;
      readonly runningExample?: true;
      readonly piece: string;
    }[];
  };
  readonly flow: {
    readonly eyebrow: string;
    readonly h2: string;
    readonly lead: string;
    readonly lanes: { readonly on: string; readonly off: string };
    /** Mobile lane tag on each step (content §10 "Lane" column). */
    readonly laneTags: { readonly on: string; readonly off: string };
    readonly steps: readonly {
      readonly n: string;
      readonly lane: 'on' | 'off';
      readonly title: string;
      readonly body: string;
      /** Running-example aside (mono, small). The aside column carries `illustrative` once, at its top. */
      readonly aside?: string;
      /** Art id beside the step; `mode` is the chain-block face for on-chain steps. */
      readonly piece: string;
      readonly mode?: string;
    }[];
    readonly outcomes: {
      readonly honest: { readonly title: string; readonly items: readonly string[] };
      readonly cheat: { readonly title: string; readonly items: readonly string[] };
    };
    readonly note: TitleBody;
    readonly demoDetails: string;
    readonly ctas: readonly Link[];
    readonly alt: { readonly chainFlow: string };
  };
  readonly verify: {
    readonly eyebrow: string;
    readonly h2: string;
    readonly lead: string;
    readonly tabs: readonly Link[];
    readonly rows: {
      readonly games: {
        readonly id: string;
        readonly h3: string;
        readonly body: string;
        readonly stats: readonly { readonly value: string; readonly caption: string }[];
        readonly explainer: TitleBody;
        readonly rigidity: { readonly eyebrow: string; readonly body: string };
        readonly readout: string;
        readonly cta: Link;
        readonly alt: string;
      };
      readonly compiler: {
        readonly id: string;
        readonly h3: string;
        readonly body: string;
        readonly cells: readonly { readonly eyebrow: string; readonly body: string }[];
        readonly cta: Link;
        /** HTML labels under the sprite, swapped with the piece's `state`. */
        readonly labels: { readonly physical: string; readonly cryptographic: string };
        readonly alt: string;
      };
      readonly rounds: {
        readonly id: string;
        readonly runningExample: true;
        readonly h3: string;
        readonly body: string;
        readonly cards: readonly TitleBody[];
        readonly cta: Link;
        /** HTML labels beside the sprite's two rows, the meter label and the cheater-loop stamp. */
        readonly labels: { readonly schedule: string; readonly provider: string; readonly meter: string; readonly rejected: string };
        readonly alt: string;
      };
    };
    readonly research: {
      readonly id: string;
      readonly h3: string;
      readonly lead: string;
      /** Link-cell label; the ↗ is the pixel external glyph. */
      readonly linkLabel: string;
      readonly items: readonly ResearchItem[];
    };
  };
  readonly guarantees: {
    readonly eyebrow: string;
    readonly h2: string;
    readonly lead: string;
    readonly certificate: {
      readonly title: string;
      readonly rows: readonly { readonly key: string; readonly value: string; readonly accent?: true }[];
    };
    readonly whereItGoes: { readonly label: string; readonly items: readonly TitleBody[] };
    readonly guaranteed: { readonly title: string; readonly items: readonly string[] };
    readonly notCovered: { readonly title: string; readonly items: readonly { readonly lead: string; readonly body: string }[] };
    readonly footnote: string;
    readonly closing: { readonly runningExample: true; readonly text: Rich };
    readonly cta: Link;
    readonly alt: { readonly certMint: string };
    readonly optional: {
      readonly assuranceLevels: {
        readonly headline: string;
        readonly note: string;
        readonly headers: readonly string[];
        readonly levels: readonly { readonly level: string; readonly proves: string; readonly today: string }[];
      };
    };
  };
  readonly cta: {
    readonly eyebrow: string;
    readonly h2: string;
    readonly lead: string;
    readonly cells: readonly { readonly piece: string; readonly title: string; readonly body: string; readonly button: Link }[];
    readonly final: Link;
  };
  readonly footer: {
    readonly columns: readonly {
      readonly label: string;
      /** No `href` = plain text. `detail` = the mono arXiv id after the ↗ glyph. */
      readonly items: readonly { readonly label: string; readonly href?: string; readonly detail?: string }[];
    }[];
    readonly socials: {
      readonly items: readonly { readonly label: string; readonly href: string; readonly piece: string; readonly supplied: boolean }[];
    };
    readonly tagline: string;
    readonly copyright: string;
    readonly builtBy: string;
    readonly illustrativeNote: string;
  };
}

/* ------------------------------------------------------------ placeholders */

/** Content §0: ship exactly as written until the team fills them in. */
export const PLACEHOLDERS = [
  '[Team]',
  '[Contact email]',
  '[GitHub]',
  '[Hackathon]',
  '[Demo link]',
  '[Network / testnet]',
  '[Contract addresses]',
  '[Terms]',
  '[Privacy]',
  '[License]',
  '[X]',
  '[Discord]',
  // Not in the §0 list, but written as a placeholder in content §13 (guarantees footnote).
  '[simulator / hardware: confirm]',
] as const;

/** True if the text or href contains an unfilled placeholder. */
export function isPlaceholder(s: string): boolean {
  return PLACEHOLDERS.some((p) => s.includes(p));
}

/** True for hrefs that leave the page (papers, demo, code); these take the ↗ glyph. */
export function isExternal(href: string): boolean {
  return /^https?:\/\//.test(href) || href === '[Demo link]' || href === '[GitHub]';
}

/* --------------------------------------------------------- research (§12) */

/** Canonical research list (content §12). Used by the hero strip, §11 and the footer. */
export const research: readonly ResearchItem[] = [
  {
    n: 1,
    year: '2018',
    authors: 'Urmila Mahadev',
    title: 'Classical Verification of Quantum Computations',
    venue: 'FOCS 2018',
    gives: 'A classical verifier can check a quantum computation, using cryptography',
    url: 'https://arxiv.org/abs/1804.01082',
    arxiv: 'arXiv:1804.01082',
  },
  {
    n: 2,
    year: '2023',
    authors: 'Yael Kalai, Alex Lombardi, Vinod Vaikuntanathan, Lisa Yang',
    title: 'Quantum Advantage from Any Non-Local Game',
    venue: 'STOC 2023',
    gives: 'The KLVY compiler: encryption replaces the wall between the players',
    url: 'https://arxiv.org/abs/2203.15877',
    arxiv: 'arXiv:2203.15877',
  },
  {
    n: 3,
    year: '2023',
    authors: 'Anand Natarajan, Tina Zhang',
    title: 'Bounding the quantum value of compiled nonlocal games: from CHSH to BQP verification',
    venue: 'FOCS 2023',
    gives: 'Compiled games become verification of any quantum computation (BQP)',
    url: 'https://arxiv.org/abs/2303.01545',
    arxiv: 'arXiv:2303.01545',
  },
  {
    n: 4,
    year: '2026',
    authors: 'Finn Holler, Anand Natarajan',
    title: 'Classical Verification of Quantum Computation with Quasilinear Resources, from Compiled Nonlocal Games',
    venue: 'arXiv:2609.38060',
    gives: 'Total cost cut to quasilinear in circuit size',
    url: 'https://arxiv.org/abs/2609.38060',
    arxiv: 'arXiv:2609.38060',
  },
  {
    n: 5,
    year: '2026',
    authors: 'Ameer Mohammed, Aydin Abadi, Jaffer Mahdi',
    title: 'Time-Delayed Publicly Verifiable Quantum Computation for Classical Verifiers',
    venue: 'ACM CCS 2026 (accepted)',
    gives: 'Commit now, reveal later, so anyone can re-check',
    url: 'https://arxiv.org/abs/2604.23516',
    arxiv: 'arXiv:2604.23516',
  },
];

const [R1, R2, R3, R4, R5] = research as readonly [ResearchItem, ResearchItem, ResearchItem, ResearchItem, ResearchItem];

const ILLUSTRATIVE_NOTE = 'Figures marked "illustrative" are examples.';

/* ---------------------------------------------------------------- strings */

export const strings: Strings = {
  common: {
    runningExample: 'RUNNING EXAMPLE',
    illustrative: 'illustrative',
  },

  ui: {
    skipLink: 'Skip to content', // design-spec §4.1
    menuLabel: 'MENU', // design-spec §4.1: centre label while the mobile menu is open
    menuOpen: 'Open menu', // aria-label (a11y; not in content.md)
    menuClose: 'Close menu', // aria-label (a11y; not in content.md)
  },

  /* §2 Navigation */
  nav: {
    logo: { label: 'Bellproof', href: '#top' },
    items: [
      { label: 'Why verify', href: '#flip' },
      { label: 'How it works', href: '#verify' },
      { label: 'Contracts', href: '#flow' },
      { label: "Who it's for", href: '#clients' },
      { label: 'Research', href: '#research' },
    ],
    contact: { label: 'Get in touch', href: 'mailto:[Contact email]' },
    demo: { label: 'Watch the demo', href: '[Demo link]' },
  },

  /* §4 Section 1: Hero · id="top" */
  top: {
    pill: { label: 'Built at [Hackathon] 2026 · Watch one job, two providers', href: '[Demo link]' },
    h1: 'Verified quantum computation, settled on-chain.',
    h1SpriteAfter: 'Verified',
    lead: 'A verification layer between the people who need quantum answers and the clouds that compute them. Providers get paid only when the answer checks out.',
    ctas: {
      primary: { label: 'See how it works', href: '#verify' },
      secondary: { label: 'Watch the demo', href: '[Demo link]' },
    },
    // Content §4 marks the ticker "optional"; design §5.1 ships it (typed in, then the cursor blinks).
    ticker: {
      text: 'job #0412 · ΔE = −12.4 ± 1.0 kcal/mol · test rounds passed · ACCEPTED',
      illustrative: true,
    },
    strip: {
      label: 'Built on published research',
      cells: [
        { name: 'Mahadev', venue: 'FOCS 2018', href: R1.url },
        { name: 'KLVY', venue: 'STOC 2023', href: R2.url },
        { name: 'Natarajan–Zhang', venue: 'FOCS 2023', href: R3.url },
        { name: 'Holler–Natarajan', venue: 'arXiv 2026', href: R4.url },
        { name: 'Mohammed–Abadi–Mahdi', venue: 'CCS 2026', href: R5.url },
      ],
    },
    fridgeLabels: ['50 K', '4 K', '800 mK', '100 mK', '10 mK'],
    cooldown: ['300 K', '50 K', '4 K', '800 mK', '100 mK', '10 mK'],
    alt: {
      fridge: 'Pixel-art quantum computer: a silver dilution-refrigerator chandelier with azure light down its cables and a glowing chip at the bottom.',
    },
    optional: {
      h1Alternates: [
        'Delegate quantum work. Verify every answer.',
        "Quantum answers, checked before they're paid.",
      ],
    },
  },

  /* §5 Section 2: We already trust cloud compute · id="trust" */
  trust: {
    eyebrow: '01 · Delegated compute',
    h2: 'We trust the cloud because we can check it.',
    lead: 'We already rent storage, GPUs and whole pipelines. It feels safe because checking an answer costs far less than computing it.',
    tags: [
      { label: 'Storage & data', piece: 'tag-disk' },
      { label: 'AI models', piece: 'tag-gpu' },
      { label: 'Genomics', piece: 'tag-helix' },
      { label: 'Risk & pricing', piece: 'tag-candles' },
      { label: 'Simulation', piece: 'tag-globe' },
      { label: 'Rollups', piece: 'tag-chain' },
    ],
    cells: [
      { title: 'Check it', body: 'Multiply the factors back. Add up the tour.', tag: 'COST: TINY', piece: 'check-scale' },
      { title: 'Re-run it', body: 'Deterministic jobs give the same output anywhere.', tag: 'COST: ONE MORE RUN', piece: 'trust-loop' },
      { title: 'Test it', body: 'Score the trained model on held-out data.', tag: 'COST: SMALL', piece: 'trust-target' },
      {
        title: 'Prove it',
        body: 'A SNARK or STARK proves the off-chain run, and the chain verifies it.',
        tag: 'COST: ONE CHEAP ON-CHAIN CHECK',
        piece: 'trust-chain-check',
      },
    ],
    closing: ['Checking is cheaper than computing. ', { em: 'That asymmetry is what makes delegation safe.' }],
    example: {
      runningExample: true,
      text: 'A biotech team rents cloud GPUs to screen thousands of drug candidates against an enzyme target.',
    },
  },

  /* §6 Section 3: Quantum flips it · id="flip" */
  flip: {
    eyebrow: '02 · Quantum in the cloud',
    h2: 'Quantum hands back one number. Good luck checking it.',
    lead: 'IBM Quantum, Amazon Braket and Azure Quantum already rent time on real quantum processors. Most organizations will rent, the way they rent GPUs today. What comes back is one classical number, with a quantum state behind it that only a quantum computer can hold.',
    example: {
      runningExample: true,
      questionLabel: 'The question',
      question: "How strongly does candidate A bind the enzyme's iron-containing active site?",
      whyLabel: 'Why quantum',
      why: 'Electrons around the iron are strongly correlated, and classical approximations disagree with each other. So the team sends this one molecule to a quantum cloud.',
      comesBack: {
        eyebrow: 'What comes back',
        value: 'ΔE = −12.4',
        body: 'kcal/mol. One classical number.',
        illustrative: true,
      },
      behind: {
        eyebrow: 'What stands behind it',
        value: '2¹⁰⁰ ≈ 10³⁰',
        body: 'complex amplitudes in the ground state of a ~100-qubit model. Only a quantum computer can hold it.',
      },
    },
    table: {
      title: 'Every classical check breaks.',
      headers: ['How we check', 'Classical cloud', 'Quantum cloud'],
      rows: [
        ['Check it', 'Multiply the factors back', 'No short classical certificate exists for an energy'],
        ['Re-run it', 'Identical output on any machine', 'Needs another quantum computer, and noisy runs disagree'],
        ['Test it', 'Score on held-out data', "Instances small enough to simulate aren't the ones you need"],
        ['Prove it', 'A SNARK proves the run', 'Proving means simulating the circuit, at exponential cost'],
      ],
    },
    paradox: {
      id: 'paradox',
      eyebrow: 'The verification paradox',
      statement: "If you could check the answer classically, you wouldn't need the quantum computer.",
      sub: 'That gap is what Bellproof closes.',
    },
    alt: {
      fridgeOut: 'A quantum computer outputs one number while a cloud of hidden quantum amplitudes flickers behind it.',
    },
  },

  /* §7 Section 4: The cost of a wrong answer · id="cost" */
  cost: {
    eyebrow: '03 · The cost of a wrong answer',
    h2: 'A wrong answer looks exactly like a right one.',
    lead: 'None of these raises an error. Every one returns a plausible number.',
    cells: [
      { title: 'Noise', body: 'At 99.9% gate fidelity, a 10,000-gate circuit expects ~10 faults.', piece: 'glitch-noise' },
      { title: 'Drift', body: 'The device shifts between calibration and your run.', piece: 'glitch-drift' },
      { title: 'Software bugs', body: "The circuit that ran isn't the one you specified.", piece: 'glitch-bug' },
      { title: 'Corner-cutting', body: 'Fewer shots, shallower circuits, smaller models.', piece: 'glitch-cut' },
      { title: 'Classical stand-ins', body: 'A cheap approximation, returned as a quantum result.', piece: 'glitch-mask' },
      { title: 'Fraud', body: 'In an open market, a plausible fake costs nothing.', piece: 'glitch-crack' },
    ],
    cascade: {
      runningExample: true,
      h3: 'In drug discovery, the compute bill is the smallest line item.',
      body: 'Each step costs more than the last. If ΔE is wrong, all of it is spent on the wrong molecule.',
      bars: [
        { n: '1', title: 'Quantum job', body: 'Computes ΔE for candidate A' },
        { n: '2', title: 'Synthesis', body: 'Chemists make candidate A' },
        { n: '3', title: 'Assays', body: 'Binding and toxicity tests' },
        { n: '4', title: 'Preclinical', body: 'Animal and safety studies' },
        { n: '5', title: 'Clinical trials', body: 'Phases I to III in patients' },
      ],
      connector: { left: 'A wrong ΔE enters here', right: '…and surfaces here, if ever' },
      errors: [
        {
          tag: 'FALSE POSITIVE',
          title: 'The wrong molecule advances.',
          body: 'Synthesis, assays and animal studies go to a compound that was never going to work.',
        },
        {
          tag: 'FALSE NEGATIVE',
          title: 'The right molecule is dropped.',
          body: 'The candidate that would have worked is discarded, and nobody ever finds out.',
        },
      ],
    },
    stats: {
      items: [
        {
          value: '$2.6B',
          caption: 'average cost to bring one new drug to approval, counting the failures along the way',
          count: { prefix: '$', to: 2.6, decimals: 1, suffix: 'B' },
        },
        {
          value: '9.6%',
          caption: 'of drugs entering Phase I trials go on to win approval',
          count: { prefix: '', to: 9.6, decimals: 1, suffix: '%' },
        },
        {
          value: '10–15 years',
          caption: 'from discovery to an approved medicine',
          count: { prefix: '10–', to: 15, decimals: 0, suffix: ' years' },
        },
      ],
      closing: ["Candidate A's ΔE decides whether it enters this pipeline. ", { em: 'That number is worth verifying.' }],
      sources:
        'Sources: DiMasi, Grabowski & Hansen, J. Health Econ. 2016 (Tufts CSDD) · BIO, Clinical Development Success Rates 2006–2015 (2016) · PhRMA',
    },
    history: {
      h3: 'Unchecked computations have been expensive before.',
      items: [
        {
          year: '1994',
          who: 'Intel',
          line: '$475M charge',
          body: "A flaw in the Pentium's division unit returned wrong results in rare cases.",
        },
        {
          year: '2012',
          who: 'JPMorgan Chase',
          line: '~$6.2B in losses',
          body: 'London Whale trades: spreadsheet errors in the risk model understated risk.',
        },
        {
          year: '2021',
          who: 'Google · Meta',
          line: 'No error raised',
          body: 'CPUs in their fleets silently returned wrong results during normal work.',
        },
      ],
      closing: [
        'All three were classical, so checking caught them eventually. ',
        { em: 'A wrong quantum result offers nothing to check against.' },
      ],
      sources:
        'Sources: Intel, Jan 1995 · JPMorgan Chase Management Task Force report, 2013 · Hochschild et al. (Google), HotOS 2021 · Dixit et al. (Meta), 2021',
    },
    alt: {
      cascadeCoin: 'Coins pile up at each stage of drug development after a wrong energy enters the pipeline.',
    },
  },

  /* §8 Section 5: Bellproof, the verification layer · id="layer" */
  layer: {
    eyebrow: '04 · The verification layer',
    h2: 'Bellproof checks the answer before anyone gets paid.',
    lead: 'A verification layer between clients and quantum clouds, settled by smart contracts. Clients need no quantum hardware. Providers need no brand trust.',
    diagram: {
      clients: {
        title: 'Clients',
        body: 'Pharma, materials, chemicals, research funders',
        tag: 'NO QUANTUM HARDWARE NEEDED',
      },
      bellproof: {
        title: 'Bellproof',
        // Content: "**Smart contracts:** escrow, … **Verifier:** compiled nonlocal games."
        // Design §5.5 sets these as two ruled rows; labels drop the colon (add it back if set inline).
        rows: [
          { label: 'Smart contracts', body: 'escrow, staking, settlement, certificates.' },
          { label: 'Verifier', body: 'compiled nonlocal games.' },
        ],
      },
      clouds: {
        title: 'Quantum clouds',
        body: 'Any provider, any hardware',
        tag: 'NO BRAND TRUST REQUIRED',
      },
      lanes: {
        left: { top: 'Job + escrow →', bottom: '← Certified result' },
        right: { top: 'Encrypted challenges →', bottom: '← Quantum answers' },
      },
    },
    line1: ['Providers are paid only when verification passes. ', { em: 'Fake a number, lose your stake.' }],
    quote: 'The first marketplace where quantum results are cryptographically verified before anyone gets paid.',
    quoteNote: 'Providers have started certifying their own results. Bellproof checks every provider the same way.',
    table: {
      id: 'with-without',
      runningExample: true,
      h3: 'The binding-energy job, with and without Bellproof.',
      headers: ['', 'Without Bellproof', 'With Bellproof'],
      rows: [
        [
          'What comes back',
          'A number you hope is right',
          { text: 'ΔE = −12.4 ± 1.0 kcal/mol, certified', illustrative: true },
        ],
        ['Payment', "Paid whether or not it's right", 'Released only on a passing verdict'],
        ['Trust rests on', "The provider's brand", 'Cryptography, under LWE'],
        ['A cheating provider', 'Is never caught', 'Fails test rounds, loses its stake'],
        ['Showing others', '"Trust us"', 'A certificate anyone can audit'],
      ],
    },
    cta: { label: 'See the contracts →', href: '#flow' },
    alt: {
      packets:
        "Jobs and payment flow from clients into Bellproof's escrow vault, encrypted challenges go to a quantum computer, and a certified result returns.",
    },
  },

  /* §9 Section 6: Who it's for · id="clients" */
  clients: {
    eyebrow: "05 · Who it's for",
    h2: 'Built for decisions that ride on one number.',
    lead: 'If you have a decision gated on one number, expensive steps downstream, and no quantum computer in-house, Bellproof is for you.',
    cta: { label: 'Talk to us', href: 'mailto:[Contact email]' },
    labels: {
      question: 'Their question',
      stakes: 'What rides on it',
      certificate: 'What the certificate does',
    },
    tabs: [
      {
        tab: 'Pharma & biotech',
        question: 'How strongly does this drug bind?',
        stakes: 'Which molecules go to the lab',
        certificate: 'Shows partners in the data room why candidate A advanced.',
        runningExample: true,
        piece: 'client-pharma',
      },
      {
        tab: 'Batteries & energy',
        question: 'Is this electrolyte stable?',
        stakes: 'Building a pilot cell line',
        certificate: 'Lets you cite a result anyone can check in papers and patents.',
        piece: 'client-battery',
      },
      {
        tab: 'Chemicals & catalysis',
        question: "What's the barrier on this catalyst?",
        stakes: 'Scaling a process to a plant',
        certificate: 'Lets you cite a result anyone can check in papers and patents.',
        piece: 'client-chem',
      },
      {
        tab: 'DeSci DAOs & funders',
        question: 'Did the funded job run correctly?',
        stakes: 'Releasing the next milestone',
        certificate: 'Releases grant funds automatically when the job passes.',
        piece: 'client-dao',
      },
      {
        tab: 'Quantum providers',
        question: 'How do we prove our results are real?',
        stakes: 'Premium prices and reputation',
        certificate: 'Builds a verified track record, on-chain.',
        piece: 'fridge-badge', // art-spec card 13: client-providers = fridge-badge
      },
    ],
  },

  /* §10 Section 7: How a job moves through the contracts · id="flow" */
  flow: {
    eyebrow: '06 · Smart contracts',
    h2: 'Seven steps. The money moves last.',
    lead: 'Money, commitments and verdicts live on-chain. Quantum work and heavy math stay off-chain. Anyone can audit the trail.',
    lanes: {
      on: 'ON-CHAIN · money, commitments, verdicts',
      off: 'OFF-CHAIN · quantum work, heavy math',
    },
    laneTags: { on: 'On-chain', off: 'Off-chain' },
    steps: [
      {
        n: '1',
        lane: 'on',
        title: 'Post job',
        body: 'Spec hash, tolerance, escrow.',
        aside: 'job #0412 · ΔE for candidate A · ±1.0 kcal/mol',
        piece: 'chain-block',
        mode: 'post',
      },
      {
        n: '2',
        lane: 'on',
        title: 'Stake',
        body: 'The provider bonds collateral.',
        aside: 'provider 0x41b2…7c09',
        piece: 'chain-block',
        mode: 'stake',
      },
      {
        n: '3',
        lane: 'on',
        title: 'Commit',
        body: 'A hash of the secret challenge keys goes on-chain.',
        piece: 'chain-block',
        mode: 'commit',
      },
      {
        n: '4',
        lane: 'off',
        title: 'Run',
        body: 'Encrypted challenge rounds.',
        aside: 'T C C T C C T …',
        piece: 'fridge-mini',
      },
      {
        n: '5',
        lane: 'on',
        title: 'Reveal',
        body: 'The challenge keys are published.',
        piece: 'chain-block',
        mode: 'reveal',
      },
      {
        n: '6',
        lane: 'off',
        title: 'Verify',
        body: 'Anyone checks the transcript.',
        aside: 'ipfs://bafy…q3k',
        piece: 'magnifier-scroll',
      },
      {
        n: '7',
        lane: 'on',
        title: 'Settle',
        body: 'Pay and certify, or slash and refund.',
        aside: 'ACCEPTED',
        piece: 'chain-block',
        mode: 'settle',
      },
    ],
    outcomes: {
      honest: {
        title: 'Honest provider',
        items: [
          'Claims the job and stakes collateral',
          'Runs the compiled-game rounds',
          'Passes the test rounds',
          'Gets paid. Certificate minted.',
        ],
      },
      cheat: {
        title: 'Cheating provider',
        items: [
          'Claims the job and stakes collateral',
          'Returns a classical guess for ΔE',
          'Fails the test rounds',
          'Stake slashed. Client refunded.',
        ],
      },
    },
    note: {
      title: 'Why commit, then reveal?',
      body: "Checking needs the verifier's secret keys, so a contract can't do it alone. Committing to the keys first and publishing them after the run lets anyone re-check the transcript, after the fact. The same idea drives time-delayed public verifiability.",
    },
    demoDetails: '[Network / testnet] · [Contract addresses] · [GitHub]',
    ctas: [
      { label: 'Watch the demo', href: '[Demo link]' },
      { label: 'Read the contracts', href: '[GitHub]' },
    ],
    alt: {
      chainFlow:
        'A job token moves through seven contract steps; an honest provider is paid and a certificate is minted, a cheating provider is slashed.',
    },
  },

  /* §11 Section 8: How the verification works · id="verify" */
  verify: {
    eyebrow: '07 · How we verify',
    h2: 'A game only quantum players can win.',
    lead: 'We check quantum work with nonlocal games, compiled with encryption, hidden among the real computation. Three ideas, one verdict.',
    tabs: [
      { label: 'Nonlocal games', href: '#verify-games' },
      { label: 'Compiled with encryption', href: '#verify-compiler' },
      { label: 'Hidden test rounds', href: '#verify-rounds' },
    ],
    rows: {
      games: {
        id: 'verify-games',
        h3: 'A test only quantum players can pass.',
        body: 'A referee sends two separated players one question each. They win if their answers satisfy a rule. Players who share entanglement win more often than any classical strategy allows.',
        // Two bordered cells; the second (`1`) is solid blue.
        stats: [
          { value: '8/9', caption: 'best classical win rate in the Magic Square game' },
          { value: '1', caption: 'quantum win rate, using shared entanglement' },
        ],
        explainer: {
          title: 'The Magic Square game.',
          body: 'Alice fills a row and Bob a column of a 3×3 grid, each with a parity rule. They must agree on the cell they share.',
        },
        rigidity: {
          eyebrow: 'RIGIDITY',
          body: 'Near-perfect play forces specific quantum states and measurements. So the referee can steer the players through a chosen computation.',
        },
        readout: 'classical ≤ 8/9 · quantum = 1',
        cta: { label: 'Read the papers', href: '#research' },
        alt: "Alice fills a row and Bob a column of a 3×3 grid; their shared cell agrees, so they win.",
      },
      compiler: {
        id: 'verify-compiler',
        h3: 'Encryption replaces the wall between the players.',
        body: "The classic game needs two devices kept apart so they can't talk. Inside one cloud, nobody can enforce that. The KLVY compiler swaps the wall for cryptography. One provider plays both roles. Alice's question arrives encrypted, so it answers blind before it sees Bob's.",
        cells: [
          {
            eyebrow: 'POST-QUANTUM SECURITY',
            body: "Soundness rests on Learning With Errors (LWE), the lattice assumption family behind NIST's ML-KEM standard.",
          },
          {
            eyebrow: 'FROM GAMES TO COMPUTATION',
            body: 'Natarajan–Zhang (2023) turned compiled games into verification of any quantum computation. Holler–Natarajan (2026) cut the total cost to quasilinear in circuit size.',
          },
        ],
        cta: { label: 'Read KLVY (STOC 2023)', href: 'https://arxiv.org/abs/2203.15877' },
        labels: {
          physical: 'PHYSICAL SEPARATION',
          cryptographic: 'CRYPTOGRAPHIC SEPARATION',
        },
        alt: 'A wall between two quantum computers turns into a padlock, leaving one computer answering an encrypted question.',
      },
      rounds: {
        id: 'verify-rounds',
        runningExample: true,
        h3: 'Test rounds hide among compute rounds.',
        body: 'The verifier keeps a secret schedule. Test rounds play the compiled game. Compute rounds measure one term of the active-site energy, and together they build ΔE. The provider sees only question marks.',
        cards: [
          {
            title: 'Test round',
            body: 'Play the compiled game and check the win condition. Any deviation shows up here.',
          },
          {
            title: 'Compute round',
            body: 'Measure one term of the active-site energy. Together these build the ΔE estimate.',
          },
          {
            title: 'Verdict',
            body: 'Accept only if the test win rate clears the threshold. Faking ΔE means failing tests.',
          },
        ],
        cta: { label: 'Watch a cheater fail', href: '[Demo link]' },
        labels: {
          schedule: "VERIFIER'S SECRET SCHEDULE",
          provider: 'WHAT THE PROVIDER SEES',
          meter: 'ΔE',
          rejected: 'REJECTED',
        },
        alt: 'Hidden test rounds mixed among compute rounds; the provider sees only question marks.',
      },
    },
    research: {
      id: 'research',
      h3: 'The papers behind it.',
      lead: 'Bellproof builds on published results in classical verification of quantum computation.',
      linkLabel: 'arXiv',
      items: research,
    },
  },

  /* §13 Section 9: What the certificate guarantees · id="guarantees" */
  guarantees: {
    eyebrow: '08 · The certificate',
    h2: 'What the certificate promises, and where it stops.',
    lead: 'Every passing job mints a certificate. It travels with the result, so anyone downstream can check it.',
    certificate: {
      title: 'BELLPROOF CERTIFICATE · ILLUSTRATIVE',
      rows: [
        { key: 'job', value: '#0412' },
        { key: 'spec', value: 'H = 0x9f3c…e21a' },
        { key: 'result', value: 'ΔE = −12.4 ± 1.0 kcal/mol' },
        { key: 'protocol', value: 'Compiled nonlocal game' },
        { key: 'soundness', value: 'error ≤ 2^−λ (LWE)' },
        { key: 'provider', value: '0x41b2…7c09' },
        { key: 'transcript', value: 'ipfs://bafy…q3k' },
        { key: 'verdict', value: 'ACCEPTED', accent: true }, // blue-light, bold
      ],
    },
    whereItGoes: {
      label: 'Where it goes',
      items: [
        { title: 'Data rooms', body: 'Show partners why candidate A advanced.' },
        { title: 'DAO milestones', body: 'Release grant funds automatically.' },
        { title: 'Papers & patents', body: 'Cite a result anyone can check.' },
        { title: 'Provider reputation', body: 'A verified track record, on-chain.' },
      ],
    },
    guaranteed: {
      title: 'Guaranteed',
      items: [
        'The result matches the computation you specified, within tolerance.',
        'A noisy run, a shortcut or a fake number is rejected, except with negligible probability.',
        'Anyone can re-check the transcript once the keys are revealed.',
        'Security rests on LWE, a post-quantum assumption.',
      ],
    },
    notCovered: {
      title: 'Not covered',
      items: [
        {
          lead: 'Whether your Hamiltonian models the real molecule.',
          body: 'The certificate checks the computation. Whether the model matches nature is a chemistry question, and it stays yours.',
        },
        {
          lead: "Today's noisy chips.",
          body: 'The protocol assumes fault-tolerant providers, the hardware these jobs need anyway. The full protocol is a fault-tolerant-era product: about 2030 or later.',
        },
      ],
    },
    footnote: 'The hackathon demo runs on [Network / testnet] with [simulator / hardware: confirm].',
    closing: {
      runningExample: true,
      text: ['The team advances candidate A, ', { em: 'with the certificate in its data room.' }],
    },
    // Content §13: "Drop this CTA if no sample exists."
    cta: { label: 'See a sample transcript', href: '[GitHub]' },
    alt: {
      certMint: 'A certificate is stamped ACCEPTED and minted as a block on a chain.',
    },
    optional: {
      // Content §15: needs team sign-off before shipping. Not in the deck (MR §4.2).
      // If approved: a 3-cell strip at the end of the guarantees section.
      assuranceLevels: {
        headline: 'Start checking today. Upgrade as the hardware grows.',
        note: 'All three levels share one certificate format.',
        headers: ['Level', 'What it proves', 'Today?'],
        levels: [
          {
            level: 'L1 Attested',
            proves: 'This exact circuit ran on the claimed backend, with this calibration, at this time',
            today: 'Yes',
          },
          {
            level: 'L2 Accredited',
            proves: 'The output distribution is close to ideal, under noise assumptions',
            today: 'Yes, about 10–50 qubits',
          },
          {
            level: 'L3 Verified',
            proves: 'The result is correct even against a malicious provider (LWE)',
            today: 'Fault-tolerant era',
          },
        ],
      },
    },
  },

  /* §13 Section 10: CTA · id="cta" */
  cta: {
    eyebrow: 'Bellproof',
    h2: 'Delegate quantum work. Verify every answer.',
    lead: 'One job, two providers. Watch the honest one get paid and the cheater get slashed.',
    cells: [
      {
        piece: 'cta-play',
        title: 'Watch the demo',
        body: 'One job, two providers, one verdict each.',
        button: { label: 'Watch the demo', href: '[Demo link]' },
      },
      {
        piece: 'cta-code',
        title: 'Read the code',
        body: 'Contracts, verifier and demo, in the open.',
        button: { label: 'Open GitHub', href: '[GitHub]' },
      },
      {
        piece: 'cta-book',
        title: 'Read the research',
        body: 'Five papers, from Mahadev 2018 to CCS 2026.',
        button: { label: 'See the papers', href: '#research' },
      },
    ],
    final: { label: 'Get in touch', href: 'mailto:[Contact email]' },
  },

  /* §13 Section 11: Footer · id="footer" */
  footer: {
    columns: [
      {
        label: 'Product',
        items: [
          { label: 'How it works', href: '#verify' },
          { label: 'Contracts', href: '#flow' },
          { label: 'The certificate', href: '#guarantees' },
          { label: "Who it's for", href: '#clients' },
          { label: 'Demo', href: '[Demo link]' },
        ],
      },
      {
        label: 'Research',
        items: [
          { label: 'Mahadev, FOCS 2018', href: R1.url, detail: R1.arxiv },
          { label: 'KLVY, STOC 2023', href: R2.url, detail: R2.arxiv },
          { label: 'Natarajan–Zhang, FOCS 2023', href: R3.url, detail: R3.arxiv },
          { label: 'Holler–Natarajan, 2026', href: R4.url, detail: R4.arxiv },
          { label: 'Mohammed–Abadi–Mahdi, CCS 2026', href: R5.url, detail: R5.arxiv },
        ],
      },
      {
        label: 'Project',
        items: [
          { label: 'Team: [Team]' },
          { label: 'Code', href: '[GitHub]' },
          { label: 'Built at [Hackathon] 2026' },
          { label: 'Contracts: [Contract addresses]' },
          { label: 'Network: [Network / testnet]' },
          { label: 'Contact', href: 'mailto:[Contact email]' },
        ],
      },
      {
        label: 'Legal',
        items: [
          { label: 'Terms', href: '[Terms]' },
          { label: 'Privacy', href: '[Privacy]' },
          { label: 'License', href: '[License]' },
          { label: ILLUSTRATIVE_NOTE },
        ],
      },
    ],
    socials: {
      // Content §13: "Ship an icon only if the team supplies its link." None supplied yet,
      // so render only items with `supplied: true` (currently none).
      items: [
        { label: '[GitHub]', href: '[GitHub]', piece: 'social-g', supplied: false },
        { label: '[X]', href: '[X]', piece: 'social-x', supplied: false },
        { label: '[Discord]', href: '[Discord]', piece: 'social-d', supplied: false },
      ],
    },
    tagline: 'Verified quantum computation, settled on-chain.',
    copyright: 'Bellproof © 2026',
    builtBy: 'Built at [Hackathon] by [Team]',
    // Content §13 layout: a small "illustrative figures" note; design §5.11 places it in the Legal column.
    illustrativeNote: ILLUSTRATIVE_NOTE,
  },
};

/* ---------------------------------------------------------------- helpers */

/** Plain text of a `Rich` value (for aria-labels, titles, tests). */
export function richText(r: Rich): string {
  return r.map((p) => (typeof p === 'string' ? p : p.em)).join('');
}

/** Text of a table cell or illustrative value (without the tag). */
export function cellText(c: Cell): string {
  return typeof c === 'string' ? c : c.text;
}

const ESC: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/** HTML-escape a string. */
export function escapeHTML(s: string): string {
  return s.replace(/[&<>"']/g, (ch) => ESC[ch] ?? ch);
}

/**
 * HTML for a `Rich` value: highlight parts become `<span class="em">…</span>`
 * (styled `color: var(--blue)` by the layout CSS; same weight).
 */
export function richHTML(r: Rich, cls = 'em'): string {
  return r
    .map((p) => (typeof p === 'string' ? escapeHTML(p) : `<span class="${cls}">${escapeHTML(p.em)}</span>`))
    .join('');
}
