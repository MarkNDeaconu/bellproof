# Bellproof website: information architecture and copy

Owner: content strategist & copywriter. This is the single source of truth for site structure and every visible string. The layout agent places it, the art agents draw the sprites named here, and QA checks claims against the ledger in §14.

---

## 0. How to read this brief

**Audience, in priority order**
1. Crypto-native reviewers: they skim, so they need the mechanism and the contracts fast.
2. Prospective clients: pharma and materials R&D leads, DeSci funders. They need the cost of a wrong answer and the certificate.
3. Quantum providers: they need a reason to want to be checked.

**Voice**
- Short, declarative sentences. Confident. A little playful. Headlines end with a full stop.
- No hype words: revolutionary, game-changing, groundbreaking, cutting-edge, seamless, unlock, next-gen, supercharge, trustless.
- No "It's not X, it's Y" constructions, and no "X, not Y" slogans.
- Use "we" for Bellproof and "you" for the client.
- Numbers use JetBrains Mono. Units are written out: kcal/mol, years.
- Typography: the site ships curly apostrophes and quotes (’ “ ”). This brief writes straight ones for ease of editing; `src/content/strings.ts` holds the shipped form. (Revision 1, CO3.)

**Revision 1 (2026-10-12).** This brief is updated to match `revision-1.md`: cut copy moved to §17, new strings added in place, the fridge is silver and azure (not gold). Where a layout note here and `revision-1.md` §1 disagree, `revision-1.md` wins.

**Source tags.** Tags are for this brief only and never ship as visible text. Shipped source lines appear only where this brief writes a `Sources:` line.
- `[src: deck/<slide-id>]` means a slide in `research/deck/slides/<slide-id>.html`.
- `[src: MR §n]` means `../research/market-research.md`, section n.
- A named external source, such as `[src: DiMasi 2016]`, is one the deck itself cites. It is always shipped in a visible `Sources:` line.

**Placeholders.** Ship these exactly as written until the team fills them in: `[Contact email]`, `[GitHub]`, `[Demo link]`, `[Network / testnet]`, `[Contract addresses]`, `[Terms]`, `[Privacy]`, `[License]`, `[X]`, `[Discord]`, `[Site URL]` (meta only, revision 1).

**Running example.** A biotech team computes ΔE, the binding energy of drug candidate A, on a ~100-qubit model of an iron-containing enzyme active site.
- ΔE = −12.4 ± 1.0 kcal/mol, and job #0412, are **illustrative**. Wherever they appear on the page, label them "illustrative" in small mono text.
- The example appears in story sections 1–9 (brief §4–§13). Mark it with the same small chip each time: `RUNNING EXAMPLE` in mono, an ink pill with paper-coloured text, as in the deck.

**Colour shorthand used below.** `ink`, `paper`, `card`, `hairline`, `blue` (#2F5BEA), `blue-light` (#8FAEFF), `ramp-1…ramp-5` (the blue→violet band ramp the creative director fixes), `warn` (deck rust #B8461B). Use `warn` only for failure states: slashed, not covered, false positive.

---

## 1. Page meta

| Field | Copy |
|---|---|
| `<title>` | `Bellproof · Verified quantum computation, settled on-chain` |
| meta description (155 chars) | `Bellproof verifies quantum cloud results with compiled nonlocal games. Providers get paid only when an answer passes, and anyone can audit the certificate.` |
| og:title | `Bellproof` |
| og:description | `Delegate quantum work. Verify every answer.` [src: deck/close] |
| og:image | `https://markndeaconu.github.io/bellproof/og.png` (absolute; 1200×630; the file is `public/og.png`) |
| og:image as shipped | A 1200×630 pixel-art card: the pixel bell mark on the left, the wordmark and "Verified quantum computation, settled on-chain." on the right, with ramp bands along the bottom. (The first suggestion put the fridge sprite on the left; the logo-mark agent shipped the bell.) |
| og:image:alt | `The Bellproof wordmark beside a pixel-art bell with a check mark, the line "Verified quantum computation, settled on-chain." and stepped blue bands along the bottom.` |
| theme-color | `ink` |

---

## 2. Navigation

Pattern: a bordered nav bar, every item its own cell with hairline dividers. The logo cell sits on the left; the pause toggle and two action cells sit on the right, and the last one is solid ink. The bar is sticky. Below 768px the bar is `bell | Bellproof | menu`; the open menu shows a CTA row (`Watch the demo`, `Contact`), the five links numbered `01`–`05`, and the pause toggle. (Layout: `revision-1.md` §1.7.)

| Cell | Label | Target |
|---|---|---|
| Logo | pixel Bellproof mark + `Bellproof` | `#top` |
| 1 | `Why verify` | `#flip` |
| 2 | `How it works` | `#verify` |
| 3 | `Contracts` | `#flow` |
| 4 | `Who it's for` | `#clients` |
| 5 | `Research` | `#research` |
| Right, toggle | `Pause motion` / `Play motion` + pixel pause / play glyph | (button, `aria-pressed`) |
| Right, plain | `Contact` | `mailto:[Contact email]` |
| Right, solid ink | `Watch the demo` + small pixel play glyph | `[Demo link]` |

Revision 1 renamed `Get in touch` to `Contact` everywhere (nav, mobile menu, CTA band).

---

## 3. Section map (story order)

| # | id | Headline | Mistral-rhythm pattern |
|---|---|---|---|
| 1 | `top` | Verified quantum computation, settled on-chain. | A pill above a giant headline whose full stop is a sprite, T/C block stacks on the rails, and a bordered strip below |
| 2 | `trust` | We trust the cloud because we can check it. | Centred statement, a 6-cell domain ledger checked one by one, then 4 bordered cells |
| 3 | `flip` | Quantum hands back one number. Good luck checking it. | Headline left with the sprite right, 2 stacked cards, then a full-bleed paradox band |
| 4 | `cost` | A wrong answer looks exactly like a right one. | A 6-cell grid, a staircase cascade, 3 giant stats |
| 5 | `layer` | Bellproof checks the answer before anyone gets paid. | A 3-cell flow diagram with animated packets, then a with/without table |
| 6 | `clients` | Built for decisions that ride on one number. | Headline left, a 5-cell segmented control, the detail panel, then a text link |
| 7 | `flow` | Seven steps. The money moves last. | Two-lane swimlane grid, then 2 outcome cells |
| 8 | `verify` | A game only quantum players can win. | A numbered figure bar, 3 stacked feature rows each with a framed figure, then the research list |
| 9 | `guarantees` | What the certificate promises, and where it stops. | Dark certificate card left, "where it goes" list right, then a 2-cell guaranteed / not covered row |
| 10 | `cta` | Delegate quantum work. Verify every answer. | Dark "go deeper" band: giant headline, 3 bordered link cells, one button |
| 11 | `footer` | (none) | 4 link columns, one sub-footer row, a hanging pixel bell, stepped ramp bands with the walkers arriving |

Revision 1 also reworked the hero, clients, verify, CTA and footer layouts; `revision-1.md` §1 is authoritative for layout.

---

## 4. Section 1: Hero · `id="top"`

**Layout** (revision 1: `revision-1.md` §1.1)
- The compact announcement pill sits above a giant headline whose final full stop is the Bloch sphere. The sub-copy, CTAs and ticker follow.
- On the left and right rails, stepped `ramp` block stacks run the T/C shuffle: the right stack's round tiles flip `T C C`, shuffle to `? ? ?`, then settle to `✓ ✓ ✓`. No diamond, no arc in the hero.
- A full-width bordered strip of cells closes the hero, the analogue of a logo strip.
- Thin grid lines frame the hero.

**Announcement pill.** It has a small square pixel tile on the left (the T/C block, which flips ? → T → C on hover) and a chevron on the right.
> `One job, two providers: see who gets paid` →  links to `#flow` (user request, 2026-10-12)

Below 1200px the pill uses the short label:
> `See who gets paid`

**Headline (H1)**
> Verified quantum computation, settled on-chain.  [src: deck/cover]

The Bloch sphere sprite replaces the final full stop, on the baseline: `Verified quantum / computation, / settled on-chain◉` (three lines at 768px and up; `Verified quantum / computation, / settled / on-chain◉` below 768px). The visually hidden copy keeps the full stop.

Alternates, for the creative director to choose from:
- "Delegate quantum work. Verify every answer." [src: deck/close]
- "Quantum answers, checked before they're paid." [src: deck/layer: "Providers are paid only when verification passes."]

**Sub-copy**
> A verification layer between the people who need quantum answers and the clouds that compute them. Providers get paid only when the answer checks out.
> [src: deck/cover; deck/layer]

**CTAs**
- Primary, solid ink: `See how it works` → `#verify`
- Secondary, outline: `Watch the demo` → `[Demo link]`

**Ticker (optional, small mono line under the CTAs)**
> `job #0412 · ΔE = −12.4 ± 1.0 kcal/mol · test rounds passed · ACCEPTED`  `illustrative`
> [src: deck/certificate]

Type the ticker in character by character, hold it for 2 seconds, then let the cursor blink.

**Bottom strip ("Built on published research")**
- A label cell on the left: `Built on published research`.
- Then 5 bordered cells. Each cell has a mono label and links to the paper in §12.

| Cell | Text |
|---|---|
| 1 | `Mahadev` / `FOCS 2018` |
| 2 | `KLVY` / `STOC 2023` |
| 3 | `Natarajan–Zhang` / `FOCS 2023` |
| 4 | `Holler–Natarajan` / `arXiv 2026` |
| 5 | `Mohammed–Abadi–Mahdi` / `CCS 2026` |

[src: deck/compiler footer; MR §1, §3.4]

These are citations. They do not imply any endorsement. Never use author photos or university logos.

**Pixel art**
- **`spr-fridge`, the dilution-refrigerator chandelier.** It hangs from the top edge, centred over the right third, like a lamp lowered into frame.
  - It shows silver-platinum stages, steel coax lines and a navy chip box at the bottom whose window glows violet. No gold anywhere: the palette has no warm colours.
  - Animation: azure pulses slide down the coax lines and the chip glows. Every ~4 seconds a single azure pixel "bit" drops from the chip.
  - Mono temperature labels sit beside the plates: `50 K`, `4 K`, `800 mK`, `100 mK`, `10 mK`. During the intro the ticker area counts down `300 K`, `50 K`, `4 K`, `800 mK`, `100 mK`, `10 mK` (design-spec §5.1).
- **`spr-bloch-inline`, about 16×16, the headline's full stop.** The state arrow precesses around the sphere at 8 fps.
- **On the floor beside the left stack: `spr-qubit-pair`.** Two small round qubit creatures joined by a dotted entanglement line. They hop in mirror sync: when one flips up, the other flips down.
- **On the floor at the right: `spr-cert-mini`.** A small certificate with a seal that stamps itself every ~6 seconds.
- **Round tiles on the right stack: `round-tile`.** Faces `?`, `T`, `C` and `✓`, driven by the T/C shuffle (revision 1 §1.1).
- Reduced motion: show every sprite on its poster frame (tiles `✓ ✓ ✓`) and print the ticker in full.
- Alt text (fridge): "Pixel-art quantum computer: a silver dilution-refrigerator chandelier with azure light down its cables and a glowing chip at the bottom."

---

## 5. Section 2: We already trust cloud compute · `id="trust"`

**Layout**
- **Part A.** A centred headline and sub, then the **domain ledger**: a row of 6 bordered cells (2 columns × 3 rows on mobile), each a pixel icon, a domain name and a mono "checked by" tag. On entering the viewport the cells are checked one by one with a pixel check mark. (Revision 1 §1.2; replaces the floating tags.)
- **Part B.** 4 bordered cells in a row, which become a 2×2 grid on tablet and a stack on mobile. Each cell has a mono "cost to check" tag at the bottom.
- Parts C (closing line) and D (running-example chip) were cut in revision 1; the copy is in §17.

**Eyebrow:** `01 · Delegated compute`

**Headline**
> We trust the cloud because we can check it.  [src: deck/trust-classical]

**Sub-copy**
> We already rent storage, GPUs and whole pipelines. It feels safe because checking an answer costs far less than computing it.
> [src: deck/cloud-today; deck/trust-classical]

**Domain ledger** (each cell with a small pixel icon) [src: deck/cloud-today; tags: revision-1 §1.2]

| Domain | Pixel icon | Mono tag |
|---|---|---|
| `Storage & data` | disk | `CHECKED BY HASH` |
| `AI models` | GPU | `CHECKED BY EVAL` |
| `Genomics` | helix | `CHECKED BY RE-RUN` |
| `Risk & pricing` | candlestick | `CHECKED BY BACKTEST` |
| `Simulation` | globe | `CHECKED BY RE-RUN` |
| `Rollups` | chain link | `CHECKED BY PROOF` |

**Four cells** [src: deck/trust-classical]

| Title | Body | Mono tag |
|---|---|---|
| Check it | Multiply the factors back. Add up the tour. | `COST: TINY` |
| Re-run it | Deterministic jobs give the same output anywhere. | `COST: ONE MORE RUN` |
| Test it | Score the trained model on held-out data. | `COST: SMALL` |
| Prove it | A SNARK or STARK proves the off-chain run, and the chain verifies it. | `COST: ONE CHEAP ON-CHAIN CHECK` |

**CTA:** none. Keep the reader scrolling.

**Pixel art: `spr-check-scale`, in the "Check it" cell header.**
- It shows a tiny balance scale: a big heavy "compute" block on one pan, a feather-light "check" pixel on the other. The light side wins and tips down, which inverts the expected physics. That is the joke.
- Animation: the scale wobbles twice, settles, and a check mark blinks.
- The other three cells get 16×16 icons: a loop arrow, a target, and a chain link with a tick.
- On the ledger cells, the icons idle on 2 frames, out of phase with one another.

---

## 6. Section 3: Quantum flips it · `id="flip"`

**Layout**
- **Part A.** Headline left with `spr-fridge-out` right, the Mistral feature-row pattern.
- **Part B.** The running-example block. "The question" on the left; on the right, two stacked cards: a light card for "What comes back" and a dark ink card for "What stands behind it".
- Part C (the "Every classical check breaks." table) was cut in revision 1; the copy is in §17.
- **Part D.** A full-bleed `blue` band for the paradox: a giant statement in paper-coloured type, with stepped ramp blocks at both edges.

**Eyebrow:** `02 · Quantum in the cloud`

**Headline**
> Quantum hands back one number. Good luck checking it.

**Sub-copy**
> IBM Quantum, Amazon Braket and Azure Quantum already rent time on real quantum processors. Most organizations will rent, the way they rent GPUs today. What comes back is one classical number, with a quantum state behind it that only a quantum computer can hold.
> [src: deck/quantum-cloud; deck/example]

Provider names appear as text only. No logos.

**Running example** (chip at top right: `RUNNING EXAMPLE`)
- **The question**
  > How strongly does candidate A bind the enzyme's iron-containing active site?
- **Why quantum**
  > Electrons around the iron are strongly correlated, and classical approximations disagree with each other. So the team sends this one molecule to a quantum cloud.
  > [src: deck/example]
- **Card 1, light.** Eyebrow `What comes back`.
  > `ΔE = −12.4` (big mono)
  > kcal/mol. One classical number. `illustrative`
  > [src: deck/example]
- **Card 2, dark.** Eyebrow `What stands behind it`.
  > `2¹⁰⁰ ≈ 10³⁰` (big mono)
  > complex amplitudes in the ground state of a ~100-qubit model. Only a quantum computer can hold it.
  > [src: deck/example]
  - Render the exponents as markup, `2<sup>100</sup> ≈ 10<sup>30</sup>`, so they never fall back to a system font (revision 1 §1.3).

**Paradox band** · `id="paradox"`
- Eyebrow: `The verification paradox`
- Statement (giant):
  > If you could check the answer classically, you wouldn't need the quantum computer.
- Sub:
  > That gap is what Bellproof closes.
- [src: deck/paradox]

**Pixel art**
- **`spr-fridge-out`, the small fridge.** A single mono number card `−12.4` pops out of the chip like toast from a toaster. Behind the card, a cloud of ~40 flickering amplitude pixels in ramp colours fades in and out. That is the state you never see.
  - Animation: the card pops at 2 fps with a squash on landing; the amplitude cloud twinkles at random.
  - Alt text: "A quantum computer outputs one number while a cloud of hidden quantum amplitudes flickers behind it."
  - The sprite draws `-12.4`, so it carries an `illustrative` tag under it.
- **Paradox band: `spr-question-block`.** A pixel block with "?" stamped on it. It sits at the right edge and flickers `? T C ? T C ?` once when the band enters the viewport (revision 1; it no longer bumps).

---

## 7. Section 4: The cost of a wrong answer · `id="cost"`

**Layout.** One section in three short beats, separated by hairlines (revision 1 §1.3).
- **A.** Headline plus a 6-cell bordered grid (3×2, a single column on mobile).
- **B.** A cascade staircase: 5 bars growing left to right, with a `warn` connector line underneath.
- **C.** 3 giant stats in bordered cells, the closing line, and a visible sources line.
- Cut in revision 1 (copy in §17): the false positive / false negative cells under B, and D, the whole history strip.

**Eyebrow:** `03 · The cost of a wrong answer`

**Headline**
> A wrong answer looks exactly like a right one.  [src: deck/silent]

**Sub-copy**
> None of these raises an error. Every one returns a plausible number.  [src: deck/silent]

**A. Six cells** [src: deck/silent]

| Title | Body |
|---|---|
| Noise | At 99.9% gate fidelity, a 10,000-gate circuit expects ~10 faults. |
| Drift | The device shifts between calibration and your run. |
| Software bugs | The circuit that ran isn't the one you specified. |
| Corner-cutting | Fewer shots, shallower circuits, smaller models. |
| Classical stand-ins | A cheap approximation, returned as a quantum result. |
| Fraud | In an open market, a plausible fake costs nothing. |

**B. Cascade** (chip: `RUNNING EXAMPLE`)
- H3:
  > In drug discovery, the compute bill is the smallest line item.  [src: deck/cascade]
- Body:
  > Each step costs more than the last. If ΔE is wrong, all of it is spent on the wrong molecule.  [src: deck/cascade]
- Bars, short to tall. The first bar is ink and the last is the `warn` tint.

| Bar | Title | Body |
|---|---|---|
| 1 | Quantum job | Computes ΔE for candidate A |
| 2 | Synthesis | Chemists make candidate A |
| 3 | Assays | Binding and toxicity tests |
| 4 | Preclinical | Animal and safety studies |
| 5 | Clinical trials | Phases I to III in patients |

- Connector labels: left, `A wrong ΔE enters here`; right, `…and surfaces here, if ever`. [src: deck/cascade]

**C. Three stats** [src: deck/pharma-numbers]

| Big number | Caption |
|---|---|
| `$2.6B` | average cost to bring one new drug to approval, counting the failures along the way |
| `9.6%` | of drugs entering Phase I trials go on to win approval |
| `10–15 years` | from discovery to an approved medicine |

- Closing line:
  > Candidate A's ΔE decides whether it enters this pipeline. **That number is worth verifying.**
- Visible sources line (small, ink-soft):
  > Sources: DiMasi, Grabowski & Hansen, J. Health Econ. 2016 (Tufts CSDD) · BIO, Clinical Development Success Rates 2006–2015 (2016) · PhRMA

**CTA:** none.

**Pixel art**
- **`spr-glitch-cells`, in the six-cell grid.** Each cell has a 16×16 icon that glitches 1–2 frames on hover:
  - Noise: static
  - Drift: a sliding dial
  - Software bugs: a bug
  - Corner-cutting: scissors
  - Classical stand-ins: a mask
  - Fraud: a coin with a crack
- **`spr-cascade-coin`, in the cascade.** A small pixel coin stack rides a conveyor along the connector line. At each bar the stack grows by one step, ending as a tall tower at "Clinical trials" that wobbles.
  - Loop: a ~5 second cycle, at a low frame rate (~8 fps).
  - Alt text: "Coins pile up at each stage of drug development after a wrong energy enters the pipeline."
- **Stats.** The numbers count up once on scroll entry, in mono, over 600 ms. Reduced motion shows the final value. `10–15 years` counts its second number from 10 to 15 behind the fixed `10–` (never `10–1 years`); each counter shows its start value before its stagger begins.

---

## 8. Section 5: Bellproof, the verification layer · `id="layer"`

**Layout**
- **Part A.** Centred headline and sub.
- **Part B.** A horizontal 3-cell diagram: `Clients` cell, connector lane, a wider `Bellproof` cell in solid `blue`, connector lane, `Quantum clouds` cell. Animated pixel packets travel the lanes. On mobile it stacks vertically and the lanes turn vertical.
- **Part C.** Two large closing lines. The second is a pull quote carrying the "first" claim.
- **Part D.** A with/without table: 3 columns, the "with" column header in `blue`, the "without" header in `warn`.

**Eyebrow:** `04 · The verification layer`

**Headline**
> Bellproof checks the answer before anyone gets paid.  [src: deck/layer]

**Sub-copy**
> A verification layer between clients and quantum clouds, settled by smart contracts. Clients need no quantum hardware. Providers need no brand trust.  [src: deck/layer]

**Diagram cells** [src: deck/layer]

| Cell | Title | Body | Tag |
|---|---|---|---|
| Left | Clients | Pharma, materials, chemicals, research funders | `NO QUANTUM HARDWARE NEEDED` |
| Centre (blue) | Bellproof | Two ruled rows. **Smart contracts:** Escrow, staking, settlement, certificates **Verifier:** Compiled nonlocal games | (none) |

Centre-cell rows are capitalised with no full stops (revision 1, CO3).
| Right | Quantum clouds | Any provider, any hardware | `NO BRAND TRUST REQUIRED` |

Lane labels (mono):
- Left lane: top `Job + escrow →`, bottom `← Certified result`
- Right lane: top `Encrypted challenges →`, bottom `← Quantum answers`

**Closing lines**
- Line 1:
  > Providers are paid only when verification passes. **Fake a number, lose your stake.**
  > [src: deck/layer: "A provider that cheats loses its stake."]
- Line 2 (pull quote, smaller, with a pixel bracket):
  > The first marketplace where quantum results are cryptographically verified before anyone gets paid.  [src: MR §1, the exact approved phrasing]
- Small note under the quote:
  > Providers have started certifying their own results. Bellproof checks every provider the same way.  [src: MR §2 Tier 2, §4.1; deck/layer "Any provider, any hardware"]

**With/without table** · `id="with-without"` (chip: `RUNNING EXAMPLE`)
- H3:
  > The binding-energy job, with and without Bellproof.  [src: deck/with-without]

| | Without Bellproof | With Bellproof |
|---|---|---|
| What comes back | A number you hope is right | ΔE = −12.4 ± 1.0 kcal/mol, certified `illustrative` |
| Payment | Paid whether or not it's right | Released only on a passing verdict |
| Trust rests on | The provider's brand | Cryptography, under LWE |
| A cheating provider | Is never caught | Fails test rounds, loses its stake |
| Showing others | "Trust us" | A certificate anyone can audit |

**CTA:** text link `See the contracts →` → `#flow`

**Pixel art: `spr-layer-packets`.**
- It shows three small sprites in the cells:
  - left: a lab bench with a flask;
  - centre: an escrow vault with a bell-shaped seal on the door;
  - right: a mini dilution fridge.
- Packets travel the lanes:
  - a coin plus a sealed envelope moving right (job + escrow);
  - padlocked question cards moving right (encrypted challenges);
  - answer pixels moving left;
  - a certificate scroll returning left to the client.
- Animation: the packets march at 6–8 fps in a staggered loop. The vault door blinks shut as the coin arrives and opens as the certificate leaves.
- Alt text: "Jobs and payment flow from clients into Bellproof's escrow vault, encrypted challenges go to a quantum computer, and a certified result returns."

---

## 9. Section 6: Who it's for · `id="clients"`

**Layout** (revision 1 §1.5)
- A header: eyebrow, headline and sub on the left, with a hairline underneath. No button in the header.
- Below it, a segmented control of 5 audiences in one bordered row (it scrolls sideways below 1024px); the active cell has a `blue` bar along its top edge. No auto-advance; arrow keys and clicks only.
- Below that, a detail panel with two bordered cells:
  - "Their question", set very large in a solid ramp-coloured cell;
  - "What rides on it" plus "What the certificate does", in a light cell.
- Under the panel, the "Talk to us" text link.

**Eyebrow:** `05 · Who it's for`

**Headline**
> Built for decisions that ride on one number.

**Sub-copy**
> If you have a decision gated on one number, expensive steps downstream, and no quantum computer in-house, Bellproof is for you.  [src: deck/clients "What clients share"]

Never write "our clients" or imply existing customers.

**Link under the panel:** `Talk to us` → `mailto:[Contact email]`

**Tabs** [questions and stakes: deck/clients; certificate uses: deck/certificate]

| Tab | Their question (big) | What rides on it | What the certificate does |
|---|---|---|---|
| Pharma & biotech | How strongly does this drug bind? | Which molecules go to the lab | Shows partners in the data room why candidate A advanced. (chip: `RUNNING EXAMPLE`) |
| Batteries & energy | Is this electrolyte stable? | Building a pilot cell line | Lets you cite a result anyone can check in papers and patents. |
| Chemicals & catalysis | What's the barrier on this catalyst? | Scaling a process to a plant | Lets you cite a result anyone can check in papers and patents. |
| DeSci DAOs & funders | Did the funded job run correctly? | Releasing the next milestone | Releases grant funds automatically when the job passes. |
| Quantum providers | How do we prove our results are real? | Premium prices and reputation | Builds a verified track record, on-chain. |

**Pixel art: `spr-client-<tab>`.** One 48×48 sprite per tab, sitting in the corner of the big question cell. It swaps with a 4-frame pixel dissolve when the tab changes.
- **Pharma:** a capsule beside a tiny molecule with an Fe atom in ramp-violet at its centre. The bonds wiggle.
- **Batteries:** a battery cell whose charge bars fill and empty.
- **Chemicals:** a flask with bubbles rising and popping at the top.
- **DeSci:** a DAO vault with a milestone flag that rises when a mini certificate drops in.
- **Providers:** the mini fridge with a badge that flips between "?" and a check mark (piece `client-providers`).

---

## 10. Section 7: How a job moves through the contracts · `id="flow"`

**Layout**
- **Part A.** Headline left, sub right.
- **Part B.** A two-lane swimlane grid: the left lane is "On-chain" and the right lane is "Off-chain". Seven numbered step pills zig-zag between the lanes in order. On-chain pills are tinted `blue`; off-chain pills are `card` with a hairline.
  - A pixel token (the job card) walks down through the steps as the user scrolls. This is scroll-driven, with a time-based fallback.
  - On mobile it becomes a single-column timeline with a lane tag on each step.
- **Part C.** Two outcome cells side by side: honest in a `blue` border, cheating in a `warn` border.
- **Part D.** A small note row with a mono demo-details line.

**Eyebrow:** `06 · Smart contracts`

**Headline**
> Seven steps. The money moves last.

**Sub-copy**
> Money, commitments and verdicts live on-chain. Quantum work and heavy math stay off-chain. Anyone can audit the trail.  [src: deck/flow]

**Lane headers** [src: deck/flow]
- `ON-CHAIN · money, commitments, verdicts`
- `OFF-CHAIN · quantum work, heavy math`

**Steps** [src: deck/flow; running-example values: deck/certificate]

| # | Lane | Step | Body | Running-example aside (mono, small) |
|---|---|---|---|---|
| 1 | On-chain | Post job | Spec hash, tolerance, escrow. | `job #0412 · ΔE for candidate A · ±1.0 kcal/mol` |
| 2 | On-chain | Stake | The provider bonds collateral. | `provider 0x41b2…7c09` |
| 3 | On-chain | Commit | A hash of the secret challenge keys goes on-chain. | (none) |
| 4 | Off-chain | Run | Encrypted challenge rounds. | `T C C T C C T …` |
| 5 | On-chain | Reveal | The challenge keys are published. | (none) |
| 6 | Off-chain | Verify | Anyone checks the transcript. | `ipfs://bafy…q3k` |
| 7 | On-chain | Settle | Pay and certify, or slash and refund. | `ACCEPTED` |

Mark the asides `illustrative` once, inline right after step 1's aside (revision 1 §1.6), so the tag sits next to `job #0412`.

**Outcome cells** [src: deck/demo]
- **Honest provider** (check icon, `blue`)
  1. Claims the job and stakes collateral
  2. Runs the compiled-game rounds
  3. Passes the test rounds
  4. Gets paid. Certificate minted.
- **Cheating provider** (warning icon, `warn`)
  1. Claims the job and stakes collateral
  2. Returns a classical guess for ΔE
  3. Fails the test rounds
  4. Stake slashed. Client refunded.

**Note row**
> **Why commit, then reveal?** Checking needs the verifier's secret keys, so a contract can't do it alone. Committing to the keys first and publishing them after the run lets anyone re-check the transcript, after the fact. The same idea drives time-delayed public verifiability.
> [src: MR §3.4; Mohammed–Abadi–Mahdi, CCS 2026, arXiv:2604.23516]

Citation under the note (small; a link to the §12 URL, with the pixel external glyph, then the mono id):
> `Mohammed–Abadi–Mahdi, CCS 2026` ↗ `arXiv:2604.23516`

Demo details line (mono, ink-soft):
> `[Network / testnet] · [Contract addresses] · [GitHub]`  [src: deck/demo placeholders]

**CTAs**
- `Watch the demo` → `[Demo link]`
- `Read the contracts` → `[GitHub]`

**Pixel art: `spr-chain-flow`.**
- It shows a row of chain blocks running down the on-chain lane, one block per on-chain step. Each block shows a mini glyph:
  - Post job: a coin into a vault
  - Stake: a coin stack with a padlock
  - Commit: a sealed envelope with a hash `#`
  - Reveal: the envelope opens and a key pops out
  - Settle: a vault that opens to the right
- The off-chain lane shows the mini fridge (Run) and a magnifier over a scroll (Verify).
- Animation: as the job token reaches each step, that block lights up one ramp step and "clicks" into the chain with a 2px drop. At Settle the loop alternates:
  - honest pass: coins slide to the provider, and a certificate block mints and drops onto the chain with a little bounce;
  - cheater pass (every other loop): the stake coins crack in `warn` and slide back to the client.
- Alt text: "A job token moves through seven contract steps; an honest provider is paid and a certificate is minted, a cheating provider is slashed."

---

## 11. Section 8: How the verification works · `id="verify"`

**Layout** (revision 1 §1.4)
- Centred headline and sub at the top.
- Below, a numbered figure bar: a row of 3 cells (`01`, `02`, `03` plus the label), sticky at desktop widths; the active cell has an ink top bar. Then 3 stacked feature rows divided by hairlines.
- Each row has an H3, body, an optional stat pair or mini-cards, and a CTA (copy left), next to a figure frame (right): the sprite on a plate inside a hairline frame with registration dots and a mono `FIG.` caption.
- The research list (§12) closes the section.

**Eyebrow:** `07 · How we verify`

**Headline**
> A game only quantum players can win.  [src: deck/games]

**Sub-copy**
> We check quantum work with nonlocal games, compiled with encryption, hidden among the real computation. Three ideas, one verdict.

**Figure bar** (number + label)
1. `01` `Nonlocal games`
2. `02` `Compiled with encryption`
3. `03` `Hidden test rounds`

### Row 1: Nonlocal games · `id="verify-games"`

**H3**
> A test only quantum players can pass.  [src: deck/games]

**Body**
> A referee sends two separated players one question each. They win if their answers satisfy a rule. Players who share entanglement win more often than any classical strategy allows.

**Stat pair** (two bordered cells; the second is solid `blue`) [src: deck/games]
- `8/9`: best classical win rate in the Magic Square game
- `1`: quantum win rate, using shared entanglement

**Small explainer**
> **The Magic Square game.** Alice fills a row and Bob a column of a 3×3 grid, each with a parity rule. They must agree on the cell they share.

**Rigidity line** (mono eyebrow `RIGIDITY`)
> Near-perfect play forces specific quantum states and measurements. So the referee can steer the players through a chosen computation.  [src: deck/games]

**CTA:** `Read the papers` → `#research`

**Figure caption:** `FIG. 01 · THE MAGIC SQUARE GAME`

**Pixel art: `spr-magic-square`** (in the figure frame)
- It shows the 3×3 grid at large scale. Alice (a small sprite, left) and Bob (right) each hold a qubit, joined by a wavy dotted entanglement line. A referee sprite sits on top holding two question cards.
- Animation (8 fps loop, ~4 seconds):
  1. The referee flips a card to each player.
  2. Alice's row fills with ±1 pixels.
  3. Bob's column fills.
  4. The shared cell flashes when they agree.
  5. A win counter ticks.
- A small mono readout under the grid reads `classical ≤ 8/9 · quantum = 1`.
- Alt text: "Alice fills a row and Bob a column of a 3×3 grid; their shared cell agrees, so they win."

### Row 2: Compiled with encryption · `id="verify-compiler"`

**H3**
> Encryption replaces the wall between the players.  [src: deck/compiler]

**Body**
> The classic game needs two devices kept apart so they can't talk. Inside one cloud, nobody can enforce that. The KLVY compiler swaps the wall for cryptography. One provider plays both roles. Alice's question arrives encrypted, so the provider answers it blind, before it sees Bob's.
> [src: deck/compiler]

**Two mini-cells**, each with a hairline on top [src: deck/compiler]
- `POST-QUANTUM SECURITY` · Soundness rests on Learning With Errors (LWE), the lattice assumption family behind NIST's ML-KEM standard.
- `FROM GAMES TO COMPUTATION` · Natarajan–Zhang (2023) turned compiled games into verification of any quantum computation. Holler–Natarajan (2026) cut the total cost to quasilinear in circuit size.

**CTA:** `Read KLVY (STOC 2023)` → https://arxiv.org/abs/2203.15877

**Figure caption:** `FIG. 02 · PHYSICAL VS CRYPTOGRAPHIC SEPARATION`

**Pixel art: `spr-wall-to-lock`** (in the figure frame)
- **Frame A.** Two mini fridges with a brick wall between them, labelled `PHYSICAL SEPARATION`.
- **Transition.** The bricks collapse pixel by pixel into a single padlock. The two fridges slide together into one fridge.
- **Frame B.** One fridge. A question card enters inside a padlocked box, the fridge answers, and only then does the second, open question card arrive. Labelled `CRYPTOGRAPHIC SEPARATION`.
- Loop: ~6 seconds, holding each labelled frame for 1.5 seconds.
- Alt text: "A wall between two quantum computers turns into a padlock, leaving one computer answering an encrypted question."

### Row 3: Hidden test rounds · `id="verify-rounds"` (chip: `RUNNING EXAMPLE`)

**H3**
> Test rounds hide among compute rounds.  [src: deck/protocol]

**Body**
> The verifier keeps a secret schedule. Test rounds play the compiled game. Compute rounds measure one term of the active-site energy, and together they build ΔE. The provider sees only question marks.
> [src: deck/protocol]

**Three mini-cards** [src: deck/protocol]

| Title | Body |
|---|---|
| Test round | Play the compiled game and check the win condition. Any deviation shows up here. |
| Compute round | Measure one term of the active-site energy. Together these build the ΔE estimate. |
| Verdict | Accept only if the test win rate clears the threshold. Faking ΔE means failing tests. |

**CTA:** `Watch a cheater fail` → `[Demo link]`

**Figure caption:** `FIG. 03 · HIDDEN TEST ROUNDS`

**Pixel art: `spr-tc-rounds`** (in the figure frame; use the deck's exact sequence)
- **Top row**, labelled `VERIFIER'S SECRET SCHEDULE`: 12 blocks, `T C C T C C T C T C C T`. T blocks are solid `blue`; C blocks are card-coloured.
- **Bottom row**, labelled `WHAT THE PROVIDER SEES`: 12 grey `?` blocks.
- **Animation:** a scan line sweeps left to right. Where it passes, each `?` briefly flips to reveal its T or C, then flips back. C blocks drip one pixel into a small `ΔE` meter that fills. T blocks flash a check.
- **Every third loop, a cheater variant.** A T block cracks in `warn`, the meter empties, and a mono `REJECTED` stamp appears for 1 second.
- HTML labels beside the sprite: `VERIFIER'S SECRET SCHEDULE` and `WHAT THE PROVIDER SEES` by the two rows, `ΔE` by the meter, and the `REJECTED` stamp text.
- Alt text: "Hidden test rounds mixed among compute rounds; the provider sees only question marks."

### Research list · `id="research"`

**Layout.** A bordered 5-row list.
- Each row: mono year cell, then authors and title, then venue, then an "arXiv ↗" link cell.
- One-line "what it gives us" text in ink-soft under each title.

**H3**
> The papers behind it.

**Sub**
> Bellproof builds on published results in classical verification of quantum computation.

Full rows are in §12.

---

## 12. Research list (canonical; used in §11 and in the footer)

All arXiv IDs were checked against arxiv.org on 2026-10-11. Venue names follow the deck (deck/compiler) and the market research (MR §1, §3.4).

| # | Year | Citation | Venue | What it gives us | Link |
|---|---|---|---|---|---|
| 1 | 2018 | Urmila Mahadev, *Classical Verification of Quantum Computations* | FOCS 2018 | A classical verifier can check a quantum computation, using cryptography | https://arxiv.org/abs/1804.01082 |
| 2 | 2023 | Yael Kalai, Alex Lombardi, Vinod Vaikuntanathan, Lisa Yang, *Quantum Advantage from Any Non-Local Game* | STOC 2023 | The KLVY compiler: encryption replaces the wall between the players | https://arxiv.org/abs/2203.15877 |
| 3 | 2023 | Anand Natarajan, Tina Zhang, *Bounding the quantum value of compiled nonlocal games: from CHSH to BQP verification* | FOCS 2023 | Compiled games become verification of any quantum computation (BQP) | https://arxiv.org/abs/2303.01545 |
| 4 | 2026 | Finn Holler, Anand Natarajan, *Classical Verification of Quantum Computation with Quasilinear Resources, from Compiled Nonlocal Games* | arXiv:2609.38060 | Total cost cut to quasilinear in circuit size | https://arxiv.org/abs/2609.38060 |
| 5 | 2026 | Ameer Mohammed, Aydin Abadi, Jaffer Mahdi, *Time-Delayed Publicly Verifiable Quantum Computation for Classical Verifiers* | ACM CCS 2026 (accepted) | Commit now, reveal later, so anyone can re-check | https://arxiv.org/abs/2604.23516 |

Notes on the "what it gives us" column:
- Row 1 is a plain-language summary of the paper's title and abstract. It is the only line here not taken from the deck or the market research.
- Rows 2–5: deck/compiler, MR §3.4.

---

## 13. Sections 9–11

### Section 9: What the certificate guarantees · `id="guarantees"`

**Layout**
- **Part A.** Headline and sub, left-aligned.
- **Part B.** Two columns: a dark ink certificate card on the left, in mono key/value rows with a pixel seal in the corner; on the right, a "Where it goes" list of 4 items with hairline dividers.
- **Part C.** A two-cell row:
  - "Guaranteed": a card cell with a `blue` heading and 4 check rows;
  - "Not covered": a slightly darker paper cell with a `warn` heading and 2 warning rows.
  Give both cells equal visual weight, because honesty is part of the pitch.
- **Part D.** One closing running-example line, set large.

**Eyebrow:** `08 · The certificate`

**Headline**
> What the certificate promises, and where it stops.

**Sub-copy**
> Every passing job mints a certificate. It travels with the result, so anyone downstream can check it.  [src: deck/certificate "The certificate travels with the result"; deck/guarantees]

**Certificate card** [src: deck/certificate]
- Card title: `BELLPROOF CERTIFICATE · ILLUSTRATIVE`

| Key | Value |
|---|---|
| job | `#0412` |
| spec | `H = 0x9f3c…e21a` |
| result | `ΔE = −12.4 ± 1.0 kcal/mol` |
| protocol | `Compiled nonlocal game` |
| soundness | `error ≤ 2^−λ (LWE)` |
| provider | `0x41b2…7c09` |
| transcript | `ipfs://bafy…q3k` |
| verdict | `ACCEPTED` (blue-light, bold) |

**Where it goes** [src: deck/certificate]

| Title | Body |
|---|---|
| Data rooms | Show partners why candidate A advanced. |
| DAO milestones | Release grant funds automatically. |
| Papers & patents | Cite a result anyone can check. |
| Provider reputation | A verified track record, on-chain. |

**Guaranteed** [src: deck/guarantees]
- ✓ The result matches the computation you specified, within tolerance.
- ✓ A noisy run, a shortcut or a fake number is rejected, except with negligible probability.
- ✓ Anyone can re-check the transcript once the keys are revealed.
- ✓ Security rests on LWE, a post-quantum assumption.

**Not covered** [src: deck/guarantees; timing from MR TL;DR #3 and §3.2]
- ⚠ **Whether your Hamiltonian models the real molecule.** The certificate checks the computation. Whether the model matches nature is a chemistry question, and it stays yours.
- ⚠ **Today's noisy chips.** The protocol assumes fault-tolerant providers, the hardware these jobs need anyway. The full protocol is a fault-tolerant-era product: about 2030 or later.

<!-- TODO (team): footnote cut in revision 1 until the demo setup is confirmed. Restore under the Not covered cell once confirmed:
"The demo runs on [Network / testnet] with [simulator / hardware: confirm]." -->

**Closing line** (chip: `RUNNING EXAMPLE`)
> The team advances candidate A, **with the certificate in its data room.**  [src: deck/with-without]

**CTA:** none. (`See a sample transcript` was cut in revision 1 because no sample exists yet; see §17.)

**Pixel art: `spr-cert-mint`, behind the certificate card's corner.**
- It shows a pixel scroll with a bell-shaped wax seal.
- Animation, a ~5 second loop:
  1. The rows of the certificate card type in.
  2. The seal stamp comes down with a 2-frame squash, and `ACCEPTED` appears.
  3. A small chain block drops below the card, with the certificate glyph on its face.
  4. It joins a short chain of three blocks that scroll left.
- Reduced motion: show the stamped, final frame.
- Alt text: "A certificate is stamped ACCEPTED and minted as a block on a chain."

### Section 10: CTA · `id="cta"`

**Layout.** This is Mistral's dark "go deeper" band.
- A full-bleed `ink` background with thin grid lines.
- A giant headline left-aligned at the top, and a sub line.
- A row of 3 bordered cells with hairline dividers. Each whole cell is the link: a pixel icon on the left, a title and a short body on the right, and a small chevron or external glyph bottom-right. No buttons inside the cells (revision 1 §1.8).
- One more row with a centred "Contact" button.
- The band ends with a stepped ramp transition into the footer.

**Eyebrow:** `Bellproof`

**Headline**
> Delegate quantum work. Verify every answer.  [src: deck/close]

**Sub-copy**
> One job, two providers. Watch the honest one get paid and the cheater get slashed.  [src: deck/demo]

**Three cells**

| Icon | Title | Body | Cell links to |
|---|---|---|---|
| play | Watch the demo | One job, two providers, one verdict each. | `[Demo link]` |
| code brackets | Read the code | Contracts, verifier and demo, in the open. | `[GitHub]` |
| book | Read the research | Five papers, from Mahadev 2018 to CCS 2026. | `#research` |

**Final button:** `Contact` → `mailto:[Contact email]`

**Pixel art**
- **Cell icons** (48×48, blue-light on ink):
  - play: the triangle "presses in" on hover;
  - code brackets: they blink;
  - book: the pages flip on hover.
- **`spr-walkers`.** Alice and Bob from §11, joined by their entanglement line, now walk in the footer (revision 1 §1.8): they arrive along the top edge of the footer strata, stop under the hanging bell (which rings once), stand, then walk off.

### Section 11: Footer · `id="footer"`

**Layout.** This is the Mistral footer.
- A paper background.
- 4 link columns with hairline dividers between them; each column has an ink-soft label and ink links.
- Below, one sub-footer row: social icons (if any) on the left, the tagline in the centre, the copyright and "Built at…" line on the right (revision 1 §1.8).
- A giant pixel Bellproof bell that hangs on a short cable from the sub-footer line, lowered into view as you scroll (the hero fridge's bookend).
- The small "illustrative figures" note sits in the Legal column.
- At the very bottom, stepped `ramp` bands whose top edge descends left to right, with faint grid lines; the walkers arrive under the bell.

**Columns**

| Product | Research | Project | Legal |
|---|---|---|---|
| How it works → `#verify` | Mahadev, FOCS 2018 ↗ arXiv:1804.01082 | Founder: Mark Deaconu | Terms → `[Terms]` |
| Contracts → `#flow` | KLVY, STOC 2023 ↗ arXiv:2203.15877 | Code → `[GitHub]` | Privacy → `[Privacy]` |
| The certificate → `#guarantees` | Natarajan–Zhang, FOCS 2023 ↗ arXiv:2303.01545 | — | License → `[License]` |
| Who it's for → `#clients` | Holler–Natarajan, 2026 ↗ arXiv:2609.38060 | Contracts: `[Contract addresses]` | Figures marked "illustrative" are examples. |
| Demo → `[Demo link]` | Mohammed–Abadi–Mahdi, CCS 2026 ↗ arXiv:2604.23516 | Network: `[Network / testnet]` | (none) |
| (none) | (none) | Contact → `mailto:[Contact email]` | (none) |

Research links go to the URLs in §12.

**Socials row**
- Pixel icons for `[GitHub]`, `[X]` and `[Discord]`. Ship an icon only if the team supplies its link.
- Right side: `Verified quantum computation, settled on-chain.`

**Bottom line**
- Left: `Bellproof © 2026`
- Right: nothing more (the founder credit has its own row above the sub-footer)

**Founder credit** (user request, 2026-10-12): one row between the link columns and the sub-footer. Text left, links right (mono, small, each with ↗).
> Built by **Mark Deaconu**, a computer science PhD student at EPFL working on the foundations of quantum computation and complexity theory.

Links: `markdeaconu.com` → https://markdeaconu.com · `Google Scholar` → https://scholar.google.com/citations?user=_IgP79MAAAAJ · `GitHub` → https://github.com/MarkNDeaconu · `arXiv` → https://arxiv.org/search/?searchtype=author&query=Deaconu%2C+Mark. No advisor name, no email (`[Contact email]` stays). His papers are not added to the research list. Meta author: Mark Deaconu.

**Pixel art**
- **Giant pixel mark.** A blocky bell glyph with a check notch, about 240px tall at integer scale. It hangs from the sub-footer line on a 1px cable and rings once when the walkers stop under it.
- **`spr-walkers`** arrive under the bell (see Section 10). The `spr-qubit-walker` patrol was dropped in revision 1 (the piece stays, unused on the page).

---

## 14. Claims ledger (QA checks every number against this)

| Claim as shipped | Brief § | Source |
|---|---|---|
| IBM Quantum, Amazon Braket and Azure Quantum rent time on real quantum processors | §6 | deck/quantum-cloud |
| ΔE = −12.4 (± 1.0) kcal/mol, job #0412, hashes, addresses | §4, §6, §8, §10, §13 | deck/example, deck/certificate (illustrative; must be labelled) |
| 2¹⁰⁰ ≈ 10³⁰ amplitudes, ~100-qubit model | §6 | deck/example |
| At 99.9% gate fidelity, a 10,000-gate circuit expects ~10 faults | §7 | deck/silent |
| $2.6B per approved drug, including failures | §7 | deck/pharma-numbers, which cites DiMasi, Grabowski & Hansen 2016 |
| 9.6% Phase I → approval | §7 | deck/pharma-numbers, which cites BIO 2016 |
| 10–15 years discovery → approval | §7 | deck/pharma-numbers, which cites PhRMA |
| Intel 1994, $475M charge | §7 | deck/history, which cites Intel Jan 1995 |
| JPMorgan 2012, ~$6.2B losses | §7 | deck/history, which cites the JPMorgan Chase Task Force 2013 |
| Google and Meta 2021, silent CPU errors | §7 | deck/history, which cites Hochschild et al. HotOS 2021 and Dixit et al. 2021 |

The three history rows above (Intel, JPMorgan, Google and Meta) are **cut in revision 1**: their copy no longer ships (§17). QA checks that none of it appears on the page.
| Magic Square: classical 8/9, quantum 1 | §11 | deck/games |
| LWE is the assumption family behind NIST ML-KEM | §11 | deck/compiler |
| Holler–Natarajan: quasilinear total cost | §11, §12 | deck/compiler; MR §1 |
| "The first marketplace where quantum results are cryptographically verified before anyone gets paid." | §8 | MR §1. Use this verbatim; never paraphrase it upward. |
| Providers have started certifying their own results | §8 | MR §2 Tier 2 |
| Fault-tolerant providers assumed; full protocol about 2030 or later | §13 | deck/guarantees; MR TL;DR #3 |
| Commit–reveal relates to time-delayed public verifiability | §10 | MR §3.4; arXiv:2604.23516 |

**Never say**
- "First quantum blockchain", "first quantum verification", or "first quantum compute on-chain". [MR §1]
- That the certificate proves the chemistry, or the model, is right.
- That the full protocol works on today's noisy hardware, or any delivery date other than "about 2030 or later".
- Customers, partners, pilots, quotes, logos, user counts, or revenue.
- "Trustless". Use "anyone can audit" instead.
- That the escrow currency, chain or token is decided. Use `[Network / testnet]`.

---

## 15. Optional block (needs team sign-off before shipping)

**Assurance levels.** This is a roadmap strip that answers the judge question "Does this work today?" It comes from the market research's positioning advice and is **not in the deck**, so ship it only if the team confirms it is the plan. [src: MR §4.2]

| Level | What it proves | Today? |
|---|---|---|
| L1 Attested | This exact circuit ran on the claimed backend, with this calibration, at this time | Yes |
| L2 Accredited | The output distribution is close to ideal, under noise assumptions | Yes, about 10–50 qubits |
| L3 Verified | The result is correct even against a malicious provider (LWE) | Fault-tolerant era |

If approved:
- Placement: a 3-cell strip at the end of §9 (Section 9: guarantees).
- Headline: "Start checking today. Upgrade as the hardware grows."
- Note: "All three levels share one certificate format."

---

## 16. Sprite index (for art agents)

| Sprite | Section | Subject | Loop |
|---|---|---|---|
| `spr-fridge` | Hero | Silver dilution-fridge chandelier hanging from the top | Azure pulses down the coax; bit drops |
| `spr-bloch-inline` | Hero H1 | 16×16 Bloch sphere, the headline's full stop | Arrow precesses |
| `spr-qubit-pair` | Hero, floor left | Two entangled qubit creatures | Mirror-sync hops |
| `spr-cert-mini` | Hero, floor right | Small certificate | Seal stamps |
| `round-tile` | Hero, right stack | Round tile with faces ?, T, C, ✓ | T/C shuffle, then verdict |
| `spr-check-scale` | Trust | Balance scale, compute vs check | Light side wins |
| `spr-fridge-out` | Flip | Fridge outputs one number card | Card pops; amplitudes twinkle |
| `spr-question-block` | Paradox band | "?" block | Flickers ? T C on enter |
| `spr-glitch-cells` | Cost | 6 failure icons | Glitch on hover |
| `spr-cascade-coin` | Cost | Coin stack on a conveyor | Grows into a tower |
| `spr-layer-packets` | Layer | Lab, vault, fridge, packets | Packets march |
| `spr-client-*` | Clients | Capsule/Fe molecule, battery, flask, DAO vault, fridge with badge | Swap on tab change |
| `spr-chain-flow` | Flow | Chain blocks, envelope, key, vault | Token walks; honest/cheat alternate |
| `spr-magic-square` | Verify row 1 | 3×3 grid, Alice, Bob, referee | Fill row/column; shared cell flashes |
| `spr-wall-to-lock` | Verify row 2 | Wall becomes a padlock; two fridges become one | Two-state morph |
| `spr-tc-rounds` | Verify row 3 | T/C row vs ? row, ΔE meter | Scan reveal; cheater variant |
| `spr-cert-mint` | Guarantees | Scroll, bell seal, chain block | Stamp, then mint |
| `spr-walkers` | Footer strata | Alice and Bob walking | Arrive under the bell, stand, walk off |
| `spr-qubit-walker` | (unused since revision 1) | Qubit creature with Bloch antenna | Patrol and hop |

Every sprite needs a still frame for `prefers-reduced-motion`. Use the deck's Magic Square highlight (middle row plus right column, as on deck/cover) as the still frame for `spr-magic-square`.

---

## 17. Cut in revision 1 (kept for the record; none of this ships)

Revision 1 (`revision-1.md` §1.2, §1.3, §1.5, §1.7, §1.8 and CO1) cut the page by about a third. The copy below was live in attempt-01 and is no longer in `strings.ts`.

**Trust, Part C (closing line)** [src: deck/trust-classical]
> Checking is cheaper than computing. **That asymmetry is what makes delegation safe.**

**Trust, Part D (running example chip)** [src: deck/cloud-today]
> `RUNNING EXAMPLE` A biotech team rents cloud GPUs to screen thousands of drug candidates against an enzyme target.

**Trust, floating tags** (replaced by the domain ledger, which keeps the six names): `Storage & data`, `AI models`, `Genomics`, `Risk & pricing`, `Simulation`, `Rollups`.

**Flip, Part C (table)** [src: deck/checks-fail]
- Title (H3): `Every classical check breaks.`

| How we check | Classical cloud | Quantum cloud |
|---|---|---|
| Check it | Multiply the factors back | No short classical certificate exists for an energy |
| Re-run it | Identical output on any machine | Needs another quantum computer, and noisy runs disagree |
| Test it | Score on held-out data | Instances small enough to simulate aren't the ones you need |
| Prove it | A SNARK proves the run | Proving means simulating the circuit, at exponential cost |

**Cost, false positive / false negative cells** [src: deck/two-errors]
- **`FALSE POSITIVE` · The wrong molecule advances.** Synthesis, assays and animal studies go to a compound that was never going to work.
- **`FALSE NEGATIVE` · The right molecule is dropped.** The candidate that would have worked is discarded, and nobody ever finds out.

**Cost, D: history strip** [src: deck/history]
- H3:
  > Unchecked computations have been expensive before.

| Year (big) | Who | Line | Body |
|---|---|---|---|
| `1994` | Intel | `$475M charge` | A flaw in the Pentium's division unit returned wrong results in rare cases. |
| `2012` | JPMorgan Chase | `~$6.2B in losses` | London Whale trades: spreadsheet errors in the risk model understated risk. |
| `2021` | Google · Meta | `No error raised` | CPUs in their fleets silently returned wrong results during normal work. |

- Closing line:
  > All three were classical, so checking caught them eventually. **A wrong quantum result offers nothing to check against.**
- Visible sources line:
  > Sources: Intel, Jan 1995 · JPMorgan Chase Management Task Force report, 2013 · Hochschild et al. (Google), HotOS 2021 · Dixit et al. (Meta), 2021

If the history strip ever returns: do not paraphrase the rows into stronger claims. For example, never write "a quantum error could cost billions".

**Guarantees, footnote** (cut until the team confirms the demo setup; also a TODO comment in §13 and in `strings.ts`)
> The demo runs on [Network / testnet] with [simulator / hardware: confirm].

**Guarantees, CTA** (no sample transcript exists yet)
- `See a sample transcript` → `[GitHub]`

**CTA band, cell buttons** (each cell is now the link)
- `Watch the demo` → `[Demo link]` · `Open GitHub` → `[GitHub]` · `See the papers` → `#research`

**Renamed**
- `Get in touch` → `Contact` (nav, mobile menu, CTA band final button).
- Clients header button `Talk to us` → the same label as a text link under the panel.
- Mobile menu label `MENU` dropped (the open menu shows the wordmark and a close button).
