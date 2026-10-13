# Revision 1: integrator queue (collected by the lead from owners' reports)

For the R2 integrator (Opus) working in `attempt-02/`. Also read `attempt-02/qa/integration/HANDOFF.md`.

1. **engine.css:** scope the `[data-reveal]` hiding under `html.js`. layout-core patched the no-JS case in the critical CSS for now.
2. **`BP_ONLY`** doesn't cover the art glob in `src/sections/nav.ts`. Either extend the vite plugin or have nav import from the registry. (layout-core)
3. **Pause motion:** after `setPaused(true)`, about 4 rAF per 500 ms remain from section-owned subscribers that ignore `motion.onChange`. Section owners were told to fix this; verify. (HANDOFF)
4. **Typewriter idle check:** couldn't be isolated until the sections landed. Verify 0 rAF when nothing animates. (HANDOFF)
5. **`toImageData` cost:** tc-rounds measured the remaining ~0.3 ms per tick as the engine's image conversion. Consider speeding it up or caching frames over 2 MB. (art-tc-rounds)
6. **Pause button:** its name stays "Pause motion" and only `aria-pressed` toggles (APG / WCAG 2.5.3). The `nav.playMotion` string is unused, so remove it or keep it documented. (layout-core)
7. **Placeholders:** the skeleton shells no longer show "?" placeholder art, because E5 skips placeholder mounts. Expected; make sure nothing visible depends on it.

## Lead decisions during revision 1
- **Footer:** the CTA walkers arrive and **stop one on each side of the hanging bell**, never under it, so the rim and check mark stay visible. The bell rings on their arrival, and its skirt depth into the strata stays as designed.
8. **sections-2 known issue:** at 1280–1439 the horizontal layer diagram is cramped, and "Quantum clouds" and the tags wrap. Consider stacking below 1440, or narrower lanes or labels.
9. **`nav.ts` eagerly imports `art/bands`** (also raised by layout-core), so a half-edited bands breaks every `BP_ONLY` build. See item 2.
10. **logo-mark `footerReveal`** adds a frame subscriber on resume even when the footer is off-screen (120 rAF/s at `#research`). Gate it on visibility. The logo-mark owner was Fable; the integrator should fix it directly. (sections-3)
11. **Walkers handoff:** check that only one pair of walkers is visible across the CTA and footer (`bp:walkers` enter/exit; the footer dispatches `{ where: 'footer', state: 'present' }`).
12. **Review the engine fix by art-bands:** `Mounted.destroy()` in `mount.ts` is now idempotent. E5's self-destroy was recursing into a stack overflow (triggered by the pill's tc-glyph), which killed the IntersectionObserver batch, so the hero never got `play()`.
13. **Engine `.band` canvas class:** the site's `.band` rule drew a hairline over the staircase and strata canvases. art-bands renamed its own canvases, but the engine's `stripe` / `staircase` should not use the class name `.band`. Rename it in the engine.
14. **Footer:** layout-core should drop the blue background on `.footer__strata` (`strata()` makes its root transparent above the edge). Verify it at integration.
- **Lead decision:** no diamond on the paradox band.
15. **Engine `mount.ts` `buildCache()`:** the idle task throws "Cannot read properties of null (reading '0')" when the mount is destroyed before its cache finishes; it reproduces on a full-page screenshot of the full build. Fix: `if (!this.cache) return true;`. (sections-1-body)
16. **Engine `engine.css` reveal:** the hidden state `inset(-12px -12px 100% -12px)` leaves a 12 px strip visible above each element. Fix: bottom inset `calc(100% + 12px)`. (sections-1-body)
17. **Engine `reveal()` / `countUp()`:** `const un = observe(...)` with `un()` inside `play()` throws a ReferenceError (TDZ) if the element is already observed and visible. Fix: declare first. (sections-1-body)
18. **`.grid-colour` rail lines use `--module`** (128 from 1024), but the hero rails are 128/96/64 (≥1440 / 1200–1439 / <1200). Make the CTA and paradox bands follow the hero rule. (sections-1-body → layout-core / integrator)
19. **Trust ledger cells are not focusable** (deliberate, to avoid 6 dead tab stops), so they have no focus re-stamp. Accepted.
