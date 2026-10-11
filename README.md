# BLUE LOCK: EGOIST LIFE

A BitLife-style life sim fused with a visual novel and (soon) a tactical match engine, set in the world of *Blue Lock*. Personal, non-commercial fan project.

```bash
npm install
npm run dev          # http://localhost:5173
npm test             # 53 engine/narrative tests
npm run build
npm run assets       # optional: fetch colored character art (gitignored, personal use)
npm run voice:export # list every voiceable line → docs/voice-script.csv
npm run e2e          # browser playthrough (needs `vite preview` on :4173 and a chromium)
```

Status: **M1 + M2 complete** (state/saves/relationships/flags/sandbox, cutscene engine, 4+2 origins, origin-divergent opening). M3 (Life Hub loop) is next. See `docs/DESIGN.md`, `docs/CONTENT_GUIDE.md`, `ASSETS.md`. Press `~` for the Sandbox.

## Play it on GitHub Pages
Merging to `main` deploys automatically (`.github/workflows/deploy.yml`: lint → test → build → Pages). One-time setup in the repo: **Settings → Pages → Build and deployment → Source: GitHub Actions**. The site is then at `https://<user>.github.io/bluelock-sim/`. The hosted build is public, so it shows the generated fallback portraits; for the colored art run the game locally (`npm run assets && npm run dev`).
