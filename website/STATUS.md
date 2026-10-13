# Bellproof website: status

- **attempt-01:** frozen at the user's request on 2026-10-12. The reviewed build is `attempt-01/dist/` (integrated 2026-10-11). Seven QA reports are in `attempt-01/qa/qa-*/findings.md`.
  - Note: seven engine source files had already received partial revision edits just before the pause. The source still builds; `dist/` is the version QA reviewed.
- **attempt-02:** a copy of attempt-01's source. Revision 1 (`research/briefs/revision-1.md`) is being applied here:
  - originality fixes (new trust, pill, hero, verify, clients, mobile menu, CTA and footer designs)
  - a 30–40 % shorter page
  - a pause-motion toggle
  - self-hosted fonts
  - a richer hero fridge
  - all blockers and majors from QA

Order: R0 (engine, content, icons, layout-core basics), then R1 (art, sections, rest of layout), then R1b (footer, hero), then R2 (integration and QA re-run).

## Paused (2026-10-12, usage limit)
- Every revision-1 owner task in attempt-02 is done: the new hero, trust ledger, verify, clients, footer, fonts, pause-motion and art polish.
- The user's latest requests are applied: no event references, a founder credit, and a hero height the user approved.
- **Remaining on resume:**
  1. The integrator finishes its final evidence and definition-of-done checks, and the README.
  2. A short Opus QA re-run.
  3. Serve attempt-01 on :4301 and attempt-02 on :4302.

## Ready to deploy (2026-10-12)
- attempt-02: integration and final validation are complete. All 11 validation checks pass (`attempt-02/qa/final-validation/REPORT.md`).
- GitHub Pages: `.github/workflows/deploy-pages.yml` at the repo root builds `website/attempt-02` on every push to `main`.
- git: initialized on `main`, origin `git@github.com:MarkNDeaconu/bellproof.git`, nothing committed yet.
- Site URL after the push: https://markndeaconu.github.io/bellproof/
