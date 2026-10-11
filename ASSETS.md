# Assets

Everything visual and audible is **referenced by ID through `public/assets/manifest.json`**. If a file is missing, the game falls back (see below) and never crashes, so you can drop art/audio in at any time without touching code.

```
public/assets/
  manifest.json          id → file maps (portraits, backgrounds, impacts, weapons, models, sfx, music, voice)
  portraits/             <id>.png|webp          character art
  backgrounds/           <bgId>.jpg|png|webp    scene backgrounds
  voice/                 <lineId>.mp3           voice lines (see "Voice")
```

> The committed `manifest.json` is intentionally empty (the art is never pushed, and the GitHub Pages site is public). `npm run assets` / `npm run assets:scan` regenerate it **locally**; don't commit your local version.

## Fastest way to swap art: drop files, run one command
Put images in `public/assets/portraits/` or `public/assets/backgrounds/`, then run **`npm run assets:scan`**. It rewrites `manifest.json` from the files it finds, so you never edit the manifest by hand.
- `portraits/<id>.png` → default art for that character (`player` for your own character); `portraits/<id>_<emotion>.png` → emotion art. If two files share a name, the newest wins, so you can overwrite fetched art simply by dropping your own file in.
- `backgrounds/<bgId>.jpg` → that scene's background. The scan prints which background ids are still missing.

## Portraits
- Key = character id (`ego`, `bachira`, …) or `player`. Original characters use their ids (`sora`, `reiji`, …).
- Manifest: `"portraits": { "sora": { "default": "portraits/sora.png", "furious": "portraits/sora_furious.png" } }`. An emotion-specific file (`neutral, smirk, furious, shocked, despair, flow, metavision, devoured`) wins over `default`.
- Best: transparent PNG/WebP, full or 3⁄4 body, ~1000–1500 px wide × 1500–2200 px tall. The stage crops to a bust automatically.
- Fallbacks: the player and **original** characters → generated layered SVG portrait (the creation wizard edits it). **Canon** characters with no file → a neutral silhouette (never a hand-drawn likeness).
- `npm run assets` (`scripts/fetch-wiki-assets.mjs`) downloads colored character art for the 15 canon cast from the Blue Lock fan wiki and writes the manifest + `SOURCES.json`. These files are copyrighted fan-wiki images, so they are **gitignored** and for personal, non-commercial local use only; never commit or redistribute them.

## Backgrounds
- Ids: `black letter room_z cafeteria locker_room training_pitch tunnel stadium monitor_wall ego_office old_pitch academy_gate street_cage bench_dusk`.
- Drop `public/assets/backgrounds/<id>.jpg` and add `"backgrounds": { "cafeteria": "backgrounds/cafeteria.jpg" }`. 1920×1080 (16:9) recommended.
- Fallback: a plain CSS gradient (no drawn scenery).

## Voice lines (easy replaceable files)
Every spoken line has a stable id `<scriptId>:<beatIndex>`; its slot is `public/assets/voice/<id with ":" → "_">.mp3`.
1. `npm run voice:export` → `docs/voice-script.csv` / `.json` listing **file, id, speaker, origin, text** for every spoken line.
2. Put an audio file at that path (record it, generate it with a TTS service you are licensed to use, etc.). Origin-specific wording has its own slot `…@<origin>.mp3`, checked first. Files can also be mapped in the manifest under `"voice"`.
3. No code changes. Missing files are silently skipped. Inner-monologue lines are not voiced.
Do not use voice models cloned from real voice actors without their consent.

## SFX / music
Declare in manifest: `"sfx": { "don": "audio/sfx/don.mp3" }`, `"music": { "selection-tension": "audio/music/tension.mp3" }`. `src/audio.ts` no-ops when absent. Track ids used by scripts: `memory-hush envelope selection-tension dorm-calm`.

## 3D (Phase 2, not built)
Planned: stylized low-poly models under `models/` with license + source recorded here per file (Mixamo / CC0 only).
