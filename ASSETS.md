# Assets

Everything visual and audible is **referenced by ID through `public/assets/manifest.json`**. If a file is missing, the game falls back (see below) and never crashes, so you can drop art/audio in at any time without touching code.

```
public/assets/
  manifest.json          id → file maps (portraits, backgrounds, impacts, weapons, models, sfx, music, voice)
  portraits/             <id>.png|webp          character art
  backgrounds/           <bgId>.jpg|png|webp    scene backgrounds
  voice/                 <lineId>.mp3           voice lines (see "Voice")
```

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
