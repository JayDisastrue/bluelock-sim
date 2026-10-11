# Importing art and audio

You add files; one command wires them up. Nothing in the project ships with copyrighted art or audio.

```
public/assets/
  portraits/     character art           → portraits/README.md
  backgrounds/   scene backgrounds       → backgrounds/README.md
  voice/         voice clips and sounds  → voice/README.md
  manifest.json  generated; do not edit
```

## The 3-step workflow
1. Drop files in the folder, named as below.
2. `npm run assets:scan`
3. Refresh the page (`npm run dev`). Missing files fall back gracefully; nothing crashes.

By default these folders are **gitignored**: your files stay on your machine, and the public GitHub Pages site shows the generated fallbacks. To publish art you own the rights to, delete the three `public/assets/...` lines in `.gitignore` and commit the files.

## Character PNGs
| | |
|---|---|
| Format | PNG or WebP, **transparent background** |
| Size | **1200 × 1800** (2:3); minimum 800 × 1200; under 2 MB |
| Framing | front/¾ view, head near the top, same head size and position for every character; the game crops to the upper ~60% |
| Name | `<characterId>.png`; `player.png` for your character |
| Expressions (optional) | `<id>_neutral/smirk/furious/shocked/despair/flow/metavision/devoured.png`; missing ones use `<id>.png` |

**Character ids:** `ego anri bachira barou chigiri kunigami raichi rin sae nagi reo noel_noa isagi gagamaru oliver_aiku` (canon) · `sora reiji mio haruka dante lukas tomas kisaragi` (original) · `player`.
Characters with no image show a plain silhouette (canon) or a generated SVG portrait (player and originals).

## Backgrounds
JPG/WebP/PNG, **1920 × 1080**, under 1.5 MB, no baked-in text, calm bottom third.
**Ids:** `black letter room_z cafeteria locker_room training_pitch tunnel stadium monitor_wall ego_office old_pitch academy_gate street_cage bench_dusk` → `backgrounds/<id>.jpg`. Missing ones show a gradient.

## Voice and sounds
**Random character clips** (grunts, laughs, short phrases):
```
voice/<characterId>/*.mp3              any file, picked at random when that character speaks
voice/<characterId>/<emotion>/*.mp3    only for lines with that emotion
```
- Make 5+ clips per character; the same clip never plays twice in a row.
- Mono MP3, 44.1 kHz, silence trimmed, similar loudness (~−16 LUFS), 0.2–3 s.
- Settings → *Character voice clips* sets how often (every line / often / sometimes / off).

**Exact line recordings** (optional): `npm run voice:export` writes `docs/voice-script.csv`; put a file at each listed path (e.g. `voice/opening.main_23.mp3`). Origin-specific wording has `…@<origin>.mp3`. Exact recordings beat random clips.

Inner-monologue lines are never voiced.

## Sound effects and music
Not auto-scanned. Add to `manifest.json` by hand: `"sfx": { "don": "audio/sfx/don.mp3" }`, `"music": { "selection-tension": "audio/music/tension.mp3" }`. Track ids used by scenes: `memory-hush envelope selection-tension dorm-calm`.

## Check what's wired
`npm run assets:scan` prints counts and the background ids still missing.

## 3D (not built)
Phase-2 idea: low-poly models under `models/` with license and source recorded here.
