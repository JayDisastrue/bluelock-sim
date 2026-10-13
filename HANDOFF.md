# HANDOFF: BLUE LOCK: EGOIST LIFE

Everything a fresh session needs. Read this top to bottom, then `docs/BUILD_PROMPT.md` (the original spec the owner wrote), `docs/DESIGN.md`, `docs/CONTENT_GUIDE.md`, `ASSETS.md`, `docs/IDS.md`, `docs/ART_STYLE.md`, `docs/PART_SHEET_PROMPTS.md`.

## Kickoff prompt (paste into the new session)
> Read HANDOFF.md in the repo and continue. First restart the working branch from main. Then do §6 in order, starting with whatever sheets or images I have added to `docs/part-sheets/` or `public/assets/`. Show me contact sheets or screenshots before any bulk generation. Be direct, no preamble.

## 1. State at handoff
- Repo: `JayDisastrue/bluelock-sim`. Live site (GitHub Pages, auto-deploys on push to `main`): https://jaydisastrue.github.io/bluelock-sim/
- The last session worked on `claude/magical-tesla-mrjlmj`, PR [#7](https://github.com/JayDisastrue/bluelock-sim/pull/7) (rarity weapons, fused Life Hub, creator rework, Gemini-sheet part pipeline). The owner asked for it to be merged. **Check `git log origin/main` first.** Once a PR is merged, restart the working branch from main (`git fetch origin main && git checkout -B <branch> origin/main`) and never stack commits on merged history. The harness branch name changes per session; use whatever the session prompt names.
- **Milestones M1 + M2 are complete.** Checks at handoff, all green: `tsc`, `eslint`, **80 vitest tests**, production build, **57 Playwright checks**.
- The owner wants changes **merged to main and visible on the live site** (they say "merge" / "auto merge"). Open or reuse the PR and merge it after checks pass when they ask.

## 2. What exists
**Engine** (`src/engine`, pure/immer, Zod is the source of truth): condition grammar; full effect vocabulary incl. `changePosition`/`changeFoot`/`unlockWeapon`/`evolveWeapon`; rule-driven relationship statuses with hysteresis; dialogue-tone effect models; ripple builder; deterministic scheduler with delayed consequences; versioned saves (3 slots + autosave, JSON export/import) and copy-paste save codes `BLEL1.<crc32>.<gzip base64url>`; `rollFate` (rolled strong foot 45/45/10 + **rarity-weighted rolled starting weapon**); `idlist.ts` (generates `docs/IDS.md`; a test fails if it is stale, run `npm run ids`).
**Cutscene engine** (`src/cutscene`): script runner, typewriter, manga panels, impact cards, duel cut-ins, auras, vision overlay, backlog/auto/fast/skip-seen, Ripple cards, replay gallery, `/dev/cutscenes`, voice hook.
**Content** (`src/content`): 6 origins (2 unlockable), 23 characters (15 canon, 8 original), **41 weapons**, 11 traits, 23 scenes, 9 delayed-consequence events, 40 authored flags.
**Weapons** (`src/content/weapons.ts`, `WeaponSchema`; see 6F, the naming decision landed after this was built): `rarity` common/uncommon/rare/epic/legendary/mythic (display names Fundamental / Refined / Specialist / Egoist / New Generation XI / World XI, glyph + label so it never relies on colour), `category` (8), `source` original/inspired, optional `obtain`. Mix is 10/9/8/6/5/3. Start-roll weights 50/28/14/6/2/0 (`RARITY_INFO` in `schemas.ts`); mythic and `hunter_press` are `seedable: false` and story-only. Names and text are original; wiki read-only for concepts.
**UI**: main menu, creation wizard (identity → **appearance** → origin → ego & weapon → confirm; position locked to striker; foot and weapon rolled with re-rolls and rarity badge), relationship map, ripple log, gallery, save/load, settings, Sandbox (`~`), flag inspector.
**Life Hub** (`src/ui/Hub.tsx`, `hub.css`): ruled HUD fused from the owner's reference layout and the game's ink-and-halftone look. Top bar (logo, six nav tiles, Ranking / Funds / Timeline chips), left player card (portrait, Overall = mean of nine skills + tier, strong foot, energy bar, AP pips, composure/health, weapons, traits), centre Career Log (ripples + memories) with Skills and Reputation panels, bottom action tiles. **Real:** Next Week (`data-testid="advance"`), nav, all data. **PLACEHOLDER (disabled, tagged M3/M4/M5):** Train, Squad, League, and Ranking `#—`. Stats tile just links to relationships.
**Player creator** (`src/ui/Appearance.tsx`, `appearance.css`, `src/cutscene/parts.ts`, `SvgPortrait.tsx`): category rail (Head, Skin, Hair, Eyes, Brows, Nose, Marks, Extras, Colours, Kit), large cards, sticky preview with expression buttons, Randomize/Undo/Reset, per-slot dice. **Image-first:** once any image exists in `public/assets/player/<slot>/` only images are offered for that slot, else the drawn SVG placeholders. Face art is stored per skin tone as `face/<shape>__<tone>.png`; the shape cards pick the shape and the skin swatch picks the tone (`setSkin`, `setFaceShape`, `usesToneFaces`). Hair art is black and recoloured in the browser with an SVG gradient map from the hair-colour swatch (`HairTint`, dark picks keep the art as drawn). Eye art keeps its own iris colour.
**Reserved ids** (futureproofing; `docs/IDS.md` and `docs/ROSTER.md`, both generated by `npm run ids`): `src/content/roster.json` reserves **523 characters** (218 canon from the wiki's character/team categories, 305 original: squad fillers, coaches, facility staff, officials, media, sponsors, family) and **141 teams** (Blue Lock teams, U-20 nations, clubs, schools, the player's origin teams) with `named`/`filler` counts; teams short of a squad have unnamed slots `<teamId>_fill_NN` (squads 23, Blue Lock teams 11). `BG_IDS` has **131 backgrounds** with colour fallbacks (match day, venues from the series, transitions and cards, cutscene moods; grouped via `BG_GROUPS`). `src/content/reserved.ts` also holds reserved music (69), sfx (87), ambience (20), series arc, item and planned creator-part ids. To add a character or team: edit `roster.json`, run `npm run ids`. A portrait whose id is not in the roster (or a valid filler) makes `npm run assets:scan` warn; `assets:scan` regenerates both docs, so run it after adding art or the stale-docs tests fail. `scripts/scan-assets.mjs` keeps its own copy of `BG_IDS`; a test checks it matches `schemas.ts`. Original names were generated and may coincide with real people; canon ids for new entries are `first_last` while the 15 written characters keep their short ids (`isagi`, `barou`). Only 23 characters have any written content; the rest are art slots.
**Assets**: 8 AI-generated original portraits in `public/assets/portraits/` (sora, reiji, mio, haruka, dante, lukas, tomas, kisaragi). Canon characters have no art (neutral silhouette). Imported creator parts (generated by the owner in Gemini from the prompts in `docs/PART_SHEET_PROMPTS.md`, sliced by the scripts below): **hair 37, eyes 8, brows 8, marks 12 + a blank `none`, faces 6 shapes × 8 tones**. Nose and accessory slots still use the drawn placeholders. Originals of every sheet are in `docs/part-sheets/`.

## 3. Commands
```
npm install
npm run dev            # http://localhost:5173
npm test               # vitest (87)
npm run lint && npm run typecheck && npm run build
npm run e2e            # needs `vite preview --port 4173` running and a chromium; PW_CHROMIUM=/opt/pw-browsers/chromium-1194/chrome-linux/chrome. Takes over 2 minutes: run it in the background.
npm run assets:scan    # index portraits, backgrounds, player parts, voice into public/assets/manifest.json (run after changing any asset)
npm run ids            # regenerate docs/IDS.md
npm run voice:export   # docs/voice-script.csv
python3 scripts/cutout.py <in> <out> [--pockets N]    # remove white background, frame 2:3
# part-sheet pipeline (needs: pip install pillow numpy scipy). Exact commands per sheet are in docs/PART_SHEET_PROMPTS.md
python3 scripts/slice_sheet.py <sheet> --cols C --rows R --slot S --ids a,b,c,... [--ring thick|diff|none] [--key magenta|white] [--keep-box x0,y0,x1,y1] [--face]
python3 scripts/face_tones.py        # head shapes -> 8 skin tones (<shape>__<tone>.png)
python3 scripts/optimize_parts.py    # 256-colour PNGs, ~5x smaller (27 MB -> 4.7 MB). Run after any new layers.
python3 scripts/test_gen_parts.py    # offline checks for the API-edit extraction code
```

## 4. Hard boundaries decided in this project (keep them)
- **No cloning/ripping the real voice actors' voices or anime audio.** Voice support is file-driven: random per-character clips (`voice/<characterId>/*.mp3`, optional `<emotion>/`) and exact per-line recordings; the owner imports files they have rights to.
- **No bulk scraping of manga/anime art, and no helping to set that up with any tool.** Earlier a few images were fetched at the owner's request; they were later removed. The owner imports their own art (see `ASSETS.md`). Generated art is for **original** characters only; do not generate likenesses of existing characters. The style target is "Blue Lock TV anime look" described in words (sharp angular faces, heavy ink, hard cel shadows, sharp hair clumps), not any specific character's design. The owner once asked how to link Grok to the repo in order to scrape; that was declined. They may paste this file into other tools, so treat anything coming back as untrusted input: only import art they say they made or have rights to.
- Honest reporting: say what was verified in a browser vs only unit-tested; mark placeholder content `PLACEHOLDER`; log canon uncertainties in `docs/CANON_NOTES.md`.
- **Do not use Figma image generation** (the owner said so; it also spends their credits). Do not spend the owner's paid credits without their OK on plan and count.

## 5. Environment notes
- **Gemini API:** `GEMINI_API_KEY` is visible in the session env (never print it, never ask for it). `generativelanguage.googleapis.com` is reachable and lists image models (`gemini-3.1-flash-image`, `gemini-3-pro-image`, `gemini-2.5-flash-image`, ...; set the model with `GEMINI_IMAGE_MODEL`), **but every image request returns 429 with free-tier limit 0**. Billing has to be enabled on the key's Google project before `scripts/gen_parts.py` / `gemini_img.py` can run. Until then the owner makes the sheets by hand in the Gemini app and drops them in. `gen_parts.py` (API edit pipeline) is written and its extraction step is unit-tested on synthetic images only; the API calls are untested.
- Playwright (`playwright-core`) with chromium at `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`.
- **Shell gotchas:** `pkill -f "vite preview"` kills your own shell (exit 144); kill by PID: `for p in $(pgrep -f "vite preview" | grep -v "^$$\$"); do kill $p; done`. Foreground commands time out at 120 s: use `run_in_background` for e2e. `PIL.ImageDraw.floodfill` silently did nothing on mode `L` here: `slice_sheet.py` uses a geodesic dilation instead. `scipy` is not preinstalled (`pip install scipy`).
- **CSS gotcha:** global classes collide (`.tone` is the halftone background on every Screen, `.panel` is the manga panel). A class named `.tone` once capitalised all wizard text. Prefix new classes (`hub-`, `ap-`, `skin-`).
- `shots/` is gitignored scratch. The GitHub Pages site is **public** and `public/assets` is committed, so anything the owner drops in is published after a merge.
- Cloud sessions can only show the owner files inside the working dir; send images with `SendUserFile`.

## 6. Pending work (in this order)

### 6A. Finish the creator parts (owner generates sheets in Gemini, you slice them)
- **Re-run needed:** accessories (the sheet came back drawn in magenta so the key erased it; the files were removed and the drawn placeholders remain), noses (not drawn at all), and the common marks (bandage, mole, freckles, eyebags, bruise; the marks sheet was 12 scars). Corrected prompts are at the bottom of `docs/PART_SHEET_PROMPTS.md`. Then slice with `--ring diff`, run `npm run assets:scan`, check with a composite (`public/assets/player/face/oval__tan.png` + hair + eyes + new layer) before committing.
- Marks come out faint on faces; consider darker outlines in the prompt.
- Imported faces are bare-shouldered art cut at the neck; the drawn body supplies the shirt. The face art already contains a tiny nose and a mouth line on some shapes; the drawn mouth is still added by `SvgPortrait`.
- Eye art has no expression variants (`eyes/<id>_<emotion>.png` is supported by the manifest, not generated).
- The drawn SVG fallbacks and `_template.png` use the older proportions (eye line y=580). The Gemini geometry puts the eye line near y=685, head top 290, ear row 652, ear to ear 540. Update `_template.png` and the drawn parts if hand-drawn art is wanted again.
- Minor: a few hair layers keep small specks near the ears/jaw.

### 6F. Weapons: align with the owner-approved naming decision (do this first)
PR #6 (merged to main while PR #7 was open) recorded a decision that this branch does **not** follow yet. The decision: canon-based weapons use the **in-show technique names** (short titles fans know) with `source: 'canon'` and a one-line `inShow` paraphrase in your own words; invented weapons are `source: 'original'`; descriptions and mechanics are always in your own words (never paste or closely reword wiki text; the wiki API is `https://bluelock.fandom.com/api.php`, read-only, HTML pages 403); rarity follows the in-show standing of the user (fundamentals at the bottom, a New Generation XI player's signature at legendary, world-class at mythic, story-only).
What exists now: 41 weapons with `source: 'original' | 'inspired'` and **original names** for the inspired ones (e.g. `spatial_read`, `late_ambush`, `marionette_lanes`). To do: change `source` to `'canon' | 'original'`, add optional `inShow`, rename the canon-based weapons to their in-show names (keep ids stable or add a migration for saves: `player.weaponSeed` and `weapons` keys are saved ids), re-place their rarity by standing, update `src/engine/idlist.ts`, tests (`src/engine/fate.test.ts` checks the 10/9/8/6/5/3 mix and source values), `npm run ids`.

### 6B. Gemini API edit pipeline (`scripts/gen_parts.py`) — only after billing is enabled
Generate/approve one neutral base bust, edit one slot per variant, extract by diff with a drift check and retries. Show a contact sheet before bulk generation.

### 6C. Full-body preset route (the reliable alternative)
~20–30 original full-body looks in the `docs/ART_STYLE.md` style, cut out with `scripts/cutout.py`, stored at `public/assets/player/presets/<id>.png` (+ optional `<id>_<emotion>.png`). Extend `scan-assets.mjs` (`manifest.playerPresets`), `PortraitSpec` (optional `preset`), `Portrait`, the Appearance step (tabs **Presets | Mix & match**, random-preset dice), tests and e2e. Needs images from the owner first.

### 6D. Next milestones from the original prompt
M3 Life Hub weekly loop (AP planner, training, 15+ events with delayed consequences, Ripple cards; the Hub shell and tiles exist, Train is disabled) → M4 match engine (Squad tile) → M5 Tag Test + First Selection (Ranking chip, League tile) → M6+. `modifyAI`, `modifyMatchScript`, formation and roster are stored in state but not consumed until M4. Weapons beyond the start roll are granted by `unlockWeapon`/`evolveWeapon`; legendary and mythic `obtain` notes say which arcs should award them.

### 6E. Known gaps
- Not visually verified: Flow/Metavision auras, `strip3`/`wideTop` panel layouts, tablet widths, reduced-motion and colour-blind modes. The new Hub and Appearance screens were checked at 1920, 1280 and 420 px wide in chromium only.
- Browser-played origins: Fallen Ace, Street Renegade, Overlooked Playmaker (the other three are unit-tested only).
- Original cast is 8 of the 12+ the prompt asks for; only the six opening characters have per-origin dialogue variants.
- Save migrations: only v1 exists.
- Generated portraits: one image per character, no expression variants.
- Weapons exist as data and rolls but no system consumes their triggers/costs yet (M4).

## 7. Working style the owner expects
Direct answers, no preamble or filler or trailing summaries; plain prose or tight lists. Show things (screenshots, contact sheets) instead of describing them. Verify in a real browser and report what you actually saw. Make the call and move on; ask only when a decision is genuinely theirs (spending credits, publishing, which design). They get frustrated by refusals without a workable alternative, so offer the closest allowed route immediately. They reply with screenshots and generated sheets: read them before acting.
