# Bellproof

Verified quantum computation, settled on-chain.

Bellproof is a verification layer between people who need quantum answers and the quantum clouds that compute them. Results are checked with compiled nonlocal games (secure under LWE), and providers are paid by smart contract only when verification passes.

## Website

The live site is built from **`website/attempt-02/`** and deployed to GitHub Pages: https://markndeaconu.github.io/bellproof/

```bash
cd website/attempt-02
npm ci
npm run dev        # local dev server
npm run build      # production build → dist/
npx vite preview   # serve the production build
```

- `website/attempt-02/`: the current site (Vite + TypeScript, a custom pixel-art canvas engine in `src/engine`, art in `src/art`, sections in `src/sections`).
- `website/attempt-01/`: the first attempt, kept frozen for reference.
- `website/research/`: design, art and engine specs, plus the pitch-deck slide sources.
- `research/market-research.md`: market and competitive research.

## Deployment

`.github/workflows/deploy-pages.yml` builds `website/attempt-02` and publishes it to GitHub Pages on every push to `main`.

One-time setup: in the GitHub repo, go to **Settings → Pages → Build and deployment → Source** and choose **GitHub Actions**.

---
Built by [Mark Deaconu](https://markdeaconu.com).
